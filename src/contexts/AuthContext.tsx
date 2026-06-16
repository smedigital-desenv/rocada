import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, Usuario, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);

  const carregarPerfil = async (userId: string, email: string) => {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (perfil) {
      setUsuario({
        id: userId,
        email,
        nome: perfil.nome,
        perfil: perfil.perfil as UserProfile,
        ativo: perfil.ativo,
      });
      setPrimeiroAcesso(perfil.primeiro_acesso ?? false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (session?.user) {
          await carregarPerfil(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Erro ao inicializar autenticação:', err);
        setError('Erro ao carregar sessão');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await carregarPerfil(session.user.id, session.user.email || '');
      } else {
        setUsuario(null);
        setPrimeiroAcesso(false);
      }
    });

    return () => { subscription?.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        await carregarPerfil(data.user.id, data.user.email || '');
      }
    } catch (err: any) {
      const mensagem = err?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setError(mensagem);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUsuario(null);
      setPrimeiroAcesso(false);
    } catch (err: any) {
      setError('Erro ao fazer logout');
      throw err;
    }
  };

  const trocarSenha = async (novaSenha: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) throw error;

    // Marcar primeiro acesso como concluído
    if (usuario) {
      await supabase
        .from('perfis')
        .update({ primeiro_acesso: false })
        .eq('user_id', usuario.id);
      setPrimeiroAcesso(false);
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      setError(null);
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      if (!user) throw new Error('Falha ao criar usuário');

      const { error: perfilError } = await supabase.from('perfis').insert({
        user_id: user.id,
        nome,
        perfil: 'EMPRESA',
        ativo: true,
        primeiro_acesso: true,
      });
      if (perfilError) throw perfilError;
    } catch (err: any) {
      const mensagem = err?.message || 'Erro ao criar conta';
      setError(mensagem);
      throw err;
    }
  };

  const value: AuthContextType = {
    usuario,
    loading,
    error,
    login,
    logout,
    signUp,
    trocarSenha,
    isAuthenticated: !!usuario && usuario.ativo,
    isSME: usuario?.perfil === 'SME',
    isEmpresa: usuario?.perfil === 'EMPRESA',
    primeiroAcesso,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
