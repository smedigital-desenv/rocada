import React, { useState } from 'react';
import { BarChart3, Download, AlertCircle, AlertTriangle, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const relatorios = [
  { id: 'criticas', label: 'Unidades Críticas', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Unidades acima de 67 dias sem roçada' },
  { id: 'atencao', label: 'Unidades em Atenção', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Unidades entre 53 e 67 dias sem roçada' },
  { id: 'historico', label: 'Histórico de Roçadas', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'Todas as roçadas realizadas' },
  { id: 'pendencias', label: 'Pendências de Validação', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', desc: 'Roçadas aguardando aprovação da SME' },
  { id: 'por_regiao', label: 'Roçadas por Região', icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', desc: 'Distribuição de roçadas por região' },
  { id: 'por_periodo', label: 'Roçadas por Período', icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', desc: 'Roçadas realizadas em um período específico' },
];

export const RelatoriosPage: React.FC = () => {
  const [relatorioAtivo, setRelatorioAtivo] = useState('criticas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio', relatorioAtivo, dataInicio, dataFim],
    queryFn: async () => {
      if (relatorioAtivo === 'criticas') {
        const { data, error } = await supabase
          .from('unidades')
          .select('*, regioes(nome)')
          .eq('situacao_operacional', 'CRITICO')
          .eq('ativa', true)
          .order('ultima_rocada', { ascending: true });
        if (error) throw error;
        return data;
      }

      if (relatorioAtivo === 'atencao') {
        const { data, error } = await supabase
          .from('unidades')
          .select('*, regioes(nome)')
          .eq('situacao_operacional', 'ATENCAO')
          .eq('ativa', true)
          .order('ultima_rocada', { ascending: true });
        if (error) throw error;
        return data;
      }

      if (relatorioAtivo === 'pendencias') {
        const { data, error } = await supabase
          .from('rocadas')
          .select('*, unidades(nome, codigo_unidade, regioes(nome))')
          .eq('status_validacao', 'PENDENTE')
          .order('data_registro', { ascending: true });
        if (error) throw error;
        return data;
      }

      if (relatorioAtivo === 'historico') {
        const { data, error } = await supabase
          .from('rocadas')
          .select('*, unidades(nome, codigo_unidade, regioes(nome))')
          .order('data_execucao', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      }

      if (relatorioAtivo === 'por_regiao') {
        const { data, error } = await supabase
          .from('rocadas')
          .select('*, unidades(nome, codigo_unidade, regiao_id, regioes(nome))')
          .eq('status_validacao', 'APROVADA')
          .order('data_execucao', { ascending: false });
        if (error) throw error;
        return data;
      }

      if (relatorioAtivo === 'por_periodo') {
        let query = supabase
          .from('rocadas')
          .select('*, unidades(nome, codigo_unidade, regioes(nome))')
          .order('data_execucao', { ascending: false });
        if (dataInicio) query = query.gte('data_execucao', dataInicio);
        if (dataFim) query = query.lte('data_execucao', dataFim);
        const { data, error } = await query;
        if (error) throw error;
        return data;
      }

      return [];
    },
  });

  const exportarCSV = () => {
    if (!data || data.length === 0) return;

    const relatorio = relatorios.find(r => r.id === relatorioAtivo);
    let cabecalho = '';
    let linhas: string[] = [];

    if (['criticas', 'atencao'].includes(relatorioAtivo)) {
      cabecalho = 'Código,Nome,Região,Última Roçada,Próxima Roçada,Situação';
      linhas = (data as any[]).map(u =>
        `${u.codigo_unidade},"${u.nome}",${u.regioes?.nome || '-'},${u.ultima_rocada || '-'},${u.proxima_rocada || '-'},${u.situacao_operacional}`
      );
    } else {
      cabecalho = 'Unidade,Código,Região,Data Execução,Data Registro,Status';
      linhas = (data as any[]).map((r: any) =>
        `"${r.unidades?.nome || '-'}",${r.unidades?.codigo_unidade || '-'},${r.unidades?.regioes?.nome || '-'},${r.data_execucao || '-'},${new Date(r.data_registro).toLocaleDateString('pt-BR')},${r.status_validacao}`
      );
    }

    const csv = [cabecalho, ...linhas].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${relatorio?.label.toLowerCase().replace(/ /g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const relatorioInfo = relatorios.find(r => r.id === relatorioAtivo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">Gere e exporte relatórios do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tipos de Relatório */}
        <div className="space-y-2">
          {relatorios.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => setRelatorioAtivo(r.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  relatorioAtivo === r.id
                    ? `${r.bg} ${r.border} border`
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={relatorioAtivo === r.id ? r.color : 'text-gray-400'} />
                  <div>
                    <p className={`text-sm font-medium ${relatorioAtivo === r.id ? r.color : 'text-gray-700'}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header do relatório */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {relatorioInfo && (
                  <>
                    <relatorioInfo.icon size={20} className={relatorioInfo.color} />
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">{relatorioInfo.label}</h2>
                      <p className="text-xs text-gray-500">{data?.length || 0} registros</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={exportarCSV}
                disabled={!data || data.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Download size={16} />
                Exportar CSV
              </button>
            </div>

            {/* Filtro de período */}
            {relatorioAtivo === 'por_periodo' && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-500">Nenhum dado encontrado para este relatório.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['criticas', 'atencao'].includes(relatorioAtivo) ? (
                        <>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Código</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Região</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Última Roçada</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unidade</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Região</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Execução</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data as any[]).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {['criticas', 'atencao'].includes(relatorioAtivo) ? (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.codigo_unidade}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nome}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.regioes?.nome || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {item.ultima_rocada
                                ? new Date(item.ultima_rocada + 'T00:00:00').toLocaleDateString('pt-BR')
                                : <span className="text-gray-400">Nunca</span>}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{item.unidades?.nome || '-'}</p>
                              <p className="text-xs text-gray-500">{item.unidades?.codigo_unidade || '-'}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.unidades?.regioes?.nome || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(item.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.status_validacao === 'APROVADA' ? 'bg-emerald-100 text-emerald-700' :
                                item.status_validacao === 'REJEITADA' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {item.status_validacao}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
