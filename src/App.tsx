import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/Layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnidadesPage } from './pages/UnidadesPage';
import { RegistrarRocadaPage } from './pages/RegistrarRocadaPage';
import { ValidarRocadasPage } from './pages/ValidarRocadasPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { PrimeiroAcessoPage } from './pages/PrimeiroAcessoPage';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

// Rota protegida — redireciona para login se não autenticado
// Redireciona para /primeiro-acesso se for primeiro acesso
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, primeiroAcesso } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (primeiroAcesso) return <Navigate to="/primeiro-acesso" replace />;
  return <>{children}</>;
};

// Rota exclusiva para primeiro acesso (só entra se estiver autenticado E primeiro_acesso = true)
const PrimeiroAcessoRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, primeiroAcesso } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!primeiroAcesso) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const SMERoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSME } = useAuth();
  if (!isSME) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const EmpresaRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isEmpresa } = useAuth();
  if (!isEmpresa) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Primeiro acesso — fora do MainLayout */}
      <Route
        path="/primeiro-acesso"
        element={
          <PrimeiroAcessoRoute>
            <PrimeiroAcessoPage />
          </PrimeiroAcessoRoute>
        }
      />

      {/* Rota pública — Unidades acessível sem login */}
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/unidades" replace />} />
        <Route path="unidades" element={<UnidadesPage />} />
      </Route>

      {/* Rotas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="registrar-rocada" element={
          <EmpresaRoute><RegistrarRocadaPage /></EmpresaRoute>
        } />
        <Route path="validar-rocadas" element={
          <SMERoute><ValidarRocadasPage /></SMERoute>
        } />
        <Route path="historico" element={<HistoricoPage />} />
        <Route path="relatorios" element={
          <SMERoute><RelatoriosPage /></SMERoute>
        } />
        <Route path="configuracoes" element={
          <SMERoute><ConfiguracoesPage /></SMERoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/unidades" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename="/rocada">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
