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

interface EventDetailModalProps {
  event: CalendarEvent | null
  open: boolean
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onMarkCompleted: (event: CalendarEvent) => void
  onCancel: (event: CalendarEvent) => void
}

export function EventDetailModal({
  event,
  open,
  onClose,
  onEdit,
  onMarkCompleted,
  onCancel,
}: EventDetailModalProps) {
  const router = useRouter()

  if (!event) return null

  const statusCfg = EVENT_STATUS_CONFIG[event.status]
  const priorityCfg = PRIORITY_CONFIG[event.priority]
  const typeCfg = EVENT_TYPE_CONFIG[event.type]
  const originCfg = ORIGIN_CONFIG[event.origin]
  const TypeIcon = TYPE_ICONS[event.type]

  const canComplete = event.status === 'scheduled' || event.status === 'confirmed'
  const canCancel = event.status !== 'cancelled' && event.status !== 'completed'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
                {event.title}
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
          {/* Date / time */}
          <div className="flex items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <div>
              {event.allDay ? (
                <span>{formatDateTime(event.start, true)}</span>
              ) : (
                <span>
                  {formatDateTime(event.start)} – {new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Responsible */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" />
            <span>{event.responsible}</span>
          </div>

          {/* Origin */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="size-4 shrink-0" />
            <span>Origem: {originCfg.label}</span>
          </div>

          {/* Description */}
          {event.description && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
              {event.description}
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Notas</p>
              {event.notes}
            </div>
          )}

          {/* Links to related modules */}
          {(event.casoId || event.leadId) && (
            <div className="flex flex-col gap-1.5 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">Vinculado a</p>
              {event.casoId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    router.push(`/casos/${event.casoId}`)
                    onClose()
                  }}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir caso: {event.casoTitle}
                </Button>
              )}
              {event.leadId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-xs"
                  onClick={() => {
                    router.push('/leads')
                    onClose()
                  }}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir lead: {event.leadName}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onCancel(event)
                onClose()
              }}
            >
              Cancelar evento
            </Button>
          )}
          {canComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onMarkCompleted(event)
                onClose()
              }}
            >
              Marcar como concluído
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              onEdit(event)
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
