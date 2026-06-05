import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, CheckSquare, ClipboardList, BarChart3, Settings, LogsIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const MainLayout: React.FC = () => {
  const { usuario, logout, isSME, isEmpresa } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      show: true,
    },
    {
      label: 'Unidades',
      icon: CheckSquare,
      href: '/unidades',
      show: true,
    },
    {
      label: 'Registrar Roçada',
      icon: ClipboardList,
      href: '/registrar-rocada',
      show: isEmpresa,
    },
    {
      label: 'Validar Roçadas',
      icon: BarChart3,
      href: '/validar-rocadas',
      show: isSME,
    },
    {
      label: 'Histórico',
      icon: LogsIcon,
      href: '/historico',
      show: true,
    },
    {
      label: 'Relatórios',
      icon: BarChart3,
      href: '/relatorios',
      show: true,
    },
    {
      label: 'Configurações',
      icon: Settings,
      href: '/configuracoes',
      show: isSME,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary-light border-r border-border transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {sidebarOpen && <h1 className="text-xl font-bold text-white">Roçadas</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-background/10 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map(
            (item) =>
              item.show && (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-background/10 transition-colors text-white group relative"
                  title={!sidebarOpen ? item.label : ''}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-primary rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {item.label}
                    </div>
                  )}
                </button>
              )
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold">Sistema de Controle de Roçadas</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{usuario?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {isSME ? 'Secretaria Municipal de Educação' : 'Empresa Terceirizada'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
