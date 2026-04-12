-- ============================================================
-- 004_lawyer_oabs.sql
-- Números de OAB dos advogados do escritório.
-- Base para descoberta de processos via Escavador no onboarding
-- e sob demanda. Cada advogado pode ter múltiplas OABs.
-- ============================================================

create table lawyer_oabs (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,
  oab_number       text not null,                -- e.g. "123456"
  oab_state        char(2) not null,             -- e.g. "SP", "RJ"
  is_primary       boolean not null default false,

  -- Controle de descoberta
  discovery_done   boolean not null default false,   -- OAB já foi consultada no Escavador?
  discovery_at     timestamptz,                       -- quando foi feita a consulta
  discovery_count  integer default 0,                -- quantos processos foram encontrados

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (tenant_id, oab_number, oab_state)
);

create trigger lawyer_oabs_updated_at
  before update on lawyer_oabs
  for each row execute function set_updated_at();

-- Índices
create index lawyer_oabs_tenant_idx on lawyer_oabs(tenant_id);
create index lawyer_oabs_user_idx on lawyer_oabs(user_id);

-- RLS
alter table lawyer_oabs enable row level security;

create policy "lawyer_oabs: membros do tenant lêem"
  on lawyer_oabs for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "lawyer_oabs: admin/manager inserem"
  on lawyer_oabs for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

create policy "lawyer_oabs: admin/manager atualizam"
  on lawyer_oabs for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );

create policy "lawyer_oabs: admin deleta"
  on lawyer_oabs for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') = 'admin'
  );
