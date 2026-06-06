import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias'
  );
}

// Criar cliente Supabase com schema separado
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'rocadas', // ← Usar schema separado
  },
});

// ============================================
// HELPERS PARA REQUISIÇÕES
// ============================================

export async function handleSupabaseError(error: any) {
  if (error?.status === 401) {
    return { error: 'Não autorizado. Faça login novamente.' };
  }
  if (error?.status === 403) {
    return { error: 'Acesso negado. Você não tem permissão para esta ação.' };
  }
  if (error?.message) {
    return { error: error.message };
  }
  return { error: 'Erro ao processar requisição' };
}