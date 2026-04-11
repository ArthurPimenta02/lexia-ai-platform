'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ROLE_OPTIONS, USER_STATUS_LABELS } from '@/types/user'
import type { User, UserRole, UserStatus } from '@/types/user'

interface EditFormState {
  role: UserRole
  status: UserStatus
}

interface UserEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | undefined
  onSave: (userId: string, data: EditFormState) => void
}

export function UserEditModal({ open, onOpenChange, user, onSave }: UserEditModalProps) {
  const [form, setForm] = useState<EditFormState>({ role: 'viewer', status: 'active' })

  useEffect(() => {
    if (open && user) {
      setForm({ role: user.role, status: user.status })
    }
  }, [open, user])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    onSave(user.id, form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>

        {user && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Info do usuário */}
            <div className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Perfil de acesso</Label>
              <select
                id="edit-role"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as UserStatus }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(Object.entries(USER_STATUS_LABELS) as [UserStatus, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
