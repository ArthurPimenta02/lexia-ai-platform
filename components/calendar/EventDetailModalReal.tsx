'use client'

import { useRouter } from 'next/navigation'
import {
  Bell,
  Briefcase,
  Calendar,
  CheckSquare,
  Clock,
  ExternalLink,
  Gavel,
  MapPin,
  User,
  Users,
} from 'lucide-react'
import { cancelAppointment, updateAppointment } from '@/actions/appointments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventType } from '@/types/calendar'
import {
  EVENT_STATUS_CONFIG,
  EVENT_TYPE_CONFIG,
  ORIGIN_CONFIG,
  PRIORITY_CONFIG,
} from '@/types/calendar'

const TYPE_ICONS: Record<EventType, React.ComponentType<{ className?: string }>> = {
  reuniao: Users,
  audiencia: Gavel,
  prazo: Clock,
  tarefa: CheckSquare,
  lembrete: Bell,
  outro: Calendar,
}

function formatDateTime(iso: string, allDay?: boolean): string {
  const date = new Date(iso)

  if (allDay) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return date.toLocaleString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface EventDetailModalRealProps {
  event: CalendarEvent | null
  open: boolean
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onEventUpdated: (event: CalendarEvent) => void
}

export function EventDetailModalReal({
  event,
  open,
  onClose,
  onEdit,
  onEventUpdated,
}: EventDetailModalRealProps) {
  const router = useRouter()

  if (!event) return null
  const currentEvent = event

  const statusCfg = EVENT_STATUS_CONFIG[currentEvent.status]
  const priorityCfg = PRIORITY_CONFIG[currentEvent.priority]
  const typeCfg = EVENT_TYPE_CONFIG[currentEvent.type]
  const originCfg = ORIGIN_CONFIG[currentEvent.origin]
  const TypeIcon = TYPE_ICONS[currentEvent.type]

  const canComplete = currentEvent.status === 'scheduled' || currentEvent.status === 'confirmed'
  const canCancel = currentEvent.status !== 'cancelled' && currentEvent.status !== 'completed'

  async function handleMarkCompleted() {
    const result = await updateAppointment(currentEvent.id, { status: 'completed' })
    if ('appointment' in result) {
      onEventUpdated(result.appointment)
      onClose()
    }
  }

  async function handleCancelEvent() {
    const result = await cancelAppointment(currentEvent.id)
    if ('appointment' in result) {
      onEventUpdated(result.appointment)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-2 pr-6">
            <div
              className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                statusCfg.bgColor,
                statusCfg.textColor,
              )}
            >
              <TypeIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm font-semibold leading-snug">
                {currentEvent.title}
              </DialogTitle>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {typeCfg.label}
                </Badge>
                <span
                  className={cn(
                    'inline-flex h-5 items-center rounded-full px-2 text-xs font-medium',
                    statusCfg.bgColor,
                    statusCfg.textColor,
                  )}
                >
                  {statusCfg.label}
                </span>
                <span
                  className={cn(
                    'inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium',
                    priorityCfg.textColor,
                  )}
                >
                  {priorityCfg.label}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <div>
              {currentEvent.allDay ? (
                <span>{formatDateTime(currentEvent.start, true)}</span>
              ) : (
                <span>
                  {formatDateTime(currentEvent.start)} – {new Date(currentEvent.end).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {currentEvent.location ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span>{currentEvent.location}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" />
            <span>{currentEvent.responsible}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-4 shrink-0" />
            <span>Origem: {originCfg.label}</span>
          </div>

          {currentEvent.description ? (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
              {currentEvent.description}
            </div>
          ) : null}

          {currentEvent.notes ? (
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
              {currentEvent.notes}
            </div>
          ) : null}

          {currentEvent.casoId || currentEvent.leadId ? (
            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Vinculado a</p>
              {currentEvent.casoId ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    router.push(`/casos/${currentEvent.casoId}`)
                    onClose()
                  }}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir caso: {currentEvent.casoTitle}
                </Button>
              ) : null}
              {currentEvent.leadId ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    router.push(`/leads/${currentEvent.leadId}`)
                    onClose()
                  }}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir lead: {currentEvent.leadName}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          {canCancel ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleCancelEvent}
            >
              Cancelar evento
            </Button>
          ) : null}
          {canComplete ? (
            <Button variant="outline" size="sm" onClick={handleMarkCompleted}>
              Marcar como concluído
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={() => {
              onEdit(currentEvent)
              onClose()
            }}
          >
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
