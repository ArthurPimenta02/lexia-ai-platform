'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, MoreHorizontal, UserX, Pencil, MailIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { UserInviteModal } from '@/components/shared/UserInviteModal'
import { UserEditModal } from '@/components/shared/UserEditModal'
import { INVITE_STATUS_LABELS, USER_STATUS_LABELS, ROLE_OPTIONS } from '@/types/user'
import type { User, UserRole, UserStatus, UserInvite, InviteStatus } from '@/types/user'
import { cn } from '@/lib/utils'

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function InviteStatusBadge({ status }: { status: InviteStatus }) {
  const styles: Record<InviteStatus, string> = {
    pending:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
    expired:  'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', styles[status])}>
      {INVITE_STATUS_LABELS[status]}
    </span>
  )
}

interface UsersClientProps {
  initialUsers: User[]
  initialInvites: UserInvite[]
}

export function UsersClient({ initialUsers, initialInvites }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [invites, setInvites] = useState<UserInvite[]>(initialInvites)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | undefined>()

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      if (filterRole && u.role !== filterRole) return false
      return true
    })
  }, [users, search, filterRole])

  function handleInvite(data: { name: string; email: string; role: UserRole }) {
    const newInvite: UserInvite = {
      id: `invite-${Date.now()}`,
      tenantId: 'tenant-1',
      email: data.email,
      name: data.name,
      role: data.role,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      invitedBy: 'Rodrigo Ferreira',
    }
    setInvites((prev) => [newInvite, ...prev])
  }

  function handleEdit(userId: string, data: { role: UserRole; status: UserStatus }) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: data.role, status: data.status } : u))
    )
  }

  function handleDeactivate(userId: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' } : u))
    )
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending' || i.status === 'expired')

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="pl-9 h-9"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
            className="h-9 rounded-md border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os perfis</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Button onClick={() => setInviteOpen(true)} size="sm" className="h-9 gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Convidar usuário
        </Button>
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Usuário</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Perfil</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">Último acesso</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    user.status === 'inactive' && 'opacity-50'
                  )}
                >
                  {/* Avatar + nome + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-brand/10 text-brand font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Status */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={cn(
                      'text-xs font-medium',
                      user.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground'
                    )}>
                      {USER_STATUS_LABELS[user.status]}
                    </span>
                  </td>

                  {/* Last access */}
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {user.lastAccessAt ?? '—'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ações" />
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => setEditTarget(user)}
                          className="gap-2 text-sm"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar perfil
                        </DropdownMenuItem>
                        {user.status === 'active' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Desativar ${user.name}?`)) handleDeactivate(user.id)
                              }}
                              className="gap-2 text-sm text-red-600 focus:text-red-600"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Desativar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pending / expired invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Convites</h2>
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Destinatário</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Perfil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Enviado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingInvites.map((invite) => (
                  <tr key={invite.id} className={cn('hover:bg-muted/30', invite.status === 'expired' && 'opacity-60')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <MailIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{invite.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{invite.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <RoleBadge role={invite.role} />
                    </td>
                    <td className="px-4 py-3">
                      <InviteStatusBadge status={invite.status} />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs text-muted-foreground">{invite.invitedBy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      <UserInviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />
      <UserEditModal
        open={Boolean(editTarget)}
        onOpenChange={(open) => { if (!open) setEditTarget(undefined) }}
        user={editTarget}
        onSave={handleEdit}
      />
    </div>
  )
}
