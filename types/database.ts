// ============================================================
// types/database.ts
// Tipos TypeScript que refletem o schema do banco Supabase.
// Em produção, gerar via: npx supabase gen types typescript
// Por ora, definição manual alinhada com as migrations.
// ============================================================

// ── Enums ──────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'lawyer' | 'secretary' | 'viewer'
export type UserStatus = 'active' | 'inactive' | 'pending'
export type InviteStatus = 'pending' | 'accepted' | 'expired'

export type LeadOrigin = 'whatsapp' | 'web' | 'manual' | 'referral' | 'advbox'
export type LeadUrgency = 'Alta' | 'Media' | 'Baixa'

export type CasoStatus = 'Ativo' | 'Suspenso' | 'Encerrado' | 'Arquivado'
export type CasoArea =
  | 'Trabalhista' | 'Cível' | 'Família' | 'Criminal' | 'Empresarial'
  | 'Tributário' | 'Previdenciário' | 'Consumidor' | 'Imobiliário' | 'Ambiental'

export type TimelineEventType =
  | 'criacao' | 'nota_interna' | 'documento_anexado' | 'prazo_criado'
  | 'movimentacao_processual' | 'atualizacao_status' | 'audiencia' | 'peticao'

export type ProcessoStatus = 'Em andamento' | 'Suspenso' | 'Encerrado' | 'Arquivado'
export type SyncSource = 'escavador' | 'cnj' | 'manual'
export type SyncStatus = 'pending' | 'synced' | 'error' | 'stale'
export type PartyType = 'autor' | 'reu' | 'advogado_autor' | 'advogado_reu' | 'terceiro' | 'juiz'

export type RadarTipo = 'publicacao' | 'movimentacao' | 'alerta_prazo' | 'acao_requerida'
export type RadarUrgencia = 'Alta' | 'Media' | 'Baixa'
export type RadarStatus = 'novo' | 'em_analise' | 'resolvido'
export type RadarOrigem = 'escavador' | 'cnj' | 'interno' | 'manual' | 'sistema'

export type AppointmentStatus = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'reagendado'
export type AppointmentType = 'audiencia' | 'reuniao' | 'consulta' | 'prazo' | 'outros'

export type NotificationType =
  | 'radar_novo_item' | 'caso_atualizacao' | 'lead_novo' | 'lead_handoff'
  | 'prazo_proximo' | 'prazo_vencido' | 'sistema' | 'convite'

export type IntegrationType = 'whatsapp' | 'google_calendar' | 'escavador' | 'advbox'
export type IntegrationStatus = 'connected' | 'disconnected' | 'coming_soon' | 'error'

// ── Row types (leitura do banco) ───────────────────────────────────────────────

export interface TenantRow {
  id: string
  name: string
  display_name: string
  cnpj: string | null
  email: string
  phone: string | null
  timezone: string
  primary_practice_area: string | null
  logo_url: string | null
  address: Record<string, string>
  agent_config: Record<string, unknown>
  onboarding_completed: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface UserRow {
  id: string
  tenant_id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  avatar_url: string | null
  last_sign_in_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface LawyerOabRow {
  id: string
  tenant_id: string
  user_id: string
  oab_number: string
  oab_state: string
  is_primary: boolean
  discovery_done: boolean
  discovery_at: string | null
  discovery_count: number
  created_at: string
  updated_at: string
}

export interface ClientRow {
  id: string
  tenant_id: string
  name: string
  cpf: string | null
  cnpj: string | null
  email: string | null
  phone: string | null
  phone_alt: string | null
  address: Record<string, string>
  external_id: string | null
  external_source: string | null
  notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface LeadStageRow {
  id: string
  tenant_id: string
  name: string
  color: string
  position: number
  is_default: boolean
  is_terminal: boolean
  created_at: string
  updated_at: string
}

export interface LeadRow {
  id: string
  tenant_id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  client_id: string | null
  stage_id: string
  responsible_id: string | null
  subject: string | null
  area: CasoArea | null
  origin: LeadOrigin
  urgency: LeadUrgency
  ai_triage: Record<string, unknown> | null
  converted_at: string | null
  converted_to_caso_id: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface LeadMessageRow {
  id: string
  tenant_id: string
  lead_id: string
  content: string
  sender_type: 'client' | 'agent' | 'lawyer' | 'system'
  sender_id: string | null
  channel: 'whatsapp' | 'web' | 'manual'
  is_handoff: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface CasoRow {
  id: string
  tenant_id: string
  client_id: string
  responsible_id: string | null
  numero_interno: string | null
  titulo: string
  area: CasoArea
  status: CasoStatus
  descricao: string | null
  observacoes: string | null
  advogados_ids: string[]
  lead_id: string | null
  proxima_acao: string | null
  proxima_acao_data: string | null
  dossie_ia: Record<string, unknown> | null
  dossie_gerado_em: string | null
  data_abertura: string
  data_encerramento: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface CasoTimelineRow {
  id: string
  tenant_id: string
  caso_id: string
  tipo: TimelineEventType
  titulo: string
  descricao: string | null
  autor_id: string | null
  autor_nome: string | null
  processo_id: string | null
  cnj_number: string | null
  urgencia: RadarUrgencia | null
  prazo_data: string | null
  prazo_cumprido: boolean | null
  metadata: Record<string, unknown>
  is_automated: boolean
  created_at: string
}

export interface ProcessoRow {
  id: string
  tenant_id: string
  cnj_number: string
  tribunal: string
  vara: string | null
  comarca: string | null
  uf: string | null
  classe: string | null
  assunto: string | null
  status: ProcessoStatus
  valor_causa: number | null
  data_distribuicao: string | null
  data_ultima_mov: string | null
  external_id: string | null
  external_source: SyncSource
  sync_status: SyncStatus
  last_synced_at: string | null
  sync_error: string | null
  payload_raw: Record<string, unknown> | null
  discovered_via_oab_id: string | null
  created_at: string
  updated_at: string
}

export interface CasoPendenciaRow {
  id: string
  tenant_id: string
  caso_id: string
  descricao: string
  prazo: string | null
  responsavel: string | null
  urgencia: RadarUrgencia
  resolvida: boolean
  created_at: string
  updated_at: string
}

export interface CasoDocumentoRow {
  id: string
  tenant_id: string
  caso_id: string
  nome: string
  tipo: string
  tamanho: string | null
  storage_path: string | null
  criado_por: string
  created_at: string
}

export interface CaseProcessLinkRow {
  id: string
  tenant_id: string
  caso_id: string
  processo_id: string
  linked_by: string | null
  linked_at: string
  role_note: string | null
  is_primary: boolean
}

export interface ProcessPartyRow {
  id: string
  processo_id: string
  party_type: PartyType
  nome: string
  cpf: string | null
  cnpj: string | null
  oab: string | null
  external_id: string | null
  created_at: string
}

export interface ProcessUpdateRow {
  id: string
  processo_id: string
  tipo: 'movimentacao' | 'publicacao' | 'despacho' | 'decisao' | 'sentenca' | 'acordao' | 'intimacao' | 'outros'
  titulo: string
  descricao: string | null
  data_movimentacao: string
  external_id: string | null
  external_source: SyncSource
  payload_raw: Record<string, unknown> | null
  ai_summary: Record<string, unknown> | null
  processed: boolean
  processed_at: string | null
  created_at: string
}

export interface RadarItemRow {
  id: string
  tenant_id: string
  caso_id: string | null
  processo_id: string | null
  process_update_id: string | null
  tipo: RadarTipo
  urgencia: RadarUrgencia
  status: RadarStatus
  origem: RadarOrigem
  titulo: string
  descricao: string | null
  exige_acao: boolean
  caso_titulo: string | null
  cliente_nome: string | null
  ai_summary: Record<string, unknown> | null
  resolvido_em: string | null
  resolvido_por: string | null
  resolucao_nota: string | null
  referencia_externa: string | null
  created_at: string
  updated_at: string
}

export interface AppointmentRow {
  id: string
  tenant_id: string
  caso_id: string | null
  lead_id: string | null
  responsible_id: string | null
  titulo: string
  descricao: string | null
  local: string | null
  tipo: AppointmentType
  status: AppointmentStatus
  starts_at: string
  ends_at: string
  all_day: boolean
  attendee_ids: string[]
  gcal_id: string | null
  gcal_synced_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationRow {
  id: string
  tenant_id: string
  type: IntegrationType
  status: IntegrationStatus
  config: Record<string, unknown>
  secret_ref: string | null
  enabled: boolean
  last_sync_at: string | null
  last_sync_error: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationSecretRow {
  id: string
  tenant_id: string
  integration_type: IntegrationType
  encrypted_payload: string
  created_at: string
  updated_at: string
}

export interface NotificationRow {
  id: string
  tenant_id: string
  user_id: string
  tipo: NotificationType
  titulo: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  read: boolean
  read_at: string | null
  created_at: string
}

export interface AgentLogRow {
  id: string
  tenant_id: string
  lead_id: string | null
  caso_id: string | null
  action_type: string
  channel: string | null
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  model: string | null
  tokens_input: number | null
  tokens_output: number | null
  success: boolean
  error: string | null
  duration_ms: number | null
  created_at: string
}

export interface UserInviteRow {
  id: string
  tenant_id: string
  email: string
  name: string
  role: UserRole
  status: InviteStatus
  invited_by: string | null
  token: string
  invited_at: string
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
}

// ── Database interface (para tipagem do Supabase client) ───────────────────────

// Supabase v2 GenericTable requires Row/Insert/Update to extend Record<string, unknown>.
// TypeScript interfaces don't satisfy index signatures, so we use this helper to cast.
type AsRecord<T> = T & Record<string, unknown>
type TableDef<R, I = Partial<R>, U = Partial<R>> = {
  Row:           AsRecord<R>
  Insert:        AsRecord<I>
  Update:        AsRecord<U>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      tenants:             TableDef<TenantRow>
      users:               TableDef<UserRow>
      lawyer_oabs:         TableDef<LawyerOabRow>
      clients:             TableDef<ClientRow>
      lead_stages:         TableDef<LeadStageRow>
      leads:               TableDef<LeadRow>
      lead_messages:       TableDef<LeadMessageRow>
      casos:               TableDef<CasoRow>
      caso_timeline:       TableDef<CasoTimelineRow>
      caso_pendencias:     TableDef<CasoPendenciaRow>
      caso_documentos:     TableDef<CasoDocumentoRow>
      processos:           TableDef<ProcessoRow>
      case_process_links:  TableDef<CaseProcessLinkRow>
      process_parties:     TableDef<ProcessPartyRow>
      process_updates:     TableDef<ProcessUpdateRow>
      radar_items:         TableDef<RadarItemRow>
      appointments:        TableDef<AppointmentRow>
      integrations:        TableDef<IntegrationRow>
      integration_secrets: TableDef<IntegrationSecretRow>
      notifications:       TableDef<NotificationRow>
      agent_logs:          TableDef<AgentLogRow>
      user_invites:        TableDef<UserInviteRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role:           UserRole
      user_status:         UserStatus
      lead_origin:         LeadOrigin
      lead_urgency:        LeadUrgency
      caso_status:         CasoStatus
      caso_area:           CasoArea
      timeline_event_type: TimelineEventType
      processo_status:     ProcessoStatus
      sync_source:         SyncSource
      sync_status:         SyncStatus
      party_type:          PartyType
      radar_tipo:          RadarTipo
      radar_urgencia:      RadarUrgencia
      radar_status:        RadarStatus
      radar_origem:        RadarOrigem
      appointment_status:  AppointmentStatus
      appointment_type:    AppointmentType
      notification_type:   NotificationType
      integration_type:    IntegrationType
      integration_status:  IntegrationStatus
      invite_status:       InviteStatus
    }
    CompositeTypes: Record<string, never>
  }
}
