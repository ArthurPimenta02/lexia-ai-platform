-- ============================================================
-- 015_radar_items.sql
-- Central de monitoramento: alertas, prazos e movimentações
-- que exigem atenção do advogado.
-- Criados automaticamente por webhooks/n8n ou manualmente.
-- ============================================================

create table radar_items (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,

  -- Vínculo com caso e processo (ambos opcionais, mas ao menos um deve existir)
  caso_id               uuid references casos(id) on delete set null,
  processo_id           uuid references processos(id) on delete set null,
  process_update_id     uuid references process_updates(id) on delete set null,

  -- Classificação
  tipo                  radar_tipo not null,
  urgencia              radar_urgencia not null default 'Baixa',
  status                radar_status not null default 'novo',
  origem                radar_origem not null default 'sistema',

  -- Conteúdo
  titulo                text not null,
  descricao             text,
  exige_acao            boolean not null default false,

  -- Dados de contexto desnormalizados (para exibição sem joins extras)
  caso_titulo           text,          -- desnormalizado
  cliente_nome          text,          -- desnormalizado

  -- Resumo IA
  ai_summary            jsonb,         -- {resumo, explicacao_pratica, proximo_passo, risco_se_nao_agir, impacto_no_caso, gerado_em}

  -- Resolução
  resolvido_em          timestamptz,
  resolvido_por         uuid references users(id) on delete set null,
  resolucao_nota        text,

  -- Referência externa (URL ou ID no Escavador, CNJ)
  referencia_externa    text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger radar_items_updated_at
  before update on radar_items
  for each row execute function set_updated_at();

-- Índices
create index radar_items_tenant_idx on radar_items(tenant_id, created_at desc);
create index radar_items_status_idx on radar_items(tenant_id, status);
create index radar_items_urgencia_idx on radar_items(tenant_id, urgencia) where status != 'resolvido';
create index radar_items_caso_idx on radar_items(caso_id) where caso_id is not null;
create index radar_items_exige_acao_idx on radar_items(tenant_id) where exige_acao = true and status != 'resolvido';

-- RLS
alter table radar_items enable row level security;

create policy "radar_items: membros do tenant lêem"
  on radar_items for select
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy "radar_items: membros ativos inserem"
  on radar_items for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer', 'secretary')
  );

create policy "radar_items: advogado/admin atualizam (ex: resolver)"
  on radar_items for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager', 'lawyer')
  );
-- n8n usa service_role para inserção automática
