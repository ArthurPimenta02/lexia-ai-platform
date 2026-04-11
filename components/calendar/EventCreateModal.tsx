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
import { cn } from '@/lib/utils'
import type {
  CalendarEvent,
  EventType,
  EventPriority,
} from '@/types/calendar'
import {
  EVENT_TYPE_CONFIG,
  PRIORITY_CONFIG,
} from '@/types/calendar'

const RESPONSIBLE_OPTIONS = [
  'Dr. Marcos Ferreira',
  'Dra. Ana Lima',
  'Dr. João Pereira',
]

const CASO_OPTIONS = [
  { id: 'caso-001', title: 'Silva vs. Construtora Norte' },
  { id: 'caso-002', title: 'Almeida vs. Indústria Metalúrgica' },
  { id: 'caso-003', title: 'Souza vs. Banco Modal' },
  { id: 'caso-004', title: 'Monteiro vs. Prefeitura' },
  { id: 'caso-005', title: 'Pinto vs. Logística Express' },
  { id: 'caso-006', title: 'Costa — Despejo de urgência' },
  { id: 'caso-007', title: 'Empresa Verde vs. IBAMA' },
]

const LEAD_OPTIONS = [
  { id: 'lead-003', name: 'Família Rodrigues' },
  { id: 'lead-007', name: 'Carlos Ferreira' },
  { id: 'lead-012', name: 'Martins Empreendimentos' },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

interface FormState {
  title: string
  type: EventType
  priority: EventPriority
  dateStart: string
  timeStart: string
  timeEnd: string
  allDay: boolean
  casoId: string
  leadId: string
  responsible: string
  location: string
  notes: string
}

function eventToForm(event: CalendarEvent): FormState {
  const start = new Date(event.start)
  const end = new Date(event.end)
  return {
    title: event.title,
    type: event.type,
    priority: event.priority,
    dateStart: event.start.split('T')[0],
    timeStart: event.allDay ? '09:00' : start.toTimeString().slice(0, 5),
    timeEnd: event.allDay ? '10:00' : end.toTimeString().slice(0, 5),
    allDay: event.allDay ?? false,
    casoId: event.casoId ?? '',
    leadId: event.leadId ?? '',
    responsible: event.responsible,
    location: event.location ?? '',
    notes: event.notes ?? '',
  }
}

const DEFAULT_FORM: FormState = {
  title: '',
  type: 'reuniao',
  priority: 'medium',
  dateStart: todayISO(),
  timeStart: '09:00',
  timeEnd: '10:00',
  allDay: false,
  casoId: '',
  leadId: '',
  responsible: RESPONSIBLE_OPTIONS[0],
  location: '',
  notes: '',
}

interface EventCreateModalProps {
  open: boolean
  editEvent?: CalendarEvent | null
  onClose: () => void
  onSave: (event: CalendarEvent) => void
}

export function EventCreateModal({ open, editEvent, onClose, onSave }: EventCreateModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  useEffect(() => {
    if (open) {
      setForm(editEvent ? eventToForm(editEvent) : { ...DEFAULT_FORM, dateStart: todayISO() })
    }
  }, [open, editEvent])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.title.trim()) return

    const selectedCaso = CASO_OPTIONS.find((c) => c.id === form.casoId)
    const selectedLead = LEAD_OPTIONS.find((l) => l.id === form.leadId)

    const startISO = form.allDay
      ? form.dateStart
      : `${form.dateStart}T${form.timeStart}:00`
    const endISO = form.allDay
      ? form.dateStart
      : `${form.dateStart}T${form.timeEnd}:00`

    const saved: CalendarEvent = {
      id: editEvent?.id ?? `evt-${Date.now()}`,
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      status: editEvent?.status ?? 'scheduled',
      origin: editEvent?.origin ?? 'manual',
      start: startISO,
      end: endISO,
      allDay: form.allDay,
      responsible: form.responsible,
      casoId: selectedCaso?.id,
      casoTitle: selectedCaso?.title,
      leadId: selectedLead?.id,
      leadName: selectedLead?.name,
      location: form.location || undefined,
      notes: form.notes || undefined,
    }

    onSave(saved)
    onClose()
  }

  const isEditing = !!editEvent

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar evento' : 'Novo evento'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evt-title" className="text-xs">Título *</Label>
            <Input
              id="evt-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Audiência de conciliação"
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as EventType)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Prioridade</Label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as EventPriority)}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {(Object.keys(PRIORITY_CONFIG) as EventPriority[]).map((p) => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* allDay toggle */}
          <div className="flex items-center gap-2">
            <input
              id="evt-allday"
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => set('allDay', e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="evt-allday" className="cursor-pointer text-sm">
              Evento do dia inteiro
            </Label>
          </div>

          {/* Date + time */}
          <div className={cn('grid gap-3', form.allDay ? 'grid-cols-1' : 'grid-cols-3')}>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={form.dateStart}
                onChange={(e) => set('dateStart', e.target.value)}
              />
            </div>
            {!form.allDay && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="time"
                    value={form.timeStart}
                    onChange={(e) => set('timeStart', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Fim</Label>
                  <Input
                    type="time"
                    value={form.timeEnd}
                    onChange={(e) => set('timeEnd', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {/* Responsible */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Responsável</Label>
            <select
              value={form.responsible}
              onChange={(e) => set('responsible', e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {RESPONSIBLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Caso */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Caso vinculado</Label>
            <select
              value={form.casoId}
              onChange={(e) => set('casoId', e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">— nenhum —</option>
              {CASO_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Lead */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Lead vinculado</Label>
            <select
              value={form.leadId}
              onChange={(e) => set('leadId', e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">— nenhum —</option>
              {LEAD_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evt-location" className="text-xs">Local</Label>
            <Input
              id="evt-location"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Ex: Sala de reuniões 1, Online..."
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evt-notes" className="text-xs">Notas</Label>
            <textarea
              id="evt-notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Observações adicionais..."
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button size="sm" onClick={handleSave} disabled={!form.title.trim()}>
            {isEditing ? 'Salvar alterações' : 'Criar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
