import type { LeadOrigin } from './database'

export type LegalArea =
  | 'Trabalhista'
  | 'Previdenciário'
  | 'Cível'
  | 'Família'
  | 'Empresarial'
  | 'Criminal'
  | 'Imobiliário'
  | 'Tributário'

export interface KanbanLead {
  id: string
  clientName: string
  caseTitle: string
  area: LegalArea
  stageId: string     // UUID do estágio (lead_stages.id)
  honorarios: number | null
  responsible: string
  origin: LeadOrigin
  nextAction: string
  nextActionDate: string | null
  createdAt: string
  priority: 'low' | 'medium' | 'high'
}

export interface KanbanColumnConfig {
  id: string         // UUID do estágio (lead_stages.id)
  label: string
  description: string
  color: string
  showValue: boolean
}
