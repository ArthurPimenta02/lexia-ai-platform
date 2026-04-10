export type LeadStatus =
  | 'Novo'
  | 'Qualificado'
  | 'Proposta'
  | 'Contrato'
  | 'Cliente'
  | 'Perdido'

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  cpf: string
  status: LeadStatus
  responsible: string
  notes: string
  createdAt: string // ISO 8601 fixed string — never new Date() or Date.now()
}

export interface LeadActivity {
  id: string
  type: 'lead_created' | 'email_sent' | 'call_made' | 'meeting_scheduled' | 'stage_changed'
  description: string
  timestamp: string // ISO 8601 fixed string
}

export type UrgencyLevel = 'Alta' | 'Média' | 'Baixa'

export interface TriageIntakeCard {
  id: string
  title: string
  content: string
}

export interface LeadTriage {
  legalArea: string
  demandSummary: string
  urgency: UrgencyLevel
  routingSuggestion: string
  intakeCards: TriageIntakeCard[]
}
