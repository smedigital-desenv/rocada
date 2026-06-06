import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { useRocadasPendentes, useValidarRocada } from '../hooks/useQueries';

export const ValidarRocadasPage: React.FC = () => {
  const { data: rocadas, isLoading } = useRocadasPendentes();
  const validar = useValidarRocada();

  const [modalRocada, setModalRocada] = useState<any>(null);
  const [acao, setAcao] = useState<'APROVADA' | 'REJEITADA' | null>(null);
  const [observacao, setObservacao] = useState('');
  const [processando, setProcessando] = useState(false);

  const abrirModal = (rocada: any, tipo: 'APROVADA' | 'REJEITADA') => {
    setModalRocada(rocada);
    setAcao(tipo);
    setObservacao('');
  };

  const confirmar = async () => {
    if (!modalRocada || !acao) return;
    if (acao === 'REJEITADA' && !observacao.trim()) return;

    setProcessando(true);
    try {
      await validar.mutateAsync({
        rocadaId: modalRocada.id,
        status: acao,
        observacao_sme: observacao,
      });
      setModalRocada(null);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validar Roçadas</h1>
        <p className="text-gray-500 text-sm mt-1">
          {rocadas?.length || 0} roçadas pendentes de validação
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : rocadas?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="mx-auto text-emerald-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Nenhuma roçada pendente</p>
          <p className="text-gray-400 text-sm mt-1">Todas as roçadas foram validadas!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rocadas?.map((rocada) => (
            <div key={rocada.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{rocada.unidades?.nome}</p>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Pendente</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{rocada.unidades?.codigo_unidade}</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>📅 Executada: <strong>{new Date(rocada.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></span>
                      <span>📋 Registrada: <strong>{new Date(rocada.data_registro).toLocaleDateString('pt-BR')}</strong></span>
                    </div>
                    {rocada.observacao_empresa && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-1">Observação da empresa:</p>
                        <p className="text-sm text-gray-700">{rocada.observacao_empresa}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={() => abrirModal(rocada, 'APROVADA')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Aprovar
                  </button>
                  <button
                    onClick={() => abrirModal(rocada, 'REJEITADA')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} />
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação */}
      {modalRocada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                acao === 'APROVADA' ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
                {acao === 'APROVADA'
                  ? <CheckCircle className="text-emerald-600" size={20} />
                  : <XCircle className="text-red-600" size={20} />
                }
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {acao === 'APROVADA' ? 'Aprovar Roçada' : 'Rejeitar Roçada'}
                </p>
                <p className="text-xs text-gray-500">{modalRocada.unidades?.nome}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Observação {acao === 'REJEITADA' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                placeholder={acao === 'REJEITADA' ? 'Informe o motivo da rejeição...' : 'Observação opcional...'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {acao === 'REJEITADA' && !observacao.trim() && (
                <p className="text-xs text-red-500 mt-1">Obrigatório informar o motivo da rejeição</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalRocada(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={processando || (acao === 'REJEITADA' && !observacao.trim())}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                  acao === 'APROVADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processando ? 'Processando...' : acao === 'APROVADA' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
