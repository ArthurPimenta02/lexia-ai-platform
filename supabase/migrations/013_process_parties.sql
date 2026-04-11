-- ============================================================
-- 013_process_parties.sql
-- Partes de um processo: autores, réus, advogados, juízes.
-- Importadas do Escavador/CNJ junto com o processo.
-- ============================================================

create table process_parties (
  id            uuid primary key default gen_random_uuid(),
  processo_id   uuid not null references processos(id) on delete cascade,

  -- Tipo de participação
  party_type    party_type not null,
  nome          text not null,

  -- Documentos (preenchidos quando disponíveis na API)
  cpf           text,
  cnpj          text,
  oab           text,           -- ex: "123456/SP" — se for advogado

  -- Referência externa
  external_id   text,

  created_at    timestamptz not null default now()
);

-- Índices
create index process_parties_processo_idx on process_parties(processo_id);
create index process_parties_oab_idx on process_parties(oab) where oab is not null;
create index process_parties_cpf_idx on process_parties(cpf) where cpf is not null;

-- RLS: acesso via processo, que já tem tenant_id
-- Usamos uma policy baseada em join
alter table process_parties enable row level security;

create policy "process_parties: membros do tenant lêem via processo"
  on process_parties for select
  using (
    exists (
      select 1 from processos p
      where p.id = process_parties.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

create policy "process_parties: advogado/admin inserem"
  on process_parties for insert
  with check (
    exists (
      select 1 from processos p
      where p.id = process_parties.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer')
  );
-- Nota: sync via n8n/service_role não tem restrição de role
