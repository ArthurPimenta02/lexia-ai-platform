export type LegalArea =
  | 'Trabalhista'
  | 'Previdenciário'
  | 'Cível'
  | 'Família'
  | 'Empresarial'
  | 'Criminal'
  | 'Imobiliário'
  | 'Tributário'

export type KanbanStage =
  | 'novo_lead'
  | 'triagem'
  | 'consulta'
  | 'proposta'
  | 'cliente_ativo'
  | 'encerrado'

export type CaseOrigin =
  | 'WhatsApp'
  | 'Instagram'
  | 'Formulário'
  | 'Ligação'
  | 'Indicação'
  | 'LinkedIn'

export interface KanbanLead {
  id: string
  clientName: string
  caseTitle: string
  area: LegalArea
  stage: KanbanStage
  honorarios: number | null // null = não definido ainda
  responsible: string
  origin: CaseOrigin
  nextAction: string
  nextActionDate: string | null // ISO 8601 fixed string or null
  createdAt: string // ISO 8601 fixed string
  priority: 'low' | 'medium' | 'high'
}

export interface KanbanColumnConfig {
  id: KanbanStage
  label: string
  description: string
  color: string // hex
  showValue: boolean // whether to sum honorarios in header
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'novo_lead',
    label: 'Novo Lead',
    description: 'Chegaram via WhatsApp, Instagram, formulário ou ligação',
    color: '#3B82F6',
    showValue: false,
  },
  {
    id: 'triagem',
    label: 'Triagem Inicial',
    description: 'Em análise, aguardando coleta inicial de informações',
    color: '#8B5CF6',
    showValue: false,
  },
  {
    id: 'consulta',
    label: 'Consulta Agendada',
    description: 'Reunião ou atendimento inicial marcado',
    color: '#F59E0B',
    showValue: false,
  },
  {
    id: 'proposta',
    label: 'Proposta / Contrato',
    description: 'Honorários enviados, aguardando aceite',
    color: '#EC4899',
    showValue: true,
  },
  {
    id: 'cliente_ativo',
    label: 'Cliente Ativo',
    description: 'Processo, atendimento ou acompanhamento em andamento',
    color: '#10B981',
    showValue: true,
  },
  {
    id: 'encerrado',
    label: 'Encerrado',
    description: 'Casos concluídos, arquivados ou perdidos',
    color: '#9CA3AF',
    showValue: false,
  },
]

