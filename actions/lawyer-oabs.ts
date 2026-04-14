'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requestOabDiscovery } from '@/actions/processos'
import type { UserRole } from '@/types/database'

const BR_STATES = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

const SELF_OAB_ALLOWED_ROLES = new Set<UserRole>(['admin', 'manager', 'lawyer'])

interface OabContext {
  userId: string
  tenantId: string
  role: UserRole
}

export interface SavePrimaryOabInput {
  oabNumber: string
  oabState: string
  searchNow?: boolean
}

export interface SavePrimaryOabResult {
  success: true
  oabId: string
  discoveryRequested: boolean
  discoveryError?: string
}

export async function removeCurrentUserOab(
  oabId: string
): Promise<{ success: true } | { error: string }> {
  const context = await getOabContext()
  if ('error' in context) return { error: context.error }

  if (!SELF_OAB_ALLOWED_ROLES.has(context.role)) {
    return { error: 'Seu perfil nao pode remover OAB neste fluxo.' }
  }

  if (!oabId) {
    return { error: 'OAB invalida.' }
  }

  const service = createServiceClient()
  const { data: currentRow, error: readError } = await service
    .from('lawyer_oabs')
    .select('id, is_primary')
    .eq('tenant_id', context.tenantId)
    .eq('user_id', context.userId)
    .eq('id', oabId)
    .maybeSingle()

  if (readError || !currentRow) {
    return { error: 'OAB nao encontrada para o usuario atual.' }
  }

  const { error: deleteError } = await service
    .from('lawyer_oabs')
    .delete()
    .eq('tenant_id', context.tenantId)
    .eq('user_id', context.userId)
    .eq('id', oabId)

  if (deleteError) {
    console.error('[removeCurrentUserOab][delete]', deleteError)
    return { error: 'Nao foi possivel remover a OAB.' }
  }

  if (currentRow.is_primary) {
    const { data: nextRow } = await service
      .from('lawyer_oabs')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('user_id', context.userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (nextRow?.id) {
      const { error: promoteError } = await service
        .from('lawyer_oabs')
        .update({ is_primary: true })
        .eq('tenant_id', context.tenantId)
        .eq('user_id', context.userId)
        .eq('id', nextRow.id)

      if (promoteError) {
        console.error('[removeCurrentUserOab][promoteNext]', promoteError)
        return { error: 'A OAB foi removida, mas nao foi possivel reorganizar a OAB principal restante.' }
      }
    }
  }

  revalidatePath('/profile')
  revalidatePath('/onboarding')
  revalidatePath('/dashboard')

  return { success: true }
}

async function getOabContext(): Promise<OabContext | { error: string }> {
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

function validateOabInput(input: SavePrimaryOabInput): { normalizedNumber: string; normalizedState: string } | { error: string } {
  const normalizedNumber = input.oabNumber.trim().replace(/\D/g, '')
  const normalizedState = input.oabState.trim().toUpperCase()

  if (!/^\d{3,7}$/.test(normalizedNumber)) {
    return { error: 'Numero de OAB invalido. Use apenas digitos, com 3 a 7 caracteres.' }
  }

  if (!BR_STATES.has(normalizedState)) {
    return { error: 'UF da OAB invalida.' }
  }

  return { normalizedNumber, normalizedState }
}

export async function saveCurrentUserPrimaryOab(
  input: SavePrimaryOabInput
): Promise<SavePrimaryOabResult | { error: string }> {
  const context = await getOabContext()
  if ('error' in context) return { error: context.error }

  if (!SELF_OAB_ALLOWED_ROLES.has(context.role)) {
    return { error: 'Seu perfil nao pode cadastrar ou editar OAB neste fluxo.' }
  }

  const validated = validateOabInput(input)
  if ('error' in validated) return { error: validated.error }

  const service = createServiceClient()
  const { data: existingRows, error: existingError } = await service
    .from('lawyer_oabs')
    .select('id, oab_number, oab_state, is_primary')
    .eq('tenant_id', context.tenantId)
    .eq('user_id', context.userId)
    .order('is_primary', { ascending: false })

  if (existingError) {
    console.error('[saveCurrentUserPrimaryOab][select]', existingError)
    return { error: 'Nao foi possivel carregar as OABs atuais do usuario.' }
  }

  const rows = (existingRows ?? []) as Array<{
    id: string
    oab_number: string
    oab_state: string
    is_primary: boolean
  }>

  const exactMatch = rows.find((row) =>
    row.oab_number === validated.normalizedNumber
    && row.oab_state === validated.normalizedState
  )

  const currentPrimary = rows.find((row) => row.is_primary) ?? null
  let primaryOabId = exactMatch?.id ?? currentPrimary?.id ?? null

  if (exactMatch) {
    const { error: updateError } = await service
      .from('lawyer_oabs')
      .update({
        is_primary: true,
        oab_number: validated.normalizedNumber,
        oab_state: validated.normalizedState,
      })
      .eq('tenant_id', context.tenantId)
      .eq('user_id', context.userId)
      .eq('id', exactMatch.id)

    if (updateError) {
      console.error('[saveCurrentUserPrimaryOab][exactMatch]', updateError)
      return { error: 'Nao foi possivel atualizar a OAB principal.' }
    }
  } else if (currentPrimary) {
    const { error: updateError } = await service
      .from('lawyer_oabs')
      .update({
        oab_number: validated.normalizedNumber,
        oab_state: validated.normalizedState,
        is_primary: true,
      })
      .eq('tenant_id', context.tenantId)
      .eq('user_id', context.userId)
      .eq('id', currentPrimary.id)

    if (updateError) {
      console.error('[saveCurrentUserPrimaryOab][primaryUpdate]', updateError)
      return { error: 'Nao foi possivel salvar a OAB principal.' }
    }
  } else {
    const { data: inserted, error: insertError } = await service
      .from('lawyer_oabs')
      .insert({
        tenant_id: context.tenantId,
        user_id: context.userId,
        oab_number: validated.normalizedNumber,
        oab_state: validated.normalizedState,
        is_primary: true,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      console.error('[saveCurrentUserPrimaryOab][insert]', insertError)
      return { error: 'Nao foi possivel salvar a OAB principal.' }
    }

    primaryOabId = inserted.id as string
  }

  if (!primaryOabId) {
    return { error: 'Nao foi possivel resolver a OAB principal do usuario.' }
  }

  const { error: demoteError } = await service
    .from('lawyer_oabs')
    .update({ is_primary: false })
    .eq('tenant_id', context.tenantId)
    .eq('user_id', context.userId)
    .neq('id', primaryOabId)

  if (demoteError) {
    console.error('[saveCurrentUserPrimaryOab][demoteOthers]', demoteError)
    return { error: 'A OAB foi salva, mas nao foi possivel consolidar a OAB principal.' }
  }

  let discoveryRequested = false
  let discoveryError: string | undefined

  if (input.searchNow) {
    const discoveryResult = await requestOabDiscovery(primaryOabId)
    if ('error' in discoveryResult) {
      discoveryError = discoveryResult.error
    } else {
      discoveryRequested = true
    }
  }

  revalidatePath('/profile')
  revalidatePath('/onboarding')
  revalidatePath('/dashboard')

  return {
    success: true,
    oabId: primaryOabId,
    discoveryRequested,
    discoveryError,
  }
}
