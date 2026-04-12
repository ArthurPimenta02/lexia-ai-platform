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
import type { Lead, LeadStage, LeadFormData } from '@/types/lead'
import type { LeadOrigin, LeadUrgency } from '@/types/database'

const ORIGINS: { value: LeadOrigin; label: string }[] = [
  { value: 'manual',   label: 'Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'web',      label: 'Site / Web' },
  { value: 'referral', label: 'Indicação' },
  { value: 'advbox',   label: 'ADVBOX' },
]

const URGENCIES: { value: LeadUrgency; label: string }[] = [
  { value: 'Baixa', label: 'Baixa' },
  { value: 'Media', label: 'Média' },
  { value: 'Alta',  label: 'Alta' },
]

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Lead
  stages: LeadStage[]
  onSubmit: (data: LeadFormData & { id?: string }) => void
  isPending?: boolean
}

function buildEmpty(stages: LeadStage[]): LeadFormData {
  const defaultStage = stages.find((s) => s.isDefault) ?? stages[0]
  return {
    name:     '',
    email:    '',
    phone:    '',
    cpf:      '',
    subject:  '',
    stageId:  defaultStage?.id ?? '',
    origin:   'manual',
    urgency:  'Baixa',
  }
}

export function LeadFormDialog({
  open,
  onOpenChange,
  initialData,
  stages,
  onSubmit,
  isPending = false,
}: LeadFormDialogProps) {
  const isEdit = initialData !== undefined

  const [form, setForm] = useState<LeadFormData>(() =>
    initialData ? dataToForm(initialData) : buildEmpty(stages)
  )
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({})

  useEffect(() => {
    if (open && initialData) {
      setForm(dataToForm(initialData))
    }
    if (!open) {
      const timer = setTimeout(() => {
        setForm(buildEmpty(stages))
        setErrors({})
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open, initialData, stages])

  function set<K extends keyof LeadFormData>(field: K, value: LeadFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof LeadFormData, string>> = {}
    if (!form.name.trim()) next.name = 'Nome é obrigatório'
    if (!form.stageId)     next.stageId = 'Selecione um estágio'
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
    'disabled:opacity-50 dark:bg-input/30 transition-colors'
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
          {/* Nome */}
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
              disabled={isPending}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email + Telefone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-email">E-mail</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="ana@empresa.com.br"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                disabled={isPending}
              />
            </div>
          </div>

          {/* CPF + Estágio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-cpf">CPF</Label>
              <Input
                id="lead-cpf"
                value={form.cpf}
                onChange={(e) => set('cpf', e.target.value)}
                placeholder="000.000.000-00"
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-stage">
                Estágio <span className="text-destructive">*</span>
              </Label>
              <select
                id="lead-stage"
                className={cn(selectClass, errors.stageId && 'border-destructive')}
                value={form.stageId}
                onChange={(e) => set('stageId', e.target.value)}
                disabled={isPending}
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.stageId && <p className="text-xs text-destructive">{errors.stageId}</p>}
            </div>
          </div>

          {/* Origem + Urgência */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lead-origin">Origem</Label>
              <select
                id="lead-origin"
                className={selectClass}
                value={form.origin}
                onChange={(e) => set('origin', e.target.value as LeadOrigin)}
                disabled={isPending}
              >
                {ORIGINS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-urgency">Urgência</Label>
              <select
                id="lead-urgency"
                className={selectClass}
                value={form.urgency}
                onChange={(e) => set('urgency', e.target.value as LeadUrgency)}
                disabled={isPending}
              >
                {URGENCIES.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observações / Demanda */}
          <div className="space-y-1.5">
            <Label htmlFor="lead-subject">Demanda / Observações</Label>
            <textarea
              id="lead-subject"
              className={textareaClass}
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="Detalhes sobre o caso, demanda ou histórico…"
              rows={3}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit ? 'Salvando…' : 'Criando…'
                : isEdit ? 'Salvar alterações' : 'Criar lead'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dataToForm(lead: Lead): LeadFormData {
  return {
    name:    lead.name,
    email:   lead.email    ?? '',
    phone:   lead.phone    ?? '',
    cpf:     lead.cpf      ?? '',
    subject: lead.subject  ?? '',
    stageId: lead.stageId,
    origin:  lead.origin,
    urgency: lead.urgency,
  }
}
