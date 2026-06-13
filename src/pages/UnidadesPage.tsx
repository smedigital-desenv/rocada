import React, { useState } from 'react';
import {
  Search, Filter, Plus, CheckCircle, AlertTriangle, AlertCircle,
  Clock, Building2, X, History, CalendarPlus
} from 'lucide-react';
import { useUnidades, useRegioes, useCriarUnidade, useRocadasUnidade, useCriarRocada } from '../hooks/useQueries';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ============================================================
// CALCULAR SITUAÇÃO DINAMICAMENTE
// ============================================================
const calcularSituacao = (
  ultima_rocada: string | null,
  statusBanco: string,
  prazo: number,
  tolAntes: number,
  tolDepois: number
): string => {
  // Manter PENDENCIA_SME se estiver aguardando validação
  if (statusBanco === 'PENDENCIA_SME') return 'PENDENCIA_SME';
  if (!ultima_rocada) return 'EM_DIA';

  const dias = Math.floor(
    (Date.now() - new Date(ultima_rocada).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dias > prazo + tolDepois) return 'CRITICO';
  if (dias > prazo - tolAntes)  return 'ATENCAO';
  return 'EM_DIA';
};

const calcularDias = (ultima_rocada?: string) => {
  if (!ultima_rocada) return null;
  return Math.floor((Date.now() - new Date(ultima_rocada).getTime()) / (1000 * 60 * 60 * 24));
};

const calcularProximaRocada = (
  ultima_rocada: string | null,
  prazo: number,
  tolAntes: number,
  tolDepois: number
): string => {
  if (!ultima_rocada) return '-';
  const ultima = new Date(ultima_rocada + 'T00:00:00');
  const addDias = (d: Date, dias: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + dias);
    return r.toLocaleDateString('pt-BR');
  };
  const inicio = addDias(ultima, prazo - tolAntes);
  const fim    = addDias(ultima, prazo + tolDepois);
  return `${inicio} a ${fim}`;
};

// ============================================================
// CONFIG DE SITUAÇÃO
// ============================================================
const situacaoConfig: Record<string, { label: string; color: string; icon: any }> = {
  EM_DIA:        { label: 'Em Dia',        color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  ATENCAO:       { label: 'Atenção',       color: 'bg-amber-100 text-amber-700',     icon: AlertTriangle },
  CRITICO:       { label: 'Crítico',       color: 'bg-red-100 text-red-700',         icon: AlertCircle },
  PENDENCIA_SME: { label: 'Pendência SME', color: 'bg-blue-100 text-blue-700',       icon: Clock },
};

const statusRocadaConfig: Record<string, { label: string; color: string }> = {
  APROVADA:  { label: 'Aprovada',  color: 'bg-emerald-100 text-emerald-700' },
  PENDENTE:  { label: 'Pendente',  color: 'bg-yellow-100 text-yellow-700' },
  REJEITADA: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' },
};

// ============================================================
// MODAL DE DETALHE DA UNIDADE
// ============================================================
const ModalDetalhe: React.FC<{ unidade: any; onClose: () => void }> = ({ unidade, onClose }) => {
  const { isEmpresa } = useAuth();
  const [aba, setAba] = useState<'historico' | 'registrar'>('historico');
  const [dataExecucao, setDataExecucao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const { data: rocadas, isLoading } = useRocadasUnidade(unidade.id);
  const criarRocada = useCriarRocada();

  const config = situacaoConfig[unidade._situacao] || situacaoConfig.EM_DIA;
  const Icon = config.icon;

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!dataExecucao) { setErro('Informe a data de execução'); return; }
    try {
      await criarRocada.mutateAsync({
        unidade_id: unidade.id,
        data_execucao: dataExecucao,
        observacao_empresa: observacao,
      });
      setSucesso('Roçada registrada! Aguardando validação da SME.');
      setDataExecucao('');
      setObservacao('');
      setAba('historico');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar roçada');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{unidade.nome}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {unidade.codigo_unidade} · {unidade.regioes?.nome || 'Sem região'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Cards de info */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Situação</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
              <Icon size={11} />{config.label}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Última Roçada</p>
            <p className="text-sm font-semibold text-gray-800">
              {unidade.ultima_rocada
                ? new Date(unidade.ultima_rocada + 'T00:00:00').toLocaleDateString('pt-BR')
                : 'Nunca'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total de Roçadas</p>
            <p className="text-sm font-bold text-blue-600">{rocadas?.length || 0}</p>
          </div>
        </div>

        {/* Abas (só EMPRESA) */}
        {isEmpresa && (
          <div className="flex border-b border-gray-100 px-6">
            <button onClick={() => setAba('historico')}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${aba === 'historico' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <History size={15} /> Histórico
            </button>
            <button onClick={() => setAba('registrar')}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${aba === 'registrar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <CalendarPlus size={15} /> Registrar Roçada
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {sucesso && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle size={16} />{sucesso}
            </div>
          )}

          {/* Aba Histórico */}
          {aba === 'historico' && (
            isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : !rocadas?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <History size={28} className="mb-2 opacity-30" />
                <p className="text-sm">Nenhuma roçada registrada ainda</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Data Execução','Registrada','Status','Observação'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rocadas.map((r) => {
                    const st = statusRocadaConfig[r.status_validacao] || statusRocadaConfig.PENDENTE;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {r.data_execucao ? new Date(r.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {r.observacao_empresa || r.observacao_sme || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {/* Aba Registrar */}
          {aba === 'registrar' && isEmpresa && (
            <form onSubmit={handleRegistrar} className="p-6 space-y-4">
              {erro && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erro}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Execução <span className="text-red-500">*</span>
                </label>
                <input type="date" value={dataExecucao}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDataExecucao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
                <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)}
                  rows={3} placeholder="Alguma observação sobre a roçada realizada..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAba('historico')}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={criarRocada.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {criarRocada.isPending ? 'Registrando...' : 'Registrar Roçada'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export const UnidadesPage: React.FC = () => {
  const { isSME } = useAuth();
  const [search, setSearch] = useState('');
  const [regiaoFiltro, setRegiaoFiltro] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);
  const [modalNovaUnidade, setModalNovaUnidade] = useState(false);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<any>(null);
  const [formData, setFormData] = useState({ codigo_unidade: '', nome: '', regiao_id: '' });
  const [erro, setErro] = useState('');

  // Buscar configurações de prazo
  const { data: configsPrazo } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data } = await supabase.from('configuracoes').select('prazo_dias, tolerancia_antes, tolerancia_depois').single();
      return data || { prazo_dias: 60, tolerancia_antes: 7, tolerancia_depois: 7 };
    },
  });

  const prazo     = configsPrazo?.prazo_dias        ?? 60;
  const tolAntes  = configsPrazo?.tolerancia_antes  ?? 7;
  const tolDepois = configsPrazo?.tolerancia_depois ?? 7;

  const { data: unidades, isLoading } = useUnidades({ search, regiao_id: regiaoFiltro || undefined });
  const { data: regioes } = useRegioes();
  const criarUnidade = useCriarUnidade();

  // Calcular situação dinamicamente e aplicar filtro
  const unidadesComSituacao = (unidades || []).map((u) => ({
    ...u,
    _situacao: calcularSituacao(u.ultima_rocada, u.situacao_operacional, prazo, tolAntes, tolDepois),
  }));

  const unidadesFiltradas = situacaoFiltro
    ? unidadesComSituacao.filter((u) => u._situacao === situacaoFiltro)
    : unidadesComSituacao;

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!formData.codigo_unidade || !formData.nome || !formData.regiao_id) {
      setErro('Preencha todos os campos'); return;
    }
    try {
      await criarUnidade.mutateAsync(formData);
      setModalNovaUnidade(false);
      setFormData({ codigo_unidade: '', nome: '', regiao_id: '' });
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar unidade');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades Escolares</h1>
          <p className="text-gray-500 text-sm mt-1">{unidadesFiltradas.length} unidades encontradas</p>
        </div>
        {isSME && (
          <button onClick={() => setModalNovaUnidade(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} /> Nova Unidade
          </button>
        )}
      </div>

      {/* Busca e filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar por nome ou código..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${showFiltros ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={16} /> Filtros
            {(regiaoFiltro || situacaoFiltro) && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
          </button>
        </div>
        {showFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Região</label>
              <select value={regiaoFiltro} onChange={(e) => setRegiaoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas as regiões</option>
                {regioes?.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Situação</label>
              <select value={situacaoFiltro} onChange={(e) => setSituacaoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas as situações</option>
                <option value="EM_DIA">Em Dia</option>
                <option value="ATENCAO">Atenção</option>
                <option value="CRITICO">Crítico</option>
                <option value="PENDENCIA_SME">Pendência SME</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setRegiaoFiltro(''); setSituacaoFiltro(''); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Limpar</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : unidadesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Nenhuma unidade encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Unidade','Região','Última Roçada','Próxima Roçada','Dias','Situação'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unidadesFiltradas.map((unidade) => {
                const config = situacaoConfig[unidade._situacao] || situacaoConfig.EM_DIA;
                const Icon = config.icon;
                const dias = calcularDias(unidade.ultima_rocada);
                return (
                  <tr key={unidade.id} onClick={() => setUnidadeSelecionada(unidade)}
                    className="hover:bg-blue-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{unidade.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{unidade.codigo_unidade}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{unidade.regioes?.nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {unidade.ultima_rocada
                        ? new Date(unidade.ultima_rocada + 'T00:00:00').toLocaleDateString('pt-BR')
                        : <span className="text-gray-400">Nunca</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {calcularProximaRocada(unidade.ultima_rocada, prazo, tolAntes, tolDepois)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        dias === null ? 'text-gray-400' :
                        dias > prazo + tolDepois ? 'text-red-600' :
                        dias > prazo - tolAntes  ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {dias !== null ? `${dias} dias` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <Icon size={12} />{config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalhe */}
      {unidadeSelecionada && (
        <ModalDetalhe unidade={unidadeSelecionada} onClose={() => setUnidadeSelecionada(null)} />
      )}

      {/* Modal nova unidade */}
      {modalNovaUnidade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nova Unidade Escolar</h2>
            {erro && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erro}</div>}
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código <span className="text-red-500">*</span></label>
                <input type="text" value={formData.codigo_unidade}
                  onChange={(e) => setFormData({ ...formData, codigo_unidade: e.target.value })}
                  placeholder="Ex: ESC001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome da unidade"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Região <span className="text-red-500">*</span></label>
                <select value={formData.regiao_id}
                  onChange={(e) => setFormData({ ...formData, regiao_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {regioes?.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalNovaUnidade(false); setErro(''); }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={criarUnidade.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {criarUnidade.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
