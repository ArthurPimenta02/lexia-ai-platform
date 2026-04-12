-- ============================================================
-- 009_casos.sql
-- Entidade operacional interna do escritório.
-- Representa o trabalho jurídico em andamento para um cliente.
-- Caso ≠ Processo: caso é interno, processo é externo (Escavador/CNJ).
-- ============================================================

create table casos (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,

  -- Vínculo com client (obrigatório — caso sempre tem cliente)
  client_id           uuid not null references clients(id) on delete restrict,

  -- Responsável principal
  responsible_id      uuid references users(id) on delete set null,

  -- Identificação interna
  numero_interno      text,               -- e.g. "2024-TRB-001" (gerado pelo escritório)
  titulo              text not null,

  -- Classificação
  area                caso_area not null,
  status              caso_status not null default 'Ativo',

  -- Contexto
  descricao           text,
  observacoes         text,

  -- Advogados adicionais (além do responsible)
  advogados_ids       uuid[] default '{}',

  -- Origem
  lead_id             uuid references leads(id) on delete set null,  -- se convertido de lead

  -- Próxima ação
  proxima_acao        text,
  proxima_acao_data   timestamptz,

  -- Dossiê Inteligente gerado por IA
  dossie_ia           jsonb,              -- {resumo, pontosCriticos, pendencias, proximos_marcos, gerado_em}
  dossie_gerado_em    timestamptz,

  -- Datas
  data_abertura       timestamptz not null default now(),
  data_encerramento   timestamptz,

  -- Soft delete
  deleted_at          timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger casos_updated_at
  before update on casos
  for each row execute function set_updated_at();

-- Índices
create index casos_tenant_idx on casos(tenant_id);
create index casos_client_idx on casos(tenant_id, client_id);
create index casos_responsible_idx on casos(tenant_id, responsible_id);
create index casos_status_idx on casos(tenant_id, status);
create index casos_area_idx on casos(tenant_id, area);
create index casos_titulo_search_idx on casos using gin(to_tsvector('portuguese', titulo));

-- RLS
alter table casos enable row level security;

create policy "casos: membros do tenant lêem"
  on casos for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and deleted_at is null);

create policy "casos: advogado/admin inserem"
  on casos for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

create policy "casos: advogado/admin atualizam"
  on casos for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );
