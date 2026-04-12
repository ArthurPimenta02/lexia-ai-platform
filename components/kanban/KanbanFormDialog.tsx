'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { KanbanLead, KanbanColumnConfig, LegalArea } from '@/types/kanban'
import type { LeadOrigin } from '@/types/database'

type FormData = Omit<KanbanLead, 'id' | 'createdAt'>

interface KanbanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStageId?: string
  stages: KanbanColumnConfig[]
  onSubmit: (data: FormData) => void
}

const LEGAL_AREAS: LegalArea[] = [
  'Trabalhista',
  'Previdenciário',
  'Cível',
  'Família',
  'Empresarial',
  'Criminal',
  'Imobiliário',
  'Tributário',
]

const ORIGINS: { value: LeadOrigin; label: string }[] = [
  { value: 'manual',   label: 'Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'web',      label: 'Site / Web' },
  { value: 'referral', label: 'Indicação' },
  { value: 'advbox',   label: 'ADVBOX' },
]

const selectClass = cn(
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground',
  'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'dark:[color-scheme:dark] transition-colors'
)

export function KanbanFormDialog({
  open,
  onOpenChange,
  initialStageId,
  stages,
  onSubmit,
}: KanbanFormDialogProps) {
  const defaultStageId = initialStageId ?? stages[0]?.id ?? ''

  const emptyForm = (): FormData => ({
    clientName:     '',
    caseTitle:      '',
    area:           'Cível',
    stageId:        defaultStageId,
    honorarios:     null,
    responsible:    '',
    origin:         'manual',
    nextAction:     '',
    nextActionDate: null,
    priority:       'medium',
  })

  const [form, setForm] = useState<FormData>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultStageId])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.clientName.trim()) e.clientName = 'Nome do cliente é obrigatório'
    if (!form.caseTitle.trim()) e.caseTitle = 'Assunto do caso é obrigatório'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Caso / Lead</DialogTitle>
          <DialogDescription>
            Adicione um novo caso ao pipeline do escritório.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 py-2">
            {/* Client name */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-clientName">Nome do cliente *</Label>
              <Input
                id="kf-clientName"
                placeholder="Ex: Mariana Alves"
                value={form.clientName}
                onChange={(e) => set('clientName', e.target.value)}
                aria-invalid={!!errors.clientName || undefined}
              />
              {errors.clientName && (
                <p className="text-xs text-destructive">{errors.clientName}</p>
              )}
            </div>

            {/* Case title */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-caseTitle">Assunto do caso *</Label>
              <Input
                id="kf-caseTitle"
                placeholder="Ex: Reclamação Trabalhista – Verbas Rescisórias"
                value={form.caseTitle}
                onChange={(e) => set('caseTitle', e.target.value)}
                aria-invalid={!!errors.caseTitle || undefined}
              />
              {errors.caseTitle && (
                <p className="text-xs text-destructive">{errors.caseTitle}</p>
              )}
            </div>

            {/* Area + Stage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kf-area">Área jurídica</Label>
                <select
                  id="kf-area"
                  className={selectClass}
                  value={form.area}
                  onChange={(e) => set('area', e.target.value as LegalArea)}
                >
                  {LEGAL_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kf-stage">Etapa</Label>
                <select
                  id="kf-stage"
                  className={selectClass}
                  value={form.stageId}
                  onChange={(e) => set('stageId', e.target.value)}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Honorários + Origin */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kf-honorarios">Honorários (R$)</Label>
                <Input
                  id="kf-honorarios"
                  type="number"
                  placeholder="Ex: 3500"
                  value={form.honorarios ?? ''}
                  onChange={(e) =>
                    set('honorarios', e.target.value === '' ? null : Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kf-origin">Origem</Label>
                <select
                  id="kf-origin"
                  className={selectClass}
                  value={form.origin}
                  onChange={(e) => set('origin', e.target.value as LeadOrigin)}
                >
                  {ORIGINS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-priority">Prioridade</Label>
              <select
                id="kf-priority"
                className={selectClass}
                value={form.priority}
                onChange={(e) =>
                  set('priority', e.target.value as 'low' | 'medium' | 'high')
                }
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            {/* Next action */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-nextAction">Próxima ação</Label>
              <Input
                id="kf-nextAction"
                placeholder="Ex: Ligar para o cliente amanhã"
                value={form.nextAction}
                onChange={(e) => set('nextAction', e.target.value)}
              />
            </div>

            {/* Next action date */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-nextActionDate">Data da próxima ação</Label>
              <Input
                id="kf-nextActionDate"
                type="datetime-local"
                value={form.nextActionDate?.slice(0, 16) ?? ''}
                onChange={(e) =>
                  set('nextActionDate', e.target.value ? e.target.value + ':00Z' : null)
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Adicionar ao pipeline</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
