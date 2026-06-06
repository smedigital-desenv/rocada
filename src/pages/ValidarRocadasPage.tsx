import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { useRocadasPendentes, useValidarRocada } from '../hooks/useQueries';

export const ValidarRocadasPage: React.FC = () => {
  const { data: rocadas, isLoading } = useRocadasPendentes();
  const { mutateAsync: validar, isPending } = useValidarRocada();

  const [modalAberto, setModalAberto] = useState(false);
  const [rocadaSelecionada, setRocadaSelecionada] = useState<any>(null);
  const [observacaoSME, setObservacaoSME] = useState('');
  const [acao, setAcao] = useState<'APROVADA' | 'REJEITADA'>('APROVADA');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  const abrirModal = (rocada: any, tipo: 'APROVADA' | 'REJEITADA') => {
    setRocadaSelecionada(rocada);
    setAcao(tipo);
    setObservacaoSME('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setRocadaSelecionada(null);
    setObservacaoSME('');
  };

  const handleValidar = async () => {
    if (acao === 'REJEITADA' && !observacaoSME.trim()) {
      return;
    }
    try {
      await validar({
        rocadaId: rocadaSelecionada.id,
        status: acao,
        observacao_sme: observacaoSME,
      });
      setFeedback({
        tipo: 'sucesso',
        msg: acao === 'APROVADA' ? 'Roçada aprovada com sucesso!' : 'Roçada rejeitada.',
      });
      fecharModal();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: err.message || 'Erro ao validar roçada.' });
      fecharModal();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Validar Roçadas</h1>
        <p className="text-gray-500 text-sm mt-1">
          {rocadas?.length || 0} roçada(s) pendente(s) de validação
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          feedback.tipo === 'sucesso'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.tipo === 'sucesso'
            ? <CheckCircle size={18} />
            : <XCircle size={18} />
          }
          <p className="text-sm font-medium">{feedback.msg}</p>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm">Carregando...</p>
          </div>
        </div>
      ) : rocadas?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="mx-auto text-emerald-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Nenhuma roçada pendente!</p>
          <p className="text-gray-400 text-sm mt-1">Todas as roçadas já foram validadas.</p>
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
                      <Building2 size={14} className="text-gray-400" />
                      <p className="text-sm font-semibold text-gray-900">
                        {rocada.unidades?.nome || 'Unidade não encontrada'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Código: {rocada.unidades?.codigo_unidade || '-'}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Execução:</span>{' '}
                        {new Date(rocada.data_execucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Registro:</span>{' '}
                        {new Date(rocada.data_registro).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {rocada.observacao_empresa && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 italic">
                        "{rocada.observacao_empresa}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => abrirModal(rocada, 'APROVADA')}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    Aprovar
                  </button>
                  <button
                    onClick={() => abrirModal(rocada, 'REJEITADA')}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {acao === 'APROVADA' ? '✅ Aprovar Roçada' : '❌ Rejeitar Roçada'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {rocadaSelecionada?.unidades?.nome}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Observação {acao === 'REJEITADA' && <span className="text-red-500">*</span>}
                {acao === 'APROVADA' && <span className="text-gray-400 font-normal">(opcional)</span>}
              </label>
              <textarea
                value={observacaoSME}
                onChange={(e) => setObservacaoSME(e.target.value)}
                rows={3}
                placeholder={acao === 'REJEITADA' ? 'Informe o motivo da rejeição...' : 'Observação opcional...'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {acao === 'REJEITADA' && !observacaoSME.trim() && (
                <p className="text-xs text-red-500 mt-1">Obrigatório informar motivo ao rejeitar.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={fecharModal}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidar}
                disabled={isPending || (acao === 'REJEITADA' && !observacaoSME.trim())}
                className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  acao === 'APROVADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isPending ? 'Processando...' : acao === 'APROVADA' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
