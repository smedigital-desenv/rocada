import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Filter, Download } from 'lucide-react';
import { useUnidades, useHistorico } from '../hooks/useQueries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ============================================================
// TIPOS
// ============================================================
interface Filtros {
  data_inicio: string;
  data_fim: string;
  unidade_id: string;
  status: string;
}

interface Configs {
  cabecalho_pdf?: string;
  rodape_pdf?: string;
  nome_secretaria?: string;
  logo_url?: string;
  nome_empresa?: string;
  numero_contrato?: string;
}

// ============================================================
// EXPORTAR EXCEL
// ============================================================
const exportarExcel = async (dados: any[], filtros: Filtros, configs: Configs) => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const cabecalho = [
    [configs.cabecalho_pdf || 'Prefeitura Municipal'],
    [configs.nome_secretaria || 'Secretaria Municipal de Educação'],
    ['Relatório de Roçadas'],
    filtros.data_inicio && filtros.data_fim
      ? [`Período: ${new Date(filtros.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(filtros.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`]
      : ['Período: Todos os registros'],
    [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
    configs.numero_contrato ? [`Contrato Nº ${configs.numero_contrato}`] : [],
    [],
    ['Unidade', 'Código', 'Região', 'Data Execução', 'Data Registro', 'Status', 'Observação Empresa', 'Observação SME'],
  ];

  const linhasDados = dados.map((r) => [
    r.unidades?.nome || '-',
    r.unidades?.codigo_unidade || '-',
    r.unidades?.regioes?.nome || '-',
    r.data_execucao ? new Date(r.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
    r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-',
    r.status_validacao === 'APROVADA' ? 'Aprovada' : r.status_validacao === 'REJEITADA' ? 'Rejeitada' : 'Pendente',
    r.observacao_empresa || '-',
    r.observacao_sme || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...cabecalho, ...linhasDados]);
  ws['!cols'] = [
    { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Roçadas');

  const periodo = filtros.data_inicio && filtros.data_fim
    ? `_${filtros.data_inicio}_a_${filtros.data_fim}` : '';
  XLSX.writeFile(wb, `relatorio_rocadas${periodo}.xlsx`);
};

// ============================================================
// EXPORTAR PDF
// ============================================================
const exportarPDF = async (dados: any[], filtros: Filtros, resumo: any, configs: Configs) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let yPos = 14;

  // ── Logo centralizado ──
  if (configs.logo_url) {
    try {
      const response = await fetch(configs.logo_url);
      if (response.ok) {
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Calcular dimensões mantendo proporção
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = base64;
        });

        const alturaMax = 20;
        const larguraMax = 60;
        let h = alturaMax;
        let w = (img.naturalWidth / img.naturalHeight) * h;
        if (w > larguraMax) {
          w = larguraMax;
          h = (img.naturalHeight / img.naturalWidth) * w;
        }

        const ext = (configs.logo_url.split('.').pop() || 'png').toUpperCase();
        // Centralizar logo horizontalmente
        const xLogo = (pageWidth - w) / 2;
        doc.addImage(base64, ext as any, xLogo, yPos, w, h);
        yPos += h + 6;
      }
    } catch (_) {}
  }

  // ── Textos do cabeçalho alinhados à esquerda ──
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text(configs.cabecalho_pdf || 'Prefeitura Municipal', 14, yPos);
  yPos += 7;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(configs.nome_secretaria || 'Secretaria Municipal de Educação', 14, yPos);
  yPos += 7;

  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('Relatório de Roçadas', 14, yPos);
  yPos += 6;

  // ── Linha separadora ──
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 6;

  // ── Período e data ──
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const periodo = filtros.data_inicio && filtros.data_fim
    ? `Período: ${new Date(filtros.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(filtros.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}`
    : 'Período: Todos os registros';
  doc.text(periodo, 14, yPos);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 14, yPos, { align: 'right' });
  yPos += 8;

  // ── Resumo ──
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumo', 14, yPos);
  yPos += 4;

  autoTable(doc, {
    startY: yPos,
    head: [['Total', 'Aprovadas', 'Pendentes', 'Rejeitadas']],
    body: [[resumo.total, resumo.aprovadas, resumo.pendentes, resumo.rejeitadas]],
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 14 },
    tableWidth: 100,
  });

  // ── Detalhamento ──
  const posDepoisResumo = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Detalhamento', 14, posDepoisResumo);

  autoTable(doc, {
    startY: posDepoisResumo + 4,
    head: [['Unidade', 'Região', 'Data Execução', 'Data Registro', 'Status']],
    body: dados.map((r) => [
      `${r.unidades?.nome || '-'} (${r.unidades?.codigo_unidade || '-'})`,
      r.unidades?.regioes?.nome || '-',
      r.data_execucao ? new Date(r.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
      r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-',
      r.status_validacao === 'APROVADA' ? 'Aprovada'
        : r.status_validacao === 'REJEITADA' ? 'Rejeitada' : 'Pendente',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204] },
    margin: { left: 14, right: 14 },
    didDrawPage: (data: any) => {
      const rodape = configs.rodape_pdf ||
        (configs.numero_contrato ? `Contrato Nº ${configs.numero_contrato}` : '');
      if (rodape) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(rodape, 14, doc.internal.pageSize.getHeight() - 8);
      }
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${data.pageNumber}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
    },
  });

  const periodo2 = filtros.data_inicio && filtros.data_fim
    ? `_${filtros.data_inicio}_a_${filtros.data_fim}` : '';
  doc.save(`relatorio_rocadas${periodo2}.pdf`);
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export const RelatoriosPage: React.FC = () => {
  const hoje = new Date().toISOString().split('T')[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState<Filtros>({
    data_inicio: trintaDiasAtras,
    data_fim: hoje,
    unidade_id: '',
    status: '',
  });

  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null);

  const { data: configs = {} } = useQuery<Configs>({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('configuracoes')
        .select('cabecalho_pdf, rodape_pdf, nome_secretaria, logo_url, nome_empresa, numero_contrato')
        .single();
      return data || {};
    },
  });

  const { data: unidades } = useUnidades();
  const { data: rocadas, isLoading } = useHistorico({
    unidade_id: filtros.unidade_id || undefined,
    status: filtros.status || undefined,
    data_inicio: filtros.data_inicio || undefined,
    data_fim: filtros.data_fim || undefined,
  });

  const resumo = {
    total:      rocadas?.length || 0,
    aprovadas:  rocadas?.filter((r) => r.status_validacao === 'APROVADA').length || 0,
    pendentes:  rocadas?.filter((r) => r.status_validacao === 'PENDENTE').length || 0,
    rejeitadas: rocadas?.filter((r) => r.status_validacao === 'REJEITADA').length || 0,
  };

  const handleExportarExcel = async () => {
    if (!rocadas?.length) return;
    setExportando('excel');
    try { await exportarExcel(rocadas, filtros, configs); }
    finally { setExportando(null); }
  };

  const handleExportarPDF = async () => {
    if (!rocadas?.length) return;
    setExportando('pdf');
    try { await exportarPDF(rocadas, filtros, resumo, configs); }
    finally { setExportando(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Exporte dados de roçadas em Excel ou PDF</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportarExcel}
            disabled={!rocadas?.length || exportando !== null}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
            <FileSpreadsheet size={16} />
            {exportando === 'excel' ? 'Gerando...' : 'Exportar Excel'}
          </button>
          <button onClick={handleExportarPDF}
            disabled={!rocadas?.length || exportando !== null}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
            <FileText size={16} />
            {exportando === 'pdf' ? 'Gerando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {(configs.cabecalho_pdf || configs.nome_secretaria) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 flex items-center gap-2">
          <FileText size={14} />
          PDF com cabeçalho: <strong>{configs.cabecalho_pdf || configs.nome_secretaria}</strong>
          {configs.rodape_pdf && <> · Rodapé: <strong>{configs.rodape_pdf}</strong></>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
            <input type="date" value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
            <input type="date" value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
            <select value={filtros.unidade_id}
              onChange={(e) => setFiltros({ ...filtros, unidade_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas</option>
              {unidades?.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="APROVADA">Aprovada</option>
              <option value="PENDENTE">Pendente</option>
              <option value="REJEITADA">Rejeitada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: resumo.total,      cor: 'blue' },
          { label: 'Aprovadas',  value: resumo.aprovadas,  cor: 'emerald' },
          { label: 'Pendentes',  value: resumo.pendentes,  cor: 'yellow' },
          { label: 'Rejeitadas', value: resumo.rejeitadas, cor: 'red' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 text-${item.cor}-600`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Registros encontrados</h2>
          {rocadas?.length ? <span className="text-xs text-gray-400">{rocadas.length} registro(s)</span> : null}
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
                  {['Unidade','Região','Executada','Registrada','Status'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rocadas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{r.unidades?.nome}</p>
                      <p className="text-xs text-gray-400">{r.unidades?.codigo_unidade}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.unidades?.regioes?.nome || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.data_execucao ? new Date(r.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.status_validacao === 'APROVADA' ? 'bg-emerald-100 text-emerald-700'
                        : r.status_validacao === 'REJEITADA' ? 'bg-red-100 text-red-700'
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
