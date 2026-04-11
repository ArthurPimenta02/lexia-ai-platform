'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Salvar dados do escritório + OABs no onboarding ───────────────────────────
// Chamado ao final do wizard de onboarding.
// Atualiza o tenant com os dados do escritório e insere as OABs dos advogados.

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  // Sessão obrigatória
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  // OABs: campo "oabs" é JSON array de { oab_number, oab_state }
  let oabs: { oab_number: string; oab_state: string }[] = []
  try {
    const raw = formData.get('oabs') as string
    if (raw) oabs = JSON.parse(raw)
  } catch {
    // campo ausente ou inválido — onboarding continua sem OABs
  }

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

  // 2. Insere OABs (upsert — duplicata por oab_number + oab_state é ignorada)
  if (oabs.length > 0) {
    const userId = user.id

    const rows = oabs
      .filter((o) => o.oab_number?.trim() && o.oab_state?.trim())
      .map((o, i) => ({
        tenant_id:  tenantId,
        user_id:    userId,
        oab_number: o.oab_number.trim(),
        oab_state:  o.oab_state.trim().toUpperCase(),
        is_primary: i === 0,      // primeira OAB informada é a principal
      }))

    if (rows.length > 0) {
      const { error: oabError } = await supabase
        .from('lawyer_oabs')
        .upsert(rows, { onConflict: 'tenant_id,oab_number,oab_state', ignoreDuplicates: true })

      if (oabError) {
        // Não bloqueia o onboarding — OABs podem ser adicionadas depois em Settings
        console.error('completeOnboarding: falha ao inserir OABs', oabError)
      }
    }
  }

  redirect('/dashboard')
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
