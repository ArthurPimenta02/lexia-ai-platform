-- ============================================================
-- 007_leads.sql
-- Prospects no pipeline comercial do escritório.
-- Um lead pode ser convertido em client + caso.
-- client_id é nullable — lead pode existir antes de virar client.
-- ============================================================

create table leads (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  -- Dados do prospect
  name            text not null,
  email           text,
  phone           text,
  cpf             text,

  -- Vínculo com client (preenchido na conversão)
  client_id       uuid references clients(id) on delete set null,

  -- Pipeline
  stage_id        uuid not null references lead_stages(id) on delete restrict,
  responsible_id  uuid references users(id) on delete set null,

  -- Contexto da demanda
  subject         text,               -- resumo da demanda
  area            caso_area,          -- área jurídica identificada
  origin          lead_origin not null default 'manual',
  urgency         lead_urgency not null default 'Baixa',

  -- IA
  ai_triage       jsonb,              -- resultado da triagem: {area, summary, urgency, recommendation}

  -- Controle
  converted_at    timestamptz,        -- quando foi marcado como Cliente
  converted_to_caso_id uuid,          -- caso criado a partir deste lead

  -- Soft delete
  deleted_at      timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- Índices
create index leads_tenant_idx on leads(tenant_id);
create index leads_stage_idx on leads(tenant_id, stage_id);
create index leads_responsible_idx on leads(tenant_id, responsible_id);
create index leads_created_at_idx on leads(tenant_id, created_at desc);
create index leads_name_search_idx on leads using gin(to_tsvector('portuguese', name));

-- RLS
alter table leads enable row level security;

create policy "leads: membros do tenant lêem"
  on leads for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and deleted_at is null);

create policy "leads: advogado/secretária/admin inserem"
  on leads for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "leads: advogado/secretária/admin atualizam"
  on leads for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "leads: admin/manager deletam (soft)"
  on leads for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );
