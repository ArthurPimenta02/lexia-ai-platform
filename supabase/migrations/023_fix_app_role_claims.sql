-- ============================================================
-- 023_fix_app_role_claims.sql
-- Corrige o claim JWT usado nas políticas RLS.
--
-- PROBLEMA: A função custom_jwt_claims() estava injetando o
-- cargo do usuário no claim `role` do JWT. O Supabase/PostgREST
-- reserva `role` para o papel de banco — injetar um valor de
-- aplicação nele fazia o PostgREST tentar executar
-- SET ROLE 'admin' no Postgres, causando o erro:
--   role "admin" does not exist
--
-- SOLUÇÃO: Usar o claim `app_role` para o cargo do app.
-- `role` fica reservado ao Supabase/PostgREST. `tenant_id`
-- permanece como está e não é afetado.
--
-- A função custom_jwt_claims() já foi corrigida no Dashboard
-- para injetar `app_role` em vez de `role`. Esta migration
-- atualiza todas as políticas RLS que liam `role` para
-- lerem `app_role`, alinhando a base de código ao novo claim.
-- ============================================================

-- ── tenants ────────────────────────────────────────────────────────────────────

drop policy if exists "tenants: admin pode atualizar" on tenants;
create policy "tenants: admin pode atualizar"
  on tenants for update
  using (
    id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') = 'admin'
  );

-- ── users ──────────────────────────────────────────────────────────────────────

drop policy if exists "users: admin ou próprio usuário pode atualizar" on users;
create policy "users: admin ou próprio usuário pode atualizar"
  on users for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (
      id = auth.uid()
      or (auth.jwt() ->> 'app_role') in ('admin', 'manager')
    )
  );

-- ── lawyer_oabs ────────────────────────────────────────────────────────────────

drop policy if exists "lawyer_oabs: advogado/admin gerencia próprias OABs" on lawyer_oabs;
create policy "lawyer_oabs: advogado/admin gerencia próprias OABs"
  on lawyer_oabs for all
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (
      user_id = auth.uid()
      or (auth.jwt() ->> 'app_role') in ('admin', 'manager')
    )
  );

drop policy if exists "lawyer_oabs: admin/manager inserem para outros" on lawyer_oabs;
create policy "lawyer_oabs: admin/manager inserem para outros"
  on lawyer_oabs for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "lawyer_oabs: somente admin apaga" on lawyer_oabs;
create policy "lawyer_oabs: somente admin apaga"
  on lawyer_oabs for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') = 'admin'
  );

-- ── clients ────────────────────────────────────────────────────────────────────

drop policy if exists "clients: membros qualificados inserem" on clients;
create policy "clients: membros qualificados inserem"
  on clients for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

drop policy if exists "clients: membros qualificados atualizam" on clients;
create policy "clients: membros qualificados atualizam"
  on clients for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

drop policy if exists "clients: somente admin/manager apagam" on clients;
create policy "clients: somente admin/manager apagam"
  on clients for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

-- ── lead_stages ────────────────────────────────────────────────────────────────

drop policy if exists "lead_stages: admin/manager gerenciam" on lead_stages;
create policy "lead_stages: admin/manager gerenciam"
  on lead_stages for all
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

-- ── leads ──────────────────────────────────────────────────────────────────────

drop policy if exists "leads: membros qualificados inserem" on leads;
create policy "leads: membros qualificados inserem"
  on leads for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

drop policy if exists "leads: membros qualificados atualizam" on leads;
create policy "leads: membros qualificados atualizam"
  on leads for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

drop policy if exists "leads: admin/manager apagam" on leads;
create policy "leads: admin/manager apagam"
  on leads for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

-- ── lead_messages ──────────────────────────────────────────────────────────────

drop policy if exists "lead_messages: membros qualificados inserem" on lead_messages;
create policy "lead_messages: membros qualificados inserem"
  on lead_messages for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

-- ── casos ──────────────────────────────────────────────────────────────────────

drop policy if exists "casos: membros qualificados inserem" on casos;
create policy "casos: membros qualificados inserem"
  on casos for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "casos: membros qualificados atualizam" on casos;
create policy "casos: membros qualificados atualizam"
  on casos for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── caso_timeline ──────────────────────────────────────────────────────────────

drop policy if exists "caso_timeline: membros qualificados inserem" on caso_timeline;
create policy "caso_timeline: membros qualificados inserem"
  on caso_timeline for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

-- ── processos ──────────────────────────────────────────────────────────────────

drop policy if exists "processos: membros qualificados inserem" on processos;
create policy "processos: membros qualificados inserem"
  on processos for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "processos: membros qualificados atualizam" on processos;
create policy "processos: membros qualificados atualizam"
  on processos for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── case_process_links ────────────────────────────────────────────────────────

drop policy if exists "case_process_links: membros qualificados inserem" on case_process_links;
create policy "case_process_links: membros qualificados inserem"
  on case_process_links for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "case_process_links: membros qualificados atualizam" on case_process_links;
create policy "case_process_links: membros qualificados atualizam"
  on case_process_links for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── process_parties ───────────────────────────────────────────────────────────

drop policy if exists "process_parties: membros qualificados inserem" on process_parties;
create policy "process_parties: membros qualificados inserem"
  on process_parties for insert
  with check (
    (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── process_updates ───────────────────────────────────────────────────────────

drop policy if exists "process_updates: membros qualificados inserem" on process_updates;
create policy "process_updates: membros qualificados inserem"
  on process_updates for insert
  with check (
    (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── radar_items ───────────────────────────────────────────────────────────────

drop policy if exists "radar_items: membros qualificados inserem" on radar_items;
create policy "radar_items: membros qualificados inserem"
  on radar_items for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

drop policy if exists "radar_items: membros qualificados atualizam" on radar_items;
create policy "radar_items: membros qualificados atualizam"
  on radar_items for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── appointments ──────────────────────────────────────────────────────────────

drop policy if exists "appointments: membros qualificados inserem" on appointments;
create policy "appointments: membros qualificados inserem"
  on appointments for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

drop policy if exists "appointments: membros qualificados atualizam" on appointments;
create policy "appointments: membros qualificados atualizam"
  on appointments for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

-- ── integrations ──────────────────────────────────────────────────────────────

drop policy if exists "integrations: admin/manager gerenciam" on integrations;
create policy "integrations: admin/manager gerenciam"
  on integrations for all
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

-- ── agent_logs ────────────────────────────────────────────────────────────────

drop policy if exists "agent_logs: admin/manager lêem" on agent_logs;
create policy "agent_logs: admin/manager lêem"
  on agent_logs for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

-- ── user_invites ──────────────────────────────────────────────────────────────

drop policy if exists "user_invites: admin/manager gerenciam" on user_invites;
create policy "user_invites: admin/manager gerenciam"
  on user_invites for all
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

drop policy if exists "user_invites: admin/manager inserem" on user_invites;
create policy "user_invites: admin/manager inserem"
  on user_invites for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

drop policy if exists "user_invites: admin/manager atualizam" on user_invites;
create policy "user_invites: admin/manager atualizam"
  on user_invites for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );
