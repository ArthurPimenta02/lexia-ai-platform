// ─── Status ──────────────────────────────────────────────────────────────────

export type CasoStatus = 'Ativo' | 'Suspenso' | 'Encerrado' | 'Arquivado'

export type CasoArea =
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

// ─── Processo Vinculado ───────────────────────────────────────────────────────

export interface ProcessoVinculado {
  id: string
  numero: string           // e.g. "0001234-56.2023.5.02.0001"
  tribunal: string         // e.g. "TRT 2ª Região"
  vara: string
  ultimaMovimentacao: string  // ISO 8601
  resumoUltimaMovimentacao: string
  link?: string
}

// ─── Pendência ────────────────────────────────────────────────────────────────

export interface Pendencia {
  id: string
  descricao: string
  prazo?: string          // ISO 8601
  responsavel?: string
  urgencia: UrgenciaNivel
  resolvida: boolean
}

// ─── Prazo ────────────────────────────────────────────────────────────────────

export interface Prazo {
  id: string
  descricao: string
  data: string            // ISO 8601
  tipo: 'judicial' | 'interno' | 'contratual'
  urgencia: UrgenciaNivel
  cumprido: boolean
}

// ─── Documento ────────────────────────────────────────────────────────────────

export interface Documento {
  id: string
  nome: string
  tipo: 'petição' | 'contrato' | 'procuração' | 'laudo' | 'decisão' | 'outro'
  tamanho?: string
  criadoEm: string        // ISO 8601
  criadoPor: string
}

// ─── Linha do Tempo ───────────────────────────────────────────────────────────

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
  descricao: string
  data: string            // ISO 8601
  autor: string
  processo?: string       // número do processo vinculado, se aplicável
  urgencia?: UrgenciaNivel
  metadata?: Record<string, string>
}

// ─── Dossiê Inteligente (IA) ─────────────────────────────────────────────────

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

// ─── Caso (entidade principal) ────────────────────────────────────────────────

export interface Caso {
  id: string
  titulo: string
  numero?: string         // número interno do caso, e.g. "2024-TRB-001"
  area: CasoArea
  status: CasoStatus
  cliente: string
  clienteId?: string      // referência ao lead/cliente
  responsavel: string
  responsavelId?: string
  advogados: string[]     // advogados adicionais
  descricao?: string
  observacoes?: string

  // Datas
  dataAbertura: string    // ISO 8601
  dataEncerramento?: string
  ultimaAtualizacao: string

  // Próxima ação / prazo
  proximaAcao?: string
  proximaAcaoData?: string  // ISO 8601

  // Prazos
  proximoPrazo?: Prazo
  prazos: Prazo[]

  // Processos
  processos: ProcessoVinculado[]

  // Pendências
  pendencias: Pendencia[]

  // Linha do tempo
  timeline: TimelineEvent[]

  // Documentos
  documentos: Documento[]

  // Dossiê IA (opcional — gerado sob demanda)
  dossieInteligente?: DossieInteligente

  // Multi-tenancy (para backend)
  tenantId?: string
}

// ─── Constantes visuais ───────────────────────────────────────────────────────

export const CASO_STATUS_COLORS: Record<CasoStatus, string> = {
  Ativo:     '#10B981',
  Suspenso:  '#F97316',
  Encerrado: '#6B7280',
  Arquivado: '#9CA3AF',
}

export const CASO_AREA_COLORS: Record<CasoArea, string> = {
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
