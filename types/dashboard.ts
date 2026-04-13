// Tipos do módulo Dashboard — compartilhados entre queries e componentes

export type ActivityType =
  | 'lead_created'
  | 'message_received'
  | 'stage_changed'
  | 'handoff'
  | 'appointment'
  | 'radar_alert'
  | 'timeline_event'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string // ISO 8601 — seguro para serialização SSR→client
}

export interface FunnelStage {
  stage: string
  count: number
  color: string
}

export interface DashboardMetrics {
  newLeads24h: number
  newLeads24hDelta: number
  totalLeads: number
  conversionRate: number
  activeCasos: number
  openPendencias: number
  urgentRadarItems: number
}

// Dados de detalhe para os sheets dos MetricCards
export interface LeadDetailItem {
  id: string
  name: string
  origin: string
  urgency: string
  stageName: string
  stageColor: string
  createdAt: string
}

export interface ConversionDetailItem {
  id: string
  name: string
  origin: string
  convertedAt: string
}

export interface PendenciaDetailItem {
  id: string
  descricao: string
  urgencia: 'Alta' | 'Media' | 'Baixa'
  prazo: string | null
  responsavel: string | null
  casoId: string
  casoTitulo: string
}

// Bloco "Precisa de atenção agora"
export interface AttentionRadarItem {
  id: string
  titulo: string
  casoTitulo: string
  urgencia: 'Alta' | 'Media' | 'Baixa'
  tipo: string
  createdAt: string
}

export interface AttentionPendencia {
  id: string
  descricao: string
  casoId: string
  urgencia: 'Alta' | 'Media' | 'Baixa'
  prazo: string | null
}

export interface AttentionNowData {
  urgentRadar: AttentionRadarItem[]
  openPendencias: AttentionPendencia[]
}
