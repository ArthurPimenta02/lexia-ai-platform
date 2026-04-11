'use client'

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalendarViewType } from './CalendarView'
import type { EventType } from '@/types/calendar'

const VIEW_LABELS: Record<CalendarViewType, string> = {
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
}

const TYPE_FILTERS: Array<{ value: EventType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'audiencia', label: 'Audiências' },
  { value: 'prazo', label: 'Prazos' },
  { value: 'reuniao', label: 'Reuniões' },
  { value: 'tarefa', label: 'Tarefas' },
  { value: 'lembrete', label: 'Lembretes' },
]

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

/** Returns true when currentDate is already in the "today" period for the given view */
function isInTodayPeriod(currentDate: Date, view: CalendarViewType): boolean {
  const today = new Date()
  if (view === 'day') {
    return isSameDay(currentDate, today)
  }
  if (view === 'month') {
    return currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth()
  }
  // week: check if today falls in the same 7-day window as currentDate
  const dayOfWeek = currentDate.getDay()
  const sunday = new Date(currentDate)
  sunday.setDate(currentDate.getDate() - dayOfWeek)
  sunday.setHours(0, 0, 0, 0)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  saturday.setHours(23, 59, 59, 999)
  return today >= sunday && today <= saturday
}

function formatPeriodLabel(date: Date, view: CalendarViewType): string {
  if (view === 'month') {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  if (view === 'day') {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  // week
  const day = date.getDay()
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - day)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)

  const startLabel = sunday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  const endLabel = saturday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

interface CalendarHeaderProps {
  view: CalendarViewType
  currentDate: Date
  activeTypeFilter: EventType | 'all'
  onViewChange: (view: CalendarViewType) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onTypeFilterChange: (type: EventType | 'all') => void
  onNewEvent: () => void
}

export function CalendarHeader({
  view,
  currentDate,
  activeTypeFilter,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onTypeFilterChange,
  onNewEvent,
}: CalendarHeaderProps) {
  const periodLabel = formatPeriodLabel(currentDate, view)
  const alreadyToday = isInTodayPeriod(currentDate, view)

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
      {/* Top row: navigation + view toggle + new event */}
      <div className="flex items-center gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={onPrev} className="size-8">
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant={alreadyToday ? 'default' : 'outline'}
            size="sm"
            onClick={onToday}
            disabled={alreadyToday}
            className="h-8 px-3 text-xs"
          >
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={onNext} className="size-8">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Period label */}
        <h2 className="flex-1 text-base font-semibold capitalize text-foreground">
          {periodLabel}
        </h2>

        {/* View toggle */}
        <div className="flex rounded-md border border-border">
          {(Object.keys(VIEW_LABELS) as CalendarViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md',
                view === v
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* New event button */}
        <Button size="sm" onClick={onNewEvent} className="h-8 gap-1.5">
          <Plus className="size-3.5" />
          Novo Evento
        </Button>
      </div>

      {/* Type filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {TYPE_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeFilterChange(value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium transition-colors',
              activeTypeFilter === value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
