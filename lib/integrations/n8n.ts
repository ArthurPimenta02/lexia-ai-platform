import crypto from 'node:crypto'
import type {
  PartyType,
  ProcessoStatus,
  RadarOrigem,
  RadarTipo,
  RadarUrgencia,
  SyncSource,
} from '@/types/database'

export interface NormalizedProcessParty {
  party_type: PartyType
  nome: string
  cpf?: string | null
  cnpj?: string | null
  oab?: string | null
  external_id?: string | null
}

export interface NormalizedDiscoveredProcess {
  external_id?: string | null
  cnj_number: string
  tribunal: string
  vara?: string | null
  comarca?: string | null
  uf?: string | null
  classe?: string | null
  assunto?: string | null
  status?: ProcessoStatus
  valor_causa?: number | null
  data_distribuicao?: string | null
  data_ultima_mov?: string | null
  payload_raw?: Record<string, unknown> | null
  parties?: NormalizedProcessParty[]
  parties_snapshot_complete?: boolean
}

export interface NormalizedProcessUpdate {
  external_id?: string | null
  tipo: 'movimentacao' | 'publicacao' | 'despacho' | 'decisao' | 'sentenca' | 'acordao' | 'intimacao' | 'outros'
  titulo: string
  descricao?: string | null
  data_movimentacao: string
  payload_raw?: Record<string, unknown> | null
}

export interface OabDiscoveryRequestPayload {
  tenant_id: string
  lawyer_oab_id: string
  user_id: string
  oab_number: string
  oab_state: string
  external_source: SyncSource
}

export interface ProcessSyncRequestPayload {
  tenant_id: string
  processo_id: string
  cnj_number: string
  external_id?: string | null
  external_source: SyncSource
}

export interface BatchProcessSyncRequestPayload {
  tenant_id: string
  processos: ProcessSyncRequestPayload[]
}

export interface WebhookDispatchResult {
  ok: boolean
  status?: number
  error?: string
  data?: unknown
}

export function isValidWebhookSecret(received: string | null, expected = process.env.N8N_WEBHOOK_SECRET) {
  if (!received || !expected) return false

  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)

  if (receivedBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
}

function getRequiredSecret() {
  return process.env.N8N_WEBHOOK_SECRET
}

async function postJson(url: string | undefined, payload: unknown): Promise<WebhookDispatchResult> {
  const secret = getRequiredSecret()
  if (!secret) {
    return { ok: false, error: 'N8N_WEBHOOK_SECRET nao configurado.' }
  }

  if (!url) {
    return { ok: false, error: 'URL do webhook n8n nao configurada.' }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': secret,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    let data: unknown = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: typeof data === 'object' && data && 'error' in data
          ? String(data.error)
          : `Webhook n8n respondeu ${response.status}.`,
        data,
      }
    }

    return { ok: true, status: response.status, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Falha ao chamar webhook n8n.',
    }
  }
}

export async function sendOabDiscoveryRequest(
  payload: OabDiscoveryRequestPayload
): Promise<WebhookDispatchResult> {
  return postJson(process.env.N8N_PROCESS_DISCOVERY_WEBHOOK_URL, payload)
}

export async function sendProcessSyncRequest(
  payload: ProcessSyncRequestPayload
): Promise<WebhookDispatchResult> {
  return postJson(process.env.N8N_PROCESS_SYNC_WEBHOOK_URL, payload)
}

export async function sendBatchProcessSyncRequest(
  payload: BatchProcessSyncRequestPayload
): Promise<WebhookDispatchResult> {
  return postJson(process.env.N8N_BATCH_PROCESS_SYNC_WEBHOOK_URL, payload)
}

export function normalizeDateOnly(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export function buildProcessUpdateDedupeKey(input: {
  processoId: string
  externalId?: string | null
  tipo: string
  titulo: string
  descricao?: string | null
  dataMovimentacao: string
  externalSource: SyncSource
}) {
  if (input.externalId?.trim()) {
    return input.externalId.trim()
  }

  return crypto
    .createHash('sha256')
    .update(
      [
        input.processoId,
        input.tipo,
        input.titulo,
        input.descricao ?? '',
        normalizeDateOnly(input.dataMovimentacao) ?? input.dataMovimentacao,
        input.externalSource,
      ].join('|')
    )
    .digest('hex')
}

export function inferRadarPayloadFromUpdate(input: {
  tipo: NormalizedProcessUpdate['tipo']
  titulo: string
  descricao?: string | null
  externalSource: SyncSource
}) {
  const text = `${input.titulo} ${input.descricao ?? ''}`.toLowerCase()
  const hasDeadlineSignal = /(prazo|manifestar|cumprir|contrarrazo|embargos|recurso)/i.test(text)
  const requiresAction = /(intima|prazo|manifestar|apresentar|responder|cumprir|audi[eê]ncia|sess[aã]o)/i.test(text)
  const highUrgency = /(urgente|48h|24h|prazo fatal|audi[eê]ncia|sess[aã]o)/i.test(text)

  let tipo: RadarTipo = 'movimentacao'
  if (hasDeadlineSignal) tipo = 'alerta_prazo'
  else if (input.tipo === 'publicacao' || input.tipo === 'intimacao') tipo = 'publicacao'

  const urgencia: RadarUrgencia = highUrgency ? 'Alta' : requiresAction ? 'Media' : 'Baixa'
  const origem: RadarOrigem = input.externalSource === 'escavador'
    ? 'escavador'
    : input.externalSource === 'cnj'
      ? 'cnj'
      : 'sistema'

  return {
    tipo,
    urgencia,
    origem,
    exigeAcao: requiresAction || hasDeadlineSignal,
  }
}
