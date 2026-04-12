-- ============================================================
-- 024_caso_pendencias.sql
-- Pendências e prazos operacionais de um caso.
-- Fonte de verdade para tarefas ativas — caso_timeline é
-- histórico imutável; caso_pendencias é operacional/mutável.
-- ============================================================

create table caso_pendencias (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  caso_id     uuid not null references casos(id) on delete cascade,

  descricao   text not null,
  prazo       timestamptz,            -- null = sem prazo definido
  responsavel text,                   -- nome denormalizado (exibição)
  urgencia    radar_urgencia not null default 'Baixa',
  resolvida   boolean not null default false,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger caso_pendencias_updated_at
  before update on caso_pendencias
  for each row execute function set_updated_at();

-- Índices
create index caso_pendencias_caso_idx on caso_pendencias(caso_id);
create index caso_pendencias_tenant_idx on caso_pendencias(tenant_id);
create index caso_pendencias_prazo_idx on caso_pendencias(tenant_id, prazo)
  where prazo is not null and resolvida = false;

-- RLS
alter table caso_pendencias enable row level security;

create policy "caso_pendencias: membros do tenant lêem"
  on caso_pendencias for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "caso_pendencias: advogado/admin inserem"
  on caso_pendencias for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "caso_pendencias: advogado/admin atualizam"
  on caso_pendencias for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "caso_pendencias: admin remove"
  on caso_pendencias for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );
