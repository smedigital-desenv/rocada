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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
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

      {/* ── Rota pública: Unidades acessível sem login ── */}
      <Route element={<MainLayout />}>
        <Route path="unidades" element={<UnidadesPage />} />
      </Route>

      {/* ── Rotas protegidas ── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/unidades" replace />} />
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

      {/* Redireciona qualquer rota desconhecida para unidades */}
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
