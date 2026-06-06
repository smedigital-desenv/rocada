import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useRegioes } from '../hooks/useQueries';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  APROVADA: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700' },
  REJEITADA: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' },
};

export const HistoricoPage: React.FC = () => {
  const [regiaoFiltro, setRegiaoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  const { data: regioes } = useRegioes();

  const { data: rocadas, isLoading } = useQuery({
    queryKey: ['historico', regiaoFiltro, statusFiltro, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('rocadas')
        .select('*, unidades(id, nome, codigo_unidade, regiao_id, regioes(nome))')
        .order('data_execucao', { ascending: false })
        .limit(100);

      if (statusFiltro) query = query.eq('status_validacao', statusFiltro);
      if (dataInicio) query = query.gte('data_execucao', dataInicio);
      if (dataFim) query = query.lte('data_execucao', dataFim);

      const { data, error } = await query;
      if (error) throw error;

      if (regiaoFiltro) {
        return data?.filter((r: any) => r.unidades?.regiao_id === regiaoFiltro);
      }
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Roçadas</h1>
        <p className="text-gray-500 text-sm mt-1">{rocadas?.length || 0} registros encontrados</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFiltros ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtros
            {(regiaoFiltro || statusFiltro || dataInicio || dataFim) && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>

        {showFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Região</label>
              <select
                value={regiaoFiltro}
                onChange={(e) => setRegiaoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {regioes?.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="APROVADA">Aprovada</option>
                <option value="REJEITADA">Rejeitada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Região</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Executada</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrada</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rocadas?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                rocadas?.map((r: any) => {
                  const status = statusConfig[r.status_validacao];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{r.unidades?.nome}</p>
                        <p className="text-xs text-gray-400">{r.unidades?.codigo_unidade}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {r.unidades?.regioes?.nome || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(r.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(r.data_registro).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status?.color}`}>
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {r.observacao_sme || r.observacao_empresa || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
