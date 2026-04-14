'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

const OFFICE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateOfficeCodeCandidate(length = 8) {
  let code = ''
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * OFFICE_CODE_CHARS.length)
    code += OFFICE_CODE_CHARS[randomIndex]
  }

  return code
}

async function ensureTenantOfficeCode(service: ReturnType<typeof createServiceClient>, tenantId: string) {
  const { data: tenant, error: readError } = await service
    .from('tenants')
    .select('office_code')
    .eq('id', tenantId)
    .maybeSingle()

  if (readError) {
    console.error('ensureTenantOfficeCode: falha ao ler office_code', readError)
  }

  const currentCode = ((tenant?.office_code as string | null) ?? '').trim()
  if (currentCode) return currentCode.toUpperCase()

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOfficeCodeCandidate()
    const { error } = await service
      .from('tenants')
      .update({ office_code: candidate })
      .eq('id', tenantId)

    if (!error) {
      return candidate
    }

    console.error('ensureTenantOfficeCode: falha ao salvar office_code', error)
  }

  return null
}

// â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function signIn(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Retorna o erro para o componente exibir â€” nÃ£o faz redirect
    return { error: mapAuthError(error.message) }
  }

  const signedUser = signInData.user
  if (signedUser) {
    const tenantId = signedUser.user_metadata?.tenant_id as string | undefined
    if (tenantId) {
      const service = createServiceClient()
      const nowIso = new Date().toISOString()

      const { data: membership } = await service
        .from('users')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('id', signedUser.id)
        .maybeSingle()

      if (membership?.status === 'pending') {
        await service
          .from('users')
          .update({
            status: 'active',
            last_sign_in_at: nowIso,
          })
          .eq('tenant_id', tenantId)
          .eq('id', signedUser.id)
          .eq('status', 'pending')

        await service
          .from('user_invites')
          .update({
            status: 'accepted',
            accepted_at: nowIso,
            accepted_by: signedUser.id,
          })
          .eq('tenant_id', tenantId)
          .eq('email', signedUser.email ?? '')
          .eq('status', 'pending')
      }
    }
  }

  redirect('/dashboard')
}

// â”€â”€ Signup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cria o tenant primeiro (via service role), depois o usuÃ¡rio Supabase Auth.
// O trigger handle_new_user() em 021_auth_hooks.sql popula a tabela `users`
// automaticamente com o tenant_id e role passados em raw_user_meta_data.
//
// NOTA sobre claims JWT:
// - `role` em raw_user_meta_data â†’ popula users.role (coluna do banco) via trigger
// - O JWT emitido ao usuÃ¡rio carrega `app_role` (nÃ£o `role`) via custom_jwt_claims()
// - As policies RLS leem `auth.jwt() ->> 'app_role'`
// - `role` no JWT Ã© reservado ao Supabase/PostgREST (papel de banco)

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const officeName = formData.get('officeName') as string
  const officeCode = formData.get('officeCode') as string
  const signupMode = formData.get('signupMode') as 'create_office' | 'join_office' | null

  if (!name || !email || !password || !signupMode) {
    return { error: 'Preencha todos os campos obrigatorios.' }
  }

  if (signupMode === 'create_office' && !officeName) {
    return { error: 'Informe o nome do escritorio.' }
  }

  if (signupMode === 'join_office' && !officeCode) {
    return { error: 'Informe o codigo do escritorio.' }
  }

  const service = createServiceClient()
  let tenantId: string | null = null
  let role: 'admin' | 'viewer' = 'admin'
  let redirectPath = '/onboarding'

  if (signupMode === 'create_office') {
    const { data: tenant, error: tenantError } = await service
      .from('tenants')
      .insert({
        name: officeName,
        display_name: officeName,
        email,
        onboarding_completed: false,
      })
      .select('id')
      .single()

    if (tenantError || !tenant) {
      console.error('signUp: falha ao criar tenant', tenantError)
      return { error: 'Erro ao criar o escritorio. Tente novamente.' }
    }

    tenantId = tenant.id as string
    const ensuredOfficeCode = await ensureTenantOfficeCode(service, tenantId)
    if (!ensuredOfficeCode) {
      await service.from('tenants').delete().eq('id', tenantId)
      return { error: 'Nao foi possivel gerar o codigo do escritorio. Verifique se a migration do office_code foi aplicada no Supabase.' }
    }
    role = 'admin'
    redirectPath = '/onboarding'
  } else {
    const normalizedCode = officeCode.trim().toUpperCase()
    const { data: tenant, error: tenantError } = await service
      .from('tenants')
      .select('id')
      .eq('office_code', normalizedCode)
      .is('deleted_at', null)
      .maybeSingle()

    if (tenantError || !tenant) {
      return { error: 'Codigo de escritorio invalido.' }
    }

    tenantId = tenant.id as string
    role = 'viewer'
    redirectPath = '/dashboard'
  }

  // 2. Cria o usuÃ¡rio no Supabase Auth com metadados para o trigger
  const supabase = await createClient()
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      data: {
        tenant_id: tenantId,
        role,
        name,
      },
    },
  })

  if (authError) {
    console.error('signUp: falha no auth.signUp', authError)
    if (signupMode === 'create_office' && tenantId) {
      await service.from('tenants').delete().eq('id', tenantId)
    }
    return { error: mapAuthError(authError.message) }
  }

  redirect(redirectPath)
}

// â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// â”€â”€ Forgot Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) return { error: 'Informe o email.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: 'Erro ao enviar email de recuperaÃ§Ã£o. Tente novamente.' }
  }

  return { success: true }
}

// â”€â”€ Reset Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string

  if (!password || password.length < 8) {
    return { error: 'A senha deve ter no mÃ­nimo 8 caracteres.' }
  }
  if (password !== confirm) {
    return { error: 'As senhas nÃ£o coincidem.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Erro ao redefinir senha. O link pode ter expirado.' }
  }

  const {
    data: { user: signedUser },
  } = await supabase.auth.getUser()

  if (signedUser) {
    const tenantId = signedUser.user_metadata?.tenant_id as string | undefined
    if (tenantId) {
      const service = createServiceClient()
      const nowIso = new Date().toISOString()

      const { data: membership } = await service
        .from('users')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('id', signedUser.id)
        .maybeSingle()

      if (membership?.status === 'pending') {
        await service
          .from('users')
          .update({
            status: 'active',
            last_sign_in_at: nowIso,
          })
          .eq('tenant_id', tenantId)
          .eq('id', signedUser.id)
          .eq('status', 'pending')
      }

      await service
        .from('user_invites')
        .update({
          status: 'accepted',
          accepted_at: nowIso,
          accepted_by: signedUser.id,
        })
        .eq('tenant_id', tenantId)
        .eq('email', signedUser.email ?? '')
        .eq('status', 'pending')
    }
  }

  redirect('/dashboard')
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu email antes de fazer login.'
  }
  if (message.includes('Error sending confirmation email')) {
    return 'O Supabase nao conseguiu enviar o email de confirmacao. Revise a configuracao de email do projeto e tente novamente.'
  }
  if (message.includes('Error sending invite email')) {
    return 'O provedor de email nao conseguiu entregar a mensagem agora. Revise a configuracao de email e tente novamente.'
  }
  if (message.includes('Database error saving new user')) {
    return 'O Supabase bloqueou o cadastro ao salvar o novo usuario. Revise os hooks de auth do projeto.'
  }
  if (message.includes('User already registered')) {
    return 'Este email jÃ¡ estÃ¡ cadastrado.'
  }
  if (message.includes('Password should be')) {
    return 'A senha deve ter no mÃ­nimo 6 caracteres.'
  }
  return `Erro do Supabase Auth: ${message}`
}

