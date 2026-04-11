-- ============================================================
-- 001_enums.sql
-- Todos os enums do sistema em um arquivo central.
-- Criar enums antes das tabelas que os referenciam.
-- ============================================================

-- Usuários
create type user_role as enum ('admin', 'manager', 'lawyer', 'secretary', 'viewer');
create type user_status as enum ('active', 'inactive', 'pending');

-- Leads
create type lead_origin as enum ('whatsapp', 'web', 'manual', 'referral', 'advbox');
create type lead_urgency as enum ('Alta', 'Media', 'Baixa');

-- Convites
create type invite_status as enum ('pending', 'accepted', 'expired');

-- Casos
create type caso_status as enum ('Ativo', 'Suspenso', 'Encerrado', 'Arquivado');
create type caso_area as enum (
  'Trabalhista', 'Cível', 'Família', 'Criminal', 'Empresarial',
  'Tributário', 'Previdenciário', 'Consumidor', 'Imobiliário', 'Ambiental'
);

-- Linha do tempo do caso
create type timeline_event_type as enum (
  'criacao', 'nota_interna', 'documento_anexado', 'prazo_criado',
  'movimentacao_processual', 'atualizacao_status', 'audiencia', 'peticao'
);

-- Processos (fonte externa)
create type processo_status as enum ('Em andamento', 'Suspenso', 'Encerrado', 'Arquivado');
create type sync_source as enum ('escavador', 'cnj', 'manual');
create type sync_status as enum ('pending', 'synced', 'error', 'stale');

-- Partes do processo
create type party_type as enum ('autor', 'reu', 'advogado_autor', 'advogado_reu', 'terceiro', 'juiz');

-- Radar
create type radar_tipo as enum ('publicacao', 'movimentacao', 'alerta_prazo', 'acao_requerida');
create type radar_urgencia as enum ('Alta', 'Media', 'Baixa');
create type radar_status as enum ('novo', 'em_analise', 'resolvido');
create type radar_origem as enum ('escavador', 'cnj', 'interno', 'manual', 'sistema');

-- Compromissos
create type appointment_status as enum ('agendado', 'confirmado', 'realizado', 'cancelado', 'reagendado');
create type appointment_type as enum ('audiencia', 'reuniao', 'consulta', 'prazo', 'outros');

-- Notificações
create type notification_type as enum (
  'radar_novo_item', 'caso_atualizacao', 'lead_novo', 'lead_handoff',
  'prazo_proximo', 'prazo_vencido', 'sistema', 'convite'
);

-- Integrações
create type integration_type as enum ('whatsapp', 'google_calendar', 'escavador', 'advbox');
create type integration_status as enum ('connected', 'disconnected', 'coming_soon', 'error');
