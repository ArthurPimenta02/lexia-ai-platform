'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types/lead'

const LEAD_STATUSES: LeadStatus[] = [
  'Novo',
  'Qualificado',
  'Proposta',
  'Contrato',
  'Cliente',
  'Perdido',
]

type FormData = Omit<Lead, 'id' | 'createdAt'>

const emptyForm: FormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  cpf: '',
  status: 'Novo',
  responsible: '',
  notes: '',
}

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Lead
  onSubmit: (data: FormData & { id?: string }) => void
}

export function LeadFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: LeadFormDialogProps) {
  const isEdit = initialData !== undefined
  const [form, setForm] = useState<FormData>(
    initialData ? { name: initialData.name, company: initialData.company, email: initialData.email, phone: initialData.phone, cpf: initialData.cpf, status: initialData.status, responsible: initialData.responsible, notes: initialData.notes } : emptyForm
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync form when initialData changes (edit target switches)
  useEffect(() => {
    if (open && initialData) {
      setForm({
        name: initialData.name,
        company: initialData.company,
        email: initialData.email,
        phone: initialData.phone,
        cpf: initialData.cpf,
        status: initialData.status,
        responsible: initialData.responsible,
        notes: initialData.notes,
      })
    }
    if (!open) {
      // Reset after close animation
      const timer = setTimeout(() => {
        setForm(emptyForm)
        setErrors({})
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open, initialData])

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Nome é obrigatório'
    if (!form.company.trim()) next.company = 'Empresa é obrigatória'
    if (!form.email.trim()) next.email = 'E-mail é obrigatório'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(isEdit ? { ...form, id: initialData!.id } : form)
  }

  const selectClass = cn(
    'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground',
    'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'disabled:opacity-50 dark:bg-input/30',
    'transition-colors'
  )

  const textareaClass = cn(
    'w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground',
    'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'placeholder:text-muted-foreground resize-none dark:bg-input/30',
    'transition-colors min-h-[80px]'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-1">
          {/* Name + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ana Paula Rodrigues"
                aria-invalid={!!errors.name || undefined}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-company">
                Empresa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-company"
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="Rodrigues & Filhos Ltda"
                aria-invalid={!!errors.company || undefined}
              />
              {errors.company && (
                <p className="text-xs text-destructive">{errors.company}</p>
              )}
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="ana@empresa.com.br"
                aria-invalid={!!errors.email || undefined}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* CPF + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-cpf">CPF</Label>
              <Input
                id="lead-cpf"
                value={form.cpf}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-status">Status</Label>
              <select
                id="lead-status"
                className={selectClass}
                value={form.status}
                onChange={(e) => set('status', e.target.value as LeadStatus)}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Responsible */}
          <div className="space-y-1.5">
            <Label htmlFor="lead-responsible">Responsável</Label>
            <Input
              id="lead-responsible"
              value={form.responsible}
              onChange={(e) => set('responsible', e.target.value)}
              placeholder="Dr. Carlos Mendes"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">Observações</Label>
            <textarea
              id="lead-notes"
              className={textareaClass}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Detalhes sobre o caso, demanda ou histórico…"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEdit ? 'Salvar alterações' : 'Criar lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
