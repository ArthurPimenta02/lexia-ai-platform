// ── Status & Área ─────────────────────────────────────────────────────────────

export type CasoStatus = 'Ativo' | 'Suspenso' | 'Encerrado' | 'Arquivado'

import type { SyncSource, SyncStatus } from '@/types/database'

export type CasoArea =
  | 'A definir'
  | 'Trabalhista'
  | 'Cível'
  | 'Família'
  | 'Criminal'
  | 'Empresarial'
  | 'Tributário'
  | 'Previdenciário'
  | 'Consumidor'
  | 'Imobiliário'
  | 'Ambiental'

export type UrgenciaNivel = 'Alta' | 'Média' | 'Baixa'

// ── Processo Vinculado ────────────────────────────────────────────────────────
// Lido de case_process_links → processos (somente leitura no M12)

export interface ProcessoVinculado {
  id: string
  numero: string           // cnj_number
  tribunal: string
  vara: string | null
  ultimaMovimentacao: string | null  // data_ultima_mov
  resumoUltimaMovimentacao: string   // assunto ou classe
  isPrimary: boolean                 // case_process_links.is_primary
  externalSource: SyncSource
  syncStatus: SyncStatus
  lastSyncedAt: string | null
  syncError: string | null
}

// ── Pendência ─────────────────────────────────────────────────────────────────
// Fonte operacional de tarefas/prazos — tabela caso_pendencias

export interface Pendencia {
  id: string
  descricao: string
  prazo: string | null     // ISO 8601
  responsavel: string | null
  urgencia: UrgenciaNivel
  resolvida: boolean
  createdAt: string
}

// ── Documento ─────────────────────────────────────────────────────────────────
// Tabela caso_documentos

export interface Documento {
  id: string
  nome: string
  tipo: 'petição' | 'contrato' | 'procuração' | 'laudo' | 'decisão' | 'outro'
  tamanho: string | null
  criadoEm: string        // ISO 8601
  criadoPor: string
}

// ── Linha do Tempo ────────────────────────────────────────────────────────────
// Histórico imutável — tabela caso_timeline

export type TimelineEventTipo =
  | 'criacao'
  | 'nota_interna'
  | 'documento_anexado'
  | 'prazo_criado'
  | 'movimentacao_processual'
  | 'atualizacao_status'
  | 'audiencia'
  | 'peticao'

export interface TimelineEvent {
  id: string
  tipo: TimelineEventTipo
  titulo: string
  descricao: string | null
  data: string            // ISO 8601 (created_at)
  autor: string           // autor_nome (denormalizado)
  urgencia: UrgenciaNivel | null
  metadata: Record<string, string>
}

// ── Dossiê Inteligente (IA) ───────────────────────────────────────────────────
// Gerado sob demanda pelo Claude, salvo em casos.dossie_ia (JSONB)

export interface DossieInteligente {
  resumo: string
  pontosCriticos: string[]
  pendenciasIdentificadas: string[]
  proximosMarcosEsperados: string[]
  ultimaMovimentacaoRelevante: string
  proximoPasso: string
  contextoRetomada: string
  geradoEm: string        // ISO 8601
}

// ── Caso (entidade principal) ─────────────────────────────────────────────────
// Montado a partir de CasoRow + joins

export interface Caso {
  id: string
  titulo: string
  numeroInterno: string | null    // numero_interno
  area: CasoArea
  status: CasoStatus
  descricao: string | null
  observacoes: string | null

  // Cliente (opcional em casos criados a partir de processo importado)
  clienteId: string | null
  clienteNome: string             // clients.name

  // Responsável principal
  responsavelId: string | null
  responsavelNome: string | null  // users.name

  // Datas
  dataAbertura: string            // ISO 8601
  dataEncerramento: string | null
  updatedAt: string               // updated_at

  // Lead de origem (opcional)
  leadId: string | null
  leadNome: string | null         // leads.name (denormalizado para exibição)

  // Próxima ação (campo direto em casos)
  proximaAcao: string | null
  proximaAcaoData: string | null  // ISO 8601

  // Relações (carregadas em getCaso)
  timeline: TimelineEvent[]
  processos: ProcessoVinculado[]
  pendencias: Pendencia[]
  documentos: Documento[]

  // Derivado client-side: primeiro caso_pendencias com prazo futuro não resolvido
  proximoPrazo: Pendencia | null

  // Dossiê IA
  dossieInteligente: DossieInteligente | null
  dossieGeradoEm: string | null
}

// ── CasoSummary (para listagem) ───────────────────────────────────────────────
// Versão leve sem relações — usada em getCasos()

export interface CasoSummary {
  id: string
  titulo: string
  numeroInterno: string | null
  area: CasoArea
  status: CasoStatus
  clienteId: string | null
  clienteNome: string
  responsavelId: string | null
  responsavelNome: string | null
  leadId: string | null
  leadNome: string | null
  dataAbertura: string
  updatedAt: string
  proximaAcao: string | null
  proximaAcaoData: string | null
  // Contadores derivados (calculados na query)
  pendenciasAbertas: number
  processosCount: number
}

// ── Formulários ───────────────────────────────────────────────────────────────

export interface CasoFormData {
  titulo: string
  area: CasoArea
  status: CasoStatus
  clienteNome: string        // upsert automático em clients dentro da action
  responsavelId: string      // UUID do usuário responsável
  leadId: string             // UUID do lead de origem, '' se nenhum
  descricao: string
  proximaAcao: string
  proximaAcaoData: string    // '' se não definido
}

export interface PendenciaInput {
  descricao: string
  prazo: string | null       // ISO 8601 ou null
  responsavel: string | null
  urgencia: UrgenciaNivel
}

export interface TimelineEventInput {
  tipo: TimelineEventTipo
  titulo: string
  descricao: string
  urgencia?: UrgenciaNivel
}

// ── Constantes visuais ────────────────────────────────────────────────────────

export const CASO_STATUS_COLORS: Record<CasoStatus, string> = {
  Ativo:     '#10B981',
  Suspenso:  '#F97316',
  Encerrado: '#6B7280',
  Arquivado: '#9CA3AF',
}

export const CASO_AREA_COLORS: Record<CasoArea, string> = {
  'A definir':      '#64748B',
  Trabalhista:    '#3B82F6',
  Cível:          '#8B5CF6',
  Família:        '#EC4899',
  Criminal:       '#EF4444',
  Empresarial:    '#F59E0B',
  Tributário:     '#14B8A6',
  Previdenciário: '#6366F1',
  Consumidor:     '#F97316',
  Imobiliário:    '#84CC16',
  Ambiental:      '#22C55E',
}

export const URGENCIA_COLORS: Record<UrgenciaNivel, string> = {
  Alta:  '#EF4444',
  Média: '#F97316',
  Baixa: '#6B7280',
}

export const TIMELINE_EVENT_LABELS: Record<TimelineEventTipo, string> = {
  criacao:                'Abertura do caso',
  nota_interna:           'Nota interna',
  documento_anexado:      'Documento anexado',
  prazo_criado:           'Prazo registrado',
  movimentacao_processual:'Movimentação processual',
  atualizacao_status:     'Atualização de status',
  audiencia:              'Audiência',
  peticao:                'Petição',
}

export const CASO_AREAS: CasoArea[] = [
  'A definir', 'Trabalhista', 'Cível', 'Família', 'Criminal', 'Empresarial',
  'Tributário', 'Previdenciário', 'Consumidor', 'Imobiliário', 'Ambiental',
]
export const CASO_STATUSES: CasoStatus[] = ['Ativo', 'Suspenso', 'Encerrado', 'Arquivado']
