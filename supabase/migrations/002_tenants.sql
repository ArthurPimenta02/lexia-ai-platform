-- ============================================================
-- 002_tenants.sql
-- Escritórios que usam a plataforma Lexia.
-- 1 tenant = 1 escritório de advocacia.
-- ============================================================

create table tenants (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,                        -- razão social
  display_name          text not null,                        -- nome exibido na UI
  cnpj                  text,
  email                 text not null,
  phone                 text,
  timezone              text not null default 'America/Sao_Paulo',
  primary_practice_area text,
  logo_url              text,

  -- Endereço
  address               jsonb default '{}'::jsonb,            -- {street, number, complement, city, state, zip}

  -- Configurações do agente de IA (persiste AgentSettings da UI)
  agent_config          jsonb default '{}'::jsonb,

  -- Controle de onboarding
  onboarding_completed  boolean not null default false,

  -- Soft delete
  deleted_at            timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Trigger para manter updated_at sincronizado
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

-- RLS — tenants não tem tenant_id próprio; acesso controlado por user → tenant
alter table tenants enable row level security;

-- Usuários autenticados só veem o próprio tenant
create policy "tenants: usuário lê o próprio tenant"
  on tenants for select
  using (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Apenas admin pode atualizar o tenant
create policy "tenants: admin pode atualizar"
  on tenants for update
  using (id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') = 'admin');

-- Insert permitido somente via service_role (signup flow usa service_role)
create policy "tenants: service_role pode inserir"
  on tenants for insert
  with check (true);  -- restrição real via service_role no backend
