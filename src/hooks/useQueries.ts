import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  Rocada,
  Log,
  Regiao,
  DashboardStats,
  FiltroUnidades,
  DashboardCharts,
  CreateRocadaRequest,
  ValidarRocadaRequest,
} from '../types';

// ============================================
// QUERIES - REGIOES
// ============================================

export const useRegioes = () => {
  return useQuery({
    queryKey: ['regioes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regioes')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Regiao[];
    },
  });
};

// ============================================
// QUERIES - UNIDADES
// ============================================

export const useUnidades = (filtros?: FiltroUnidades) => {
  return useQuery({
    queryKey: ['unidades', filtros],
    queryFn: async () => {
      let query = supabase
        .from('unidades')
        .select('*, regioes(id, nome, descricao)')
        .eq('ativa', true)
        .order('nome');

      if (filtros?.search) {
        query = query.or(
          `nome.ilike.%${filtros.search}%,codigo_unidade.ilike.%${filtros.search}%`
        );
      }

      if (filtros?.regiao_id) {
        query = query.eq('regiao_id', filtros.regiao_id);
      }

      if (filtros?.situacao) {
        query = query.eq('situacao_operacional', filtros.situacao);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any[];
    },
  });
};

export const useUnidade = (id: string) => {
  return useQuery({
    queryKey: ['unidade', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades')
        .select('*, regioes(id, nome, descricao)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// ============================================
// QUERIES - ROCADAS
// ============================================

export const useRocadasPendentes = () => {
  return useQuery({
    queryKey: ['rocadas', 'pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rocadas')
        .select('*, unidades(id, nome, codigo_unidade)')
        .eq('status_validacao', 'PENDENTE')
        .order('data_registro', { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });
};

export const useRocadasUnidade = (unidadeId: string) => {
  return useQuery({
    queryKey: ['rocadas', unidadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rocadas')
        .select('*')
        .eq('unidade_id', unidadeId)
        .order('data_execucao', { ascending: false });

      if (error) throw error;
      return data as Rocada[];
    },
    enabled: !!unidadeId,
  });
};

// ============================================
// QUERIES - DASHBOARD
// ============================================

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      // Buscar todas as unidades
      const { data: unidades, error } = await supabase
        .from('unidades')
        .select('situacao_operacional, ativa');

      if (error) throw error;

      const stats: DashboardStats = {
        total_unidades: unidades?.length || 0,
        em_dia: unidades?.filter((u) => u.situacao_operacional === 'EM_DIA').length || 0,
        atencao: unidades?.filter((u) => u.situacao_operacional === 'ATENCAO').length || 0,
        critico: unidades?.filter((u) => u.situacao_operacional === 'CRITICO').length || 0,
        pendente_validacao:
          unidades?.filter((u) => u.situacao_operacional === 'PENDENCIA_SME').length || 0,
        inativas: unidades?.filter((u) => !u.ativa).length || 0,
      };

      return stats;
    },
  });
};

export const useDashboardCharts = () => {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => {
      // Distribuição por situação
      const { data: unidades } = await supabase
        .from('unidades')
        .select('situacao_operacional, regiao_id, ultima_rocada')
        .eq('ativa', true);

      if (!unidades) throw new Error('Erro ao buscar dados');

      // Gráfico 1: Distribuição por situação
      const distribuicao: Record<string, number> = {};
      unidades.forEach((u) => {
        distribuicao[u.situacao_operacional] = (distribuicao[u.situacao_operacional] || 0) + 1;
      });

      const distribuicao_situacao = Object.entries(distribuicao).map(([name, value]) => ({
        name:
          name === 'EM_DIA'
            ? 'Em Dia'
            : name === 'ATENCAO'
              ? 'Atenção'
              : name === 'CRITICO'
                ? 'Crítico'
                : 'Pendência SME',
        value,
      }));

      // Gráfico 2: Unidades por região
      const { data: regioes } = await supabase.from('regioes').select('id, nome');

      const unidades_por_regiao = (regioes || []).map((regiao) => ({
        name: regiao.nome,
        value: unidades.filter((u) => u.regiao_id === regiao.id).length,
      }));

      // Gráfico 3: Roçadas por mês
      const { data: rocadas } = await supabase
        .from('rocadas')
        .select('data_execucao')
        .eq('status_validacao', 'APROVADA');

      const rocadas_por_mes: Record<string, number> = {};
      (rocadas || []).forEach((r) => {
        const data = new Date(r.data_execucao);
        const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        rocadas_por_mes[mes] = (rocadas_por_mes[mes] || 0) + 1;
      });

      const rocadas_por_mes_array = Object.entries(rocadas_por_mes).map(([mes, quantidade]) => ({
        mes,
        quantidade,
      }));

      return {
        distribuicao_situacao,
        unidades_por_regiao,
        rocadas_por_mes: rocadas_por_mes_array,
      } as DashboardCharts;
    },
  });
};

// ============================================
// QUERIES - LOGS
// ============================================

export const useLogs = (filtros?: { usuario_id?: string; acao?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['logs', filtros],
    queryFn: async () => {
      let query = supabase.from('logs').select('*');

      if (filtros?.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }

      if (filtros?.acao) {
        query = query.eq('acao', filtros.acao);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filtros?.limit || 50);

      if (error) throw error;
      return data as Log[];
    },
  });
};

// ============================================
// MUTATIONS - ROCADAS
// ============================================

export const useCriarRocada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRocadaRequest) => {
      const { data: usuario } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('rocadas').insert({
        unidade_id: payload.unidade_id,
        data_execucao: payload.data_execucao,
        observacao_empresa: payload.observacao_empresa,
        usuario_empresa: usuario?.user?.id,
        status_validacao: 'PENDENTE',
      });

      if (error) throw error;

      // Atualizar unidade
      await supabase
        .from('unidades')
        .update({
          ultima_rocada: payload.data_execucao,
          proxima_rocada: new Date(
            new Date(payload.data_execucao).getTime() + 60 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0],
          situacao_operacional: 'EM_DIA',
        })
        .eq('id', payload.unidade_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['rocadas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useValidarRocada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rocadaId,
      ...payload
    }: ValidarRocadaRequest & { rocadaId: string }) => {
      const { data: usuario } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('rocadas')
        .update({
          status_validacao: payload.status,
          observacao_sme: payload.observacao_sme,
          usuario_sme: usuario?.user?.id,
        })
        .eq('id', rocadaId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rocadas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// ============================================
// MUTATIONS - UNIDADES
// ============================================

export const useCriarUnidade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { codigo_unidade: string; nome: string; regiao_id: string }) => {
      const { data: unidade, error } = await supabase
        .from('unidades')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return unidade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
    },
  });
};
