-- ============================================================
-- 003_users.sql
-- Membros de um tenant. Vinculados a auth.users do Supabase.
-- Criados automaticamente via trigger em 021_auth_hooks.sql.
-- ============================================================

create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  name            text not null,
  email           text not null,
  role            user_role not null default 'lawyer',
  status          user_status not null default 'active',
  avatar_url      text,
  last_sign_in_at timestamptz,

  -- Soft delete
  deleted_at      timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();

-- Índices
create index users_tenant_id_idx on users(tenant_id);
create index users_email_idx on users(email);
create index users_status_idx on users(tenant_id, status);

-- RLS
alter table users enable row level security;

-- Leitura: membros do mesmo tenant
create policy "users: membros do tenant podem ler"
  on users for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Update: próprio usuário ou admin
create policy "users: admin ou próprio usuário pode atualizar"
  on users for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (
      id = auth.uid()
      or (auth.jwt() ->> 'role') in ('admin', 'manager')
    )
  );

-- Insert: somente via service_role (trigger de auth)
create policy "users: service_role insere"
  on users for insert
  with check (true);
