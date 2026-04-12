// lib/permissions.ts
// Helpers de permissão baseados no JWT da sessão autenticada.
//
// O cargo do usuário é lido do claim `app_role` do JWT — injetado pela
// função custom_jwt_claims() configurada em:
//   Supabase Dashboard → Authentication → Hooks → Customize Access Token
//
// NUNCA ler de `session.user.role` (campo do Supabase Auth, não do app).
// NUNCA usar o claim `role` do JWT — reservado ao PostgREST para papéis de banco.
// SEMPRE usar `app_role` do JWT ou `users.role` da tabela para o cargo do app.

import type { UserRole } from '@/types/database'

// ── Tipo de sessão com claims customizados ────────────────────────────────────

export interface AppJwtClaims {
  tenant_id: string
  app_role:  UserRole
}

// ── Extrair claims do JWT (Server Actions / Server Components) ────────────────
// Passa o objeto `user` retornado por supabase.auth.getUser().
// Os claims customizados ficam em user.user_metadata (no cliente) ou
// diretamente no JWT decodificado disponível via session.

export function getAppClaims(
  user: { user_metadata?: Record<string, unknown> } | null
): AppJwtClaims | null {
  if (!user?.user_metadata) return null

  const tenantId = user.user_metadata.tenant_id as string | undefined
  const appRole  = user.user_metadata.app_role  as UserRole | undefined

  if (!tenantId || !appRole) return null

  return { tenant_id: tenantId, app_role: appRole }
}

// ── Verificações de permissão ─────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin:     5,
  manager:   4,
  lawyer:    3,
  secretary: 2,
  viewer:    1,
}

/** Verifica se o role tem nível igual ou maior que o exigido */
export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}

/** Pode criar/editar leads e cases */
export function canWrite(role: UserRole): boolean {
  return hasRole(role, 'secretary')
}

/** Pode gerenciar usuários e configurações */
export function canManage(role: UserRole): boolean {
  return hasRole(role, 'manager')
}

/** Acesso total ao sistema */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}
