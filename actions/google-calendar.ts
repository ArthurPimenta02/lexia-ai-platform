'use server'

import { revalidatePath } from 'next/cache'
import {
  disconnectGoogleCalendarForTenant,
  getGoogleCalendarIntegrationStatusForTenant,
  getGoogleIntegrationAuthContext,
} from '@/lib/google-calendar/server'
import type { GoogleCalendarIntegrationStatus } from '@/lib/google-calendar/server'
import type { Integration } from '@/types/settings'
import { MOCK_INTEGRATIONS } from '@/lib/mock/settings'

async function getGoogleContext(requireManager = false): Promise<
  { error: string } |
  { tenantId: string; userId: string }
> {
  const context = await getGoogleIntegrationAuthContext()
  if ('error' in context) {
    return { error: context.error }
  }

  if (requireManager && !context.canManage) {
    return { error: 'Apenas admin ou manager podem gerenciar integracoes.' }
  }

  return { tenantId: context.tenantId, userId: context.userId }
}

function formatSyncDate(iso?: string | null) {
  if (!iso) return undefined

  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapGoogleIntegration(status: GoogleCalendarIntegrationStatus): Integration {
  const primaryAction = status.connected ? 'Desconectar' : 'Conectar'
  const connectionDetails = status.connected
    ? [status.calendarSummary, status.accountEmail].filter(Boolean).join(' - ')
    : undefined

  return {
    id: 'google-calendar',
    type: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincronize compromissos, audiencias e prazos da Lexia com a agenda principal do Google Calendar.',
    status: status.connected ? 'connected' : status.status === 'error' ? 'error' : 'disconnected',
    connected: status.connected,
    enabled: status.enabled,
    lastSyncAt: formatSyncDate(status.lastSyncAt),
    connectionDetails,
    errorMessage: status.lastSyncError ?? undefined,
    primaryAction,
    logoIcon: 'CalendarDays',
  }
}

export async function getGoogleCalendarIntegrationStatus() {
  const context = await getGoogleContext()
  if ('error' in context) {
    return { error: context.error }
  }

  const status = await getGoogleCalendarIntegrationStatusForTenant(context.tenantId)
  return { integration: status }
}

export async function getSettingsIntegrations(): Promise<Integration[]> {
  const context = await getGoogleContext()
  if ('error' in context) {
    return MOCK_INTEGRATIONS
  }

  const googleStatus = await getGoogleCalendarIntegrationStatusForTenant(context.tenantId)

  return MOCK_INTEGRATIONS.map((integration) =>
    integration.type === 'google_calendar'
      ? mapGoogleIntegration(googleStatus)
      : integration
  )
}

export async function disconnectGoogleCalendar() {
  const context = await getGoogleContext(true)
  if ('error' in context) {
    return { error: context.error }
  }

  await disconnectGoogleCalendarForTenant(context.tenantId)
  revalidatePath('/settings/integrations')
  revalidatePath('/calendar')
  return { success: true as const }
}