-- ============================================================
-- 019_agent_logs.sql
-- Registro de ações do agente de IA (n8n + Claude).
-- Auditoria de tudo que o agente fez: triagem, qualificação,
-- consultas externas, handoffs, respostas geradas.
-- ============================================================

create table agent_logs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  -- Entidades envolvidas
  lead_id         uuid references leads(id) on delete set null,
  caso_id         uuid references casos(id) on delete set null,

  -- Ação realizada
  action_type     text not null check (action_type in (
    'triage', 'qualification', 'response', 'handoff',
    'escavador_query', 'cnj_query', 'dossie_generation',
    'radar_summary', 'notification_sent', 'stage_move', 'outros'
  )),

  -- Canal de origem da interação
  channel         text check (channel in ('whatsapp', 'web', 'platform', 'system')),

  -- I/O da ação
  input           jsonb,          -- contexto enviado ao modelo
  output          jsonb,          -- resposta do modelo

  -- Modelo e custo
  model           text,           -- e.g. "claude-sonnet-4-6"
  tokens_input    integer,
  tokens_output   integer,

  -- Resultado
  success         boolean not null default true,
  error           text,

  -- Duração em ms
  duration_ms     integer,

  created_at      timestamptz not null default now()
);

-- Índices
create index agent_logs_tenant_idx on agent_logs(tenant_id, created_at desc);
create index agent_logs_lead_idx on agent_logs(lead_id) where lead_id is not null;
create index agent_logs_caso_idx on agent_logs(caso_id) where caso_id is not null;
create index agent_logs_action_idx on agent_logs(tenant_id, action_type);

-- RLS — somente leitura para o tenant; insert via service_role (n8n)
alter table agent_logs enable row level security;

create policy "agent_logs: admin/manager lêem"
  on agent_logs for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );
-- Insert exclusivamente via service_role (n8n/webhooks)
