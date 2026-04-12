'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Check, Trash2, Clock, AlertCircle } from 'lucide-react'
import type { KanbanLead, KanbanColumnConfig, LegalArea } from '@/types/kanban'
import type { LeadOrigin } from '@/types/database'

interface KanbanDetailDialogProps {
  lead: KanbanLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updated: KanbanLead) => void
  onDelete: (id: string) => void
  stages: KanbanColumnConfig[]
}

// ─── constants ──────────────────────────────────────────────────────────────

const LEGAL_AREAS: LegalArea[] = [
  'Trabalhista', 'Previdenciário', 'Cível', 'Família',
  'Empresarial', 'Criminal', 'Imobiliário', 'Tributário',
]

const ORIGINS: { value: LeadOrigin; label: string }[] = [
  { value: 'manual',   label: 'Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'web',      label: 'Site / Web' },
  { value: 'referral', label: 'Indicação' },
  { value: 'advbox',   label: 'ADVBOX' },
]

const PRIORITY_LABEL: Record<KanbanLead['priority'], string> = {
  high: 'Alta', medium: 'Média', low: 'Baixa',
}

const PRIORITY_CLASS: Record<KanbanLead['priority'], string> = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-muted-foreground',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatHonorarios(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

function isUrgent(dateStr: string | null): boolean {
  if (!dateStr) return false
  const now = new Date()
  return new Date(dateStr).getTime() - now.getTime() <= 8 * 60 * 60 * 1000
}

const selectCls =
  'w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground dark:[color-scheme:dark] outline-none focus:border-ring'

// ─── inline-editable field ────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string
  display: React.ReactNode
  editor: (onDone: () => void) => React.ReactNode
}

function EditableField({ label, display, editor }: EditableFieldProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="group relative">
      <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>

      {editing ? (
        <div className="flex items-start gap-1.5">
          <div className="flex-1">{editor(() => setEditing(false))}</div>
          <button
            onClick={() => setEditing(false)}
            className="mt-1 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Confirmar"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          className="flex cursor-pointer items-start justify-between gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/60 transition-colors"
          onClick={() => setEditing(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
        >
          <div className="min-w-0 text-sm text-foreground">{display}</div>
          <Pencil className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity" />
        </div>
      )}
    </div>
  )
}

// ─── main dialog ─────────────────────────────────────────────────────────────

export function KanbanDetailDialog({
  lead: initialLead,
  open,
  onOpenChange,
  onSave,
  onDelete,
  stages,
}: KanbanDetailDialogProps) {
  const [lead, setLead] = useState<KanbanLead | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (initialLead) {
      setLead({ ...initialLead })
      setConfirmDelete(false)
    }
  }, [initialLead])

  if (!lead) return null

  function patch<K extends keyof KanbanLead>(key: K, value: KanbanLead[K]) {
    setLead((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  function handleSave() {
    if (lead) onSave(lead)
    onOpenChange(false)
  }

  function handleClose() {
    onOpenChange(false)
  }

  const stageConfig = stages.find((c) => c.id === lead.stageId)
  const stageName = stageConfig?.label ?? '—'
  const stageColor = stageConfig?.color ?? '#9CA3AF'
  const deadlineUrgent = isUrgent(lead.nextActionDate)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto gap-0 p-0">
        {/* ── Header strip with stage color ─────────────────────────── */}
        <div
          className="h-1.5 w-full rounded-t-xl"
          style={{ backgroundColor: stageColor }}
        />

        <div className="p-6 pb-4">
          <DialogHeader className="mb-4">
            {/* Stage label */}
            <div className="mb-2 flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: stageColor }}
              />
              <span className="text-xs text-muted-foreground">{stageName}</span>
            </div>

            {/* Title — inline editable */}
            <div className="group relative -mx-1 rounded-md px-1">
              <textarea
                className="w-full resize-none bg-transparent text-lg font-semibold text-foreground outline-none focus:bg-muted/40 rounded px-1 py-0.5 transition-colors leading-snug"
                value={lead.caseTitle}
                onChange={(e) => patch('caseTitle', e.target.value)}
                rows={2}
                placeholder="Título do caso"
              />
            </div>

            {/* Client name — inline editable */}
            <input
              className="w-full bg-transparent text-sm text-muted-foreground outline-none focus:bg-muted/40 rounded px-1 py-0.5 -mx-1 transition-colors"
              value={lead.clientName}
              onChange={(e) => patch('clientName', e.target.value)}
              placeholder="Nome do cliente"
            />
          </DialogHeader>

          {/* ── Fields grid ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">

            {/* Stage */}
            <EditableField
              label="Etapa"
              display={<span>{stageName}</span>}
              editor={(done) => (
                <select
                  autoFocus
                  className={selectCls}
                  value={lead.stageId}
                  onChange={(e) => { patch('stageId', e.target.value); done() }}
                >
                  {stages.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              )}
            />

            {/* Area */}
            <EditableField
              label="Área jurídica"
              display={<span>{lead.area}</span>}
              editor={(done) => (
                <select
                  autoFocus
                  className={selectCls}
                  value={lead.area}
                  onChange={(e) => { patch('area', e.target.value as LegalArea); done() }}
                >
                  {LEGAL_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              )}
            />

            {/* Priority */}
            <EditableField
              label="Prioridade"
              display={
                <span className={PRIORITY_CLASS[lead.priority]}>
                  {PRIORITY_LABEL[lead.priority]}
                </span>
              }
              editor={(done) => (
                <select
                  autoFocus
                  className={selectCls}
                  value={lead.priority}
                  onChange={(e) => { patch('priority', e.target.value as KanbanLead['priority']); done() }}
                >
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              )}
            />

            {/* Honorários */}
            <EditableField
              label="Honorários"
              display={
                lead.honorarios !== null
                  ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatHonorarios(lead.honorarios)}</span>
                  : <span className="text-muted-foreground italic">Não definido</span>
              }
              editor={(done) => (
                <input
                  autoFocus
                  type="number"
                  className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
                  placeholder="Ex: 3500"
                  value={lead.honorarios ?? ''}
                  onChange={(e) =>
                    patch('honorarios', e.target.value === '' ? null : Number(e.target.value))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && done()}
                />
              )}
            />

            {/* Origin */}
            <EditableField
              label="Origem"
              display={<span>{lead.origin}</span>}
              editor={(done) => (
                <select
                  autoFocus
                  className={selectCls}
                  value={lead.origin}
                  onChange={(e) => { patch('origin', e.target.value as LeadOrigin); done() }}
                >
                  {ORIGINS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            />

            {/* Next action — full width */}
            <div className="col-span-2">
              <EditableField
                label="Próxima ação"
                display={<span>{lead.nextAction || <span className="italic text-muted-foreground">—</span>}</span>}
                editor={(done) => (
                  <input
                    autoFocus
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
                    value={lead.nextAction}
                    onChange={(e) => patch('nextAction', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && done()}
                  />
                )}
              />
            </div>

            {/* Next action date — full width */}
            <div className="col-span-2">
              <EditableField
                label="Data da próxima ação"
                display={
                  <span className={cn(deadlineUrgent && 'text-red-600 dark:text-red-400')}>
                    {lead.nextActionDate ? (
                      <span className="flex items-center gap-1">
                        {deadlineUrgent
                          ? <AlertCircle className="h-3 w-3 shrink-0" />
                          : <Clock className="h-3 w-3 shrink-0" />
                        }
                        {formatDateTime(lead.nextActionDate)}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">Sem prazo definido</span>
                    )}
                  </span>
                }
                editor={(done) => (
                  <input
                    autoFocus
                    type="datetime-local"
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-ring dark:[color-scheme:dark]"
                    value={lead.nextActionDate?.slice(0, 16) ?? ''}
                    onChange={(e) =>
                      patch('nextActionDate', e.target.value ? e.target.value + ':00Z' : null)
                    }
                    onKeyDown={(e) => e.key === 'Enter' && done()}
                  />
                )}
              />
            </div>

            {/* Created at — read only */}
            <div className="col-span-2">
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                Criado em
              </p>
              <p className="px-2 text-sm text-muted-foreground">{formatDate(lead.createdAt)}</p>
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
            {confirmDelete ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Excluir este card?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { onDelete(lead.id); onOpenChange(false) }}
                  >
                    Confirmar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Salvar alterações
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
