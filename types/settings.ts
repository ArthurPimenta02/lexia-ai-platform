// ─── Office ───────────────────────────────────────────────────────────────────

export interface OfficeAddress {
  street: string
  number: string
  complement?: string
  city: string
  state: string
  zip: string
}

export interface OfficeSettings {
  id: string
  tenantId: string
  name: string                  // official/legal name
  displayName: string           // name shown in the UI / to clients
  cnpj: string
  email: string
  phone: string
  address: OfficeAddress
  timezone: string              // e.g. "America/Sao_Paulo"
  primaryPracticeArea: string   // e.g. "Trabalhista"
  logoUrl?: string
  updatedAt: string             // ISO 8601
}

// ─── Agent — Business Hours ───────────────────────────────────────────────────

export interface OfficeBusinessHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday
  enabled: boolean
  start: string   // "08:00"
  end: string     // "18:00"
}

// ─── Agent — Tone ─────────────────────────────────────────────────────────────

export type AgentTone = 'formal' | 'neutral' | 'friendly'

// ─── Agent — Handoff Rules ────────────────────────────────────────────────────

export interface HandoffRules {
  autoHandoffOnKeywords: string[]    // e.g. ["urgente", "advogado", "processo"]
  handoffAfterXMessages: number      // e.g. 10
  handoffMessage: string             // message sent when handing off
  notifyUserId?: string              // user to notify on handoff
  fallbackOnNoContext: boolean       // hand off when agent lacks context
  fallbackOnOutOfHours: boolean      // hand off when outside business hours
}

// ─── Agent — Channels ─────────────────────────────────────────────────────────

export type AgentChannel = 'whatsapp' | 'web'

// ─── Agent — Practice Areas ───────────────────────────────────────────────────

export const PRACTICE_AREAS = [
  'Cível',
  'Trabalhista',
  'Família',
  'Criminal',
  'Empresarial',
  'Tributário',
  'Previdenciário',
  'Consumidor',
  'Imobiliário',
  'Ambiental',
] as const

export type PracticeArea = typeof PRACTICE_AREAS[number]

// ─── Agent Settings ───────────────────────────────────────────────────────────

export interface AgentSettings {
  id: string
  tenantId: string
  tone: AgentTone
  practiceAreas: PracticeArea[]
  businessHours: OfficeBusinessHours[]
  greetingMessage: string
  closingMessage: string
  outOfHoursMessage: string
  noContextMessage: string         // message when agent lacks context
  handoffRules: HandoffRules
  activeChannels: AgentChannel[]
  updatedAt: string                // ISO 8601
}

// ─── Integration ─────────────────────────────────────────────────────────────

export type IntegrationType = 'whatsapp' | 'google_calendar' | 'escavador' | 'advbox'

export type IntegrationStatus = 'connected' | 'disconnected' | 'coming_soon'

export interface Integration {
  id: string
  type: IntegrationType
  name: string
  description: string         // what this integration does
  status: IntegrationStatus
  connected: boolean          // whether credentials are set up
  enabled: boolean            // whether it's actively being used
  lastSyncAt?: string         // mock: relative string "há 3 horas"
  primaryAction: string       // label for the main CTA button
  logoIcon: string            // name of lucide icon or custom identifier
}

// ─── Constantes visuais ───────────────────────────────────────────────────────

export const AGENT_TONE_LABELS: Record<AgentTone, string> = {
  formal:   'Formal',
  neutral:  'Neutro',
  friendly: 'Amigável',
}

export const AGENT_TONE_DESCRIPTIONS: Record<AgentTone, string> = {
  formal:   'Linguagem técnica e profissional, indicada para casos complexos',
  neutral:  'Comunicação equilibrada, adequada para a maioria dos clientes',
  friendly: 'Tom acolhedor e próximo, ideal para primeiras impressões',
}

export const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}

export const TIMEZONES = [
  { value: 'America/Sao_Paulo',  label: 'Brasília (UTC-3)' },
  { value: 'America/Manaus',     label: 'Manaus (UTC-4)' },
  { value: 'America/Belem',      label: 'Belém (UTC-3)' },
  { value: 'America/Fortaleza',  label: 'Fortaleza (UTC-3)' },
  { value: 'America/Recife',     label: 'Recife (UTC-3)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (UTC-4)' },
  { value: 'America/Boa_Vista',  label: 'Boa Vista (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
]
