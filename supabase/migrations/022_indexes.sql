-- ============================================================
-- 022_indexes.sql
-- Índices adicionais para queries de alto volume e buscas
-- textuais. Os índices básicos de FK já foram criados nas
-- migrations individuais de cada tabela.
-- ============================================================

-- ── Full-text search ──────────────────────────────────────────────────────────

-- Busca de clientes por nome (já criado em 005, mas garantindo)
create index if not exists clients_name_fts_idx
  on clients using gin(to_tsvector('portuguese', name));

-- Busca de leads por nome
create index if not exists leads_name_fts_idx
  on leads using gin(to_tsvector('portuguese', name));

-- Busca de casos por título
create index if not exists casos_titulo_fts_idx
  on casos using gin(to_tsvector('portuguese', titulo));

-- Busca de processos por número CNJ
create index if not exists processos_cnj_text_idx
  on processos(cnj_number text_pattern_ops);


-- ── Queries do Dashboard ──────────────────────────────────────────────────────

-- Leads criados nas últimas 24h por tenant
create index if not exists leads_recent_idx
  on leads(tenant_id, created_at desc)
  where deleted_at is null;

-- Casos ativos por tenant
create index if not exists casos_active_idx
  on casos(tenant_id, status)
  where status = 'Ativo' and deleted_at is null;

-- Radar items não resolvidos com urgência alta
create index if not exists radar_urgent_idx
  on radar_items(tenant_id, urgencia, created_at desc)
  where status != 'resolvido' and urgencia = 'Alta';


-- ── Realtime / Notificações ───────────────────────────────────────────────────

-- Notificações não lidas (Realtime subscribe)
create index if not exists notifications_realtime_idx
  on notifications(user_id, created_at desc)
  where read = false;


-- ── Sync / Escavador / CNJ ────────────────────────────────────────────────────

-- Processos que precisam de sync (stale ou pending)
create index if not exists processos_needs_sync_idx
  on processos(tenant_id, last_synced_at nulls first)
  where sync_status in ('pending', 'stale', 'error');

-- process_updates não processadas (que ainda não geraram radar_item)
create index if not exists process_updates_pending_idx
  on process_updates(processo_id, created_at)
  where processed = false;


-- ── Appointments / Agenda ─────────────────────────────────────────────────────

-- Próximos compromissos por tenant e responsável
create index if not exists appointments_upcoming_idx
  on appointments(tenant_id, responsible_id, starts_at)
  where status in ('agendado', 'confirmado') and deleted_at is null;


-- ── agent_logs ────────────────────────────────────────────────────────────────

-- Últimas ações do agente por tenant (Dashboard de atividade)
create index if not exists agent_logs_recent_idx
  on agent_logs(tenant_id, created_at desc);
