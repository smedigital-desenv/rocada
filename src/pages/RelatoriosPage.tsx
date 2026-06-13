import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Filter, Download } from 'lucide-react';
import { useUnidades, useHistorico } from '../hooks/useQueries';

// ============================================================
// TIPOS
// ============================================================
interface Filtros {
  data_inicio: string;
  data_fim: string;
  unidade_id: string;
  status: string;
}

// ============================================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================================

// Exportar para Excel usando SheetJS (já disponível no projeto)
const exportarExcel = async (dados: any[], filtros: Filtros) => {
  const XLSX = await import('xlsx');

  const linhas = dados.map((r) => ({
    'Unidade': r.unidades?.nome || '-',
    'Código': r.unidades?.codigo_unidade || '-',
    'Região': r.unidades?.regioes?.nome || '-',
    'Data Execução': r.data_execucao
      ? new Date(r.data_execucao).toLocaleDateString('pt-BR')
      : '-',
    'Data Registro': r.created_at
      ? new Date(r.created_at).toLocaleDateString('pt-BR')
      : '-',
    'Status': r.status_validacao === 'APROVADA'
      ? 'Aprovada'
      : r.status_validacao === 'REJEITADA'
        ? 'Rejeitada'
        : 'Pendente',
    'Observação Empresa': r.observacao_empresa || '-',
    'Observação SME': r.observacao_sme || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();

  // Ajustar largura das colunas
  ws['!cols'] = [
    { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Roçadas');

  const periodo = filtros.data_inicio && filtros.data_fim
    ? `_${filtros.data_inicio}_a_${filtros.data_fim}`
    : '';
  XLSX.writeFile(wb, `relatorio_rocadas${periodo}.xlsx`);
};

// Exportar para PDF usando jsPDF
const exportarPDF = async (dados: any[], filtros: Filtros, resumo: any) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });

  // Título
  doc.setFontSize(16);
  doc.setTextColor(0, 102, 204);
  doc.text('Relatório de Roçadas — SME Ribeirão Preto', 14, 18);

  // Período
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const periodo = filtros.data_inicio && filtros.data_fim
    ? `Período: ${new Date(filtros.data_inicio).toLocaleDateString('pt-BR')} a ${new Date(filtros.data_fim).toLocaleDateString('pt-BR')}`
    : 'Período: Todos os registros';
  doc.text(periodo, 14, 26);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);

  // Resumo
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumo', 14, 42);

  autoTable(doc, {
    startY: 46,
    head: [['Total', 'Aprovadas', 'Pendentes', 'Rejeitadas']],
    body: [[
      resumo.total,
      resumo.aprovadas,
      resumo.pendentes,
      resumo.rejeitadas,
    ]],
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 14 },
    tableWidth: 120,
  });

  // Tabela principal
  doc.text('Detalhamento', 14, (doc as any).lastAutoTable.finalY + 12);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 16,
    head: [['Unidade', 'Região', 'Data Execução', 'Data Registro', 'Status']],
    body: dados.map((r) => [
      `${r.unidades?.nome || '-'} (${r.unidades?.codigo_unidade || '-'})`,
      r.unidades?.regioes?.nome || '-',
      r.data_execucao ? new Date(r.data_execucao).toLocaleDateString('pt-BR') : '-',
      r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-',
      r.status_validacao === 'APROVADA' ? 'Aprovada'
        : r.status_validacao === 'REJEITADA' ? 'Rejeitada' : 'Pendente',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 14, right: 14 },
    didDrawCell: (data: any) => {
      // Colorir coluna de status
      if (data.column.index === 4 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'Aprovada') doc.setTextColor(0, 150, 80);
        else if (val === 'Rejeitada') doc.setTextColor(200, 0, 0);
        else doc.setTextColor(180, 120, 0);
      }
    },
  });

  const periodo2 = filtros.data_inicio && filtros.data_fim
    ? `_${filtros.data_inicio}_a_${filtros.data_fim}`
    : '';
  doc.save(`relatorio_rocadas${periodo2}.pdf`);
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const RelatoriosPage: React.FC = () => {
  const hoje = new Date().toISOString().split('T')[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [filtros, setFiltros] = useState<Filtros>({
    data_inicio: trintaDiasAtras,
    data_fim: hoje,
    unidade_id: '',
    status: '',
  });

  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null);

  const { data: unidades } = useUnidades();
  const { data: rocadas, isLoading } = useHistorico({
    unidade_id: filtros.unidade_id || undefined,
    status: filtros.status || undefined,
    data_inicio: filtros.data_inicio || undefined,
    data_fim: filtros.data_fim || undefined,
  });

  // Resumo
  const resumo = {
    total: rocadas?.length || 0,
    aprovadas: rocadas?.filter((r) => r.status_validacao === 'APROVADA').length || 0,
    pendentes: rocadas?.filter((r) => r.status_validacao === 'PENDENTE').length || 0,
    rejeitadas: rocadas?.filter((r) => r.status_validacao === 'REJEITADA').length || 0,
  };

  const handleExportarExcel = async () => {
    if (!rocadas?.length) return;
    setExportando('excel');
    try {
      await exportarExcel(rocadas, filtros);
    } finally {
      setExportando(null);
    }
  };

  const handleExportarPDF = async () => {
    if (!rocadas?.length) return;
    setExportando('pdf');
    try {
      await exportarPDF(rocadas, filtros, resumo);
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Exporte dados de roçadas em Excel ou PDF</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportarExcel}
            disabled={!rocadas?.length || exportando !== null}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            {exportando === 'excel' ? 'Gerando...' : 'Exportar Excel'}
          </button>
          <button
            onClick={handleExportarPDF}
            disabled={!rocadas?.length || exportando !== null}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <FileText size={16} />
            {exportando === 'pdf' ? 'Gerando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
            <select
              value={filtros.unidade_id}
              onChange={(e) => setFiltros({ ...filtros, unidade_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {unidades?.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="APROVADA">Aprovada</option>
              <option value="PENDENTE">Pendente</option>
              <option value="REJEITADA">Rejeitada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: resumo.total, cor: 'blue' },
          { label: 'Aprovadas', value: resumo.aprovadas, cor: 'emerald' },
          { label: 'Pendentes', value: resumo.pendentes, cor: 'yellow' },
          { label: 'Rejeitadas', value: resumo.rejeitadas, cor: 'red' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 text-${item.cor}-600`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Registros encontrados
          </h2>
          {rocadas?.length ? (
            <span className="text-xs text-gray-400">{rocadas.length} registro(s)</span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !rocadas?.length ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Download size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum registro encontrado para os filtros selecionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Unidade</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Região</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Executada</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Registrada</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rocadas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{r.unidades?.nome}</p>
                      <p className="text-xs text-gray-400">{r.unidades?.codigo_unidade}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.unidades?.regioes?.nome || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.data_execucao
                        ? new Date(r.data_execucao).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.status_validacao === 'APROVADA'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status_validacao === 'REJEITADA'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.status_validacao === 'APROVADA' ? 'Aprovada'
                          : r.status_validacao === 'REJEITADA' ? 'Rejeitada' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
