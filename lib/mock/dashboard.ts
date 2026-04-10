export type NotificationType = 'lead_novo' | 'handoff' | 'prazo' | 'reuniao' | 'status'

export interface MockNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  read: boolean
  timestamp: string // ISO 8601 fixed string
  leadId?: string
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-001',
    type: 'handoff',
    title: 'Handoff solicitado',
    description: 'Maria Silva pediu atendimento humano via WhatsApp',
    read: false,
    timestamp: '2026-04-10T09:05:00Z',
    leadId: 'lead-001',
  },
  {
    id: 'notif-002',
    type: 'lead_novo',
    title: 'Novo lead qualificado',
    description: 'João Ferreira avançou para Qualificado',
    read: false,
    timestamp: '2026-04-10T08:42:00Z',
    leadId: 'lead-004',
  },
  {
    id: 'notif-003',
    type: 'prazo',
    title: 'Prazo se aproximando',
    description: 'Resposta trabalhista — Bruno Ferreira — vence em 2 dias',
    read: false,
    timestamp: '2026-04-10T08:00:00Z',
    leadId: 'lead-002',
  },
  {
    id: 'notif-004',
    type: 'reuniao',
    title: 'Reunião confirmada',
    description: 'Ana Costa confirmou reunião para hoje às 14h',
    read: true,
    timestamp: '2026-04-09T16:30:00Z',
    leadId: 'lead-007',
  },
  {
    id: 'notif-005',
    type: 'status',
    title: 'Lead avançou no pipeline',
    description: 'Eliane Cardoso movida para Contrato',
    read: true,
    timestamp: '2026-04-09T14:15:00Z',
    leadId: 'lead-005',
  },
  {
    id: 'notif-006',
    type: 'lead_novo',
    title: 'Novo lead recebido',
    description: 'Mariana Cunha entrou via WhatsApp',
    read: true,
    timestamp: '2026-04-09T10:00:00Z',
    leadId: 'lead-013',
  },
]

export const mockMetrics = {
  newLeads24h: 7,
  newLeads24hDelta: +3,
  totalLeads: 142,
  totalLeadsDelta: +12,
  conversionRate: 18.3,
  conversionRateDelta: +2.1,
  attendancesToday: 5,
  attendancesTodayDelta: -1,
}

export const mockFunnel = [
  { stage: 'Novo', count: 38, color: '#3B82F6' },
  { stage: 'Qualificado', count: 27, color: '#8B5CF6' },
  { stage: 'Proposta', count: 19, color: '#FBBF24' },
  { stage: 'Contrato', count: 12, color: '#34D399' },
  { stage: 'Cliente', count: 31, color: '#10B981' },
  { stage: 'Perdido', count: 15, color: '#9CA3AF' },
]

export type ActivityType = 'lead_created' | 'message_received' | 'handoff' | 'stage_changed' | 'appointment'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: Date
}

// Datas fixas (ISO) — evita divergência SSR/cliente com Date.now()
export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'handoff',
    title: 'Handoff solicitado',
    description: 'Maria Silva solicitou atendimento humano',
    timestamp: new Date('2026-04-09T14:55:00Z'),
  },
  {
    id: '2',
    type: 'lead_created',
    title: 'Novo lead criado',
    description: 'João Ferreira via WhatsApp',
    timestamp: new Date('2026-04-09T14:42:00Z'),
  },
  {
    id: '3',
    type: 'stage_changed',
    title: 'Lead avançou no pipeline',
    description: 'Ana Costa: Qualificado → Proposta',
    timestamp: new Date('2026-04-09T14:15:00Z'),
  },
  {
    id: '4',
    type: 'message_received',
    title: 'Nova mensagem',
    description: 'Carlos Mendes enviou documentos',
    timestamp: new Date('2026-04-09T13:00:00Z'),
  },
  {
    id: '5',
    type: 'appointment',
    title: 'Agendamento confirmado',
    description: 'Reunião com Pedro Alves amanhã às 14h',
    timestamp: new Date('2026-04-09T12:00:00Z'),
  },
  {
    id: '6',
    type: 'lead_created',
    title: 'Novo lead criado',
    description: 'Lucia Barbosa via site',
    timestamp: new Date('2026-04-09T10:00:00Z'),
  },
]
