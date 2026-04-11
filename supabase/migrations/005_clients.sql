-- ============================================================
-- 005_clients.sql
-- Pessoas físicas ou jurídicas atendidas pelo escritório.
-- Entidade permanente — existe antes e depois do lead.
-- Um client pode ter múltiplos leads e casos ao longo do tempo.
-- ============================================================

create table clients (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,

  -- Identificação
  name          text not null,
  cpf           text,                 -- pessoa física
  cnpj          text,                 -- pessoa jurídica
  email         text,
  phone         text,
  phone_alt     text,

  -- Endereço (opcional)
  address       jsonb default '{}'::jsonb,

  -- Referência externa (ex: importado do ADVBOX)
  external_id   text,
  external_source text,               -- 'advbox', 'manual'

  -- Notas
  notes         text,

  -- Soft delete
  deleted_at    timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- Índices
create index clients_tenant_idx on clients(tenant_id);
create index clients_cpf_idx on clients(tenant_id, cpf) where cpf is not null;
create index clients_cnpj_idx on clients(tenant_id, cnpj) where cnpj is not null;
create index clients_name_idx on clients using gin(to_tsvector('portuguese', name));

-- RLS
alter table clients enable row level security;

create policy "clients: membros do tenant lêem"
  on clients for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and deleted_at is null);

create policy "clients: advogado/secretária/admin inserem"
  on clients for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "clients: advogado/secretária/admin atualizam"
  on clients for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "clients: admin faz soft delete"
  on clients for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );
