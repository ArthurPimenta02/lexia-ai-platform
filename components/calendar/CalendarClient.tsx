'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Unplug, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventType } from '@/types/calendar'
import type { CalendarViewType } from './CalendarView'
import { CalendarHeader } from './CalendarHeader'
import { CalendarView } from './CalendarView'
import { EventDetailModal } from './EventDetailModal'
import { EventCreateModal } from './EventCreateModal'
import { useGoogleCalendar } from '@/lib/hooks/useGoogleCalendar'

interface CalendarClientProps {
  events: CalendarEvent[]
}

export function CalendarClient({ events: initialEvents }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [view, setView] = useState<CalendarViewType>('month')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)

  // Google Calendar integration
  const google = useGoogleCalendar({
    onEventsLoaded: (googleEvents) => {
      setEvents((prev) => {
        // Merge: keep local events that don't have a matching googleEventId
        const localOnly = prev.filter(
          (e) => !googleEvents.some((g) => g.googleEventId === e.googleEventId)
        )
        return [...localOnly, ...googleEvents]
      })
    },
  })

  // Navigation
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

  // Event interactions
  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event)
    setDetailOpen(true)
  }

  function handleEdit(event: CalendarEvent) {
    setEditEvent(event)
    setCreateOpen(true)
  }

  function handleMarkCompleted(event: CalendarEvent) {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, status: 'completed' } : e))
    )
  }

  function handleCancelEvent(event: CalendarEvent) {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, status: 'cancelled' } : e))
    )
    // If synced with Google, delete from there too
    if (google.isConnected && event.googleEventId) {
      google.deleteEvent(event.googleEventId).catch(console.error)
    }
  }

  async function handleSaveEvent(saved: CalendarEvent) {
    let finalEvent = saved
    // Push to Google if connected
    if (google.isConnected) {
      try {
        finalEvent = await google.pushEvent(saved)
      } catch (err) {
        console.error('Google sync failed, saving locally only:', err)
      }
    }
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === finalEvent.id)
      if (exists) return prev.map((e) => (e.id === finalEvent.id ? finalEvent : e))
      return [...prev, finalEvent]
    })
  }

  function openNewEvent() {
    setEditEvent(null)
    setCreateOpen(true)
  }

  // Sync current visible range with Google
  function handleGoogleSync() {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    if (view === 'month') {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1, 0)
    } else if (view === 'week') {
      start.setDate(start.getDate() - start.getDay())
      end.setDate(start.getDate() + 6)
    }
    google.syncRange(start, end).catch(console.error)
  }

  // Filter
  const filteredEvents = useMemo(() => {
    if (typeFilter === 'all') return events
    return events.filter((e) => e.type === typeFilter)
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

      {/* Google Calendar sync bar */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border px-4 py-2 text-xs',
          google.isConnected ? 'bg-green-50 dark:bg-green-950/20' : 'bg-muted/40',
        )}
      >
        {google.isConnected ? (
          <>
            <Wifi className="size-3.5 text-green-600" />
            <span className="text-green-700 dark:text-green-400">
              Google Calendar conectado
            </span>
            {google.lastSyncedAt && (
              <span className="text-muted-foreground">
                · sincronizado{' '}
                {new Date(google.lastSyncedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
                {google.syncStatus === 'syncing' ? 'Sincronizando…' : 'Sincronizar'}
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
            <span className="text-muted-foreground">Google Calendar não conectado</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => {
                // TODO (Fase 3): iniciar OAuth flow
                // Exemplo: router.push('/api/auth/google/calendar')
                alert('Integração Google Calendar disponível na Fase 3.\nConfigurar em: Settings → Integrações → Google Calendar')
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

      <EventDetailModal
        event={selectedEvent}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
        onMarkCompleted={handleMarkCompleted}
        onCancel={handleCancelEvent}
      />

      <EventCreateModal
        open={createOpen}
        editEvent={editEvent}
        onClose={() => {
          setCreateOpen(false)
          setEditEvent(null)
        }}
        onSave={handleSaveEvent}
      />
    </div>
  )
}
