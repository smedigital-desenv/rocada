import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, Usuario, UserProfile } from '../types';

/* ============================================================================
 * AuthContext — INTEGRAÇÃO COM O CONTROLE DE ACESSO CENTRAL (homologação/teste).
 * ----------------------------------------------------------------------------
 * Nesta build (develop / /rocada/teste/), o LOGIN e as PERMISSÕES vêm do
 * Controle de Acesso CENTRAL da rede (window.AcessoSME), carregado por
 * /central/acesso-sme.js no index.html. Se não houver sessão, o próprio
 * acesso-sme.js redireciona para /central/login.html.
 *
 * Modelo "Fase 1" (igual ao GOM): o central governa QUEM entra e o PAPEL
 * (SME/EMPRESA). Os DADOS continuam no Supabase do Roçadas (src/lib/supabase).
 * A mesma interface AuthContextType é mantida para o resto do app não mudar.
 * ========================================================================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Espera um global aparecer (os scripts do central carregam fora do bundle).
function waitFor<T>(get: () => T | undefined | null, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    (function tick() {
      const v = get();
      if (v) return resolve(v as T);
      if (Date.now() - start > timeoutMs) return resolve(null);
      setTimeout(tick, 50);
    })();
  });
}

// AcessoSME.sistema.papel / perfil.tipo -> perfil do Roçadas (SME | EMPRESA).
function mapearPerfil(A: any): UserProfile {
  if (A?.perfil?.is_super_admin) return 'SME';
  const papel = String(A?.sistema?.papel || A?.perfil?.tipo || '').toLowerCase();
  if (papel.indexOf('empresa') >= 0 || papel === 'externo') return 'EMPRESA';
  return 'SME';
}

const LOGIN_URL = () =>
  (typeof window !== 'undefined' && (window as any).ACESSO_LOGIN) || '/central/login.html';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      // 1) Espera o módulo do central (window.AcessoSME) ficar disponível.
      const A: any = await waitFor(() => (window as any).AcessoSME, 8000);
      if (cancelado) return;
      if (!A) {
        setError('Controle de acesso central indisponível.');
        setLoading(false);
        return;
      }
      try {
        // 2) Aguarda a verificação de acesso. Sem sessão, o acesso-sme.js já
        //    redireciona para o login central — aqui só resolve quando OK.
        await A.pronto;
        if (cancelado) return;
        if (A.perfil) {
          setUsuario({
            id: String(A.perfil.id ?? A.perfil.email ?? ''),
            email: A.perfil.email || '',
            nome: A.perfil.nome || A.perfil.email || '',
            perfil: mapearPerfil(A),
            ativo: true,
          });
        }
      } catch {
        if (!cancelado) setError('Falha ao verificar seu acesso no central.');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();

    return () => { cancelado = true; };
  }, []);

  // Login/cadastro/senha são gerenciados pelo CENTRAL — mantidos por compat.
  const login = async () => {
    window.location.href = LOGIN_URL();
  };

  const logout = async () => {
    const A: any = (window as any).AcessoSME;
    if (A && typeof A.signOut === 'function') {
      await A.signOut();
    } else {
      window.location.href = LOGIN_URL();
    }
  };

  const signUp = async () => {
    throw new Error('O cadastro de usuários é feito no Controle de Acesso Central.');
  };

  const trocarSenha = async () => {
    throw new Error('A senha é gerenciada pelo Controle de Acesso Central.');
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
    primeiroAcesso: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
