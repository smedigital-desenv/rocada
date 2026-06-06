import React, { useState } from 'react';
import { Plus, Users, Settings, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const ConfiguracoesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<'usuarios' | 'sistema'>('usuarios');
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ email: '', senha: '', nome: '', perfil: 'EMPRESA' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Listar usuários
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, user_id, nome, perfil, ativo, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Criar usuário
  const criarUsuario = useMutation({
    mutationFn: async () => {
      if (!formData.email || !formData.senha || !formData.nome) {
        throw new Error('Preencha todos os campos');
      }

      const { data, error } = await supabase.rpc('criar_usuario', {
        email: formData.email,
        senha: formData.senha,
        nome: formData.nome,
        perfil: formData.perfil,
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setSucesso('Usuário criado com sucesso!');
      setFormData({ email: '', senha: '', nome: '', perfil: 'EMPRESA' });
      setModalAberto(false);
      setTimeout(() => setSucesso(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: any) => {
      setErro(err.message || 'Erro ao criar usuário');
    },
  });

  // Desativar usuário
  const desativarUsuario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('perfis')
        .update({ ativo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerenciar sistema e usuários</p>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setAba('usuarios')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              aba === 'usuarios'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Users className="inline-block mr-2" size={18} />
            Usuários
          </button>
          <button
            onClick={() => setAba('sistema')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              aba === 'sistema'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Settings className="inline-block mr-2" size={18} />
            Sistema
          </button>
        </div>
      </div>

      {/* Aba Usuários */}
      {aba === 'usuarios' && (
        <div className="space-y-4">
          {sucesso && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="text-emerald-600" size={20} />
              <p className="text-sm text-emerald-700">{sucesso}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => { setModalAberto(true); setErro(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Novo Usuário
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Perfil</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data Criação</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.perfil === 'SME'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {user.perfil}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.ativo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        {user.ativo && (
                          <button
                            onClick={() => desativarUsuario.mutate(user.id)}
                            disabled={desativarUsuario.isPending}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Aba Sistema */}
      {aba === 'sistema' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h3>
          <p className="text-gray-500 text-sm">Funcionalidade em desenvolvimento...</p>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Usuário</h2>

            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); criarUsuario.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SME">SME (Administrador)</option>
                  <option value="EMPRESA">EMPRESA (Terceirizada)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalAberto(false); setErro(''); }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarUsuario.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {criarUsuario.isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
