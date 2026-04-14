export type EventType =
  | 'reuniao'
  | 'audiencia'
  | 'prazo'
  | 'tarefa'
  | 'lembrete'
  | 'outro'

export type EventStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export type EventPriority = 'high' | 'medium' | 'low'

export type EventOrigin = 'manual' | 'radar' | 'caso' | 'lead' | 'sistema'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay?: boolean
  status: EventStatus
  type: EventType
  priority: EventPriority
  origin: EventOrigin
  description?: string
  casoId?: string
  casoTitle?: string
  leadId?: string
  leadName?: string
  responsibleId?: string
  responsible: string
  location?: string
  notes?: string
  // Google Calendar integration fields
  googleEventId?: string        // ID do evento no Google Calendar
  googleCalendarId?: string     // ID da agenda (primary, shared, etc.)
  googleSyncedAt?: string       // ISO 8601 — última sincronização
  googleMeetLink?: string       // Link de videochamada Meet gerado pelo Google
  recurrence?: string[]         // RRULE strings (ex: ["RRULE:FREQ=WEEKLY;BYDAY=MO"])
  attendees?: CalendarAttendee[]
}

export interface CalendarCaseOption {
  id: string
  title: string
}

export interface CalendarLeadOption {
  id: string
  name: string
}

export interface CalendarResponsibleOption {
  id: string
  name: string
}

export interface CalendarFormOptions {
  casos: CalendarCaseOption[]
  leads: CalendarLeadOption[]
  responsaveis: CalendarResponsibleOption[]
}

export interface CalendarEventInput {
  title: string
  start: string
  end: string
  allDay: boolean
  type: EventType
  priority: EventPriority
  casoId?: string
  leadId?: string
  responsibleId?: string
  location?: string
  notes?: string
}

export interface CalendarAttendee {
  email: string
  name?: string
  /** 'needsAction' | 'declined' | 'tentative' | 'accepted' */
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  self?: boolean
}

/**
 * Payload para criar/atualizar um evento via Google Calendar API.
 * Usado pelo hook useGoogleCalendar.
 */
export interface GoogleEventPayload {
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  attendees?: Array<{ email: string; displayName?: string }>
  conferenceData?: { createRequest: { requestId: string; conferenceSolutionKey: { type: 'hangoutsMeet' } } }
  recurrence?: string[]
  reminders?: {
    useDefault: boolean
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>
  }
}

/** Converts a CalendarEvent to a GoogleEventPayload ready for the API. */
export function toGooglePayload(event: CalendarEvent): GoogleEventPayload {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return {
    summary: event.title,
    description: [event.description, event.notes].filter(Boolean).join('\n\n') || undefined,
    location: event.location,
    start: event.allDay
      ? { date: event.start.split('T')[0] }
      : { dateTime: event.start, timeZone },
    end: event.allDay
      ? { date: event.end.split('T')[0] }
      : { dateTime: event.end, timeZone },
    attendees: event.attendees?.map((a) => ({ email: a.email, displayName: a.name })),
    recurrence: event.recurrence,
    reminders: { useDefault: true },
  }
}

/** Converts a Google Calendar API event object to a CalendarEvent. */
export function fromGoogleEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gEvent: Record<string, any>,
  defaults: Pick<CalendarEvent, 'type' | 'priority' | 'responsible'>,
): CalendarEvent {
  const allDay = !gEvent.start?.dateTime
  return {
    id: `google-${gEvent.id}`,
    googleEventId: gEvent.id,
    googleCalendarId: gEvent.organizer?.email,
    googleSyncedAt: new Date().toISOString(),
    googleMeetLink: gEvent.conferenceData?.entryPoints?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ep: Record<string, any>) => ep.entryPointType === 'video'
    )?.uri,
    title: gEvent.summary ?? '(sem título)',
    start: allDay ? gEvent.start.date : gEvent.start.dateTime,
    end: allDay ? gEvent.end.date : gEvent.end.dateTime,
    allDay,
    status: gEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
    origin: 'sistema',
    description: gEvent.description,
    location: gEvent.location,
    recurrence: gEvent.recurrence,
    attendees: gEvent.attendees?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: Record<string, any>) => ({
        email: a.email,
        name: a.displayName,
        responseStatus: a.responseStatus ?? 'needsAction',
        self: a.self,
      })
    ),
    ...defaults,
  }
}

export const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  { label: string; textColor: string; bgColor: string; borderColor: string }
> = {
  scheduled: {
    label: 'Agendado',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-400',
  },
  confirmed: {
    label: 'Confirmado',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
  },
  completed: {
    label: 'Concluído',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-500',
  },
  cancelled: {
    label: 'Cancelado',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
}

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string }> = {
  reuniao: { label: 'Reunião' },
  audiencia: { label: 'Audiência' },
  prazo: { label: 'Prazo' },
  tarefa: { label: 'Tarefa' },
  lembrete: { label: 'Lembrete' },
  outro: { label: 'Outro' },
}

export const PRIORITY_CONFIG: Record<EventPriority, { label: string; textColor: string }> = {
  high: { label: 'Alta', textColor: 'text-red-600' },
  medium: { label: 'Média', textColor: 'text-yellow-600' },
  low: { label: 'Baixa', textColor: 'text-gray-400' },
}

export const ORIGIN_CONFIG: Record<EventOrigin, { label: string }> = {
  manual: { label: 'Manual' },
  radar: { label: 'Radar' },
  caso: { label: 'Caso' },
  lead: { label: 'Lead' },
  sistema: { label: 'Sistema' },
}
