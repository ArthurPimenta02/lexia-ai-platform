'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  canManageTargetUser,
  canManageUsers,
} from '@/lib/permissions'
import type {
  UserInviteRow,
  UserRole,
  UserRow,
} from '@/types/database'
import type { User, UserInvite } from '@/types/user'

interface UsersContext {
  userId: string
  tenantId: string
  role: UserRole
  actorName: string
}

const ALLOWED_ROLES: UserRole[] = ['admin', 'manager', 'lawyer', 'secretary', 'viewer']

async function getUsersContext(): Promise<{ error: string } | UsersContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Nao autenticado.' }
  }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return { error: 'tenant_id nao encontrado na sessao.' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('users')
    .select('role, name')
    .eq('tenant_id', tenantId)
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (membershipError || !membership) {
    return { error: 'Nao foi possivel validar o usuario no tenant.' }
  }

  return {
    userId: user.id,
    tenantId,
    role: membership.role as UserRole,
    actorName: membership.name,
  }
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status === 'pending' ? 'inactive' : row.status,
    avatarUrl: row.avatar_url ?? undefined,
    lastAccessAt: row.last_sign_in_at ?? undefined,
    createdAt: row.created_at,
  }
}

function mapInvite(row: UserInviteRow, invitedBy: string | null): UserInvite {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    invitedAt: row.invited_at,
    expiresAt: row.expires_at,
    invitedBy: invitedBy ?? 'Sistema',
  }
}

async function sendInviteEmail(params: {
  to: string
  name: string
  role: UserRole
  officeName: string
  inviterName: string
  inviteLink: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY nao configurada.')

  // Em producao, usar RESEND_FROM_EMAIL (sobrescreve este fallback).
  const from = process.env.RESEND_FROM_EMAIL ?? 'Lexia AI <onboarding@uselexia.app>'
  const subject = `Convite para acessar ${params.officeName} na Lexia AI`

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin-bottom:8px">Voce foi convidado para a Lexia AI</h2>
      <p>Ola ${params.name},</p>
      <p>${params.inviterName} convidou voce para acessar o workspace <strong>${params.officeName}</strong> com perfil <strong>${params.role}</strong>.</p>
      <p>
        <a href="${params.inviteLink}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
          Aceitar convite
        </a>
      </p>
      <p>Se o botao nao funcionar, copie o link abaixo:</p>
      <p style="word-break:break-all">${params.inviteLink}</p>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Falha no envio do convite por email (HTTP ${response.status}).`)
  }
}

export async function getUsersAndInvites():
Promise<{ users: User[]; invites: UserInvite[] } | { error: string }> {
  const context = await getUsersContext()
  if ('error' in context) return { error: context.error }
  if (!canManageUsers(context.role)) return { error: 'Sem permissao para visualizar usuarios.' }

  const service = createServiceClient()

  const [usersResult, invitesResult] = await Promise.all([
    service
      .from('users')
      .select('id, tenant_id, name, email, role, status, avatar_url, last_sign_in_at, deleted_at, created_at, updated_at')
      .eq('tenant_id', context.tenantId)
      .neq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    service
      .from('user_invites')
      .select('id, tenant_id, email, name, role, status, invited_by, token, invited_at, expires_at, accepted_at, accepted_by')
      .eq('tenant_id', context.tenantId)
      .order('invited_at', { ascending: false }),
  ])

  if (usersResult.error || invitesResult.error) {
    return { error: 'Erro ao carregar usuarios e convites.' }
  }

  const users = ((usersResult.data ?? []) as unknown as UserRow[]).map(mapUser)
  const invitesRows = (invitesResult.data ?? []) as unknown as UserInviteRow[]
  const inviterIds = Array.from(new Set(invitesRows.map((invite) => invite.invited_by).filter(Boolean))) as string[]

  let inviterNameMap = new Map<string, string>()
  if (inviterIds.length > 0) {
    const { data: inviterRows } = await service
      .from('users')
      .select('id, name')
      .in('id', inviterIds)
      .eq('tenant_id', context.tenantId)
      .is('deleted_at', null)

    inviterNameMap = new Map((inviterRows ?? []).map((row) => [row.id as string, row.name as string]))
  }

  const invites = invitesRows
    .filter((row) => row.status !== 'accepted')
    .map((row) => mapInvite(row, row.invited_by ? inviterNameMap.get(row.invited_by) ?? null : null))

  return { users, invites }
}

export async function inviteUser(input: {
  name: string
  email: string
  role: UserRole
}): Promise<{ success: true } | { error: string }> {
  try {
    const context = await getUsersContext()
    if ('error' in context) return { error: context.error }
    if (!canManageUsers(context.role)) return { error: 'Sem permissao para convidar usuarios.' }

    const name = input.name.trim()
    const email = input.email.trim().toLowerCase()
    const role = input.role

    if (!name || !email) return { error: 'Nome e email sao obrigatorios.' }
    if (!ALLOWED_ROLES.includes(role)) return { error: 'Role invalido.' }
    if (context.role === 'manager' && role === 'admin') {
      return { error: 'Manager nao pode convidar usuario admin.' }
    }

    const service = createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const redirectTo = `${appUrl}/accept-invite`

    const { data: tenant } = await service
      .from('tenants')
      .select('display_name, name')
      .eq('id', context.tenantId)
      .single()

    const officeName = (tenant?.display_name as string | null) ?? (tenant?.name as string | null) ?? 'seu escritorio'

    // Se houver conta pendente antiga para o mesmo email neste tenant (ex: convite excluido),
    // removemos a identidade para permitir reenvio de convite.
    const { data: staleUser } = await service
      .from('users')
      .select('id, status, deleted_at')
      .eq('tenant_id', context.tenantId)
      .eq('email', email)
      .maybeSingle()

    if (staleUser && (staleUser.status === 'pending' || staleUser.deleted_at != null)) {
      const deleteAuthResult = await service.auth.admin.deleteUser(staleUser.id as string)
      if (deleteAuthResult.error) {
        console.error('[inviteUser][cleanupAuthUser]', deleteAuthResult.error)
      }
    }

    const { data: generated, error: generatedError } = await service.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo,
        data: {
          tenant_id: context.tenantId,
          role,
          name,
        },
      },
    })

    if (generatedError) {
      console.error('[inviteUser][generateLink]', generatedError)
      const msg = generatedError.message?.toLowerCase() ?? ''
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return {
          error:
            'Este email ja possui conta cadastrada. Exclua a conta existente ou use outro email para novo convite.',
        }
      }
      return { error: 'Erro ao gerar convite no Supabase.' }
    }

    const inviteLink = generated.properties?.action_link
    if (!inviteLink) {
      return { error: 'Nao foi possivel gerar o link de convite.' }
    }

    // Convite deve manter o usuario pendente ate ele aceitar e concluir acesso.
    // O trigger de auth pode criar o registro como active; corrigimos para pending.
    const { error: markPendingError } = await service
      .from('users')
      .update({
        status: 'pending',
        role,
        name,
      })
      .eq('tenant_id', context.tenantId)
      .eq('email', email)
      .is('deleted_at', null)

    if (markPendingError) {
      console.error('[inviteUser][markPending]', markPendingError)
      return { error: 'Convite gerado, mas nao foi possivel marcar o usuario como pendente.' }
    }

    const { error: inviteError } = await service
      .from('user_invites')
      .upsert(
        {
          tenant_id: context.tenantId,
          email,
          name,
          role,
          status: 'pending',
          invited_by: context.userId,
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
          accepted_by: null,
        },
        { onConflict: 'tenant_id,email' }
      )

    if (inviteError) {
      console.error('[inviteUser][user_invites]', inviteError)
      return { error: 'Erro ao registrar convite no banco.' }
    }

    try {
      await sendInviteEmail({
        to: email,
        name,
        role,
        officeName,
        inviterName: context.actorName,
        inviteLink,
      })
    } catch (error) {
      console.error('[inviteUser][resend]', error)
      const reason = error instanceof Error ? error.message : 'erro desconhecido'
      return { error: `Convite criado, mas houve falha ao enviar email: ${reason}` }
    }

    revalidatePath('/settings/users')
    return { success: true }
  } catch (error) {
    console.error('[inviteUser][unhandled]', error)
    const reason = error instanceof Error ? error.message : 'erro desconhecido'
    return { error: `Falha inesperada ao processar convite: ${reason}` }
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: true } | { error: string }> {
  const context = await getUsersContext()
  if ('error' in context) return { error: context.error }
  if (!canManageUsers(context.role)) return { error: 'Sem permissao para editar usuarios.' }
  if (!ALLOWED_ROLES.includes(role)) return { error: 'Role invalido.' }

  const service = createServiceClient()
  const { data: target, error: targetError } = await service
    .from('users')
    .select('id, role, tenant_id')
    .eq('tenant_id', context.tenantId)
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (targetError || !target) return { error: 'Usuario nao encontrado.' }
  if (!canManageTargetUser(context.role, target.role as UserRole)) {
    return { error: 'Voce nao pode alterar este usuario.' }
  }
  if (context.role === 'manager' && role === 'admin') {
    return { error: 'Manager nao pode promover usuario para admin.' }
  }

  const { error } = await service
    .from('users')
    .update({ role })
    .eq('tenant_id', context.tenantId)
    .eq('id', userId)

  if (error) {
    console.error('[updateUserRole]', error)
    return { error: 'Erro ao atualizar role do usuario.' }
  }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function deactivateUser(
  userId: string
): Promise<{ success: true } | { error: string }> {
  const context = await getUsersContext()
  if ('error' in context) return { error: context.error }
  if (!canManageUsers(context.role)) return { error: 'Sem permissao para desativar usuarios.' }

  if (context.userId === userId) {
    return { error: 'Voce nao pode desativar seu proprio usuario.' }
  }

  const service = createServiceClient()
  const { data: target, error: targetError } = await service
    .from('users')
    .select('id, role, tenant_id')
    .eq('tenant_id', context.tenantId)
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (targetError || !target) return { error: 'Usuario nao encontrado.' }
  if (!canManageTargetUser(context.role, target.role as UserRole)) {
    return { error: 'Voce nao pode desativar este usuario.' }
  }

  const { error } = await service
    .from('users')
    .update({ status: 'inactive' })
    .eq('tenant_id', context.tenantId)
    .eq('id', userId)

  if (error) {
    console.error('[deactivateUser]', error)
    return { error: 'Erro ao desativar usuario.' }
  }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function deleteUser(
  userId: string
): Promise<{ success: true } | { error: string }> {
  const context = await getUsersContext()
  if ('error' in context) return { error: context.error }
  if (!canManageUsers(context.role)) return { error: 'Sem permissao para excluir usuarios.' }

  if (context.userId === userId) {
    return { error: 'Voce nao pode excluir seu proprio usuario.' }
  }

  const service = createServiceClient()
  const { data: target, error: targetError } = await service
    .from('users')
    .select('id, role, tenant_id, email')
    .eq('tenant_id', context.tenantId)
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (targetError || !target) return { error: 'Usuario nao encontrado.' }
  if (!canManageTargetUser(context.role, target.role as UserRole)) {
    return { error: 'Voce nao pode excluir este usuario.' }
  }

  // Remove identidade do Auth (cascade remove em public.users pelo FK on delete cascade).
  const deleteAuthResult = await service.auth.admin.deleteUser(userId)
  if (deleteAuthResult.error) {
    console.error('[deleteUser][auth.deleteUser]', deleteAuthResult.error)
    return { error: 'Erro ao excluir usuario no Auth.' }
  }

  // Limpa convites remanescentes para o mesmo email neste tenant.
  if (target.email) {
    await service
      .from('user_invites')
      .delete()
      .eq('tenant_id', context.tenantId)
      .eq('email', target.email)
  }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function deleteInvite(
  inviteId: string
): Promise<{ success: true } | { error: string }> {
  const context = await getUsersContext()
  if ('error' in context) return { error: context.error }
  if (!canManageUsers(context.role)) return { error: 'Sem permissao para excluir convites.' }

  const service = createServiceClient()

  const { data: invite, error: inviteLookupError } = await service
    .from('user_invites')
    .select('id, email, status')
    .eq('tenant_id', context.tenantId)
    .eq('id', inviteId)
    .maybeSingle()

  if (inviteLookupError || !invite) {
    return { error: 'Convite nao encontrado.' }
  }

  // Se existir usuario pendente para este convite, remove do Auth para permitir reenviar convite.
  const { data: pendingUser } = await service
    .from('users')
    .select('id, status')
    .eq('tenant_id', context.tenantId)
    .eq('email', invite.email)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingUser?.id) {
    const deleteAuthResult = await service.auth.admin.deleteUser(pendingUser.id as string)
    if (deleteAuthResult.error) {
      console.error('[deleteInvite][auth.deleteUser]', deleteAuthResult.error)
      return { error: 'Erro ao excluir usuario pendente vinculado ao convite.' }
    }
  }

  const { error } = await service
    .from('user_invites')
    .delete()
    .eq('tenant_id', context.tenantId)
    .eq('id', inviteId)

  if (error) {
    console.error('[deleteInvite]', error)
    return { error: 'Erro ao excluir convite.' }
  }

  revalidatePath('/settings/users')
  return { success: true }
}
