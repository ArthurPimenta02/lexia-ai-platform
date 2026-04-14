-- ============================================================
-- 028_google_calendar_phase1.sql
-- Storage privado de tokens OAuth para integrações.
-- A tabela integrations continua pública por tenant para estado/config.
-- Secrets ficam separados e acessados apenas server-side via service_role.
-- ============================================================

create table if not exists integration_secrets (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  integration_type  integration_type not null,
  encrypted_payload text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (tenant_id, integration_type)
);

create trigger integration_secrets_updated_at
  before update on integration_secrets
  for each row execute function set_updated_at();

create index integration_secrets_tenant_idx
  on integration_secrets(tenant_id, integration_type);

alter table integration_secrets enable row level security;
