import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Home, CheckSquare, ClipboardList, BarChart3, Settings, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const MainLayout: React.FC = () => {
  const { usuario, logout, isSME, isEmpresa } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard', show: true },
    { label: 'Unidades', icon: CheckSquare, href: '/unidades', show: true },
    { label: 'Registrar Roçada', icon: ClipboardList, href: '/registrar-rocada', show: isEmpresa },
    { label: 'Validar Roçadas', icon: BarChart3, href: '/validar-rocadas', show: isSME },
    { label: 'Histórico', icon: FileText, href: '/historico', show: true },
    { label: 'Relatórios', icon: BarChart3, href: '/relatorios', show: true },
    { label: 'Configurações', icon: Settings, href: '/configuracoes', show: isSME },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 ease-in-out flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          {sidebarOpen && <h1 className="text-xl font-bold text-white">Roçadas</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1 flex-1">
          {menuItems.map((item) =>
            item.show ? (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left relative group ${
                  location.pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </button>
            ) : null
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Sistema de Controle de Roçadas</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{usuario?.nome}</p>
              <p className="text-xs text-gray-500">
                {isSME ? 'Secretaria Municipal de Educação' : 'Empresa Terceirizada'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
