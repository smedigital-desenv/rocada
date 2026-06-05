# Sistema de Controle de Roçadas

Sistema web responsivo para controle e acompanhamento das roçadas das unidades escolares da rede municipal.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com)

### 1. Configurar o Banco de Dados (Supabase)

1. Crie um novo projeto no [Supabase](https://supabase.com/dashboard)
2. Na seção "SQL Editor", execute os scripts SQL nesta ordem:
   - `01_schema.sql` - Cria as tabelas base
   - `02_rls_policies.sql` - Configura segurança e políticas RLS

3. Configure a Autenticação:
   - Vá para Authentication > Providers
   - Habilite "Email" como método de autenticação

4. Copie as credenciais (URL e chave anon):
   - Project Settings > API
   - Copie `Project URL` e `anon public key`

### 2. Configurar Variáveis de Ambiente

1. Clone este repositório
2. Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Adicione suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   ```

### 3. Instalar Dependências

```bash
npm install
# ou
yarn install
```

### 4. Rodar em Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

A aplicação abrirá em `http://localhost:5173`

### 5. Build para Produção

```bash
npm run build
# ou
yarn build
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   └── Layout/
│       └── MainLayout.tsx
├── contexts/            # Contextos React (Auth, etc)
│   └── AuthContext.tsx
├── hooks/               # Hooks customizados
│   └── useQueries.ts    # Hooks com React Query
├── lib/                 # Utilitários e libs
│   └── supabase.ts      # Cliente Supabase
├── pages/               # Páginas da aplicação
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── styles/              # Arquivos CSS
│   └── globals.css
├── types/               # Tipos TypeScript
│   └── index.ts
├── App.tsx              # Componente raiz
└── main.tsx             # Ponto de entrada
```

## 🔐 Segurança

A aplicação implementa Row Level Security (RLS) no Supabase para garantir que:

- **EMPRESA**: Pode visualizar todas unidades, registrar roçadas, mas não pode editar/deletar
- **SME**: Tem acesso total ao sistema, incluindo validação, edição e configuração

## 📚 Funcionalidades

### Implementadas (Fase 1)

- ✅ Autenticação com Supabase
- ✅ Dashboard com estatísticas
- ✅ Estrutura de banco de dados
- ✅ Segurança com RLS
- ✅ Layout responsivo

### Próximas (Fase 2)

- 🔄 Tela de Unidades (CRUD)
- 🔄 Registro de Roçadas
- 🔄 Validação de Roçadas (SME)
- 🔄 Histórico
- 🔄 Relatórios (Excel/PDF)
- 🔄 Mapa georreferenciado
- 🔄 Upload de fotos
- 🔄 Notificações automáticas

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Estado**: React Query + React Context
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **UI**: Tailwind CSS + Shadcn/UI
- **Ícones**: Lucide Icons
- **Gráficos**: Recharts
- **Validação**: Zod + React Hook Form
- **Hospedagem**: Vercel

## 📝 Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=           # URL do projeto
VITE_SUPABASE_ANON_KEY=      # Chave pública anon

# App
VITE_APP_NAME=Sistema de Roçadas
VITE_APP_VERSION=1.0.0
```

## 🚀 Deploy no Vercel

1. Faça push do código para GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Clique em "New Project" e selecione seu repositório
4. Configure as variáveis de ambiente (mesmos valores do .env.local)
5. Clique em "Deploy"

O site estará disponível em `seu-nome.vercel.app`

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação React](https://react.dev)
- [Documentação Vite](https://vitejs.dev)

## 📄 Licença

Este projeto é propriedade da Secretaria Municipal de Educação.

---

**Desenvolvido com ❤️ para a Educação Municipal**
