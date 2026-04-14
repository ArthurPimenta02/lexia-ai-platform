'use server'

import { createClient } from '@/lib/supabase/server'
import { saveCurrentUserPrimaryOab } from '@/actions/lawyer-oabs'

// ── Salvar dados do escritório + OABs no onboarding ───────────────────────────
// Chamado ao final do wizard de onboarding.
// Atualiza o tenant com os dados do escritório e insere as OABs dos advogados.

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  // Sessão obrigatória
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Sessao invalida. Faca login novamente.' }
  }

  // tenant_id vem do JWT — nunca do input do usuário
  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return { error: 'Sessão inválida. Faça login novamente.' }
  }

  const displayName        = formData.get('displayName') as string
  const phone              = formData.get('phone') as string
  const cnpj               = formData.get('cnpj') as string
  const primaryPracticeArea = formData.get('primaryPracticeArea') as string
  const timezone           = (formData.get('timezone') as string) || 'America/Sao_Paulo'

  const oabNumber = (formData.get('oabNumber') as string | null)?.trim() ?? ''
  const oabState = (formData.get('oabState') as string | null)?.trim() ?? ''
  const searchNow = formData.get('searchNow') === 'true'

  // 1. Atualiza o tenant
  const { error: tenantError } = await supabase
    .from('tenants')
    .update({
      display_name:          displayName || undefined,
      phone:                 phone || undefined,
      cnpj:                  cnpj || undefined,
      primary_practice_area: primaryPracticeArea || undefined,
      timezone,
      onboarding_completed:  true,
    })
    .eq('id', tenantId)

  if (tenantError) {
    console.error('completeOnboarding: falha ao atualizar tenant', tenantError)
    return { error: 'Erro ao salvar dados do escritório. Tente novamente.' }
  }

  let oabSaved = false
  let discoveryRequested = false
  let discoveryError: string | undefined

  if (oabNumber) {
    const oabResult = await saveCurrentUserPrimaryOab({
      oabNumber,
      oabState,
      searchNow,
    })

    if ('error' in oabResult) {
      return { error: oabResult.error }
    }

    oabSaved = true
    discoveryRequested = oabResult.discoveryRequested
    discoveryError = oabResult.discoveryError
  }

  return {
    success: true,
    oabSaved,
    discoveryRequested,
    discoveryError,
  }
}

// ── Buscar dados do tenant atual (para pré-preencher o wizard) ─────────────────

export async function getTenantForOnboarding() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return null

  const { data } = await supabase
    .from('tenants')
    .select('id, name, display_name, email, phone, cnpj, timezone, primary_practice_area, onboarding_completed')
    .eq('id', tenantId)
    .single()

  return data
}
