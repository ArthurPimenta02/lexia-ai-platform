-- ============================================================
-- 011_processos.sql
-- Espelhos de processos judiciais externos.
-- Origem: Escavador (discovery via OAB) ou CNJ/Datajud (sync).
-- Um processo pode existir sem caso vinculado.
-- A vinculação a casos é feita via case_process_links (012).
-- ============================================================

create table processos (
  id                  uuid primary key default gen_random_uuid(),

  -- tenant_id aqui porque processos descobertos por OAB pertencem ao tenant
  -- mesmo antes de serem vinculados a um caso
  tenant_id           uuid not null references tenants(id) on delete cascade,

  -- Identificação CNJ (formato: 0000000-00.0000.0.00.0000)
  cnj_number          text not null,
  tribunal            text not null,      -- e.g. "TRT 2ª Região", "TJSP"
  vara                text,               -- e.g. "4ª Vara do Trabalho de São Paulo"
  comarca             text,
  uf                  char(2),

  -- Informações do processo
  classe              text,               -- e.g. "Reclamação Trabalhista"
  assunto             text,
  status              processo_status not null default 'Em andamento',
  valor_causa         numeric(15,2),      -- valor da causa em reais

  -- Datas
  data_distribuicao   date,
  data_ultima_mov     date,

  -- Sincronização com fonte externa
  external_id         text,               -- ID único no Escavador ou CNJ
  external_source     sync_source not null default 'escavador',
  sync_status         sync_status not null default 'pending',
  last_synced_at      timestamptz,
  sync_error          text,               -- mensagem de erro do último sync, se houver

  -- Payload bruto da última resposta da API externa (para reprocessamento)
  payload_raw         jsonb,

  -- Descoberta
  discovered_via_oab_id uuid references lawyer_oabs(id) on delete set null,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- CNJ number deve ser único por tenant
  unique (tenant_id, cnj_number)
);

create trigger processos_updated_at
  before update on processos
  for each row execute function set_updated_at();

-- FK retroativa de caso_timeline.processo_id
alter table caso_timeline
  add constraint caso_timeline_processo_fk
  foreign key (processo_id) references processos(id) on delete set null;

-- Índices
create index processos_tenant_idx on processos(tenant_id);
create index processos_cnj_idx on processos(tenant_id, cnj_number);
create index processos_sync_idx on processos(tenant_id, sync_status, last_synced_at);
create index processos_external_id_idx on processos(external_source, external_id) where external_id is not null;
create index processos_tribunal_idx on processos(tenant_id, tribunal);

-- RLS
alter table processos enable row level security;

create policy "processos: membros do tenant lêem"
  on processos for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "processos: advogado/admin inserem"
  on processos for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

create policy "processos: advogado/admin atualizam"
  on processos for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );
-- Nota: sync via n8n usa service_role
