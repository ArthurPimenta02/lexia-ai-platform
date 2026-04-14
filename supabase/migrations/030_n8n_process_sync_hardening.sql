-- ============================================================
-- 030_n8n_process_sync_hardening.sql
-- Hardening para integracao juridica inbound/outbound via n8n.
--
-- Objetivos:
-- - reforcar deduplicacao de processos por tenant
-- - adicionar tenant_id + dedupe_key em process_updates
-- - adicionar source_update_id em radar_items para evitar duplicacao
-- ============================================================

-- ── processos ────────────────────────────────────────────────────────────────
-- tenant_id ja existe em processos desde a modelagem inicial.
-- Aqui reforcamos a deduplicacao tenant-scoped para external_id.

drop index if exists processos_external_id_idx;

create unique index if not exists processos_tenant_external_uidx
  on processos(tenant_id, external_source, external_id)
  where external_id is not null;

-- O schema original ja garante unicidade por (tenant_id, cnj_number).
-- Mantemos isso como fonte de verdade sem recriar indice redundante.

-- ── process_updates ──────────────────────────────────────────────────────────

alter table process_updates
  add column if not exists tenant_id uuid references tenants(id) on delete cascade;

alter table process_updates
  add column if not exists dedupe_key text;

alter table process_updates
  add column if not exists sync_error text;

update process_updates pu
set tenant_id = p.tenant_id
from processos p
where p.id = pu.processo_id
  and pu.tenant_id is null;

update process_updates pu
set dedupe_key = coalesce(
  nullif(trim(pu.external_id), ''),
  md5(
    concat_ws(
      '|',
      pu.processo_id::text,
      pu.tipo,
      pu.titulo,
      coalesce(pu.descricao, ''),
      pu.data_movimentacao::text,
      pu.external_source::text
    )
  )
)
where pu.dedupe_key is null;

alter table process_updates
  alter column tenant_id set not null;

alter table process_updates
  alter column dedupe_key set not null;

create index if not exists process_updates_tenant_idx
  on process_updates(tenant_id, data_movimentacao desc);

create unique index if not exists process_updates_tenant_external_uidx
  on process_updates(tenant_id, external_source, external_id)
  where external_id is not null;

create unique index if not exists process_updates_tenant_dedupe_key_uidx
  on process_updates(tenant_id, dedupe_key);

drop index if exists process_updates_external_idx;

-- ── radar_items ──────────────────────────────────────────────────────────────

alter table radar_items
  add column if not exists source_update_id uuid references process_updates(id) on delete set null;

update radar_items
set source_update_id = process_update_id
where source_update_id is null
  and process_update_id is not null;

create unique index if not exists radar_items_source_update_uidx
  on radar_items(source_update_id)
  where source_update_id is not null;
