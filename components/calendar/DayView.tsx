'use client'

import { cn } from '@/lib/utils'
import type { CalendarEvent, EventStatus } from '@/types/calendar'
import { EVENT_STATUS_CONFIG } from '@/types/calendar'

// Static map so Tailwind can detect all border-color classes at build time
const BORDER_LEFT_CLASS: Record<EventStatus, string> = {
  scheduled: 'border-l-4 border-blue-400',
  confirmed:  'border-l-4 border-green-400',
  completed:  'border-l-4 border-emerald-500',
  cancelled:  'border-l-4 border-gray-300',
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7h–21h

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const today = new Date()
  const isToday = isSameDay(currentDate, today)

  const dayAllDay = events.filter((e) => e.allDay && isSameDay(new Date(e.start), currentDate))
  const dayTimed = events.filter((e) => !e.allDay && isSameDay(new Date(e.start), currentDate))

  const dayLabel = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Day header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-full text-lg font-bold',
            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
          )}
        >
          {currentDate.getDate()}
        </span>
        <span className="capitalize text-sm text-muted-foreground">{dayLabel}</span>
      </div>

      {/* All-day events strip */}
      {dayAllDay.length > 0 && (
        <div className="flex border-b border-border">
          <div className="flex w-16 shrink-0 items-center justify-end pr-2">
            <span className="text-[10px] text-muted-foreground">dia todo</span>
          </div>
          <div className="flex flex-1 flex-col gap-1 p-2">
            {dayAllDay.map((event) => {
              const cfg = EVENT_STATUS_CONFIG[event.status]
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'rounded px-2 py-1 text-left text-sm font-medium transition-opacity hover:opacity-80',
                    cfg.bgColor,
                    cfg.textColor,
                  )}
                >
                  {event.title}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex w-full">
          {/* Hour labels */}
          <div className="w-16 shrink-0">
            {HOURS.map((h) => (
              <div key={h} className="relative h-16">
                <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Event column */}
          <div className="relative flex-1 border-l border-border">
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div key={h} className="h-16 border-b border-border/50" />
            ))}

            {/* Timed events */}
            {dayTimed.map((event) => {
              const start = new Date(event.start)
              const end = new Date(event.end)
              const startHour = start.getHours() + start.getMinutes() / 60
              const endHour = end.getHours() + end.getMinutes() / 60
              const top = Math.max(0, (startHour - 7) * 64) // 64px per hour (h-16)
              const height = Math.max((endHour - startHour) * 64, 24)
              const cfg = EVENT_STATUS_CONFIG[event.status]

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  style={{ top, height }}
                  className={cn(
                    'absolute inset-x-1 overflow-hidden rounded-md px-2 text-left transition-opacity hover:opacity-80',
                    cfg.bgColor,
                    cfg.textColor,
                    BORDER_LEFT_CLASS[event.status],
                  )}
                >
                  <p className="truncate text-sm font-semibold leading-tight">{event.title}</p>
                  <p className="text-xs opacity-80">
                    {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {event.location && (
                    <p className="truncate text-xs opacity-70">{event.location}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
