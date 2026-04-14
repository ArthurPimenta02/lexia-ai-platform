'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export interface UserPrimaryOabData {
  id: string
  oabNumber: string
  oabState: string
  discoveryDone: boolean
  discoveryAt: string | null
  discoveryCount: number
}

export interface DiscoveredProcessSummary {
  id: string
  cnjNumber: string
  tribunal: string
  status: string
  syncStatus: string
  lastSyncedAt: string | null
  updatedAt: string
  syncError: string | null
}

export interface UserProfileData {
  id: string
  tenantId: string
  tenantName: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  primaryOab?: UserPrimaryOabData | null
  discoveredProcesses: DiscoveredProcessSummary[]
}

interface ProfileContext {
  userId: string
  tenantId: string
}

async function getProfileContext(): Promise<{ error: string } | ProfileContext> {
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

  return {
    userId: user.id,
    tenantId,
  }
}

export async function getCurrentUserProfile():
Promise<UserProfileData | { error: string }> {
  const context = await getProfileContext()
  if ('error' in context) return { error: context.error }

  const supabase = await createClient()
  const [userResult, tenantResult, oabResult] = await Promise.all([
    supabase
      .from('users')
      .select('id, tenant_id, name, email, role, avatar_url')
      .eq('tenant_id', context.tenantId)
      .eq('id', context.userId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('tenants')
      .select('display_name')
      .eq('id', context.tenantId)
      .single(),
    supabase
      .from('lawyer_oabs')
      .select('id, oab_number, oab_state, discovery_done, discovery_at, discovery_count')
      .eq('tenant_id', context.tenantId)
      .eq('user_id', context.userId)
      .order('is_primary', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (userResult.error || !userResult.data || tenantResult.error || !tenantResult.data) {
    return { error: 'Nao foi possivel carregar o perfil.' }
  }

  const primaryOab = oabResult.data ? {
    id: oabResult.data.id as string,
    oabNumber: oabResult.data.oab_number as string,
    oabState: oabResult.data.oab_state as string,
    discoveryDone: Boolean(oabResult.data.discovery_done),
    discoveryAt: (oabResult.data.discovery_at as string | null) ?? null,
    discoveryCount: Number(oabResult.data.discovery_count ?? 0),
  } : null

  const discoveredProcessesResult = primaryOab
    ? await supabase
        .from('processos')
        .select('id, cnj_number, tribunal, status, sync_status, last_synced_at, updated_at, sync_error')
        .eq('tenant_id', context.tenantId)
        .eq('discovered_via_oab_id', primaryOab.id)
        .order('updated_at', { ascending: false })
        .limit(8)
    : { data: [], error: null }

  return {
    id: userResult.data.id as string,
    tenantId: userResult.data.tenant_id as string,
    tenantName: tenantResult.data.display_name as string,
    name: userResult.data.name as string,
    email: userResult.data.email as string,
    role: userResult.data.role as UserRole,
    avatarUrl: (userResult.data.avatar_url as string | null) ?? undefined,
    primaryOab,
    discoveredProcesses: ((discoveredProcessesResult.data ?? []) as Array<{
      id: string
      cnj_number: string
      tribunal: string
      status: string
      sync_status: string
      last_synced_at: string | null
      updated_at: string
      sync_error: string | null
    }>).map((processo) => ({
      id: processo.id,
      cnjNumber: processo.cnj_number,
      tribunal: processo.tribunal,
      status: processo.status,
      syncStatus: processo.sync_status,
      lastSyncedAt: processo.last_synced_at,
      updatedAt: processo.updated_at,
      syncError: processo.sync_error,
    })),
  }
}

export async function updateCurrentUserProfile(input: {
  name: string
}): Promise<{ success: true } | { error: string }> {
  const context = await getProfileContext()
  if ('error' in context) return { error: context.error }

  const name = input.name.trim()
  if (!name) {
    return { error: 'Nome e obrigatorio.' }
  }

  const service = createServiceClient()
  const { error } = await service
    .from('users')
    .update({ name })
    .eq('tenant_id', context.tenantId)
    .eq('id', context.userId)

  if (error) {
    console.error('[updateCurrentUserProfile]', error)
    return { error: 'Erro ao salvar o perfil.' }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function uploadCurrentUserAvatar(
  formData: FormData
): Promise<{ success: true; url: string } | { error: string }> {
  const context = await getProfileContext()
  if ('error' in context) return { error: context.error }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecione uma imagem valida.' }
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'O arquivo precisa ser uma imagem.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'A imagem deve ter no maximo 5MB.' }
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? 'png' : 'png'
  const path = `${context.tenantId}/${context.userId}.${extension}`
  const service = createServiceClient()

  const { error: uploadError } = await service.storage
    .from('user-avatars')
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    console.error('[uploadCurrentUserAvatar]', uploadError)
    return { error: 'Erro ao enviar a foto de perfil.' }
  }

  const { data } = service.storage.from('user-avatars').getPublicUrl(path)
  const publicUrl = data.publicUrl

  const { error: updateError } = await service
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('tenant_id', context.tenantId)
    .eq('id', context.userId)

  if (updateError) {
    console.error('[uploadCurrentUserAvatar][update]', updateError)
    return { error: 'Erro ao salvar a foto de perfil.' }
  }

  revalidatePath('/profile')
  return { success: true, url: publicUrl }
}
