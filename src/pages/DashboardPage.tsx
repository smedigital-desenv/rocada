import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, BarChart3, Loader } from 'lucide-react';
import { useDashboardStats, useDashboardCharts } from '../hooks/useQueries';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={32} />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle de roçadas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Unidades */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total de Unidades</p>
              <p className="text-3xl font-bold">{stats?.total_unidades || 0}</p>
            </div>
            <BarChart3 className="text-secondary" size={32} />
          </div>
        </div>

        {/* Em Dia */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Em Dia</p>
              <p className="text-3xl font-bold">{stats?.em_dia || 0}</p>
            </div>
            <CheckCircle className="text-success" size={32} />
          </div>
        </div>

        {/* Atenção */}
        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Atenção</p>
              <p className="text-3xl font-bold">{stats?.atencao || 0}</p>
            </div>
            <AlertTriangle className="text-warning" size={32} />
          </div>
        </div>

        {/* Crítico */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crítico</p>
              <p className="text-3xl font-bold">{stats?.critico || 0}</p>
            </div>
            <AlertCircle className="text-danger" size={32} />
          </div>
        </div>

        {/* Pendente SME */}
        <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pendente SME</p>
              <p className="text-3xl font-bold">{stats?.pendente_validacao || 0}</p>
            </div>
            <AlertCircle className="text-info" size={32} />
          </div>
        </div>

        {/* Inativas */}
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Inativas</p>
              <p className="text-3xl font-bold">{stats?.inativas || 0}</p>
            </div>
            <BarChart3 className="text-muted-foreground" size={32} />
          </div>
        </div>
      </div>

      {/* Charts */}
      {!chartsLoading && charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Situação */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Distribuição por Situação</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.distribuicao_situacao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {charts.distribuicao_situacao.map((entry, index) => {
                    let color = '#3b82f6';
                    if (entry.name === 'Em Dia') color = '#10b981';
                    else if (entry.name === 'Atenção') color = '#f59e0b';
                    else if (entry.name === 'Crítico') color = '#ef4444';
                    else if (entry.name === 'Pendência SME') color = '#06b6d4';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Unidades por Região */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Unidades por Região</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.unidades_por_regiao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Roçadas por Mês */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6">Roçadas Realizadas (Últimos Meses)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.rocadas_por_mes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="quantidade"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};