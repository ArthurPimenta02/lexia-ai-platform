'use client'

import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'
import { EVENT_STATUS_CONFIG } from '@/types/calendar'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7h–21h
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay()
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - day)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const today = new Date()
  const weekDays = getWeekDays(currentDate)

  const allDayEvents = events.filter(
    (e) => e.allDay && weekDays.some((d) => isSameDay(new Date(e.start), d))
  )

  const timedEvents = events.filter(
    (e) => !e.allDay && weekDays.some((d) => isSameDay(new Date(e.start), d))
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header row: time gutter + day headers */}
      <div className="flex border-b border-border">
        {/* Gutter */}
        <div className="w-14 shrink-0" />
        {weekDays.map((day, i) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center py-2"
            >
              <span className="text-xs text-muted-foreground">{WEEKDAYS_SHORT[day.getDay()]}</span>
              <span
                className={cn(
                  'mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-medium',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* All-day strip */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-border">
          <div className="flex w-14 shrink-0 items-center justify-end pr-2">
            <span className="text-[10px] text-muted-foreground">dia todo</span>
          </div>
          {weekDays.map((day, i) => {
            const dayAllDay = allDayEvents.filter((e) => isSameDay(new Date(e.start), day))
            return (
              <div key={i} className="flex flex-1 flex-col gap-0.5 border-l border-border p-1">
                {dayAllDay.map((event) => {
                  const cfg = EVENT_STATUS_CONFIG[event.status]
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        'truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-80',
                        cfg.bgColor,
                        cfg.textColor,
                      )}
                    >
                      {event.title}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex w-full">
          {/* Hour labels */}
          <div className="w-14 shrink-0">
            {HOURS.map((h) => (
              <div key={h} className="relative h-14">
                <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayTimed = timedEvents.filter((e) => isSameDay(new Date(e.start), day))
            const isToday = isSameDay(day, today)

            return (
              <div
                key={dayIdx}
                className={cn(
                  'relative flex-1 border-l border-border',
                  isToday && 'bg-blue-50/30',
                )}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div key={h} className="h-14 border-b border-border/50" />
                ))}

                {/* Timed events */}
                {dayTimed.map((event) => {
                  const start = new Date(event.start)
                  const end = new Date(event.end)
                  const startHour = start.getHours() + start.getMinutes() / 60
                  const endHour = end.getHours() + end.getMinutes() / 60
                  const top = Math.max(0, (startHour - 7) * 56) // 56px per hour (h-14)
                  const height = Math.max((endHour - startHour) * 56, 20)
                  const cfg = EVENT_STATUS_CONFIG[event.status]

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      style={{ top, height }}
                      className={cn(
                        'absolute inset-x-0.5 overflow-hidden rounded px-1 text-left text-xs font-medium transition-opacity hover:opacity-80',
                        cfg.bgColor,
                        cfg.textColor,
                      )}
                    >
                      <span className="line-clamp-2 leading-tight">{event.title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
