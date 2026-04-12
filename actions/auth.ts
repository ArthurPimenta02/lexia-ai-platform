'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// ── Login ──────────────────────────────────────────────────────────────────────

export async function signIn(formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Retorna o erro para o componente exibir — não faz redirect
    return { error: mapAuthError(error.message) }
  }

  redirect('/dashboard')
}

// ── Signup ─────────────────────────────────────────────────────────────────────
// Cria o tenant primeiro (via service role), depois o usuário Supabase Auth.
// O trigger handle_new_user() em 021_auth_hooks.sql popula a tabela `users`
// automaticamente com o tenant_id e role passados em raw_user_meta_data.
//
// NOTA sobre claims JWT:
// - `role` em raw_user_meta_data → popula users.role (coluna do banco) via trigger
// - O JWT emitido ao usuário carrega `app_role` (não `role`) via custom_jwt_claims()
// - As policies RLS leem `auth.jwt() ->> 'app_role'`
// - `role` no JWT é reservado ao Supabase/PostgREST (papel de banco)

export async function signUp(formData: FormData) {
  const name         = formData.get('name') as string
  const email        = formData.get('email') as string
  const password     = formData.get('password') as string
  const officeName   = formData.get('officeName') as string

  if (!name || !email || !password || !officeName) {
    return { error: 'Preencha todos os campos obrigatórios.' }
  }

  const service = createServiceClient()

  // 1. Cria o tenant
  const { data: tenant, error: tenantError } = await service
    .from('tenants')
    .insert({
      name:         officeName,
      display_name: officeName,
      email,
      onboarding_completed: false,
    })
    .select('id')
    .single()

  if (tenantError || !tenant) {
    console.error('signUp: falha ao criar tenant', tenantError)
    return { error: 'Erro ao criar o escritório. Tente novamente.' }
  }

  // 2. Cria o usuário no Supabase Auth com metadados para o trigger
  const supabase = await createClient()
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        tenant_id: tenant.id,
        role:      'admin',      // primeiro usuário sempre é admin
        name,
      },
    },
  })

  if (authError) {
    // Rollback: remove o tenant criado
    await service.from('tenants').delete().eq('id', tenant.id)
    return { error: mapAuthError(authError.message) }
  }

  redirect('/onboarding')
}

// ── Logout ─────────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Forgot Password ────────────────────────────────────────────────────────────

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) return { error: 'Informe o email.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { error: 'Erro ao enviar email de recuperação. Tente novamente.' }
  }

  return { success: true }
}

// ── Reset Password ─────────────────────────────────────────────────────────────

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string

  if (!password || password.length < 8) {
    return { error: 'A senha deve ter no mínimo 8 caracteres.' }
  }
  if (password !== confirm) {
    return { error: 'As senhas não coincidem.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Erro ao redefinir senha. O link pode ter expirado.' }
  }

  redirect('/dashboard')
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu email antes de fazer login.'
  }
  if (message.includes('User already registered')) {
    return 'Este email já está cadastrado.'
  }
  if (message.includes('Password should be')) {
    return 'A senha deve ter no mínimo 6 caracteres.'
  }
  return 'Ocorreu um erro. Tente novamente.'
}
