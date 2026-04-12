-- ============================================================
-- 010_caso_timeline.sql
-- Linha do tempo de eventos de um caso.
-- Registra tudo: notas, documentos, prazos, movimentações,
-- audiências, petições e mudanças de status.
-- ============================================================

create table caso_timeline (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  caso_id       uuid not null references casos(id) on delete cascade,

  tipo          timeline_event_type not null,
  titulo        text not null,
  descricao     text,

  -- Autor do evento
  autor_id      uuid references users(id) on delete set null,
  autor_nome    text,                   -- desnormalizado para exibição histórica

  -- Vínculo com processo externo (se movimentação processual)
  processo_id   uuid,                   -- FK adicionada após 011_processos.sql via ALTER
  cnj_number    text,                   -- número CNJ da movimentação, se aplicável

  -- Urgência e prazo associado
  urgencia      radar_urgencia,
  prazo_data    timestamptz,
  prazo_cumprido boolean,

  -- Metadados extras (tipo de documento, link, etc.)
  metadata      jsonb default '{}'::jsonb,

  -- Evento gerado por sistema/agente?
  is_automated  boolean not null default false,

  created_at    timestamptz not null default now()
  -- Imutável: sem updated_at
);

-- Índices
create index caso_timeline_caso_idx on caso_timeline(caso_id, created_at desc);
create index caso_timeline_tenant_idx on caso_timeline(tenant_id);
create index caso_timeline_tipo_idx on caso_timeline(caso_id, tipo);
create index caso_timeline_prazo_idx on caso_timeline(tenant_id, prazo_data)
  where prazo_data is not null and prazo_cumprido = false;

-- RLS
alter table caso_timeline enable row level security;

create policy "caso_timeline: membros do tenant lêem"
  on caso_timeline for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "caso_timeline: advogado/admin inserem"
  on caso_timeline for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );
-- Nota: eventos automáticos (n8n, webhooks) inserem via service_role
