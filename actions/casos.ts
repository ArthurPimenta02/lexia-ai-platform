'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Caso,
  CasoSummary,
  CasoFormData,
  Pendencia,
  PendenciaInput,
  TimelineEvent,
  TimelineEventInput,
  ProcessoVinculado,
  Documento,
  UrgenciaNivel,
} from '@/types/caso'
import type { ClientRow, UserRow, ProcessoRow } from '@/types/database'

// ── Helpers ───────────────────────────────────────────────────────────────────

// UrgenciaNivel usa 'Média' (UI), RadarUrgencia usa 'Media' (DB) — precisamos mapear
function urgenciaToDb(u: UrgenciaNivel): string {
  return u === 'Média' ? 'Media' : u
}

function urgenciaFromDb(u: string | null): UrgenciaNivel {
  if (u === 'Media') return 'Média'
  if (u === 'Alta') return 'Alta'
  return 'Baixa'
}

// ── Filtros de listagem ───────────────────────────────────────────────────────

export interface CasoFilters {
  search?: string
  status?: string
  area?: string
  responsavelId?: string
}

// ── getCasos ──────────────────────────────────────────────────────────────────
// Lista casos do tenant com cliente e responsável. RLS garante isolamento.

export async function getCasos(filters: CasoFilters = {}): Promise<CasoSummary[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  // Supabase typed query com joins retorna tipos complexos — usamos cast explícito
  type CasoListRow = {
    id: string
    titulo: string
    numero_interno: string | null
    area: string
    status: string
    client_id: string
    responsible_id: string | null
    proxima_acao: string | null
    proxima_acao_data: string | null
    data_abertura: string
    updated_at: string
    clients: Pick<ClientRow, 'id' | 'name'> | null
    users: Pick<UserRow, 'id' | 'name'> | null
  }

  let query = supabase
    .from('casos')
    .select(`
      id, titulo, numero_interno, area, status,
      client_id, responsible_id,
      proxima_acao, proxima_acao_data,
      data_abertura, updated_at,
      clients!client_id ( id, name ),
      users:responsible_id ( id, name )
    `)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (filters.status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('status', filters.status as any)
  }
  if (filters.area) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('area', filters.area as any)
  }
  if (filters.responsavelId) {
    query = query.eq('responsible_id', filters.responsavelId)
  }
  if (filters.search) {
    query = query.ilike('titulo', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar casos: ${error.message}`)

  const rows = (data ?? []) as unknown as CasoListRow[]
  const ids = rows.map((c) => c.id)
  if (ids.length === 0) return []

  // Contadores de pendências e processos em paralelo
  const [pendenciasResult, processosResult] = await Promise.all([
    supabase
      .from('caso_pendencias')
      .select('caso_id')
      .in('caso_id', ids)
      .eq('resolvida', false),
    supabase
      .from('case_process_links')
      .select('caso_id')
      .in('caso_id', ids),
  ])

  const pendenciasMap: Record<string, number> = {}
  for (const p of (pendenciasResult.data ?? []) as { caso_id: string }[]) {
    pendenciasMap[p.caso_id] = (pendenciasMap[p.caso_id] ?? 0) + 1
  }

  const processosMap: Record<string, number> = {}
  for (const p of (processosResult.data ?? []) as { caso_id: string }[]) {
    processosMap[p.caso_id] = (processosMap[p.caso_id] ?? 0) + 1
  }

  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    numeroInterno: row.numero_interno ?? null,
    area: row.area as CasoSummary['area'],
    status: row.status as CasoSummary['status'],
    clienteId: row.client_id ?? '',
    clienteNome: row.clients?.name ?? '—',
    responsavelId: row.responsible_id ?? null,
    responsavelNome: row.users?.name ?? null,
    dataAbertura: row.data_abertura,
    updatedAt: row.updated_at,
    proximaAcao: row.proxima_acao ?? null,
    proximaAcaoData: row.proxima_acao_data ?? null,
    pendenciasAbertas: pendenciasMap[row.id] ?? 0,
    processosCount: processosMap[row.id] ?? 0,
  } satisfies CasoSummary))
}

// ── getCaso ───────────────────────────────────────────────────────────────────
// Retorna caso completo com todas as relações. Null se não encontrado.

export async function getCaso(id: string): Promise<Caso | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  type CasoDetailRow = {
    id: string
    titulo: string
    numero_interno: string | null
    area: string
    status: string
    descricao: string | null
    observacoes: string | null
    client_id: string
    responsible_id: string | null
    proxima_acao: string | null
    proxima_acao_data: string | null
    dossie_ia: Record<string, unknown> | null
    dossie_gerado_em: string | null
    data_abertura: string
    data_encerramento: string | null
    updated_at: string
    clients: Pick<ClientRow, 'id' | 'name'> | null
    users: Pick<UserRow, 'id' | 'name'> | null
  }

  const { data, error } = await supabase
    .from('casos')
    .select(`
      id, titulo, numero_interno, area, status, descricao, observacoes,
      client_id, responsible_id,
      proxima_acao, proxima_acao_data,
      dossie_ia, dossie_gerado_em,
      data_abertura, data_encerramento, updated_at,
      clients!client_id ( id, name ),
      users:responsible_id ( id, name )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar caso: ${error.message}`)
  }
  if (!data) return null

  const row = data as unknown as CasoDetailRow

  // Carrega relações em paralelo
  const [timelineResult, pendenciasResult, documentosResult, processosResult] = await Promise.all([
    supabase
      .from('caso_timeline')
      .select('id, tipo, titulo, descricao, autor_nome, urgencia, created_at')
      .eq('caso_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('caso_pendencias')
      .select('id, descricao, prazo, responsavel, urgencia, resolvida, created_at')
      .eq('caso_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('caso_documentos')
      .select('id, nome, tipo, tamanho, criado_por, created_at')
      .eq('caso_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('case_process_links')
      .select(`
        id, is_primary,
        processos ( id, cnj_number, tribunal, vara, assunto, classe, data_ultima_mov )
      `)
      .eq('caso_id', id),
  ])

  type TimelineRaw = { id: string; tipo: string; titulo: string; descricao: string | null; autor_nome: string | null; urgencia: string | null; created_at: string }
  type PendenciaRaw = { id: string; descricao: string; prazo: string | null; responsavel: string | null; urgencia: string; resolvida: boolean; created_at: string }
  type DocumentoRaw = { id: string; nome: string; tipo: string; tamanho: string | null; criado_por: string; created_at: string }
  type ProcessLinkRaw = { id: string; is_primary: boolean; processos: Pick<ProcessoRow, 'id' | 'cnj_number' | 'tribunal' | 'vara' | 'assunto' | 'classe' | 'data_ultima_mov'> | null }

  const timeline: TimelineEvent[] = ((timelineResult.data ?? []) as unknown as TimelineRaw[]).map((t) => ({
    id: t.id,
    tipo: t.tipo as TimelineEvent['tipo'],
    titulo: t.titulo,
    descricao: t.descricao ?? null,
    data: t.created_at,
    autor: t.autor_nome ?? 'Sistema',
    urgencia: t.urgencia ? urgenciaFromDb(t.urgencia) : null,
    metadata: {},
  }))

  const pendencias: Pendencia[] = ((pendenciasResult.data ?? []) as unknown as PendenciaRaw[]).map((p) => ({
    id: p.id,
    descricao: p.descricao,
    prazo: p.prazo ?? null,
    responsavel: p.responsavel ?? null,
    urgencia: urgenciaFromDb(p.urgencia),
    resolvida: p.resolvida,
    createdAt: p.created_at,
  }))

  const documentos: Documento[] = ((documentosResult.data ?? []) as unknown as DocumentoRaw[]).map((d) => ({
    id: d.id,
    nome: d.nome,
    tipo: d.tipo as Documento['tipo'],
    tamanho: d.tamanho ?? null,
    criadoEm: d.created_at,
    criadoPor: d.criado_por,
  }))

  const processos: ProcessoVinculado[] = ((processosResult.data ?? []) as unknown as ProcessLinkRaw[])
    .filter((link) => link.processos != null)
    .map((link) => {
      const proc = link.processos!
      return {
        id: proc.id,
        numero: proc.cnj_number,
        tribunal: proc.tribunal,
        vara: proc.vara ?? null,
        ultimaMovimentacao: proc.data_ultima_mov ?? null,
        resumoUltimaMovimentacao: proc.assunto ?? proc.classe ?? '—',
        isPrimary: link.is_primary,
      }
    })

  // Próximo prazo: primeira pendência com prazo futuro não resolvida
  const agora = new Date().toISOString()
  const proximoPrazo = pendencias
    .filter((p) => !p.resolvida && p.prazo != null && p.prazo > agora)
    .sort((a, b) => (a.prazo! > b.prazo! ? 1 : -1))[0] ?? null

  // Parse do dossiê IA (JSONB)
  let dossieInteligente: Caso['dossieInteligente'] = null
  if (row.dossie_ia && typeof row.dossie_ia === 'object') {
    dossieInteligente = row.dossie_ia as unknown as Caso['dossieInteligente']
  }

  return {
    id: row.id,
    titulo: row.titulo,
    numeroInterno: row.numero_interno ?? null,
    area: row.area as Caso['area'],
    status: row.status as Caso['status'],
    descricao: row.descricao ?? null,
    observacoes: row.observacoes ?? null,
    clienteId: row.client_id ?? '',
    clienteNome: row.clients?.name ?? '—',
    responsavelId: row.responsible_id ?? null,
    responsavelNome: row.users?.name ?? null,
    dataAbertura: row.data_abertura,
    dataEncerramento: row.data_encerramento ?? null,
    updatedAt: row.updated_at,
    proximaAcao: row.proxima_acao ?? null,
    proximaAcaoData: row.proxima_acao_data ?? null,
    timeline,
    processos,
    pendencias,
    documentos,
    proximoPrazo,
    dossieInteligente,
    dossieGeradoEm: row.dossie_gerado_em ?? null,
  }
}

// ── createCaso ────────────────────────────────────────────────────────────────
// Upserta cliente real pelo nome, insere caso, insere evento de criação.

export async function createCaso(
  data: CasoFormData
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id não encontrado na sessão' }

  const userName = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'Sistema'

  // 1. Upsert client pelo nome (case-insensitive)
  let clientId: string

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('name', data.clienteNome.trim())
    .maybeSingle()

  if (existingClient) {
    clientId = existingClient.id as string
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenantId,
        name: data.clienteNome.trim(),
      })
      .select('id')
      .single()

    if (clientError || !newClient) {
      console.error('createCaso client insert:', clientError)
      return { error: 'Erro ao registrar cliente. Tente novamente.' }
    }
    clientId = newClient.id as string
  }

  // 2. Inserir caso
  const { data: inserted, error: casoError } = await supabase
    .from('casos')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      responsible_id: data.responsavelId || null,
      titulo: data.titulo.trim(),
      area: data.area,
      status: data.status,
      descricao: data.descricao.trim() || null,
      proxima_acao: data.proximaAcao.trim() || null,
      proxima_acao_data: data.proximaAcaoData || null,
      data_abertura: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (casoError || !inserted) {
    console.error('createCaso insert:', casoError)
    return { error: 'Erro ao criar caso. Tente novamente.' }
  }

  const casoId = inserted.id as string

  // 3. Registrar evento de criação na timeline
  await supabase.from('caso_timeline').insert({
    tenant_id: tenantId,
    caso_id: casoId,
    tipo: 'criacao' as const,
    titulo: 'Caso aberto',
    descricao: `Caso criado por ${userName}.`,
    autor_nome: userName,
    is_automated: false,
    metadata: {},
  } as Record<string, unknown>)

  revalidatePath('/casos')
  return { id: casoId }
}

// ── updateCaso ────────────────────────────────────────────────────────────────

export async function updateCaso(
  id: string,
  data: Partial<CasoFormData>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id não encontrado na sessão' }

  const userName = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'Sistema'

  // Se mudou o nome do cliente, upsert client
  let clientId: string | undefined
  if (data.clienteNome) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('name', data.clienteNome.trim())
      .maybeSingle()

    if (existingClient) {
      clientId = existingClient.id as string
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ tenant_id: tenantId, name: data.clienteNome.trim() })
        .select('id')
        .single()
      if (clientError || !newClient) return { error: 'Erro ao registrar cliente.' }
      clientId = newClient.id as string
    }
  }

  // Verifica se status mudou (para evento na timeline)
  let oldStatus: string | null = null
  if (data.status) {
    const { data: current } = await supabase
      .from('casos')
      .select('status')
      .eq('id', id)
      .single()
    oldStatus = (current?.status as string) ?? null
  }

  const patch: Record<string, unknown> = {}
  if (data.titulo      !== undefined) patch.titulo           = data.titulo.trim()
  if (data.area        !== undefined) patch.area             = data.area
  if (data.status      !== undefined) patch.status           = data.status
  if (data.descricao   !== undefined) patch.descricao        = data.descricao.trim() || null
  if (data.proximaAcao !== undefined) patch.proxima_acao     = data.proximaAcao.trim() || null
  if (data.proximaAcaoData !== undefined) patch.proxima_acao_data = data.proximaAcaoData || null
  if (data.responsavelId   !== undefined) patch.responsible_id    = data.responsavelId || null
  if (clientId         !== undefined) patch.client_id        = clientId

  const { error } = await supabase
    .from('casos')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('updateCaso:', error)
    return { error: 'Erro ao atualizar caso. Tente novamente.' }
  }

  // Evento de atualização de status na timeline
  if (data.status && oldStatus && data.status !== oldStatus) {
    await supabase.from('caso_timeline').insert({
      tenant_id: tenantId,
      caso_id: id,
      tipo: 'atualizacao_status',
      titulo: `Status alterado para ${data.status}`,
      descricao: `Status do caso alterado de ${oldStatus} para ${data.status}.`,
      autor_nome: userName,
      is_automated: false,
      metadata: { status_anterior: oldStatus, status_novo: data.status },
    } as Record<string, unknown>)
  }

  revalidatePath('/casos')
  revalidatePath(`/casos/${id}`)
  return { success: true }
}

// ── deleteCaso ────────────────────────────────────────────────────────────────
// Soft delete: preenche deleted_at.

export async function deleteCaso(id: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('casos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('deleteCaso:', error)
    return { error: 'Erro ao excluir caso. Tente novamente.' }
  }

  revalidatePath('/casos')
  return { success: true }
}

// ── addTimelineEvent ──────────────────────────────────────────────────────────

export async function addTimelineEvent(
  casoId: string,
  event: TimelineEventInput
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id não encontrado na sessão' }

  const userName = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'Sistema'

  const { data: inserted, error } = await supabase
    .from('caso_timeline')
    .insert({
      tenant_id: tenantId,
      caso_id: casoId,
      tipo: event.tipo,
      titulo: event.titulo,
      descricao: event.descricao || null,
      urgencia: event.urgencia ? urgenciaToDb(event.urgencia) : null,
      autor_nome: userName,
      is_automated: false,
      metadata: {},
    } as Record<string, unknown>)
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('addTimelineEvent:', error)
    return { error: 'Erro ao registrar evento. Tente novamente.' }
  }

  revalidatePath(`/casos/${casoId}`)
  return { id: (inserted as { id: string }).id }
}

// ── createPendencia ───────────────────────────────────────────────────────────

export async function createPendencia(
  casoId: string,
  data: PendenciaInput
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id não encontrado na sessão' }

  const { data: inserted, error } = await supabase
    .from('caso_pendencias')
    .insert({
      tenant_id: tenantId,
      caso_id: casoId,
      descricao: data.descricao.trim(),
      prazo: data.prazo ?? null,
      responsavel: data.responsavel?.trim() || null,
      urgencia: urgenciaToDb(data.urgencia),
      resolvida: false,
    } as Record<string, unknown>)
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('createPendencia:', error)
    return { error: 'Erro ao criar pendência. Tente novamente.' }
  }

  revalidatePath(`/casos/${casoId}`)
  return { id: (inserted as { id: string }).id }
}

// ── updatePendencia ───────────────────────────────────────────────────────────

export async function updatePendencia(
  id: string,
  casoId: string,
  resolvida: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('caso_pendencias')
    .update({ resolvida })
    .eq('id', id)

  if (error) {
    console.error('updatePendencia:', error)
    return { error: 'Erro ao atualizar pendência. Tente novamente.' }
  }

  revalidatePath(`/casos/${casoId}`)
  return { success: true }
}

// ── getUsers ──────────────────────────────────────────────────────────────────
// Lista usuários ativos do tenant para o select de responsável.

export async function getUsers(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name')

  if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`)

  return ((data ?? []) as { id: string; name: string }[]).map((u) => ({ id: u.id, name: u.name }))
}
