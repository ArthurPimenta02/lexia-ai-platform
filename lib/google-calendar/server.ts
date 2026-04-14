import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { CalendarEvent } from '@/types/calendar'
import type { IntegrationRow, IntegrationSecretRow, UserRole } from '@/types/database'
import { toGooglePayload } from '@/types/calendar'

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
]

export interface GoogleCalendarIntegrationStatus {
  connected: boolean
  enabled: boolean
  status: IntegrationRow['status'] | 'disconnected'
  calendarId?: string
  calendarSummary?: string
  accountEmail?: string
  lastSyncAt?: string | null
  lastSyncError?: string | null
}

interface GoogleTokenPayload {
  access_token: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expiry_date: number
}

interface GooglePushResult {
  googleEventId: string
  googleCalendarId: string
  googleSyncedAt: string
  googleMeetLink?: string
}

interface GoogleCalendarConfig {
  calendarId?: string
  calendarSummary?: string
  accountEmail?: string
}

export type GoogleIntegrationAuthContext =
  | { error: string }
  | {
      tenantId: string
      userId: string
      role: UserRole
      canManage: boolean
    }

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variavel de ambiente ausente: ${name}`)
  return value
}

function getEncryptionKey() {
  return createHash('sha256')
    .update(getRequiredEnv('INTEGRATIONS_ENCRYPTION_KEY'))
    .digest()
}

function encryptPayload(payload: GoogleTokenPayload): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()

  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.')
}

function decryptPayload(payload: string): GoogleTokenPayload {
  const [ivPart, tagPart, dataPart] = payload.split('.')
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Payload criptografado invalido.')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivPart, 'base64url')
  )
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8')

  return JSON.parse(plaintext) as GoogleTokenPayload
}

function getRedirectUri() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI
    ?? `${getRequiredEnv('NEXT_PUBLIC_APP_URL')}/api/integrations/google/callback`
}

function getGoogleOauthConfig() {
  return {
    clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: getRedirectUri(),
  }
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Erro desconhecido na integracao com Google Calendar.'
}

export async function getGoogleIntegrationAuthContext(): Promise<GoogleIntegrationAuthContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'not_authenticated' }
  }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return { error: 'missing_tenant_id' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (membershipError) {
    return { error: `Erro ao validar permissoes da integracao: ${membershipError.message}` }
  }

  if (!membership) {
    return { error: 'user_not_found_in_tenant' }
  }

  const role = membership.role as UserRole

  return {
    tenantId,
    userId: user.id,
    role,
    canManage: role === 'admin' || role === 'manager',
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || `Google API error ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function getIntegrationRow(tenantId: string) {
  const admin = createServiceClient()
  const { data, error } = await admin
    .from('integrations')
    .select('id, tenant_id, type, status, config, secret_ref, enabled, last_sync_at, last_sync_error, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .eq('type', 'google_calendar')
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar integraÃ§Ã£o Google Calendar: ${error.message}`)
  }

  return data as IntegrationRow | null
}

async function getStoredSecret(tenantId: string) {
  const admin = createServiceClient()
  const { data, error } = await admin
    .from('integration_secrets')
    .select('id, tenant_id, integration_type, encrypted_payload, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'google_calendar')
    .maybeSingle()

  if (error) {
    throw new Error(`Erro ao buscar secret da integraÃ§Ã£o Google Calendar: ${error.message}`)
  }

  return data as IntegrationSecretRow | null
}

async function touchIntegrationSyncState(
  tenantId: string,
  patch: Partial<Pick<IntegrationRow, 'status' | 'enabled' | 'last_sync_at' | 'last_sync_error' | 'config' | 'secret_ref'>>
) {
  const admin = createServiceClient()
  const { error } = await admin
    .from('integrations')
    .upsert({
      tenant_id: tenantId,
      type: 'google_calendar',
      ...patch,
    }, { onConflict: 'tenant_id,type' })

  if (error) {
    throw new Error(`Erro ao atualizar integraÃ§Ã£o Google Calendar: ${error.message}`)
  }
}

async function storeSecretPayload(tenantId: string, payload: GoogleTokenPayload) {
  const admin = createServiceClient()
  const encryptedPayload = encryptPayload(payload)
  const { data, error } = await admin
    .from('integration_secrets')
    .upsert({
      tenant_id: tenantId,
      integration_type: 'google_calendar',
      encrypted_payload: encryptedPayload,
    }, { onConflict: 'tenant_id,integration_type' })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Erro ao armazenar secret da integraÃ§Ã£o Google Calendar: ${error?.message ?? 'sem resposta'}`)
  }

  return data.id as string
}

async function updateAppointmentGoogleMetadata(
  tenantId: string,
  appointmentId: string,
  patch: { gcal_id?: string; gcal_synced_at: string }
) {
  const admin = createServiceClient()
  const updatePatch: Record<string, string> = {
    gcal_synced_at: patch.gcal_synced_at,
  }

  if (patch.gcal_id) {
    updatePatch.gcal_id = patch.gcal_id
  }

  const { error } = await admin
    .from('appointments')
    .update(updatePatch)
    .eq('tenant_id', tenantId)
    .eq('id', appointmentId)

  if (error) {
    throw new Error(`Erro ao atualizar metadata Google do appointment: ${error.message}`)
  }
}

async function getValidGoogleToken(tenantId: string): Promise<{
  token: GoogleTokenPayload
  config: GoogleCalendarConfig
} | null> {
  const integration = await getIntegrationRow(tenantId)
  if (!integration || !integration.enabled || integration.status === 'disconnected') {
    return null
  }

  const secret = await getStoredSecret(tenantId)
  if (!secret) {
    return null
  }

  let token = decryptPayload(secret.encrypted_payload)
  const config = (integration.config ?? {}) as GoogleCalendarConfig
  const needsRefresh = !token.expiry_date || token.expiry_date <= Date.now() + 60_000

  if (!needsRefresh) {
    return { token, config }
  }

  if (!token.refresh_token) {
    await touchIntegrationSyncState(tenantId, {
      status: 'error',
      enabled: false,
      last_sync_error: 'Refresh token ausente. Reconecte o Google Calendar.',
    })
    return null
  }

  try {
    const refreshed = await refreshGoogleAccessToken(token.refresh_token)
    token = {
      ...token,
      ...refreshed,
      refresh_token: refreshed.refresh_token ?? token.refresh_token,
    }
    const secretRef = await storeSecretPayload(tenantId, token)
    await touchIntegrationSyncState(tenantId, {
      secret_ref: secretRef,
      status: 'connected',
      enabled: true,
      last_sync_error: null,
    })
    return { token, config }
  } catch (error) {
    await touchIntegrationSyncState(tenantId, {
      status: 'error',
      enabled: false,
      last_sync_error: normalizeErrorMessage(error),
    })
    return null
  }
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<GoogleTokenPayload> {
  const { clientId, clientSecret, redirectUri } = getGoogleOauthConfig()

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Falha ao renovar token do Google Calendar.')
  }

  const data = await response.json() as {
    access_token: string
    expires_in: number
    refresh_token?: string
    scope?: string
    token_type?: string
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    scope: data.scope,
    token_type: data.token_type,
    expiry_date: Date.now() + (data.expires_in * 1000),
  }
}

function getGoogleEventUrl(calendarId: string, googleEventId?: string) {
  const base = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`
  return googleEventId ? `${base}/${googleEventId}?conferenceDataVersion=1` : `${base}?conferenceDataVersion=1`
}

export function buildGoogleAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOauthConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    scope: GOOGLE_SCOPES.join(' '),
    state,
  })

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOauthConfig()

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Falha ao trocar o cÃ³digo OAuth do Google.')
  }

  const data = await response.json() as {
    access_token: string
    expires_in: number
    refresh_token?: string
    scope?: string
    token_type?: string
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    scope: data.scope,
    token_type: data.token_type,
    expiry_date: Date.now() + (data.expires_in * 1000),
  } satisfies GoogleTokenPayload
}

export async function fetchPrimaryGoogleCalendar(accessToken: string) {
  return fetchJson<{
    id: string
    summary?: string
    primary?: boolean
  }>(
    `${GOOGLE_CALENDAR_BASE}/users/me/calendarList/primary`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )
}

export async function saveGoogleCalendarConnection(params: {
  tenantId: string
  userId: string
  tokens: GoogleTokenPayload
  calendarId: string
  calendarSummary?: string
  accountEmail?: string
}) {
  const { tenantId, userId, tokens, calendarId, calendarSummary, accountEmail } = params
  const currentSecret = await getStoredSecret(tenantId)
  const mergedTokens: GoogleTokenPayload = {
    ...tokens,
    refresh_token: tokens.refresh_token
      ?? (currentSecret ? decryptPayload(currentSecret.encrypted_payload).refresh_token : undefined),
  }

  const secretRef = await storeSecretPayload(tenantId, mergedTokens)

  await touchIntegrationSyncState(tenantId, {
    status: 'connected',
    enabled: true,
    secret_ref: secretRef,
    last_sync_error: null,
    config: {
      calendarId,
      calendarSummary: calendarSummary ?? 'Agenda principal',
      accountEmail: accountEmail ?? calendarId,
      connectedAt: new Date().toISOString(),
      connectedByUserId: userId,
      syncDirection: 'lexia_to_google',
    },
  })
}

export async function getGoogleCalendarIntegrationStatusForTenant(
  tenantId: string
): Promise<GoogleCalendarIntegrationStatus> {
  const integration = await getIntegrationRow(tenantId)

  if (!integration) {
    return {
      connected: false,
      enabled: false,
      status: 'disconnected',
    }
  }

  const config = (integration.config ?? {}) as GoogleCalendarConfig
  return {
    connected: integration.status === 'connected' && integration.enabled,
    enabled: integration.enabled,
    status: integration.status,
    calendarId: config.calendarId,
    calendarSummary: config.calendarSummary,
    accountEmail: config.accountEmail,
    lastSyncAt: integration.last_sync_at,
    lastSyncError: integration.last_sync_error,
  }
}

export async function disconnectGoogleCalendarForTenant(tenantId: string) {
  const admin = createServiceClient()

  await admin
    .from('integration_secrets')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('integration_type', 'google_calendar')

  const { error } = await admin
    .from('integrations')
    .upsert({
      tenant_id: tenantId,
      type: 'google_calendar',
      status: 'disconnected',
      enabled: false,
      config: {},
      secret_ref: null,
      last_sync_error: null,
      last_sync_at: null,
    }, { onConflict: 'tenant_id,type' })

  if (error) {
    throw new Error(`Erro ao desconectar Google Calendar: ${error.message}`)
  }
}

export async function pushAppointmentToGoogle(params: {
  tenantId: string
  appointmentId: string
  event: CalendarEvent
}): Promise<GooglePushResult | null> {
  const { tenantId, appointmentId, event } = params
  const validToken = await getValidGoogleToken(tenantId)

  if (!validToken) {
    return null
  }

  const calendarId = validToken.config.calendarId ?? 'primary'

  try {
    const response = await fetch(getGoogleEventUrl(calendarId, event.googleEventId), {
      method: event.googleEventId ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${validToken.token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toGooglePayload(event)),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Falha ao sincronizar evento ${appointmentId} com Google Calendar.`)
    }

    const googleEvent = await response.json() as {
      id: string
      conferenceData?: {
        entryPoints?: Array<{ entryPointType?: string; uri?: string }>
      }
    }

    const googleSyncedAt = new Date().toISOString()
    await updateAppointmentGoogleMetadata(tenantId, appointmentId, {
      gcal_id: googleEvent.id,
      gcal_synced_at: googleSyncedAt,
    })
    await touchIntegrationSyncState(tenantId, {
      status: 'connected',
      enabled: true,
      last_sync_at: googleSyncedAt,
      last_sync_error: null,
    })

    return {
      googleEventId: googleEvent.id,
      googleCalendarId: calendarId,
      googleSyncedAt,
      googleMeetLink: googleEvent.conferenceData?.entryPoints?.find(
        (entryPoint) => entryPoint.entryPointType === 'video'
      )?.uri,
    }
  } catch (error) {
    const message = normalizeErrorMessage(error)
    console.error('[pushAppointmentToGoogle]', message)
    await touchIntegrationSyncState(tenantId, {
      status: 'error',
      last_sync_error: message,
    })
    return null
  }
}

export async function cancelAppointmentInGoogle(params: {
  tenantId: string
  appointmentId: string
  googleEventId?: string
}): Promise<{ googleSyncedAt: string } | null> {
  const { tenantId, appointmentId, googleEventId } = params
  if (!googleEventId) return null

  const validToken = await getValidGoogleToken(tenantId)
  if (!validToken) return null

  const calendarId = validToken.config.calendarId ?? 'primary'

  try {
    const response = await fetch(getGoogleEventUrl(calendarId, googleEventId), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${validToken.token.access_token}`,
      },
    })

    if (!response.ok && response.status !== 204 && response.status !== 410) {
      const errorText = await response.text()
      throw new Error(errorText || `Falha ao cancelar evento ${appointmentId} no Google Calendar.`)
    }

    const googleSyncedAt = new Date().toISOString()
    await updateAppointmentGoogleMetadata(tenantId, appointmentId, {
      gcal_synced_at: googleSyncedAt,
    })
    await touchIntegrationSyncState(tenantId, {
      status: 'connected',
      enabled: true,
      last_sync_at: googleSyncedAt,
      last_sync_error: null,
    })

    return { googleSyncedAt }
  } catch (error) {
    const message = normalizeErrorMessage(error)
    console.error('[cancelAppointmentInGoogle]', message)
    await touchIntegrationSyncState(tenantId, {
      status: 'error',
      last_sync_error: message,
    })
    return null
  }
}

