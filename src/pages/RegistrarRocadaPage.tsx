import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle } from 'lucide-react';
import { useUnidades, useCriarRocada } from '../hooks/useQueries';

export const RegistrarRocadaPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: unidades } = useUnidades();
  const criarRocada = useCriarRocada();

  const [unidadeId, setUnidadeId] = useState('');
  const [dataExecucao, setDataExecucao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await criarRocada.mutateAsync({
        unidade_id: unidadeId,
        data_execucao: dataExecucao,
        observacao_empresa: observacao,
      });
      setSucesso(true);
      setTimeout(() => navigate('/unidades'), 2500);
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar roçada');
    }
  };

  const hoje = new Date().toISOString().split('T')[0];
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (sucesso) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Roçada Registrada!</h2>
          <p className="text-gray-500">Redirecionando para unidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Roçada</h1>
        <p className="text-gray-500 text-sm mt-1">Informe os dados da roçada executada</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Nova Roçada</p>
            <p className="text-xs text-gray-500">Preencha todos os campos obrigatórios</p>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data de Execução <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dataExecucao}
              onChange={(e) => setDataExecucao(e.target.value)}
              max={hoje}
              min={seteDiasAtras}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Data em que a roçada foi realizada (máximo 7 dias atrás)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={4}
              placeholder="Descreva detalhes da execução, condições do local, etc..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Atenção:</strong> Após o registro, a roçada ficará com status <strong>Pendente</strong> até a validação pela SME.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/unidades')}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={criarRocada.isPending}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {criarRocada.isPending ? 'Registrando...' : 'Registrar Roçada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
