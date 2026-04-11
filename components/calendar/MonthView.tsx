'use client'

import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'
import { EventPill } from './EventPill'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_VISIBLE_PILLS = 3

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick: (date: Date) => void
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getEventDate(event: CalendarEvent): Date {
  return new Date(event.start)
}

export function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const today = new Date()

  // Build the 6-week grid
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDay = new Date(firstOfMonth)
  startDay.setDate(startDay.getDate() - firstOfMonth.getDay())

  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDay)
    d.setDate(startDay.getDate() + i)
    days.push(d)
  }

  const currentMonth = currentDate.getMonth()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6 divide-x divide-y divide-border overflow-hidden">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = isSameDay(day, today)
          const dayEvents = events
            .filter((e) => isSameDay(getEventDate(e), day))
            .sort((a, b) => {
              // allDay first, then by start time
              if (a.allDay && !b.allDay) return -1
              if (!a.allDay && b.allDay) return 1
              return a.start.localeCompare(b.start)
            })

          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_PILLS)
          const overflowCount = dayEvents.length - MAX_VISIBLE_PILLS

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={cn(
                'flex min-h-[90px] cursor-pointer flex-col gap-0.5 p-1 transition-colors hover:bg-muted/40',
                !isCurrentMonth && 'bg-muted/20',
              )}
            >
              {/* Day number */}
              <div className="flex justify-end">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5">
                {visibleEvents.map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    compact
                  />
                ))}
                {overflowCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDayClick(day)
                    }}
                    className="px-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    +{overflowCount} mais
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
