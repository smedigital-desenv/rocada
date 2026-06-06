import React, { useState } from 'react';
import { ClipboardList, CheckCircle } from 'lucide-react';
import { useUnidades, useCriarRocada } from '../hooks/useQueries';

export const RegistrarRocadaPage: React.FC = () => {
  const [unidadeId, setUnidadeId] = useState('');
  const [dataExecucao, setDataExecucao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const { data: unidades } = useUnidades();
  const { mutateAsync: criarRocada, isPending } = useCriarRocada();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!unidadeId || !dataExecucao) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await criarRocada({
        unidade_id: unidadeId,
        data_execucao: dataExecucao,
        observacao_empresa: observacao,
      });
      setSucesso(true);
      setUnidadeId('');
      setDataExecucao('');
      setObservacao('');
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar roçada.');
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Roçada</h1>
        <p className="text-gray-500 text-sm mt-1">Informe os dados da roçada realizada</p>
      </div>

      {/* Sucesso */}
      {sucesso && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Roçada registrada com sucesso!</p>
            <p className="text-sm text-emerald-700 mt-0.5">O registro foi enviado para validação da SME.</p>
          </div>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="text-blue-600" size={20} />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Dados da Roçada</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unidade Escolar <span className="text-red-500">*</span>
            </label>
            <select
              value={unidadeId}
              onChange={(e) => setUnidadeId(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione a unidade...</option>
              {unidades?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigo_unidade} - {u.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data da Execução <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dataExecucao}
              onChange={(e) => setDataExecucao(e.target.value)}
              max={hoje}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observação <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={4}
              placeholder="Descreva detalhes sobre a roçada realizada..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700 font-medium mb-1">ℹ️ Informação</p>
            <p className="text-xs text-blue-600">
              Após o registro, a roçada ficará com status <strong>Pendente</strong> até a validação da SME. O próximo ciclo de 60 dias já começa a contar a partir da data de execução informada.
            </p>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Registrando...' : 'Registrar Roçada'}
          </button>
        </form>
      </div>
    </div>
  );
};
