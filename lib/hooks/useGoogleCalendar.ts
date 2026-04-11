'use client'

/**
 * useGoogleCalendar
 *
 * Hook para integração com Google Calendar API v3.
 *
 * ## Como conectar (Fase 3)
 * 1. Crie um projeto em console.cloud.google.com
 * 2. Ative "Google Calendar API"
 * 3. Crie credenciais OAuth 2.0 (Web Application)
 * 4. Configure os scopes: https://www.googleapis.com/auth/calendar
 * 5. Armazene o access_token no Supabase (tabela `integrations`)
 * 6. Passe o token via `setAccessToken(token)` após o OAuth flow
 *
 * ## Arquitetura de sync
 * - Push: ao criar/editar/deletar evento local → chama Google API
 * - Pull: ao abrir o calendário → busca eventos do período visível
 * - Bidirecional: usa `googleEventId` no CalendarEvent como chave de deduplicação
 * - Webhook (futuro): Google envia notificações via Push Notification Channel
 *
 * ## Referência
 * https://developers.google.com/calendar/api/v3/reference/events
 */

import { useState, useCallback } from 'react'
import type { CalendarEvent } from '@/types/calendar'
import { toGooglePayload, fromGoogleEvent } from '@/types/calendar'

const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'

export type GoogleSyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface UseGoogleCalendarOptions {
  /** Google Calendar ID to sync with. Defaults to 'primary'. */
  calendarId?: string
  /** Called when events are fetched/updated from Google */
  onEventsLoaded?: (events: CalendarEvent[]) => void
}

interface UseGoogleCalendarReturn {
  isConnected: boolean
  syncStatus: GoogleSyncStatus
  lastSyncedAt: string | null
  setAccessToken: (token: string) => void
  disconnect: () => void
  /** Fetch events from Google for a given date range */
  fetchEvents: (timeMin: Date, timeMax: Date) => Promise<CalendarEvent[]>
  /** Push a local event to Google Calendar (create or update) */
  pushEvent: (event: CalendarEvent) => Promise<CalendarEvent>
  /** Delete an event from Google Calendar */
  deleteEvent: (googleEventId: string) => Promise<void>
  /** Full two-way sync for a date range */
  syncRange: (timeMin: Date, timeMax: Date) => Promise<void>
}

export function useGoogleCalendar({
  calendarId = 'primary',
  onEventsLoaded,
}: UseGoogleCalendarOptions = {}): UseGoogleCalendarReturn {
  const [accessToken, setAccessTokenState] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<GoogleSyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const isConnected = !!accessToken

  const headers = useCallback((): HeadersInit => ({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }), [accessToken])

  function setAccessToken(token: string) {
    setAccessTokenState(token)
  }

  function disconnect() {
    setAccessTokenState(null)
    setSyncStatus('idle')
    setLastSyncedAt(null)
  }

  const fetchEvents = useCallback(async (timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> => {
    if (!accessToken) throw new Error('Google Calendar não conectado')

    setSyncStatus('syncing')
    try {
      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      })

      const res = await fetch(
        `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: headers() }
      )

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `Google API error ${res.status}`)
      }

      const data = await res.json()
      const events: CalendarEvent[] = (data.items ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: Record<string, any>) =>
          fromGoogleEvent(item, { type: 'outro', priority: 'medium', responsible: '' })
      )

      setSyncStatus('success')
      setLastSyncedAt(new Date().toISOString())
      onEventsLoaded?.(events)
      return events
    } catch (err) {
      setSyncStatus('error')
      throw err
    }
  }, [accessToken, calendarId, headers, onEventsLoaded])

  const pushEvent = useCallback(async (event: CalendarEvent): Promise<CalendarEvent> => {
    if (!accessToken) throw new Error('Google Calendar não conectado')

    setSyncStatus('syncing')
    try {
      const payload = toGooglePayload(event)
      const isUpdate = !!event.googleEventId

      const url = isUpdate
        ? `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${event.googleEventId}?conferenceDataVersion=1`
        : `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`

      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `Google API error ${res.status}`)
      }

      const gEvent = await res.json()
      setSyncStatus('success')
      setLastSyncedAt(new Date().toISOString())

      return {
        ...event,
        googleEventId: gEvent.id,
        googleCalendarId: calendarId,
        googleSyncedAt: new Date().toISOString(),
        googleMeetLink: gEvent.conferenceData?.entryPoints?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ep: Record<string, any>) => ep.entryPointType === 'video'
        )?.uri,
      }
    } catch (err) {
      setSyncStatus('error')
      throw err
    }
  }, [accessToken, calendarId, headers])

  const deleteEvent = useCallback(async (googleEventId: string): Promise<void> => {
    if (!accessToken) throw new Error('Google Calendar não conectado')

    setSyncStatus('syncing')
    try {
      const res = await fetch(
        `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
        { method: 'DELETE', headers: headers() }
      )

      if (!res.ok && res.status !== 204 && res.status !== 410) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `Google API error ${res.status}`)
      }

      setSyncStatus('success')
      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      setSyncStatus('error')
      throw err
    }
  }, [accessToken, calendarId, headers])

  const syncRange = useCallback(async (timeMin: Date, timeMax: Date): Promise<void> => {
    const events = await fetchEvents(timeMin, timeMax)
    onEventsLoaded?.(events)
  }, [fetchEvents, onEventsLoaded])

  return {
    isConnected,
    syncStatus,
    lastSyncedAt,
    setAccessToken,
    disconnect,
    fetchEvents,
    pushEvent,
    deleteEvent,
    syncRange,
  }
}
