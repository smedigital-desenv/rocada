import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, BarChart3, Loader2, Building2 } from 'lucide-react';
import { useDashboardStats, useDashboardCharts } from '../hooks/useQueries';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}> = ({ title, value, icon, color, bg }) => (
  <div className={`${bg} rounded-xl p-5 flex items-center justify-between`}>
    <div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
    <div className={`${color} opacity-80`}>{icon}</div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-gray-500">Visão geral do sistema de controle de roçadas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total" value={stats?.total_unidades || 0} icon={<Building2 size={32} />} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Em Dia" value={stats?.em_dia || 0} icon={<CheckCircle size={32} />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="Atenção" value={stats?.atencao || 0} icon={<AlertTriangle size={32} />} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Crítico" value={stats?.critico || 0} icon={<AlertCircle size={32} />} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Pendente SME" value={stats?.pendente_validacao || 0} icon={<BarChart3 size={32} />} color="text-cyan-600" bg="bg-cyan-50" />
        <StatCard title="Inativas" value={stats?.inativas || 0} icon={<Building2 size={32} />} color="text-gray-500" bg="bg-gray-100" />
      </div>

      {/* Charts */}
      {!chartsLoading && charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Distribuição por Situação</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={charts.distribuicao_situacao} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {charts.distribuicao_situacao.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Por Região */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Unidades por Região</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.unidades_por_regiao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Roçadas por Mês */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Roçadas Realizadas por Mês</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={charts.rocadas_por_mes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="quantidade" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
