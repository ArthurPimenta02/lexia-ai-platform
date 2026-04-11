-- ============================================================
-- 006_lead_stages.sql
-- Etapas do funil de leads, configuráveis por tenant.
-- Seed com 6 estágios padrão feito em seed.sql.
-- ============================================================

create table lead_stages (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  name        text not null,
  color       text not null default '#6B7280',  -- hex color
  position    integer not null default 0,        -- ordem no kanban
  is_default  boolean not null default false,    -- estágio criado automaticamente no onboarding
  is_terminal boolean not null default false,    -- estágio final (Cliente, Perdido)

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (tenant_id, name)
);

create trigger lead_stages_updated_at
  before update on lead_stages
  for each row execute function set_updated_at();

-- Índices
create index lead_stages_tenant_idx on lead_stages(tenant_id, position);

-- RLS
alter table lead_stages enable row level security;

create policy "lead_stages: membros do tenant lêem"
  on lead_stages for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "lead_stages: admin/manager gerenciam"
  on lead_stages for all
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );
