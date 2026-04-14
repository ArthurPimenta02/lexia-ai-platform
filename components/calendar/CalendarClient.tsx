'use client'

import { useMemo, useState, useTransition } from 'react'
import { RefreshCw, Unplug, Wifi } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { syncAppointmentsWithGoogle } from '@/actions/appointments'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalendarEvent, CalendarFormOptions, EventType } from '@/types/calendar'
import type { GoogleCalendarIntegrationStatus } from '@/lib/google-calendar/server'
import type { CalendarViewType } from './CalendarView'
import { CalendarHeader } from './CalendarHeader'
import { CalendarView } from './CalendarView'
import { EventDetailModalReal } from './EventDetailModalReal'
import { EventCreateModalReal } from './EventCreateModalReal'

interface CalendarClientProps {
  events: CalendarEvent[]
  formOptions: CalendarFormOptions
  googleIntegration: GoogleCalendarIntegrationStatus
}

export function CalendarClient({
  events: initialEvents,
  formOptions,
  googleIntegration,
}: CalendarClientProps) {
  const router = useRouter()
  const [isSyncingGoogle, startSyncTransition] = useTransition()
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [view, setView] = useState<CalendarViewType>('month')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)

  const google: {
    isConnected: boolean
    lastSyncedAt: string
    syncStatus: 'idle' | 'syncing'
    disconnect: () => void
  } = {
    isConnected: googleIntegration.connected,
    lastSyncedAt: googleIntegration.lastSyncAt ?? '',
    syncStatus: isSyncingGoogle ? 'syncing' : 'idle',
    disconnect: () => router.push('/settings/integrations'),
  }

  function navigate(direction: 'prev' | 'next') {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (view === 'month') {
        d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1))
      } else if (view === 'week') {
        d.setDate(d.getDate() + (direction === 'next' ? 7 : -7))
      } else {
        d.setDate(d.getDate() + (direction === 'next' ? 1 : -1))
      }
      return d
    })
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  function handleDayClick(date: Date) {
    setCurrentDate(date)
    setView('day')
  }

  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  function handleEdit(event: CalendarEvent) {
    setEditEvent(event)
    setCreateOpen(true)
  }

  function handleEventSaved(savedEvent: CalendarEvent) {
    setEvents((prev) =>
      prev.some((event) => event.id === savedEvent.id)
        ? prev.map((event) => (event.id === savedEvent.id ? savedEvent : event))
        : [...prev, savedEvent]
    )
  }

  function openNewEvent() {
    setEditEvent(null)
    setCreateOpen(true)
  }

  function handleGoogleSync() {
    startSyncTransition(async () => {
      const result = await syncAppointmentsWithGoogle()

      if ('error' in result) {
        window.alert(result.error)
        return
      }

      router.refresh()
      window.alert(
        `Sincronizacao concluida. ${result.syncedCount} compromisso(s) enviados, ${result.cancelledCount} cancelamento(s) refletidos e ${result.skippedCount} item(ns) sem alteracoes.`
      )
    })
  }

  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events
    return events.filter((event) => event.type === typeFilter)
  }, [events, typeFilter])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CalendarHeader
        view={view}
        currentDate={currentDate}
        activeTypeFilter={typeFilter}
        onViewChange={setView}
        onPrev={() => navigate('prev')}
        onNext={() => navigate('next')}
        onToday={goToday}
        onTypeFilterChange={setTypeFilter}
        onNewEvent={openNewEvent}
      />

      <div
        className={cn(
          'flex items-center gap-2 border-b border-border px-4 py-2 text-xs',
          googleIntegration.connected ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/40',
        )}
      >
        {googleIntegration.connected ? (
          <>
            <Wifi className="size-3.5 text-green-600" />
            <span className="text-green-700 dark:text-green-400">
              Google Calendar conectado
            </span>
            {(googleIntegration.calendarSummary || googleIntegration.accountEmail) && (
              <span className="text-muted-foreground">
                {' - '}sincronizado{' '}
                {google.lastSyncedAt
                  ? new Date(google.lastSyncedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'agora'}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={handleGoogleSync}
                disabled={google.syncStatus === 'syncing'}
              >
                <RefreshCw
                  className={cn('size-3', google.syncStatus === 'syncing' && 'animate-spin')}
                />
                {google.syncStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                onClick={google.disconnect}
              >
                <Unplug className="size-3" />
                Desconectar
              </Button>
            </div>
          </>
        ) : (
          <>
            <Unplug className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Google Calendar nao conectado</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => {
                window.location.href = '/api/integrations/google/start'
              }}
            >
              Conectar Google Calendar
            </Button>
          </>
        )}
      </div>

      <CalendarView
        view={view}
        currentDate={currentDate}
        events={filteredEvents}
        onEventClick={handleEventClick}
        onDayClick={handleDayClick}
      />

      <EventDetailModalReal
        event={selectedEvent}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
        onEventUpdated={(updatedEvent) => {
          handleEventSaved(updatedEvent)
          setSelectedEvent(updatedEvent)
        }}
      />

      <EventCreateModalReal
        key={`${createOpen ? 'open' : 'closed'}:${editEvent?.id ?? 'new'}`}
        open={createOpen}
        editEvent={editEvent}
        formOptions={formOptions}
        onClose={() => {
          setCreateOpen(false)
          setEditEvent(null)
        }}
        onSaved={handleEventSaved}
      />
    </div>
  )
}
