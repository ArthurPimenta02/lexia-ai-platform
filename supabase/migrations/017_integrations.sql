-- ============================================================
-- 017_integrations.sql
-- Configuração de integrações externas por tenant.
-- 1 registro por tipo de integração por tenant.
-- Credenciais nunca em texto puro — referência a Vault/secrets.
-- ============================================================

create table integrations (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  type            integration_type not null,
  status          integration_status not null default 'disconnected',

  -- Configurações não-sensíveis (webhook URLs, IDs de calendário, etc.)
  config          jsonb default '{}'::jsonb,

  -- Referência ao secret no Supabase Vault (nunca a credential em si)
  secret_ref      text,

  -- Controle de sync
  enabled         boolean not null default false,
  last_sync_at    timestamptz,
  last_sync_error text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (tenant_id, type)
);

create trigger integrations_updated_at
  before update on integrations
  for each row execute function set_updated_at();

-- Índices
create index integrations_tenant_idx on integrations(tenant_id);

-- RLS
alter table integrations enable row level security;

create policy "integrations: membros do tenant lêem"
  on integrations for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "integrations: admin gerencia"
  on integrations for all
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );
