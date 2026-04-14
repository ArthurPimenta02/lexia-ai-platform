'use server'

import { revalidatePath } from 'next/cache'
import {
  cancelAppointmentInGoogle,
  getGoogleCalendarIntegrationStatusForTenant,
  getGoogleIntegrationAuthContext,
  pushAppointmentToGoogle,
} from '@/lib/google-calendar/server'
import { createClient } from '@/lib/supabase/server'
import type {
  AppointmentRow,
  AppointmentStatus,
  AppointmentType,
  CasoRow,
  LeadRow,
  UserRow,
} from '@/types/database'
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarFormOptions,
  EventPriority,
  EventStatus,
  EventType,
} from '@/types/calendar'

const META_PREFIX = '__LEXIA_CALENDAR_META__'

interface CalendarMeta {
  uiType?: EventType
  priority?: EventPriority
  storage?: 'notes'
}

export interface AppointmentFilters {
  startsAtGte?: string
  startsAtLte?: string
  responsibleId?: string
  casoId?: string
  leadId?: string
  status?: EventStatus
}

type AppointmentWithJoins = AppointmentRow & {
  casos: Pick<CasoRow, 'id' | 'titulo'> | null
  leads: Pick<LeadRow, 'id' | 'name'> | null
  users: Pick<UserRow, 'id' | 'name'> | null
}

async function getSessionContext(): Promise<
  { error: string } |
  { supabase: Awaited<ReturnType<typeof createClient>>; tenantId: string }
> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Não autenticado' as const }
  }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return { error: 'tenant_id não encontrado na sessão' as const }
  }

  return { supabase, tenantId }
}

function mapDbStatusToEventStatus(status: AppointmentStatus): EventStatus {
  switch (status) {
    case 'confirmado':
      return 'confirmed'
    case 'realizado':
      return 'completed'
    case 'cancelado':
      return 'cancelled'
    case 'reagendado':
      return 'scheduled'
    default:
      return 'scheduled'
  }
}

function mapEventStatusToDbStatus(status: EventStatus): AppointmentStatus {
  switch (status) {
    case 'confirmed':
      return 'confirmado'
    case 'completed':
      return 'realizado'
    case 'cancelled':
      return 'cancelado'
    default:
      return 'agendado'
  }
}

function mapDbTypeToEventType(type: AppointmentType): EventType {
  switch (type) {
    case 'reuniao':
      return 'reuniao'
    case 'audiencia':
      return 'audiencia'
    case 'prazo':
      return 'prazo'
    default:
      return 'outro'
  }
}

function mapEventTypeToDbType(type: EventType): AppointmentType {
  switch (type) {
    case 'reuniao':
      return 'reuniao'
    case 'audiencia':
      return 'audiencia'
    case 'prazo':
      return 'prazo'
    default:
      return 'outros'
  }
}

function parseStoredDescription(value: string | null): { text: string | null; meta: CalendarMeta } {
  if (!value) return { text: null, meta: {} }

  const lines = value.split('\n')
  const metaLine = lines.find((line) => line.startsWith(META_PREFIX))
  if (!metaLine) return { text: value, meta: {} }

  const textLines = lines.filter((line) => !line.startsWith(META_PREFIX))
  let meta: CalendarMeta = {}

  try {
    meta = JSON.parse(metaLine.slice(META_PREFIX.length)) as CalendarMeta
  } catch {
    meta = {}
  }

  const text = textLines.join('\n').trim()
  return { text: text || null, meta }
}

function serializeStoredDescription(text: string | undefined, meta: CalendarMeta): string {
  const payload = `${META_PREFIX}${JSON.stringify(meta)}`
  const base = text?.trim()
  return base ? `${base}\n${payload}` : payload
}

function inferOrigin(row: AppointmentWithJoins, description: string | null): CalendarEvent['origin'] {
  if (description?.includes('[radar:')) return 'radar'
  if (row.caso_id) return 'caso'
  if (row.lead_id) return 'lead'
  return 'manual'
}

function inferPriority(row: AppointmentWithJoins, meta: CalendarMeta): EventPriority {
  if (meta.priority) return meta.priority
  if (row.tipo === 'prazo') return 'high'
  if (row.status === 'cancelado') return 'low'
  return 'medium'
}

function rowToCalendarEvent(row: AppointmentWithJoins): CalendarEvent {
  const parsed = parseStoredDescription(row.descricao)
  const type = parsed.meta.uiType ?? mapDbTypeToEventType(row.tipo)
  const userText = parsed.text ?? undefined

  return {
    id: row.id,
    title: row.titulo,
    start: row.starts_at,
    end: row.ends_at,
    allDay: row.all_day,
    status: mapDbStatusToEventStatus(row.status),
    type,
    priority: inferPriority(row, parsed.meta),
    origin: inferOrigin(row, parsed.text),
    description: parsed.meta.storage === 'notes' ? undefined : userText,
    notes: parsed.meta.storage === 'notes' ? userText : undefined,
    casoId: row.caso_id ?? undefined,
    casoTitle: row.casos?.titulo ?? undefined,
    leadId: row.lead_id ?? undefined,
    leadName: row.leads?.name ?? undefined,
    responsibleId: row.responsible_id ?? undefined,
    responsible: row.users?.name ?? 'Sem responsável',
    location: row.local ?? undefined,
    googleEventId: row.gcal_id ?? undefined,
    googleCalendarId: undefined,
    googleSyncedAt: row.gcal_synced_at ?? undefined,
  }
}

function mergeGoogleSync(
  appointment: CalendarEvent,
  syncResult: {
    googleEventId: string
    googleCalendarId: string
    googleSyncedAt: string
    googleMeetLink?: string
  } | null
): CalendarEvent {
  if (!syncResult) return appointment

  return {
    ...appointment,
    googleEventId: syncResult.googleEventId,
    googleCalendarId: syncResult.googleCalendarId,
    googleSyncedAt: syncResult.googleSyncedAt,
    googleMeetLink: syncResult.googleMeetLink ?? appointment.googleMeetLink,
  }
}

async function validateRelatedEntity(
  table: 'casos' | 'leads' | 'users',
  id: string,
  tenantId: string
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from(table)
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', id)

  if (table !== 'users') {
    query = query.is('deleted_at', null)
  } else {
    query = query.eq('status', 'active').is('deleted_at', null)
  }

  const { data } = await query.maybeSingle()
  return !!data
}

export async function getAppointments(
  filters: AppointmentFilters = {}
): Promise<{ appointments: CalendarEvent[] } | { error: string }> {
  const session = await getSessionContext()
  if ('error' in session) return { error: session.error }

  const { supabase, tenantId } = session

  let query = supabase
    .from('appointments')
    .select(`
      id, tenant_id, caso_id, lead_id, responsible_id, titulo, descricao, local, tipo, status,
      starts_at, ends_at, all_day, attendee_ids, gcal_id, gcal_synced_at, deleted_at, created_at, updated_at,
      casos:caso_id ( id, titulo ),
      leads:lead_id ( id, name ),
      users:responsible_id ( id, name )
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true })

  if (filters.startsAtGte) query = query.gte('starts_at', filters.startsAtGte)
  if (filters.startsAtLte) query = query.lte('starts_at', filters.startsAtLte)
  if (filters.responsibleId) query = query.eq('responsible_id', filters.responsibleId)
  if (filters.casoId) query = query.eq('caso_id', filters.casoId)
  if (filters.leadId) query = query.eq('lead_id', filters.leadId)
  if (filters.status) query = query.eq('status', mapEventStatusToDbStatus(filters.status))

  const { data, error } = await query

  if (error) {
    console.error('getAppointments:', error)
    return { error: 'Erro ao buscar compromissos.' }
  }

  const rows = (data ?? []) as unknown as AppointmentWithJoins[]
  return { appointments: rows.map(rowToCalendarEvent) }
}

export async function syncAppointmentsWithGoogle(): Promise<
  | {
      success: true
      syncedCount: number
      cancelledCount: number
      skippedCount: number
    }
  | { error: string }
> {
  const session = await getSessionContext()
  if ('error' in session) return { error: session.error }

  const { supabase, tenantId } = session
  const googleContext = await getGoogleIntegrationAuthContext()

  if ('error' in googleContext) {
    return { error: 'Erro ao validar permissões da integração Google.' }
  }

  if (!googleContext.canManage) {
    return { error: 'Apenas admin ou manager podem sincronizar com o Google Calendar.' }
  }

  const googleStatus = await getGoogleCalendarIntegrationStatusForTenant(tenantId)
  if (!googleStatus.connected) {
    return { error: 'Google Calendar não está conectado para este tenant.' }
  }

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, tenant_id, caso_id, lead_id, responsible_id, titulo, descricao, local, tipo, status,
      starts_at, ends_at, all_day, attendee_ids, gcal_id, gcal_synced_at, deleted_at, created_at, updated_at,
      casos:caso_id ( id, titulo ),
      leads:lead_id ( id, name ),
      users:responsible_id ( id, name )
    `)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true })

  if (error) {
    console.error('syncAppointmentsWithGoogle:', error)
    return { error: 'Erro ao sincronizar compromissos com o Google Calendar.' }
  }

  const rows = (data ?? []) as unknown as AppointmentWithJoins[]
  let syncedCount = 0
  let cancelledCount = 0
  let skippedCount = 0

  for (const row of rows) {
    const event = rowToCalendarEvent(row)

    if (event.status === 'cancelled') {
      if (!event.googleEventId) {
        skippedCount += 1
        continue
      }

      const cancelResult = await cancelAppointmentInGoogle({
        tenantId,
        appointmentId: event.id,
        googleEventId: event.googleEventId,
      })

      if (cancelResult) {
        cancelledCount += 1
      } else {
        skippedCount += 1
      }

      continue
    }

    const pushResult = await pushAppointmentToGoogle({
      tenantId,
      appointmentId: event.id,
      event,
    })

    if (pushResult) {
      syncedCount += 1
    } else {
      skippedCount += 1
    }
  }

  revalidatePath('/calendar')

  return {
    success: true,
    syncedCount,
    cancelledCount,
    skippedCount,
  }
}

export async function getLinkedAppointments(
  filters: Pick<AppointmentFilters, 'casoId' | 'leadId'>
): Promise<CalendarEvent[]> {
  const result = await getAppointments(filters)

  if ('error' in result) {
    throw new Error(result.error)
  }

  return result.appointments
}

export async function getAppointmentFormOptions():
Promise<{ options: CalendarFormOptions } | { error: string }> {
  const session = await getSessionContext()
  if ('error' in session) return { error: session.error }

  const { supabase, tenantId } = session

  const [casosResult, leadsResult, usersResult] = await Promise.all([
    supabase
      .from('casos')
      .select('id, titulo')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    supabase
      .from('leads')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('name'),
  ])

  if (casosResult.error || leadsResult.error || usersResult.error) {
    console.error('getAppointmentFormOptions:', {
      casos: casosResult.error,
      leads: leadsResult.error,
      users: usersResult.error,
    })
    return { error: 'Erro ao carregar opções do calendário.' }
  }

  return {
    options: {
      casos: (casosResult.data ?? []).map((caso) => ({ id: caso.id, title: caso.titulo })),
      leads: (leadsResult.data ?? []).map((lead) => ({ id: lead.id, name: lead.name })),
      responsaveis: (usersResult.data ?? []).map((user) => ({ id: user.id, name: user.name })),
    },
  }
}

export async function createAppointment(
  data: CalendarEventInput
): Promise<{ appointment: CalendarEvent } | { error: string }> {
  const session = await getSessionContext()
  if ('error' in session) return { error: session.error }

  const { supabase, tenantId } = session

  if (!data.title.trim()) return { error: 'Título é obrigatório.' }
  if (new Date(data.end) <= new Date(data.start)) {
    return { error: 'O horário de término deve ser maior que o de início.' }
  }

  if (data.casoId && !(await validateRelatedEntity('casos', data.casoId, tenantId))) {
    return { error: 'Caso vinculado inválido para este tenant.' }
  }
  if (data.leadId && !(await validateRelatedEntity('leads', data.leadId, tenantId))) {
    return { error: 'Lead vinculado inválido para este tenant.' }
  }
  if (data.responsibleId && !(await validateRelatedEntity('users', data.responsibleId, tenantId))) {
    return { error: 'Responsável inválido para este tenant.' }
  }

  const { data: inserted, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      caso_id: data.casoId ?? null,
      lead_id: data.leadId ?? null,
      responsible_id: data.responsibleId ?? null,
      titulo: data.title.trim(),
      descricao: serializeStoredDescription(data.notes, {
        uiType: data.type,
        priority: data.priority,
        storage: 'notes',
      }),
      local: data.location?.trim() || null,
      tipo: mapEventTypeToDbType(data.type),
      status: 'agendado',
      starts_at: data.start,
      ends_at: data.end,
      all_day: data.allDay,
      attendee_ids: data.responsibleId ? [data.responsibleId] : [],
    })
    .select(`
      id, tenant_id, caso_id, lead_id, responsible_id, titulo, descricao, local, tipo, status,
      starts_at, ends_at, all_day, attendee_ids, gcal_id, gcal_synced_at, deleted_at, created_at, updated_at,
      casos:caso_id ( id, titulo ),
      leads:lead_id ( id, name ),
      users:responsible_id ( id, name )
    `)
    .single()

  if (error || !inserted) {
    console.error('createAppointment:', error)
    return { error: 'Erro ao criar compromisso.' }
  }

  const appointment = rowToCalendarEvent(inserted as unknown as AppointmentWithJoins)
  const syncResult = await pushAppointmentToGoogle({
    tenantId,
    appointmentId: appointment.id,
    event: appointment,
  })

  revalidatePath('/calendar')
  return { appointment: mergeGoogleSync(appointment, syncResult) }
}

export async function updateAppointment(
  id: string,
  data: Partial<CalendarEventInput & { status: EventStatus }>
): Promise<{ appointment: CalendarEvent } | { error: string }> {
  const session = await getSessionContext()
  if ('error' in session) return { error: session.error }

  const { supabase, tenantId } = session

  const { data: current, error: currentError } = await supabase
    .from('appointments')
    .select(`
      id, tenant_id, caso_id, lead_id, responsible_id, titulo, descricao, local, tipo, status,
      starts_at, ends_at, all_day, attendee_ids, gcal_id, gcal_synced_at, deleted_at, created_at, updated_at
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (currentError || !current) {
    return { error: 'Compromisso não encontrado.' }
  }

  const existing = current as AppointmentRow
  const nextStart = data.start ?? existing.starts_at
  const nextEnd = data.end ?? existing.ends_at

  if (new Date(nextEnd) <= new Date(nextStart)) {
    return { error: 'O horário de término deve ser maior que o de início.' }
  }

  if (data.casoId && !(await validateRelatedEntity('casos', data.casoId, tenantId))) {
    return { error: 'Caso vinculado inválido para este tenant.' }
  }
  if (data.leadId && !(await validateRelatedEntity('leads', data.leadId, tenantId))) {
    return { error: 'Lead vinculado inválido para este tenant.' }
  }
  if (data.responsibleId && !(await validateRelatedEntity('users', data.responsibleId, tenantId))) {
    return { error: 'Responsável inválido para este tenant.' }
  }

  const currentParsed = parseStoredDescription(existing.descricao)
  const nextType = data.type ?? currentParsed.meta.uiType ?? mapDbTypeToEventType(existing.tipo)
  const nextPriority = data.priority ?? currentParsed.meta.priority ?? inferPriority({
    ...existing,
    casos: null,
    leads: null,
    users: null,
  }, currentParsed.meta)

  const patch: Record<string, unknown> = {
    titulo: data.title !== undefined ? data.title.trim() : existing.titulo,
    descricao: serializeStoredDescription(
      data.notes !== undefined ? data.notes : currentParsed.text ?? undefined,
      {
        uiType: nextType,
        priority: nextPriority,
        storage: 'notes',
      }
    ),
    local: data.location !== undefined ? data.location?.trim() || null : existing.local,
    tipo: data.type !== undefined ? mapEventTypeToDbType(data.type) : existing.tipo,
    status: data.status !== undefined ? mapEventStatusToDbStatus(data.status) : existing.status,
    starts_at: nextStart,
    ends_at: nextEnd,
    all_day: data.allDay !== undefined ? data.allDay : existing.all_day,
    caso_id: data.casoId !== undefined ? data.casoId || null : existing.caso_id,
    lead_id: data.leadId !== undefined ? data.leadId || null : existing.lead_id,
    responsible_id: data.responsibleId !== undefined ? data.responsibleId || null : existing.responsible_id,
    attendee_ids: data.responsibleId !== undefined
      ? (data.responsibleId ? [data.responsibleId] : [])
      : existing.attendee_ids,
  }

  const { data: updated, error } = await supabase
    .from('appointments')
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .select(`
      id, tenant_id, caso_id, lead_id, responsible_id, titulo, descricao, local, tipo, status,
      starts_at, ends_at, all_day, attendee_ids, gcal_id, gcal_synced_at, deleted_at, created_at, updated_at,
      casos:caso_id ( id, titulo ),
      leads:lead_id ( id, name ),
      users:responsible_id ( id, name )
    `)
    .single()

  if (error || !updated) {
    console.error('updateAppointment:', error)
    return { error: 'Erro ao atualizar compromisso.' }
  }

  const appointment = rowToCalendarEvent(updated as unknown as AppointmentWithJoins)

  if (appointment.status === 'cancelled') {
    const cancelResult = await cancelAppointmentInGoogle({
      tenantId,
      appointmentId: appointment.id,
      googleEventId: appointment.googleEventId,
    })

    revalidatePath('/calendar')
    return {
      appointment: {
        ...appointment,
        googleSyncedAt: cancelResult?.googleSyncedAt ?? appointment.googleSyncedAt,
      },
    }
  }

  const pushResult = await pushAppointmentToGoogle({
    tenantId,
    appointmentId: appointment.id,
    event: appointment,
  })

  revalidatePath('/calendar')
  return { appointment: mergeGoogleSync(appointment, pushResult) }
}

export async function cancelAppointment(
  id: string
): Promise<{ appointment: CalendarEvent } | { error: string }> {
  return updateAppointment(id, { status: 'cancelled' })
}
