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
import type { KanbanLead, KanbanStage, LegalArea, CaseOrigin } from '@/types/kanban'

type FormData = Omit<KanbanLead, 'id' | 'createdAt'>

interface KanbanFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStage?: KanbanStage
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

const STAGES: { value: KanbanStage; label: string }[] = [
  { value: 'novo_lead', label: 'Novo Lead' },
  { value: 'triagem', label: 'Triagem Inicial' },
  { value: 'consulta', label: 'Consulta Agendada' },
  { value: 'proposta', label: 'Proposta / Contrato' },
  { value: 'cliente_ativo', label: 'Cliente Ativo' },
  { value: 'encerrado', label: 'Encerrado' },
]

const ORIGINS: CaseOrigin[] = [
  'WhatsApp',
  'Instagram',
  'Formulário',
  'Ligação',
  'Indicação',
  'LinkedIn',
]

const RESPONSAVEIS = [
  'Dr. Lucas Oliveira',
  'Dra. Fernanda Lima',
  'Dra. Renata Souza',
  'Dr. Felipe Andrade',
]

const empty: FormData = {
  clientName: '',
  caseTitle: '',
  area: 'Cível',
  stage: 'novo_lead',
  honorarios: null,
  responsible: RESPONSAVEIS[0],
  origin: 'WhatsApp',
  nextAction: '',
  nextActionDate: null,
  priority: 'medium',
}

// color-scheme: dark tells the browser to render the native <option> popup with dark background
const selectClass = cn(
  'h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground',
  'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'dark:[color-scheme:dark] transition-colors'
)

export function KanbanFormDialog({
  open,
  onOpenChange,
  initialStage,
  onSubmit,
}: KanbanFormDialogProps) {
  const [form, setForm] = useState<FormData>({ ...empty })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    if (open) {
      setForm({ ...empty, stage: initialStage ?? 'novo_lead' })
      setErrors({})
    }
  }, [open, initialStage])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.clientName.trim()) e.clientName = 'Nome do cliente é obrigatório'
    if (!form.caseTitle.trim()) e.caseTitle = 'Assunto do caso é obrigatório'
    if (!form.nextAction.trim()) e.nextAction = 'Próxima ação é obrigatória'
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
                  value={form.stage}
                  onChange={(e) => set('stage', e.target.value as KanbanStage)}
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
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
                    set(
                      'honorarios',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kf-origin">Origem</Label>
                <select
                  id="kf-origin"
                  className={selectClass}
                  value={form.origin}
                  onChange={(e) => set('origin', e.target.value as CaseOrigin)}
                >
                  {ORIGINS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Responsible + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kf-responsible">Responsável</Label>
                <select
                  id="kf-responsible"
                  className={selectClass}
                  value={form.responsible}
                  onChange={(e) => set('responsible', e.target.value)}
                >
                  {RESPONSAVEIS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

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
            </div>

            {/* Next action */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-nextAction">Próxima ação *</Label>
              <Input
                id="kf-nextAction"
                placeholder="Ex: Ligar para o cliente amanhã"
                value={form.nextAction}
                onChange={(e) => set('nextAction', e.target.value)}
                aria-invalid={!!errors.nextAction || undefined}
              />
              {errors.nextAction && (
                <p className="text-xs text-destructive">{errors.nextAction}</p>
              )}
            </div>

            {/* Next action date */}
            <div className="space-y-1.5">
              <Label htmlFor="kf-nextActionDate">Data da próxima ação</Label>
              <Input
                id="kf-nextActionDate"
                type="datetime-local"
                value={form.nextActionDate?.slice(0, 16) ?? ''}
                onChange={(e) =>
                  set(
                    'nextActionDate',
                    e.target.value ? e.target.value + ':00Z' : null
                  )
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
