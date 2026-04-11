'use client'

import { Bell, Calendar, CheckSquare, Clock, Gavel, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventType } from '@/types/calendar'
import { EVENT_STATUS_CONFIG } from '@/types/calendar'

const TYPE_ICONS: Record<EventType, React.ComponentType<{ className?: string }>> = {
  reuniao: Users,
  audiencia: Gavel,
  prazo: Clock,
  tarefa: CheckSquare,
  lembrete: Bell,
  outro: Calendar,
}

interface EventPillProps {
  event: CalendarEvent
  onClick: (event: CalendarEvent) => void
  compact?: boolean
}

export function EventPill({ event, onClick, compact = false }: EventPillProps) {
  const statusConfig = EVENT_STATUS_CONFIG[event.status]
  const Icon = TYPE_ICONS[event.type]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(event)
      }}
      title={event.title}
      className={cn(
        'group relative flex w-full items-center gap-1 rounded px-1.5 text-left text-xs font-medium transition-opacity hover:opacity-80',
        statusConfig.bgColor,
        statusConfig.textColor,
        compact ? 'py-0.5' : 'py-1',
        event.status === 'cancelled' && 'line-through opacity-60',
      )}
    >
      {/* Borda esquerda colorida para allDay */}
      {event.allDay && (
        <span
          className={cn('absolute inset-y-0 left-0 w-1 rounded-l', statusConfig.borderColor, 'border-l-2 border-solid')}
        />
      )}

      <Icon className={cn('shrink-0', compact ? 'size-2.5' : 'size-3')} />

      <span className="truncate">{event.title}</span>

      {/* Indicador de prioridade alta */}
      {event.priority === 'high' && event.status !== 'completed' && event.status !== 'cancelled' && (
        <span className="ml-auto size-1.5 shrink-0 rounded-full bg-red-500" />
      )}
    </button>
  )
}
