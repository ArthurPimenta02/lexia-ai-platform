export type RadarTipo = 'publicacao' | 'movimentacao' | 'alerta_prazo' | 'acao_requerida'
export type RadarUrgencia = 'Alta' | 'Media' | 'Baixa'
export type RadarStatus = 'novo' | 'em_analise' | 'resolvido'
export type RadarOrigem = 'escavador' | 'cnj' | 'interno' | 'manual' | 'sistema'

export interface RadarItem {
  id: string
  tipo: RadarTipo
  titulo: string
  descricao?: string
  casoId: string
  casoTitulo: string
  cliente: string
  data: string // ISO 8601
  urgencia: RadarUrgencia
  exigeAcao: boolean
  status: RadarStatus
  origem: RadarOrigem
  resumoIA: string
  explicacaoPratica: string
  proximoPasso: string
  riscoSeNaoAgir: string
  impactoNoCaso: string
  dataResolucao?: string // ISO 8601, set when status = 'resolvido'
  referenciaExterna?: string // ID ou URL da fonte externa (ex: Escavador, Datajud)
  processoNumero?: string
  processoExternalId?: string
  contextoLinha?: string
}

function normalizeForCompare(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR')
}

export function buildRadarContextLine(item: Pick<RadarItem, 'titulo' | 'casoTitulo' | 'cliente' | 'processoNumero' | 'processoExternalId'>): string {
  const parts: string[] = []

  if (item.processoNumero?.trim()) {
    parts.push(item.processoNumero.trim())
  } else if (item.processoExternalId?.trim()) {
    parts.push(`Ref. ${item.processoExternalId.trim()}`)
  }

  if (item.cliente.trim()) {
    parts.push(item.cliente.trim())
  }

  if (
    item.casoTitulo.trim() &&
    normalizeForCompare(item.casoTitulo) !== normalizeForCompare(item.titulo)
  ) {
    parts.push(item.casoTitulo.trim())
  }

  return parts.join(' • ')
}

export const RADAR_TIPO_COLORS: Record<RadarTipo, string> = {
  publicacao: '#3B82F6',
  movimentacao: '#8B5CF6',
  alerta_prazo: '#F59E0B',
  acao_requerida: '#EF4444',
}

export const RADAR_URGENCIA_COLORS: Record<RadarUrgencia, string> = {
  Alta: '#EF4444',
  Media: '#F59E0B',
  Baixa: '#6B7280',
}

export const RADAR_STATUS_COLORS: Record<RadarStatus, string> = {
  novo: '#3B82F6',
  em_analise: '#F59E0B',
  resolvido: '#10B981',
}

export const RADAR_TIPO_LABELS: Record<RadarTipo, string> = {
  publicacao: 'Publicação',
  movimentacao: 'Movimentação',
  alerta_prazo: 'Alerta de Prazo',
  acao_requerida: 'Ação Requerida',
}

export const RADAR_URGENCIA_LABELS: Record<RadarUrgencia, string> = {
  Alta: 'Alta',
  Media: 'Média',
  Baixa: 'Baixa',
}

export const RADAR_STATUS_LABELS: Record<RadarStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em análise',
  resolvido: 'Resolvido',
}

export const RADAR_ORIGEM_LABELS: Record<RadarOrigem, string> = {
  escavador: 'Escavador',
  cnj: 'CNJ',
  interno: 'Interno',
  manual: 'Manual',
  sistema: 'Sistema',
}
