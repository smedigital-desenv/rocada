import React, { useState } from 'react';
import { Search, Filter, Plus, CheckCircle, AlertTriangle, AlertCircle, Clock, Building2 } from 'lucide-react';
import { useUnidades, useRegioes } from '../hooks/useQueries';
import { SituacaoOperacional } from '../types';
import { useAuth } from '../contexts/AuthContext';

const situacaoConfig = {
  EM_DIA: { label: 'Em Dia', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, iconColor: 'text-emerald-500' },
  ATENCAO: { label: 'Atenção', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle, iconColor: 'text-amber-500' },
  CRITICO: { label: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertCircle, iconColor: 'text-red-500' },
  PENDENCIA_SME: { label: 'Pendência SME', color: 'bg-blue-100 text-blue-700', icon: Clock, iconColor: 'text-blue-500' },
};

const calcularDias = (ultima_rocada?: string) => {
  if (!ultima_rocada) return null;
  const hoje = new Date();
  const ultima = new Date(ultima_rocada);
  const diff = Math.floor((hoje.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

export const UnidadesPage: React.FC = () => {
  const { isSME } = useAuth();
  const [search, setSearch] = useState('');
  const [regiaoFiltro, setRegiaoFiltro] = useState('');
  const [situacaoFiltro, setSituacaoFiltro] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  const { data: unidades, isLoading } = useUnidades({
    search,
    regiao_id: regiaoFiltro || undefined,
    situacao: (situacaoFiltro as SituacaoOperacional) || undefined,
  });

  const { data: regioes } = useRegioes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades Escolares</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unidades?.length || 0} unidades encontradas
          </p>
        </div>
        {isSME && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} />
            Nova Unidade
          </button>
        )}
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botão Filtros */}
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFiltros ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(regiaoFiltro || situacaoFiltro) && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Painel de Filtros */}
        {showFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
            {/* Região */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Região</label>
              <select
                value={regiaoFiltro}
                onChange={(e) => setRegiaoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as regiões</option>
                {regioes?.map((r) => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>

            {/* Situação */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Situação</label>
              <select
                value={situacaoFiltro}
                onChange={(e) => setSituacaoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as situações</option>
                <option value="EM_DIA">Em Dia</option>
                <option value="ATENCAO">Atenção</option>
                <option value="CRITICO">Crítico</option>
                <option value="PENDENCIA_SME">Pendência SME</option>
              </select>
            </div>

            {/* Limpar */}
            <div className="flex items-end">
              <button
                onClick={() => { setRegiaoFiltro(''); setSituacaoFiltro(''); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Unidades */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm">Carregando unidades...</p>
          </div>
        </div>
      ) : unidades?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Nenhuma unidade encontrada</p>
          <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou cadastre uma nova unidade</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Região</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Roçada</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dias</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unidades?.map((unidade) => {
                const config = situacaoConfig[unidade.situacao_operacional as SituacaoOperacional];
                const Icon = config.icon;
                const dias = calcularDias(unidade.ultima_rocada);

                return (
                  <tr key={unidade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{unidade.nome}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{unidade.codigo_unidade}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{unidade.regioes?.nome || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {unidade.ultima_rocada
                          ? new Date(unidade.ultima_rocada + 'T00:00:00').toLocaleDateString('pt-BR')
                          : <span className="text-gray-400">Nunca</span>
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        dias === null ? 'text-gray-400' :
                        dias > 67 ? 'text-red-600' :
                        dias > 52 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {dias !== null ? `${dias} dias` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
