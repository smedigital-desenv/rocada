import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-lg shadow-lg p-8">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Roçadas</h1>
          <p className="text-muted-foreground">
            Sistema de Controle de Roçadas - Rede Municipal de Educação
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-danger flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              placeholder="seu@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-secondary text-white font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Não tem conta?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-secondary hover:underline font-medium"
            >
              Criar conta
            </button>
          </p>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
          <p className="text-xs text-info font-medium mb-2">Credenciais de Demonstração:</p>
          <p className="text-xs text-muted-foreground">
            Use as credenciais fornecidas pelo administrador do sistema para acessar.
          </p>
        </div>
      </div>
    </div>
  );
};
