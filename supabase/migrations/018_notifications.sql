-- ============================================================
-- 018_notifications.sql
-- Alertas in-app por usuário. Lidas via Supabase Realtime.
-- Criadas por: n8n (webhooks), Server Actions, triggers.
-- ============================================================

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,

  tipo          notification_type not null,
  titulo        text not null,
  body          text,

  -- Navegação: ao clicar, redireciona para a entidade relacionada
  entity_type   text,    -- 'caso', 'lead', 'radar_item', 'appointment'
  entity_id     uuid,

  -- Estado
  read          boolean not null default false,
  read_at       timestamptz,

  created_at    timestamptz not null default now()
);

-- Índices
create index notifications_user_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id) where read = false;
create index notifications_tenant_idx on notifications(tenant_id);

-- RLS — cada usuário só vê as próprias notificações
alter table notifications enable row level security;

create policy "notifications: usuário lê as próprias"
  on notifications for select
  using (user_id = auth.uid());

create policy "notifications: usuário marca como lida"
  on notifications for update
  using (user_id = auth.uid());

-- Insert: sistema/n8n via service_role — sem policy de insert para authenticated
-- (n8n e Server Actions usam service_role)
