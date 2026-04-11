// ─── Roles ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'lawyer' | 'secretary' | 'viewer'

// ─── Status ───────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'inactive'

export type InviteStatus = 'pending' | 'accepted' | 'expired'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  tenantId: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  avatarUrl?: string
  lastAccessAt?: string   // ISO 8601 or relative string for mock
  permissions?: string[]  // reserved — not used visually in MVP
  createdAt: string       // ISO 8601
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export interface UserInvite {
  id: string
  tenantId: string
  email: string
  name: string
  role: UserRole
  status: InviteStatus
  invitedAt: string   // ISO 8601
  expiresAt: string   // ISO 8601
  invitedBy: string   // name of the user who sent the invite
}

// ─── Constantes visuais ───────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:     'Administrador',
  manager:   'Gestor',
  lawyer:    'Advogado',
  secretary: 'Secretária',
  viewer:    'Visualizador',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin:     '#2563EB', // blue
  manager:   '#8B5CF6', // purple
  lawyer:    '#10B981', // green
  secretary: '#F59E0B', // amber
  viewer:    '#6B7280', // gray
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active:   'Ativo',
  inactive: 'Inativo',
}

export const INVITE_STATUS_LABELS: Record<InviteStatus, string> = {
  pending:  'Convite pendente',
  accepted: 'Aceito',
  expired:  'Convite expirado',
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin',     label: 'Administrador' },
  { value: 'manager',   label: 'Gestor' },
  { value: 'lawyer',    label: 'Advogado' },
  { value: 'secretary', label: 'Secretária' },
  { value: 'viewer',    label: 'Visualizador' },
]
