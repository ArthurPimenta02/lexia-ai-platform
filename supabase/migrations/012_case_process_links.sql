-- ============================================================
-- 012_case_process_links.sql
-- Join table N:N entre casos (internos) e processos (externos).
-- Um caso pode ter múltiplos processos vinculados.
-- Um processo pode existir sem caso (descoberto mas não operacionalizado).
-- A vinculação é sempre uma decisão humana — nunca automática.
-- ============================================================

create table case_process_links (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  caso_id         uuid not null references casos(id) on delete cascade,
  processo_id     uuid not null references processos(id) on delete cascade,

  -- Quem vinculou e quando
  linked_by       uuid references users(id) on delete set null,
  linked_at       timestamptz not null default now(),

  -- Papel do processo neste caso (descritivo, livre)
  role_note       text,       -- e.g. "Processo principal", "Incidente de desconsideração"

  -- O processo é o principal do caso?
  is_primary      boolean not null default false,

  unique (caso_id, processo_id)
);

-- Índices
create index case_process_links_caso_idx on case_process_links(caso_id);
create index case_process_links_processo_idx on case_process_links(processo_id);
create index case_process_links_tenant_idx on case_process_links(tenant_id);

-- RLS
alter table case_process_links enable row level security;

create policy "case_process_links: membros do tenant lêem"
  on case_process_links for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "case_process_links: advogado/admin vinculam"
  on case_process_links for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

create policy "case_process_links: advogado/admin desvinculam"
  on case_process_links for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );
