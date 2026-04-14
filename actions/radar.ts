'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { buildRadarContextLine } from '@/types/radar'
import type { RadarItem, RadarTipo, RadarUrgencia, RadarStatus } from '@/types/radar'
import type { RadarItemRow, AppointmentType } from '@/types/database'

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToRadarItem(row: RadarItemRow & {
  casos?: { titulo: string; clients?: { name: string } | null } | null
  processos?: { cnj_number: string; external_id: string | null } | null
}): RadarItem {
  const aiSummary = row.ai_summary as Record<string, string> | null
  const casoTitulo = row.caso_titulo ?? row.casos?.titulo ?? ''
  const cliente = row.cliente_nome ?? row.casos?.clients?.name ?? ''
  const processoNumero = row.processos?.cnj_number ?? undefined
  const processoExternalId = row.processos?.external_id ?? undefined

  const item: RadarItem = {
    id: row.id,
    tipo: row.tipo as RadarTipo,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    casoId: row.caso_id ?? '',
    casoTitulo,
    cliente,
    data: row.created_at,
    urgencia: row.urgencia as RadarUrgencia,
    exigeAcao: row.exige_acao,
    status: row.status as RadarStatus,
    origem: row.origem as RadarItem['origem'],
    resumoIA: aiSummary?.resumo ?? '',
    explicacaoPratica: aiSummary?.explicacaoPratica ?? '',
    proximoPasso: aiSummary?.proximoPasso ?? '',
    riscoSeNaoAgir: aiSummary?.riscoSeNaoAgir ?? '',
    impactoNoCaso: aiSummary?.impactoNoCaso ?? '',
    dataResolucao: row.resolvido_em ?? undefined,
    referenciaExterna: row.referencia_externa ?? undefined,
    processoNumero,
    processoExternalId,
  }

  return {
    ...item,
    contextoLinha: buildRadarContextLine(item),
  }
}

// ── Filtros ────────────────────────────────────────────────────────────────────

export interface RadarFilters {
  tipo?: RadarTipo
  urgencia?: RadarUrgencia
  status?: RadarStatus
  exigeAcao?: boolean
  casoId?: string
  periodo?: 'hoje' | '7dias' | '30dias' | 'tudo'
  search?: string
}

// ── getRadarItems ─────────────────────────────────────────────────────────────

export async function getRadarItems(
  filters?: RadarFilters
): Promise<{ items: RadarItem[] } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'Tenant não encontrado na sessão' }

  let query = supabase
    .from('radar_items')
    .select(`
      *,
      casos (
        titulo,
        clients ( name )
      ),
      processos (
        cnj_number,
        external_id
      )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.urgencia) query = query.eq('urgencia', filters.urgencia)
  if (filters?.status) query = query.eq('status', filters.status)
  if (typeof filters?.exigeAcao === 'boolean') query = query.eq('exige_acao', filters.exigeAcao)
  if (filters?.casoId) query = query.eq('caso_id', filters.casoId)

  if (filters?.periodo && filters.periodo !== 'tudo') {
    const ms: Record<string, number> = { hoje: 86400000, '7dias': 604800000, '30dias': 2592000000 }
    const since = new Date(Date.now() - ms[filters.periodo]).toISOString()
    query = query.gte('created_at', since)
  }

  const { data, error } = await query

  if (error) {
    console.error('getRadarItems:', error)
    return { error: 'Erro ao buscar itens do radar.' }
  }

  let items = (data ?? []).map((row) => rowToRadarItem(row as RadarItemRow & {
    casos?: { titulo: string; clients?: { name: string } | null } | null
    processos?: { cnj_number: string; external_id: string | null } | null
  }))

  // Filtro de busca textual (feito no cliente por ser simples ILIKE — evita round-trip extra)
  if (filters?.search) {
    const q = filters.search.toLowerCase()
    items = items.filter(
      (r) => r.titulo.toLowerCase().includes(q) || r.cliente.toLowerCase().includes(q)
    )
  }

  return { items }
}

// ── markResolved ──────────────────────────────────────────────────────────────

export async function markResolved(
  itemId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'Tenant não encontrado na sessão' }

  // Usa service client: UPDATE em radar_items exige app_role no JWT
  const service = createServiceClient()
  const { error } = await service
    .from('radar_items')
    .update({
      status: 'resolvido',
      exige_acao: false,
      resolvido_em: new Date().toISOString(),
      resolvido_por: user.id,
    })
    .eq('id', itemId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('markResolved:', error)
    return { error: 'Erro ao marcar como resolvido.' }
  }

  revalidatePath('/radar')
  return { ok: true }
}

// ── markInAnalysis ────────────────────────────────────────────────────────────

export async function markInAnalysis(
  itemId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'Tenant não encontrado na sessão' }

  const service = createServiceClient()
  const { error } = await service
    .from('radar_items')
    .update({ status: 'em_analise' })
    .eq('id', itemId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('markInAnalysis:', error)
    return { error: 'Erro ao atualizar status.' }
  }

  revalidatePath('/radar')
  return { ok: true }
}

// ── deleteRadarItem ───────────────────────────────────────────────────────────

export async function deleteRadarItem(
  itemId: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'Tenant não encontrado na sessão' }

  const service = createServiceClient()
  const { error } = await service
    .from('radar_items')
    .delete()
    .eq('id', itemId)
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('deleteRadarItem:', error)
    return { error: 'Erro ao excluir item.' }
  }

  revalidatePath('/radar')
  return { ok: true }
}

// ── createPrazo ───────────────────────────────────────────────────────────────
// Cria um appointment do tipo 'prazo' preservando o vínculo com o radar item.
// O campo `descricao` armazena a referência ao radar_item_id para rastreabilidade.

export interface CreatePrazoData {
  titulo: string
  dataLimite: string        // YYYY-MM-DD
  tipo: string              // TipoPrazo UI → AppointmentType banco
  observacoes?: string
  responsavelId?: string
  casoId: string
  radarItemId: string       // origem do prazo — preserva rastreabilidade
  radarItemTitulo: string
}

const TIPO_PRAZO_MAP: Record<string, AppointmentType> = {
  recursal: 'prazo',
  contestacao: 'prazo',
  replica: 'prazo',
  manifestacao: 'prazo',
  pericia: 'outros',
  audiencia: 'audiencia',
  protocolo: 'prazo',
  outro: 'outros',
}

export async function createPrazo(
  data: CreatePrazoData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'Tenant não encontrado na sessão' }

  const startsAt = new Date(`${data.dataLimite}T00:00:00`).toISOString()
  const endsAt   = new Date(`${data.dataLimite}T23:59:59`).toISOString()

  const appointmentType = TIPO_PRAZO_MAP[data.tipo] ?? 'prazo'

  // Preserva a rastreabilidade do prazo: descricao referencia o radar_item_id
  // e o título original do item de radar.
  const descricao = [
    data.observacoes ?? '',
    `[radar:${data.radarItemId}] Originado de: ${data.radarItemTitulo}`,
  ].filter(Boolean).join('\n\n')

  // Usa service client: RLS de appointments exige app_role no JWT
  // que pode não estar presente em todos os contextos de sessão.
  const service = createServiceClient()
  const { data: inserted, error } = await service
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      caso_id: data.casoId || null,
      responsible_id: data.responsavelId ?? null,
      titulo: data.titulo,
      descricao,
      tipo: appointmentType,
      status: 'agendado',
      starts_at: startsAt,
      ends_at: endsAt,
      all_day: true,
      attendee_ids: data.responsavelId ? [data.responsavelId] : [],
    })
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('createPrazo:', error)
    return { error: 'Erro ao criar prazo.' }
  }

  revalidatePath('/radar')
  revalidatePath('/calendar')
  return { id: inserted.id }
}

// ── getTenantUsers ────────────────────────────────────────────────────────────
// Busca usuários ativos do tenant para o select de responsáveis no dialog.

export async function getTenantUsers(): Promise<{
  users: { id: string; name: string; role: string }[]
} | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'Tenant não encontrado na sessão' }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, role')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('getTenantUsers:', error)
    return { error: 'Erro ao buscar usuários.' }
  }

  return { users: data ?? [] }
}
