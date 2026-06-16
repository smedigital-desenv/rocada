import React, { useState, useEffect } from 'react';
import {
  Plus, Users, Settings, CheckCircle, Trash2, AlertCircle,
  Clock, Building2, FileText, MapPin, Save, Pencil, X, Upload, KeyRound
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Aba = 'usuarios' | 'sistema';
type SecaoSistema = 'prazos' | 'empresa' | 'relatorios' | 'regioes';

const SENHA_PADRAO = 'Rocada@2026';

// ============================================================
// HOOKS DE CONFIGURAÇÃO
// ============================================================
const useConfiguracoes = () => {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('configuracoes').select('*').single();
      if (error) throw error;
      return data;
    },
  });
};

const useSalvarConfiguracoes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valores: Record<string, any>) => {
      const { data: existente } = await supabase.from('configuracoes').select('id').single();
      if (existente) {
        const { error } = await supabase
          .from('configuracoes')
          .update({ ...valores, updated_at: new Date().toISOString() })
          .eq('id', existente.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['configuracoes'] }); },
  });
};

// ============================================================
// SEÇÃO: PRAZOS
// ============================================================
const SecaoPrazos: React.FC<{ configs: any }> = ({ configs }) => {
  const [prazo, setPrazo] = useState<number>(60);
  const [tolAntes, setTolAntes] = useState<number>(7);
  const [tolDepois, setTolDepois] = useState<number>(7);
  const [sucesso, setSucesso] = useState(false);
  const salvar = useSalvarConfiguracoes();

  useEffect(() => {
    if (configs) {
      setPrazo(configs.prazo_dias ?? 60);
      setTolAntes(configs.tolerancia_antes ?? 7);
      setTolDepois(configs.tolerancia_depois ?? 7);
    }
  }, [configs]);

  const handleSalvar = async () => {
    await salvar.mutateAsync({ prazo_dias: prazo, tolerancia_antes: tolAntes, tolerancia_depois: tolDepois });
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  const p = prazo || 60;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={18} className="text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Prazos</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prazo entre roçadas (dias)</label>
          <input type="number" min="1" max="365" value={prazo}
            onChange={(e) => setPrazo(e.target.value === '' ? 60 : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância antes (dias)</label>
          <input type="number" min="0" max="30" value={tolAntes}
            onChange={(e) => setTolAntes(e.target.value === '' ? 0 : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tolerância depois (dias)</label>
          <input type="number" min="0" max="30" value={tolDepois}
            onChange={(e) => setTolDepois(e.target.value === '' ? 0 : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1.5">
        <p className="font-medium text-gray-600 mb-2">Preview das situações:</p>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Em Dia</span>
          <span className="text-gray-500">até {p - tolAntes} dias desde a última roçada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Atenção</span>
          <span className="text-gray-500">de {p - tolAntes + 1} a {p + tolDepois} dias</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Crítico</span>
          <span className="text-gray-500">acima de {p + tolDepois} dias</span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        {sucesso && <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle size={14} /> Salvo!</span>}
        <button onClick={handleSalvar} disabled={salvar.isPending}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Save size={14} />{salvar.isPending ? 'Salvando...' : 'Salvar Prazos'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// SEÇÃO: EMPRESA E CONTRATO
// ============================================================
const SecaoEmpresa: React.FC<{ configs: any }> = ({ configs }) => {
  const [form, setForm] = useState({ nome_empresa: '', cnpj_empresa: '', numero_contrato: '', vigencia_inicio: '', vigencia_fim: '' });
  const [sucesso, setSucesso] = useState(false);
  const salvar = useSalvarConfiguracoes();

  useEffect(() => {
    if (configs) {
      setForm({
        nome_empresa:    configs.nome_empresa    || '',
        cnpj_empresa:    configs.cnpj_empresa    || '',
        numero_contrato: configs.numero_contrato || '',
        vigencia_inicio: configs.vigencia_inicio || '',
        vigencia_fim:    configs.vigencia_fim    || '',
      });
    }
  }, [configs]);

  const handleSalvar = async () => {
    await salvar.mutateAsync(form);
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={18} className="text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Empresa e Contrato</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
          <input type="text" value={form.nome_empresa} onChange={(e) => setForm({ ...form, nome_empresa: e.target.value })}
            placeholder="Razão Social"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
          <input type="text" value={form.cnpj_empresa} onChange={(e) => setForm({ ...form, cnpj_empresa: e.target.value })}
            placeholder="00.000.000/0000-00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número do Contrato</label>
          <input type="text" value={form.numero_contrato} onChange={(e) => setForm({ ...form, numero_contrato: e.target.value })}
            placeholder="Ex: 001/2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vigência Início</label>
            <input type="date" value={form.vigencia_inicio} onChange={(e) => setForm({ ...form, vigencia_inicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vigência Fim</label>
            <input type="date" value={form.vigencia_fim} onChange={(e) => setForm({ ...form, vigencia_fim: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        {sucesso && <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle size={14} /> Salvo!</span>}
        <button onClick={handleSalvar} disabled={salvar.isPending}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Save size={14} />{salvar.isPending ? 'Salvando...' : 'Salvar Empresa'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// SEÇÃO: RELATÓRIOS
// ============================================================
const SecaoRelatorios: React.FC<{ configs: any }> = ({ configs }) => {
  const [form, setForm] = useState({ nome_secretaria: '', cabecalho_pdf: '', rodape_pdf: '', logo_url: '' });
  const [sucesso, setSucesso] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erroUpload, setErroUpload] = useState('');
  const salvar = useSalvarConfiguracoes();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (configs) {
      setForm({
        nome_secretaria: configs.nome_secretaria || '',
        cabecalho_pdf:   configs.cabecalho_pdf   || '',
        rodape_pdf:      configs.rodape_pdf       || '',
        logo_url:        configs.logo_url         || '',
      });
    }
  }, [configs]);

  const handleSalvar = async () => {
    await salvar.mutateAsync(form);
    setSucesso(true);
    setTimeout(() => setSucesso(false), 3000);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) { setErroUpload('Formato não suportado. Use PNG, JPG ou SVG.'); return; }
    if (file.size > 2 * 1024 * 1024) { setErroUpload('Arquivo muito grande. Máximo 2MB.'); return; }
    setUploadando(true);
    setErroUpload('');
    try {
      const ext = file.name.split('.').pop();
      const fileName = `logo_sme.${ext}`;
      const { data, error } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true, cacheControl: '3600' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(data.path);
      setForm((prev) => ({ ...prev, logo_url: publicUrl }));
    } catch (err: any) {
      setErroUpload(err.message || 'Erro ao fazer upload do logo');
    } finally {
      setUploadando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={18} className="text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Relatórios PDF</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Secretaria</label>
          <input type="text" value={form.nome_secretaria} onChange={(e) => setForm({ ...form, nome_secretaria: e.target.value })}
            placeholder="Ex: Secretaria Municipal de Educação"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cabeçalho do PDF</label>
          <input type="text" value={form.cabecalho_pdf} onChange={(e) => setForm({ ...form, cabecalho_pdf: e.target.value })}
            placeholder="Ex: Prefeitura Municipal de Ribeirão Preto"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rodapé do PDF</label>
          <input type="text" value={form.rodape_pdf} onChange={(e) => setForm({ ...form, rodape_pdf: e.target.value })}
            placeholder="Ex: Contrato Nº 001/2026 — Empresa XYZ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
          {form.logo_url && (
            <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <img src={form.logo_url} alt="Logo atual" className="h-12 object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">{form.logo_url}</p>
              </div>
              <button onClick={() => setForm((prev) => ({ ...prev, logo_url: '' }))}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded transition-colors">
                <X size={12} /> Remover
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={handleUploadLogo} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadando}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
            {uploadando
              ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> Enviando...</>
              : <><Upload size={15} /> Fazer upload do logo</>}
          </button>
          {erroUpload && <p className="text-xs text-red-600 mt-1">{erroUpload}</p>}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Ou cole uma URL de imagem hospedada online:</p>
            <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG · Máximo 2MB</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        {sucesso && <span className="flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle size={14} /> Salvo!</span>}
        <button onClick={handleSalvar} disabled={salvar.isPending}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Save size={14} />{salvar.isPending ? 'Salvando...' : 'Salvar Relatórios'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// SEÇÃO: REGIÕES
// ============================================================
const SecaoRegioes: React.FC = () => {
  const queryClient = useQueryClient();
  const [novaRegiao, setNovaRegiao] = useState('');
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null);
  const [erro, setErro] = useState('');

  const { data: regioes, isLoading } = useQuery({
    queryKey: ['regioes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('regioes').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const adicionarRegiao = useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase.from('regioes').insert([{ nome }]);
      if (error) throw error;
    },
    onSuccess: () => { setNovaRegiao(''); queryClient.invalidateQueries({ queryKey: ['regioes'] }); },
    onError: (err: any) => setErro(err.message),
  });

  const editarRegiao = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from('regioes').update({ nome }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { setEditando(null); queryClient.invalidateQueries({ queryKey: ['regioes'] }); },
    onError: (err: any) => setErro(err.message),
  });

  const deletarRegiao = useMutation({
    mutationFn: async (id: string) => {
      const { data: unidades } = await supabase.from('unidades').select('id').eq('regiao_id', id).limit(1);
      if (unidades && unidades.length > 0) throw new Error('Esta região possui unidades e não pode ser removida.');
      const { error } = await supabase.from('regioes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regioes'] }),
    onError: (err: any) => setErro(err.message),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={18} className="text-blue-600" />
        <h3 className="text-base font-semibold text-gray-900">Regiões</h3>
      </div>
      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          {erro}<button onClick={() => setErro('')}><X size={14} /></button>
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={novaRegiao} onChange={(e) => setNovaRegiao(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && novaRegiao.trim() && adicionarRegiao.mutate(novaRegiao.trim())}
          placeholder="Nome da nova região..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => novaRegiao.trim() && adicionarRegiao.mutate(novaRegiao.trim())}
          disabled={!novaRegiao.trim() || adicionarRegiao.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          <Plus size={14} /> Adicionar
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {!regioes?.length && <p className="text-sm text-gray-400 text-center py-6">Nenhuma região cadastrada</p>}
          {regioes?.map((regiao: any) => (
            <div key={regiao.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              {editando?.id === regiao.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="text" value={editando!.nome} autoFocus
                    onChange={(e) => setEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && editando) editarRegiao.mutate({ id: editando.id, nome: editando.nome }); }}
                    className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => editando && editarRegiao.mutate({ id: editando.id, nome: editando.nome })} className="text-blue-600 hover:text-blue-700"><CheckCircle size={16} /></button>
                  <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-gray-800">{regiao.nome}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditando({ id: regiao.id, nome: regiao.nome })} className="text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => deletarRegiao.mutate(regiao.id)} disabled={deletarRegiao.isPending} className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"><Trash2 size={15} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export const ConfiguracoesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<Aba>('usuarios');
  const [secao, setSecao] = useState<SecaoSistema>('prazos');
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({ email: '', nome: '', perfil: 'EMPRESA' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const { data: configs, isLoading: loadingConfigs } = useConfiguracoes();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, user_id, nome, email, perfil, ativo, primeiro_acesso, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ── Criar usuário no Auth + Perfil automaticamente ──
  const criarUsuario = useMutation({
    mutationFn: async () => {
      if (!formData.email || !formData.nome) throw new Error('Preencha Nome e Email');

      // Usar cliente temporário sem persistir sessão (não substitui sessão do admin)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseTemp = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, storageKey: 'temp-admin-create' } }
      );

      const { data, error: authError } = await supabaseTemp.auth.signUp({
        email: formData.email,
        password: SENHA_PADRAO,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Falha ao criar usuário no sistema de autenticação');

      // Criar perfil com user_id real
      const { error: perfilError } = await supabase.from('perfis').insert({
        user_id: data.user.id,
        nome: formData.nome,
        email: formData.email,
        perfil: formData.perfil,
        ativo: true,
        primeiro_acesso: true,
      });

      if (perfilError) throw perfilError;
    },
    onSuccess: () => {
      setSucesso(`Usuário criado com sucesso! Informe ao usuário que a senha inicial é "${SENHA_PADRAO}" e que será solicitada a troca no primeiro acesso.`);
      setFormData({ email: '', nome: '', perfil: 'EMPRESA' });
      setModalAberto(false);
      setTimeout(() => setSucesso(''), 10000);
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err: any) => setErro(err.message || 'Erro ao criar usuário'),
  });

  // ── Ativar/desativar usuário ──
  const alterarStatusUsuario = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('perfis').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const secoesConfig = [
    { id: 'prazos',     label: 'Prazos',            icon: Clock },
    { id: 'empresa',    label: 'Empresa e Contrato', icon: Building2 },
    { id: 'relatorios', label: 'Relatórios PDF',     icon: FileText },
    { id: 'regioes',    label: 'Regiões',            icon: MapPin },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerenciar sistema e usuários</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {([['usuarios', Users, 'Usuários'], ['sistema', Settings, 'Sistema']] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setAba(id as Aba)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${aba === id ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent hover:text-gray-900'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ABA USUÁRIOS */}
      {aba === 'usuarios' && (
        <div className="space-y-4">
          {sucesso && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-emerald-700">{sucesso}</p>
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={() => { setModalAberto(true); setErro(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Plus size={16} /> Novo Usuário
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Nome', 'Email', 'Perfil', 'Status', 'Data Criação', 'Ações'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                        {user.primeiro_acesso && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                            <KeyRound size={11} /> Aguardando primeiro acesso
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.perfil === 'SME' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {user.perfil}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.ativo
                          ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Ativo</span>
                          : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex items-center gap-1 w-fit"><AlertCircle size={12} /> Inativo</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4">
                        {user.ativo ? (
                          <button onClick={() => alterarStatusUsuario.mutate({ id: user.id, ativo: false })}
                            disabled={alterarStatusUsuario.isPending}
                            title="Desativar usuário"
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button onClick={() => alterarStatusUsuario.mutate({ id: user.id, ativo: true })}
                            disabled={alterarStatusUsuario.isPending}
                            title="Reativar usuário"
                            className="text-emerald-500 hover:text-emerald-700 disabled:opacity-50 transition-colors">
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA SISTEMA */}
      {aba === 'sistema' && (
        <div className="flex gap-6">
          <div className="w-48 shrink-0">
            <nav className="space-y-1">
              {secoesConfig.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setSecao(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${secao === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Icon size={15} />{label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1">
            {loadingConfigs ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {secao === 'prazos'     && <SecaoPrazos     configs={configs} />}
                {secao === 'empresa'    && <SecaoEmpresa    configs={configs} />}
                {secao === 'relatorios' && <SecaoRelatorios configs={configs} />}
                {secao === 'regioes'    && <SecaoRegioes />}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Usuário</h2>
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{erro}</div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); criarUsuario.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil <span className="text-red-500">*</span></label>
                <select value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="SME">SME (Administrador)</option>
                  <option value="EMPRESA">EMPRESA (Terceirizada)</option>
                </select>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-2">
                <KeyRound size={14} className="shrink-0 mt-0.5" />
                <span>
                  Senha inicial: <strong>{SENHA_PADRAO}</strong><br />
                  O usuário será solicitado a trocar a senha no primeiro acesso.
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModalAberto(false); setErro(''); }}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={criarUsuario.isPending}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {criarUsuario.isPending ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
