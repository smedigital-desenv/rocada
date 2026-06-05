// ============================================
// TIPOS DO SISTEMA
// ============================================

// Perfis de usuário
export type UserProfile = 'SME' | 'EMPRESA';

// Status de validação de roçadas
export type StatusValidacao = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

// Situação operacional das unidades
export type SituacaoOperacional = 'EM_DIA' | 'ATENCAO' | 'CRITICO' | 'PENDENCIA_SME';

// ============================================
// USUARIO
// ============================================

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  perfil: UserProfile;
  ativo: boolean;
}

export interface UsuarioPerfil {
  id: string;
  user_id: string;
  nome: string;
  perfil: UserProfile;
  ativo: boolean;
  created_at: string;
}

// ============================================
// CONFIGURACOES
// ============================================

export interface Configuracoes {
  id: string;
  prazo_dias: number;
  tolerancia_antes: number;
  tolerancia_depois: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// REGIOES
// ============================================

export interface Regiao {
  id: string;
  nome: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// UNIDADES
// ============================================

export interface Unidade {
  id: string;
  codigo_unidade: string;
  nome: string;
  tipo_unidade?: string;
  endereco?: string;
  bairro?: string;
  regiao_id: string;
  ativa: boolean;
  
  // Campos de controle
  ultima_rocada?: string; // DATE
  proxima_rocada?: string; // DATE
  situacao_operacional: SituacaoOperacional;
  
  // Geolocalização
  latitude?: number;
  longitude?: number;
  
  created_at: string;
  updated_at: string;
}

export interface UnidadeComRegiao extends Unidade {
  regiao: Regiao;
}

export interface DadosUnidadeComRocadas extends UnidadeComRegiao {
  rocadas: Rocada[];
  dias_desde_ultima_rocada?: number;
}

// ============================================
// ROCADAS
// ============================================

export interface Rocada {
  id: string;
  unidade_id: string;
  data_execucao: string; // DATE
  data_registro: string; // TIMESTAMP
  status_validacao: StatusValidacao;
  observacao_empresa?: string;
  observacao_sme?: string;
  usuario_empresa: string;
  usuario_sme?: string;
  created_at: string;
  updated_at: string;
}

export interface RocadaComUnidade extends Rocada {
  unidade: Unidade;
}

// ============================================
// LOGS
// ============================================

export interface Log {
  id: string;
  usuario_id: string;
  acao: string;
  entidade: string;
  registro_id?: string;
  detalhes?: Record<string, any>;
  created_at: string;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStats {
  total_unidades: number;
  em_dia: number;
  atencao: number;
  critico: number;
  pendente_validacao: number;
  inativas: number;
}

export interface DashboardCharts {
  distribuicao_situacao: ChartData[];
  unidades_por_regiao: ChartData[];
  rocadas_por_mes: ChartDataMes[];
}

export interface ChartData {
  name: string;
  value: number;
}

export interface ChartDataMes {
  mes: string;
  quantidade: number;
}

// ============================================
// FILTROS
// ============================================

export interface FiltroUnidades {
  search?: string;
  regiao_id?: string;
  situacao?: SituacaoOperacional;
  ativa?: boolean;
  page?: number;
  limit?: number;
}

export interface FiltroRocadas {
  unidade_id?: string;
  regiao_id?: string;
  status_validacao?: StatusValidacao;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

export interface FiltroLogs {
  usuario_id?: string;
  acao?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

// ============================================
// RESPONSES / REQUESTS
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRocadaRequest {
  unidade_id: string;
  data_execucao: string;
  observacao_empresa?: string;
}

export interface ValidarRocadaRequest {
  status: StatusValidacao;
  observacao_sme?: string;
}

export interface CreateUnidadeRequest {
  codigo_unidade: string;
  nome: string;
  tipo_unidade?: string;
  endereco?: string;
  bairro?: string;
  regiao_id: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateUnidadeRequest extends Partial<CreateUnidadeRequest> {
  ativa?: boolean;
}

// ============================================
// CONTEXTO DE AUTENTICAÇÃO
// ============================================

export interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<void>;
  isAuthenticated: boolean;
  isSME: boolean;
  isEmpresa: boolean;
}
