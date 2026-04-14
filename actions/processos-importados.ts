'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canWrite } from '@/lib/permissions'
import type { UserRole } from '@/types/database'

export interface ImportedProcessItem {
  id: string
  cnjNumber: string
  tribunal: string
  vara: string | null
  status: string
  syncStatus: string
  lastSyncedAt: string | null
  hasLinkedCase: boolean
  linkedCaseId: string | null
  linkedCaseTitle: string | null
  radarCount: number
}

interface Context {
  userId: string
  tenantId: string
  role: UserRole
}

function mapCreateCasoFromImportedProcessError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('create_case_from_imported_process')) {
    return 'A funcao create_case_from_imported_process ainda nao existe no banco remoto. Aplique a migration 032_manual_case_from_imported_process.sql.'
  }

  if (normalized.includes('origin_processo_id')) {
    return 'O campo origin_processo_id ainda nao existe no banco remoto. Aplique a migration 032_manual_case_from_imported_process.sql.'
  }

  if (normalized.includes('a definir') || normalized.includes('caso_area')) {
    return "O enum caso_area ainda nao foi atualizado no banco remoto. Aplique a migration 033_imported_process_case_defaults_hardening.sql."
  }

  if (normalized.includes('client_id') && normalized.includes('null')) {
    return 'A coluna casos.client_id ainda esta exigindo valor no banco remoto. Aplique a migration 033_imported_process_case_defaults_hardening.sql.'
  }

  return `Erro ao criar caso a partir do processo importado: ${message}`
}

async function getContext(): Promise<Context | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { error: 'Nao autenticado.' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id nao encontrado na sessao.' }

  const { data: membership, error: membershipError } = await supabase
    .from('users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (membershipError || !membership) {
    return { error: 'Nao foi possivel validar o usuario atual.' }
  }

  return {
    userId: user.id,
    tenantId,
    role: membership.role as UserRole,
  }
}

export async function getImportedProcesses():
Promise<ImportedProcessItem[] | { error: string }> {
  const context = await getContext()
  if ('error' in context) return { error: context.error }

  const supabase = await createClient()
  const { data: processes, error } = await supabase
    .from('processos')
    .select('id, cnj_number, tribunal, vara, status, sync_status, last_synced_at')
    .eq('tenant_id', context.tenantId)
    .not('discovered_via_oab_id', 'is', null)
    .order('updated_at', { ascending: false })

  if (error) {
    return { error: 'Nao foi possivel carregar os processos importados.' }
  }

  const rows = (processes ?? []) as Array<{
    id: string
    cnj_number: string
    tribunal: string
    vara: string | null
    status: string
    sync_status: string
    last_synced_at: string | null
  }>

  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)
  const [linksResult, radarResult] = await Promise.all([
    supabase
      .from('case_process_links')
      .select(`
        processo_id,
        casos (
          id,
          titulo
        )
      `)
      .eq('tenant_id', context.tenantId)
      .in('processo_id', ids),
    supabase
      .from('radar_items')
      .select('processo_id')
      .eq('tenant_id', context.tenantId)
      .in('processo_id', ids),
  ])

  const linkedMap = new Map<string, { casoId: string | null; casoTitulo: string | null }>()
  for (const rawLink of ((linksResult.data ?? []) as unknown as Array<{
    processo_id: string
    casos: { id: string; titulo: string } | null
  }>)) {
    linkedMap.set(rawLink.processo_id, {
      casoId: rawLink.casos?.id ?? null,
      casoTitulo: rawLink.casos?.titulo ?? null,
    })
  }

  const radarCountMap = new Map<string, number>()
  for (const item of ((radarResult.data ?? []) as Array<{ processo_id: string | null }>)) {
    if (!item.processo_id) continue
    radarCountMap.set(item.processo_id, (radarCountMap.get(item.processo_id) ?? 0) + 1)
  }

  return rows.map((row) => {
    const linked = linkedMap.get(row.id)
    return {
      id: row.id,
      cnjNumber: row.cnj_number,
      tribunal: row.tribunal,
      vara: row.vara,
      status: row.status,
      syncStatus: row.sync_status,
      lastSyncedAt: row.last_synced_at,
      hasLinkedCase: Boolean(linked?.casoId),
      linkedCaseId: linked?.casoId ?? null,
      linkedCaseTitle: linked?.casoTitulo ?? null,
      radarCount: radarCountMap.get(row.id) ?? 0,
    }
  })
}

export async function createCasoFromImportedProcess(
  processoId: string
): Promise<{ success: true; casoId: string } | { error: string }> {
  const context = await getContext()
  if ('error' in context) return { error: context.error }

  if (!canWrite(context.role)) {
    return { error: 'Voce nao tem permissao para criar casos a partir de processos importados.' }
  }

  const supabase = await createClient()
  const { data: process, error: processError } = await supabase
    .from('processos')
    .select('id')
    .eq('tenant_id', context.tenantId)
    .eq('id', processoId)
    .maybeSingle()

  if (processError || !process) {
    return { error: 'Processo nao encontrado para o tenant autenticado.' }
  }

  const { data: existingLink } = await supabase
    .from('case_process_links')
    .select('caso_id')
    .eq('tenant_id', context.tenantId)
    .eq('processo_id', processoId)
    .limit(1)
    .maybeSingle()

  if (existingLink?.caso_id) {
    return { error: 'Este processo ja esta vinculado a um caso.' }
  }

  const service = createServiceClient()
  const serviceWithRpc = service as typeof service & {
    rpc: (
      fn: string,
      params: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  }

  const { data, error } = await serviceWithRpc.rpc('create_case_from_imported_process', {
    p_tenant_id: context.tenantId,
    p_actor_id: context.userId,
    p_processo_id: processoId,
  })

  if (error) {
    console.error('[createCasoFromImportedProcess]', error)
    return { error: mapCreateCasoFromImportedProcessError(error.message) }
  }

  const row = Array.isArray(data)
    ? (data[0] as { caso_id: string | null; created: boolean; message: string } | undefined)
    : undefined

  if (!row) {
    return { error: 'Resposta inesperada ao criar caso a partir do processo.' }
  }

  if (!row.created || !row.caso_id) {
    return { error: row.message || 'Este processo ja esta vinculado a um caso.' }
  }

  revalidatePath('/casos')
  revalidatePath('/processos')
  revalidatePath(`/casos/${row.caso_id}`)
  revalidatePath('/profile')

  return { success: true, casoId: row.caso_id }
}
