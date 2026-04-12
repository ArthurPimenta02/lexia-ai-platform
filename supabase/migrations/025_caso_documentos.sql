-- ============================================================
-- 025_caso_documentos.sql
-- Documentos vinculados a um caso.
-- storage_path aponta para Supabase Storage (fase futura).
-- No MVP: metadados apenas, sem upload real.
-- ============================================================

create table caso_documentos (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  caso_id      uuid not null references casos(id) on delete cascade,

  nome         text not null,
  tipo         text not null default 'outro',  -- petição | contrato | procuração | laudo | decisão | outro
  tamanho      text,                           -- e.g. "1.2 MB" (string, para exibição)
  storage_path text,                           -- path no Supabase Storage (fase futura)
  criado_por   text not null,                  -- nome do usuário (denormalizado)

  created_at   timestamptz not null default now()
  -- Imutável: sem updated_at (documento não é editado, apenas removido)
);

-- Índices
create index caso_documentos_caso_idx on caso_documentos(caso_id);
create index caso_documentos_tenant_idx on caso_documentos(tenant_id);

-- RLS
alter table caso_documentos enable row level security;

create policy "caso_documentos: membros do tenant lêem"
  on caso_documentos for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "caso_documentos: advogado/admin inserem"
  on caso_documentos for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "caso_documentos: admin remove"
  on caso_documentos for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager')
  );
