-- ============================================================
-- 008_lead_messages.sql
-- Histórico de mensagens de cada lead.
-- Escritas pelo agente n8n ou pelo advogado via plataforma.
-- ============================================================

create table lead_messages (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  lead_id       uuid not null references leads(id) on delete cascade,

  content       text not null,
  sender_type   text not null check (sender_type in ('client', 'agent', 'lawyer', 'system')),
  sender_id     uuid references users(id) on delete set null,  -- null se agente ou cliente

  -- Canal de origem
  channel       text not null default 'whatsapp' check (channel in ('whatsapp', 'web', 'manual')),

  -- Handoff
  is_handoff    boolean not null default false,    -- esta mensagem marcou transbordo para humano

  -- Metadados do canal (ex: ID da mensagem no WhatsApp)
  metadata      jsonb default '{}'::jsonb,

  created_at    timestamptz not null default now()
  -- Sem updated_at: mensagens são imutáveis
);

-- Índices
create index lead_messages_lead_idx on lead_messages(lead_id, created_at desc);
create index lead_messages_tenant_idx on lead_messages(tenant_id);
create index lead_messages_handoff_idx on lead_messages(lead_id) where is_handoff = true;

-- RLS
alter table lead_messages enable row level security;

create policy "lead_messages: membros do tenant lêem"
  on lead_messages for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "lead_messages: membros ativos inserem"
  on lead_messages for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );
-- Nota: n8n insere via service_role (sem restrição de role)
