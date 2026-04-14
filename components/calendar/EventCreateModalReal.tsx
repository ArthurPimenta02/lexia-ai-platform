'use client'

import { useState, useTransition } from 'react'
import { createAppointment, updateAppointment } from '@/actions/appointments'
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
import type {
  CalendarEvent,
  CalendarFormOptions,
  EventPriority,
  EventType,
} from '@/types/calendar'
import { EVENT_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/calendar'

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
  responsibleId: string
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
    responsibleId: event.responsibleId ?? '',
    location: event.location ?? '',
    notes: event.notes ?? '',
  }
}

function getDefaultForm(options: CalendarFormOptions): FormState {
  return {
    title: '',
    type: 'reuniao',
    priority: 'medium',
    dateStart: todayISO(),
    timeStart: '09:00',
    timeEnd: '10:00',
    allDay: false,
    casoId: '',
    leadId: '',
    responsibleId: options.responsaveis[0]?.id ?? '',
    location: '',
    notes: '',
  }
}

function getInitialForm(
  editEvent: CalendarEvent | null | undefined,
  options: CalendarFormOptions
): FormState {
  return editEvent ? eventToForm(editEvent) : getDefaultForm(options)
}

interface EventCreateModalRealProps {
  open: boolean
  formOptions: CalendarFormOptions
  editEvent?: CalendarEvent | null
  onClose: () => void
  onSaved: (event: CalendarEvent) => void
}

export function EventCreateModalReal({
  open,
  formOptions,
  editEvent,
  onClose,
  onSaved,
}: EventCreateModalRealProps) {
  const [form, setForm] = useState<FormState>(() => getInitialForm(editEvent, formOptions))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.title.trim()) return

    const startISO = form.allDay
      ? new Date(`${form.dateStart}T00:00:00`).toISOString()
      : new Date(`${form.dateStart}T${form.timeStart}:00`).toISOString()
    const endISO = form.allDay
      ? new Date(`${form.dateStart}T23:59:59`).toISOString()
      : new Date(`${form.dateStart}T${form.timeEnd}:00`).toISOString()

    setError(null)
    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        priority: form.priority,
        start: startISO,
        end: endISO,
        allDay: form.allDay,
        casoId: form.casoId || undefined,
        leadId: form.leadId || undefined,
        responsibleId: form.responsibleId || undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
      }

      const result = editEvent
        ? await updateAppointment(editEvent.id, payload)
        : await createAppointment(payload)

      if ('error' in result) {
        setError(result.error)
        return
      }

      onSaved(result.appointment)
      onClose()
    })
  }

  const isEditing = !!editEvent
  const selectClass = cn(
    'h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none',
    'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
    'dark:bg-card dark:text-foreground dark:[color-scheme:dark]'
  )

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar evento' : 'Novo evento'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evt-title-real" className="text-xs">Título *</Label>
            <Input
              id="evt-title-real"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Audiência de conciliação"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as EventType)}
                className={selectClass}
              >
                {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => (
                  <option key={type} value={type}>{EVENT_TYPE_CONFIG[type].label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Prioridade</Label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as EventPriority)}
                className={selectClass}
              >
                {(Object.keys(PRIORITY_CONFIG) as EventPriority[]).map((priority) => (
                  <option key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="evt-allday-real"
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => set('allDay', e.target.checked)}
              className="size-4 accent-primary"
            />
            <Label htmlFor="evt-allday-real" className="cursor-pointer text-sm">
              Evento do dia inteiro
            </Label>
          </div>

          <div className={cn('grid gap-3', form.allDay ? 'grid-cols-1' : 'grid-cols-3')}>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={form.dateStart}
                onChange={(e) => set('dateStart', e.target.value)}
              />
            </div>
            {!form.allDay ? (
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
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Responsável</Label>
            <select
              value={form.responsibleId}
              onChange={(e) => set('responsibleId', e.target.value)}
              className={selectClass}
            >
              <option value="">— nenhum —</option>
              {formOptions.responsaveis.map((responsavel) => (
                <option key={responsavel.id} value={responsavel.id}>{responsavel.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Caso vinculado</Label>
            <select
              value={form.casoId}
              onChange={(e) => set('casoId', e.target.value)}
              className={selectClass}
            >
              <option value="">— nenhum —</option>
              {formOptions.casos.map((caso) => (
                <option key={caso.id} value={caso.id}>{caso.title}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Lead vinculado</Label>
            <select
              value={form.leadId}
              onChange={(e) => set('leadId', e.target.value)}
              className={selectClass}
            >
              <option value="">— nenhum —</option>
              {formOptions.leads.map((lead) => (
                <option key={lead.id} value={lead.id}>{lead.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evt-location-real" className="text-xs">Local</Label>
            <Input
              id="evt-location-real"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Ex: Sala de reuniões 1, Online..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evt-notes-real" className="text-xs">Notas</Label>
            <textarea
              id="evt-notes-real"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Observações adicionais..."
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
            />
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button size="sm" onClick={handleSave} disabled={!form.title.trim() || isPending}>
            {isEditing ? 'Salvar alterações' : 'Criar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
