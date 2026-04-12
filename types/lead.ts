// ── Tipos de UI para o módulo de Leads ────────────────────────────────────────
// Lead é o tipo adaptado banco → UI. Os campos do banco (stage_id, responsible_id)
// são enriquecidos com nomes para exibição. Não usar `any`.

import type { CasoArea, LeadOrigin, LeadUrgency } from './database'

// Os estágios do pipeline. Os nomes são os mesmos registrados em lead_stages.name.
export type LeadStatus =
  | 'Novo'
  | 'Qualificado'
  | 'Proposta'
  | 'Contrato'
  | 'Cliente'
  | 'Perdido'

// Tipo UI principal — montado a partir de LeadRow + join com lead_stages e users
export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  cpf: string | null
  subject: string | null       // campo "observações/demanda" no banco
  area: CasoArea | null
  origin: LeadOrigin
  urgency: LeadUrgency
  // Estágio
  stageId: string
  stageName: LeadStatus        // nome do estágio (Novo, Qualificado, ...)
  stageColor: string           // hex color do estágio
  // Responsável
  responsibleId: string | null
  responsibleName: string | null
  // Timestamps
  createdAt: string            // ISO 8601
  updatedAt: string
  // Triagem de IA — espelha leads.ai_triage JSONB
  aiTriage: LeadTriage | null
}

// Estágio do pipeline
export interface LeadStage {
  id: string
  name: LeadStatus
  color: string
  position: number
  isDefault: boolean
  isTerminal: boolean
}

// Atividade/mensagem do lead (derivada de lead_messages)
export interface LeadActivity {
  id: string
  type: 'lead_created' | 'email_sent' | 'call_made' | 'meeting_scheduled' | 'stage_changed' | 'message'
  description: string
  timestamp: string // ISO 8601
}

// ── Triagem de IA ──────────────────────────────────────────────────────────────

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

// ── Tipos de formulário ────────────────────────────────────────────────────────

// Dados necessários para criar um lead (sem campos derivados do banco)
export interface LeadFormData {
  name: string
  email: string
  phone: string
  cpf: string
  subject: string   // mapeado para leads.subject (observações/demanda)
  stageId: string   // UUID do estágio selecionado
  origin: LeadOrigin
  urgency: LeadUrgency
}
