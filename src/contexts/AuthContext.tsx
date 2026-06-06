import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, Usuario, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar sessão ao carregar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Obter sessão existente
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          // Buscar perfil do usuário
          const { data: perfil, error: perfilError } = await supabase
            .from('perfis')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (perfilError && perfilError.code !== 'PGRST116') {
            throw perfilError;
          }

          if (perfil) {
            setUsuario({
              id: session.user.id,
              email: session.user.email || '',
              nome: perfil.nome,
              perfil: perfil.perfil as UserProfile,
              ativo: perfil.ativo,
            });
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar autenticação:', err);
        setError('Erro ao carregar sessão');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (perfil) {
          setUsuario({
            id: session.user.id,
            email: session.user.email || '',
            nome: perfil.nome,
            perfil: perfil.perfil as UserProfile,
            ativo: perfil.ativo,
          });
        }
      } else {
        setUsuario(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
    } catch (err: any) {
      const mensagem =
        err?.message || 'Erro ao fazer login. Verifique suas credenciais.';
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
    } catch (err: any) {
      setError('Erro ao fazer logout');
      throw err;
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      setError(null);

      // Criar usuário no Auth
      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Falha ao criar usuário');

      // Criar perfil inicial (EMPRESA por padrão)
      const { error: perfilError } = await supabase.from('perfis').insert({
        user_id: user.id,
        nome,
        perfil: 'EMPRESA',
        ativo: true,
      });

      if (perfilError) throw perfilError;

      setUsuario({
        id: user.id,
        email: user.email || '',
        nome,
        perfil: 'EMPRESA',
        ativo: true,
      });
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
    isAuthenticated: !!usuario && usuario.ativo,
    isSME: usuario?.perfil === 'SME',
    isEmpresa: usuario?.perfil === 'EMPRESA',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
