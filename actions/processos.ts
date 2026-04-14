'use server'

import { createClient } from '@/lib/supabase/server'
import { canWrite } from '@/lib/permissions'
import {
  sendBatchProcessSyncRequest,
  sendOabDiscoveryRequest,
  sendProcessSyncRequest,
} from '@/lib/integrations/n8n'
import type { ProcessoRow, SyncSource, UserRole } from '@/types/database'

interface ActionContext {
  userId: string
  tenantId: string
  role: UserRole
}

export interface PrimaryLawyerOabSummary {
  id: string
  oabNumber: string
  oabState: string
  discoveryDone: boolean
  discoveryAt: string | null
  discoveryCount: number
}

async function getActionContext(): Promise<ActionContext | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: 'Nao autenticado.' }
  }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return { error: 'tenant_id nao encontrado na sessao.' }
  }

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

export async function getCurrentUserPrimaryOab():
Promise<PrimaryLawyerOabSummary | null | { error: string }> {
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lawyer_oabs')
    .select('id, oab_number, oab_state, is_primary, discovery_done, discovery_at, discovery_count')
    .eq('tenant_id', context.tenantId)
    .eq('user_id', context.userId)
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { error: 'Nao foi possivel carregar a OAB do usuario.' }
  }

  if (!data) return null

  return {
    id: data.id as string,
    oabNumber: data.oab_number as string,
    oabState: data.oab_state as string,
    discoveryDone: Boolean(data.discovery_done),
    discoveryAt: (data.discovery_at as string | null) ?? null,
    discoveryCount: Number(data.discovery_count ?? 0),
  }
}

export async function requestOabDiscovery(
  lawyerOabId: string
): Promise<{ success: true } | { error: string }> {
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  if (!canWrite(context.role)) {
    return { error: 'Voce nao tem permissao para solicitar sincronizacao juridica.' }
  }

  const supabase = await createClient()
  let query = supabase
    .from('lawyer_oabs')
    .select('id, user_id, oab_number, oab_state')
    .eq('tenant_id', context.tenantId)
    .eq('id', lawyerOabId)

  if (context.role === 'lawyer') {
    query = query.eq('user_id', context.userId)
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data) {
    return { error: 'OAB nao encontrada para o tenant autenticado.' }
  }

  const result = await sendOabDiscoveryRequest({
    tenant_id: context.tenantId,
    lawyer_oab_id: data.id as string,
    user_id: data.user_id as string,
    oab_number: data.oab_number as string,
    oab_state: data.oab_state as string,
    external_source: 'escavador',
  })

  if (!result.ok) {
    return { error: result.error ?? 'Falha ao acionar o workflow de descoberta por OAB.' }
  }

  return { success: true }
}

export async function requestProcessSync(
  processoId: string
): Promise<{ success: true } | { error: string }> {
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  if (!canWrite(context.role)) {
    return { error: 'Voce nao tem permissao para sincronizar processos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('processos')
    .select('id, cnj_number, external_id, external_source')
    .eq('tenant_id', context.tenantId)
    .eq('id', processoId)
    .maybeSingle()

  if (error || !data) {
    return { error: 'Processo nao encontrado para o tenant autenticado.' }
  }

  const result = await sendProcessSyncRequest({
    tenant_id: context.tenantId,
    processo_id: data.id as string,
    cnj_number: data.cnj_number as string,
    external_id: (data.external_id as string | null) ?? null,
    external_source: data.external_source as SyncSource,
  })

  if (!result.ok) {
    return { error: result.error ?? 'Falha ao acionar o workflow de sincronizacao do processo.' }
  }

  return { success: true }
}

export async function requestBatchProcessSync():
Promise<{ success: true; count: number } | { error: string }> {
  const context = await getActionContext()
  if ('error' in context) return { error: context.error }

  if (!canWrite(context.role)) {
    return { error: 'Voce nao tem permissao para sincronizar processos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('processos')
    .select('id, cnj_number, external_id, external_source, sync_status, last_synced_at')
    .eq('tenant_id', context.tenantId)
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(50)

  if (error) {
    return { error: 'Nao foi possivel listar processos para sincronizacao em lote.' }
  }

  const rows = (data ?? []) as unknown as ProcessoRow[]
  const eligible = rows.filter((row) => row.sync_status !== 'synced' || !row.last_synced_at)

  if (eligible.length === 0) {
    return { success: true, count: 0 }
  }

  const result = await sendBatchProcessSyncRequest({
    tenant_id: context.tenantId,
    processos: eligible.map((row) => ({
      tenant_id: context.tenantId,
      processo_id: row.id,
      cnj_number: row.cnj_number,
      external_id: row.external_id,
      external_source: row.external_source,
    })),
  })

  if (!result.ok) {
    return { error: result.error ?? 'Falha ao acionar o workflow de sincronizacao em lote.' }
  }

  return { success: true, count: eligible.length }
}
