-- =============================================================================
-- CORREÇÃO: loop de "primeiro acesso" / troca de senha
-- =============================================================================
--
-- Sintoma: ao acessar, o usuário é obrigado a trocar a senha; após trocar e
-- logar novamente, o sistema pede a troca de novo, indefinidamente.
--
-- Causa provável (lado do banco): a coluna `rocadas.perfis.primeiro_acesso`
-- nunca é gravada como `false`. Com RLS habilitado na tabela `perfis` e SEM uma
-- policy de UPDATE para o próprio usuário, o PostgREST/Supabase devolve
-- "sucesso" com 0 linhas afetadas (sem erro), então o valor continua `true` no
-- banco e a troca de senha é exigida a cada login.
--
-- Este script:
--   1) Garante a existência da coluna `primeiro_acesso`.
--   2) Cria a policy de UPDATE que permite o usuário atualizar o PRÓPRIO perfil.
--   3) (Opcional) Normaliza usuários que já trocaram a senha mas ficaram presos.
--
-- Execute no SQL Editor do Supabase. Ajuste o nome do schema/tabela se necessário.
-- =============================================================================

-- 1) Coluna (idempotente)
alter table rocadas.perfis
  add column if not exists primeiro_acesso boolean not null default true;

-- 2) Garante RLS habilitado
alter table rocadas.perfis enable row level security;

-- 3) Policy de UPDATE do próprio perfil.
--    Necessária para que `UPDATE perfis SET primeiro_acesso = false
--    WHERE user_id = auth.uid()` seja de fato aplicado.
drop policy if exists "usuario_atualiza_proprio_perfil" on rocadas.perfis;
create policy "usuario_atualiza_proprio_perfil"
  on rocadas.perfis
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3b) Garantia de leitura do próprio perfil (o login já depende disto;
--     incluído por completude — remova se já existir uma policy de SELECT).
drop policy if exists "usuario_le_proprio_perfil" on rocadas.perfis;
create policy "usuario_le_proprio_perfil"
  on rocadas.perfis
  for select
  to authenticated
  using (user_id = auth.uid());

-- 4) (OPCIONAL) Desbloqueia quem já trocou a senha mas ficou preso no loop.
--    Descomente e ajuste o filtro conforme necessário.
-- update rocadas.perfis set primeiro_acesso = false
--   where email in ('empresa@exemplo.com');
