'use client'

import type { CalendarEvent } from '@/types/calendar'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'

export type CalendarViewType = 'month' | 'week' | 'day'

interface CalendarViewProps {
  view: CalendarViewType
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick: (date: Date) => void
}

export function CalendarView({ view, currentDate, events, onEventClick, onDayClick }: CalendarViewProps) {
  if (view === 'week') {
    return (
      <WeekView
        currentDate={currentDate}
        events={events}
        onEventClick={onEventClick}
      />
    )
  }

  if (view === 'day') {
    return (
      <DayView
        currentDate={currentDate}
        events={events}
        onEventClick={onEventClick}
      />
    )
  }

  return (
    <MonthView
      currentDate={currentDate}
      events={events}
      onEventClick={onEventClick}
      onDayClick={onDayClick}
    />
  )
}
