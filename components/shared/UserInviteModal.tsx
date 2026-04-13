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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLE_OPTIONS } from '@/types/user'
import type { UserRole } from '@/types/user'
import { cn } from '@/lib/utils'

interface InviteFormState {
  name: string
  email: string
  role: UserRole
}

const DEFAULT: InviteFormState = {
  name: '',
  email: '',
  role: 'lawyer',
}

interface UserInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (data: InviteFormState) => void
}

export function UserInviteModal({ open, onOpenChange, onInvite }: UserInviteModalProps) {
  const [form, setForm] = useState<InviteFormState>(DEFAULT)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(DEFAULT)
      setSubmitted(false)
    }
  }, [open])

  function set<K extends keyof InviteFormState>(key: K, value: InviteFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!form.name.trim() || !form.email.trim()) return
    onInvite(form)
    onOpenChange(false)
  }

  const err = (val: string) => submitted && !val.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="inv-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nome completo"
              aria-invalid={err(form.name)}
              className={cn(err(form.name) && 'border-red-400 focus-visible:ring-red-400')}
            />
            {err(form.name) && <p className="text-xs text-red-500">Nome é obrigatório</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="inv-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="email@escritorio.com.br"
              aria-invalid={err(form.email)}
              className={cn(err(form.email) && 'border-red-400 focus-visible:ring-red-400')}
            />
            {err(form.email) && <p className="text-xs text-red-500">Email é obrigatório</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-role">Perfil de acesso</Label>
            <select
              id="inv-role"
              value={form.role}
              onChange={(e) => set('role', e.target.value as UserRole)}
              className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            O convite será enviado por email e expira em 7 dias.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Enviar convite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
