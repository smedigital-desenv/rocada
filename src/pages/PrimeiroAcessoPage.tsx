import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const PrimeiroAcessoPage: React.FC = () => {
  const { usuario, trocarSenha } = useAuth();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const validarSenha = (senha: string) => {
    if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    if (!/[A-Z]/.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula';
    if (!/[0-9]/.test(senha)) return 'A senha deve conter pelo menos um número';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const erroValidacao = validarSenha(novaSenha);
    if (erroValidacao) { setErro(erroValidacao); return; }
    if (novaSenha !== confirmarSenha) { setErro('As senhas não coincidem'); return; }

    setCarregando(true);
    try {
      await trocarSenha(novaSenha);
      setSucesso(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao alterar senha');
    } finally {
      setCarregando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Senha alterada com sucesso!</h2>
          <p className="text-gray-500 text-sm">Redirecionando para o sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-8">

        {/* Ícone e título */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="text-blue-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Bem-vindo, {usuario?.nome?.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 mt-1">
            Este é seu primeiro acesso. Por segurança, defina uma nova senha antes de continuar.
          </p>
        </div>

        {/* Requisitos */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 text-xs text-blue-700 space-y-1">
          <p className="font-medium mb-1">A senha deve ter:</p>
          <p className={novaSenha.length >= 8 ? 'text-emerald-600 font-medium' : ''}>
            {novaSenha.length >= 8 ? '✓' : '○'} Pelo menos 8 caracteres
          </p>
          <p className={/[A-Z]/.test(novaSenha) ? 'text-emerald-600 font-medium' : ''}>
            {/[A-Z]/.test(novaSenha) ? '✓' : '○'} Uma letra maiúscula
          </p>
          <p className={/[0-9]/.test(novaSenha) ? 'text-emerald-600 font-medium' : ''}>
            {/[0-9]/.test(novaSenha) ? '✓' : '○'} Um número
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              required
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                confirmarSenha && novaSenha !== confirmarSenha
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
            )}
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
            {carregando ? 'Salvando...' : 'Definir Nova Senha e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
