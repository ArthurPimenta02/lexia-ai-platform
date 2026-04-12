-- ============================================================
-- 014_process_updates.sql
-- Movimentações e publicações de um processo.
-- Alimentadas pelo n8n via CNJ/Datajud (sync incremental)
-- ou Escavador (discovery inicial).
-- Cada nova entrada pode gerar um radar_item (015).
-- ============================================================

create table process_updates (
  id                  uuid primary key default gen_random_uuid(),
  processo_id         uuid not null references processos(id) on delete cascade,

  -- Tipo de atualização
  tipo                text not null check (tipo in (
    'movimentacao', 'publicacao', 'despacho', 'decisao',
    'sentenca', 'acordao', 'intimacao', 'outros'
  )),

  titulo              text not null,
  descricao           text,            -- texto completo da movimentação/publicação
  data_movimentacao   date not null,

  -- Fonte externa
  external_id         text,            -- ID único na fonte (CNJ, Escavador)
  external_source     sync_source not null,
  payload_raw         jsonb,           -- resposta bruta da API

  -- Resumo gerado por IA
  ai_summary          jsonb,           -- {resumo, urgencia_classificada, exige_acao, proximo_passo, gerado_em}

  -- Controle de processamento
  processed           boolean not null default false,  -- já gerou radar_item?
  processed_at        timestamptz,

  created_at          timestamptz not null default now(),

  unique (processo_id, external_id, external_source)
);

-- Índices
create index process_updates_processo_idx on process_updates(processo_id, data_movimentacao desc);
create index process_updates_unprocessed_idx on process_updates(processo_id)
  where processed = false;
create index process_updates_external_idx on process_updates(external_source, external_id)
  where external_id is not null;

-- RLS: acesso via processo → tenant
alter table process_updates enable row level security;

create policy "process_updates: membros do tenant lêem via processo"
  on process_updates for select
  using (
    exists (
      select 1 from processos p
      where p.id = process_updates.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

create policy "process_updates: advogado/admin inserem"
  on process_updates for insert
  with check (
    exists (
      select 1 from processos p
      where p.id = process_updates.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );
-- Nota: n8n usa service_role para inserção de movimentações automáticas
