-- ============================================================
-- 016_appointments.sql
-- Compromissos, audiências e reuniões do escritório.
-- Vinculáveis a casos e/ou leads. Estrutura pronta para
-- integração com Google Calendar (external_id, gcal_id).
-- ============================================================

create table appointments (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,

  -- Vínculo opcional com entidades do domínio
  caso_id         uuid references casos(id) on delete set null,
  lead_id         uuid references leads(id) on delete set null,
  responsible_id  uuid references users(id) on delete set null,

  -- Dados do compromisso
  titulo          text not null,
  descricao       text,
  local           text,
  tipo            appointment_type not null default 'outros',
  status          appointment_status not null default 'agendado',

  -- Datas
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  all_day         boolean not null default false,

  -- Participantes (IDs de users do mesmo tenant)
  attendee_ids    uuid[] default '{}',

  -- Google Calendar sync (Fase 4)
  gcal_id         text,                -- ID do evento no Google Calendar
  gcal_synced_at  timestamptz,

  -- Soft delete
  deleted_at      timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  check (ends_at > starts_at)
);

create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- Índices
create index appointments_tenant_idx on appointments(tenant_id, starts_at);
create index appointments_responsible_idx on appointments(tenant_id, responsible_id, starts_at);
create index appointments_caso_idx on appointments(caso_id) where caso_id is not null;
create index appointments_status_idx on appointments(tenant_id, status) where deleted_at is null;

-- RLS
alter table appointments enable row level security;

create policy "appointments: membros do tenant lêem"
  on appointments for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid and deleted_at is null);

create policy "appointments: membros ativos inserem"
  on appointments for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "appointments: membros ativos atualizam"
  on appointments for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );
