'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  canManageSettings,
  canManageUsers,
  type AppJwtClaims,
} from '@/lib/permissions'
import type {
  AgentSettings,
  Integration,
  IntegrationType,
  OfficeSettings,
  PracticeArea,
} from '@/types/settings'
import type { IntegrationRow, TenantRow, UserRole } from '@/types/database'
import { MOCK_INTEGRATIONS } from '@/lib/mock/settings'

interface SettingsContext {
  userId: string
  tenantId: string
  role: UserRole
}

const OFFICE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const DEFAULT_AGENT_SETTINGS: Omit<AgentSettings, 'id' | 'tenantId' | 'updatedAt'> = {
  tone: 'neutral',
  practiceAreas: ['Trabalhista'] as PracticeArea[],
  businessHours: [
    { dayOfWeek: 0, enabled: false, start: '08:00', end: '18:00' },
    { dayOfWeek: 1, enabled: true, start: '08:00', end: '18:00' },
    { dayOfWeek: 2, enabled: true, start: '08:00', end: '18:00' },
    { dayOfWeek: 3, enabled: true, start: '08:00', end: '18:00' },
    { dayOfWeek: 4, enabled: true, start: '08:00', end: '18:00' },
    { dayOfWeek: 5, enabled: true, start: '08:00', end: '17:00' },
    { dayOfWeek: 6, enabled: false, start: '09:00', end: '12:00' },
  ],
  greetingMessage: '',
  closingMessage: '',
  outOfHoursMessage: '',
  noContextMessage: '',
  handoffRules: {
    autoHandoffOnKeywords: [],
    handoffAfterXMessages: 8,
    handoffMessage: '',
    notifyUserId: undefined,
    fallbackOnNoContext: true,
    fallbackOnOutOfHours: false,
  },
  activeChannels: ['whatsapp'],
}

async function getSettingsContext(): Promise<{ error: string } | SettingsContext> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Nao autenticado.' }
  }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) {
    return { error: 'tenant_id nao encontrado na sessao.' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (membershipError || !membership) {
    return { error: 'Nao foi possivel validar o papel do usuario.' }
  }

  return {
    userId: user.id,
    tenantId,
    role: membership.role as UserRole,
  }
}

function generateOfficeCodeCandidate(length = 8) {
  let code = ''
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * OFFICE_CODE_CHARS.length)
    code += OFFICE_CODE_CHARS[randomIndex]
  }

  return code
}

async function ensureOfficeCode(
  service: ReturnType<typeof createServiceClient>,
  tenant: TenantRow
): Promise<{ officeCode: string | null; error?: string }> {
  if (tenant.office_code?.trim()) {
    return { officeCode: tenant.office_code.trim().toUpperCase() }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOfficeCodeCandidate()
    const { error } = await service
      .from('tenants')
      .update({ office_code: candidate })
      .eq('id', tenant.id)
      .is('deleted_at', null)

    if (!error) {
      return { officeCode: candidate }
    }

    const message =
      error?.message ||
      error?.details ||
      error?.hint ||
      error?.code ||
      'Falha desconhecida ao gerar o codigo do escritorio.'

    if (
      message.includes('office_code') ||
      message.includes("Could not find the 'office_code' column") ||
      message.includes('schema cache')
    ) {
      return {
        officeCode: null,
        error: 'O campo office_code ainda nao existe no banco remoto. Aplique a migration 029_workspace_profile_assets.sql no Supabase.',
      }
    }
  }

  return {
    officeCode: null,
    error: 'Nao foi possivel gerar o codigo do escritorio neste ambiente.',
  }
}

async function ensurePublicBucket(
  service: ReturnType<typeof createServiceClient>,
  bucket: string
) {
  const { data: currentBucket, error: readError } = await service.storage.getBucket(bucket)
  if (currentBucket) return

  const statusCode = typeof readError?.statusCode === 'string'
    ? Number.parseInt(readError.statusCode, 10)
    : undefined

  if (readError && readError.status !== 404 && statusCode !== 404) {
    throw readError
  }

  const { error: createError } = await service.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
  })

  if (createError && createError.message !== 'The resource already exists') {
    throw createError
  }
}

function toOfficeSettings(tenant: TenantRow, officeCode: string): OfficeSettings {
  const address = (tenant.address ?? {}) as Record<string, string>

  return {
    id: tenant.id,
    tenantId: tenant.id,
    name: tenant.name,
    displayName: tenant.display_name,
    officeCode,
    cnpj: tenant.cnpj ?? '',
    email: tenant.email,
    phone: tenant.phone ?? '',
    address: {
      street: address.street ?? '',
      number: address.number ?? '',
      complement: address.complement ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      zip: address.zip ?? '',
    },
    timezone: tenant.timezone ?? 'America/Sao_Paulo',
    primaryPracticeArea: tenant.primary_practice_area ?? 'Trabalhista',
    logoUrl: tenant.logo_url ?? undefined,
    updatedAt: tenant.updated_at,
  }
}

function toAgentSettings(tenant: TenantRow): AgentSettings {
  const config = (tenant.agent_config ?? {}) as Partial<AgentSettings>

  return {
    id: tenant.id,
    tenantId: tenant.id,
    tone: config.tone ?? DEFAULT_AGENT_SETTINGS.tone,
    practiceAreas: (config.practiceAreas as PracticeArea[] | undefined) ?? DEFAULT_AGENT_SETTINGS.practiceAreas,
    businessHours: config.businessHours ?? DEFAULT_AGENT_SETTINGS.businessHours,
    greetingMessage: config.greetingMessage ?? DEFAULT_AGENT_SETTINGS.greetingMessage,
    closingMessage: config.closingMessage ?? DEFAULT_AGENT_SETTINGS.closingMessage,
    outOfHoursMessage: config.outOfHoursMessage ?? DEFAULT_AGENT_SETTINGS.outOfHoursMessage,
    noContextMessage: config.noContextMessage ?? DEFAULT_AGENT_SETTINGS.noContextMessage,
    handoffRules: config.handoffRules ?? DEFAULT_AGENT_SETTINGS.handoffRules,
    activeChannels: config.activeChannels ?? DEFAULT_AGENT_SETTINGS.activeChannels,
    updatedAt: tenant.updated_at,
  }
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

function mapIntegrations(rows: IntegrationRow[]): Integration[] {
  const byType = new Map(rows.map((row) => [row.type, row]))

  return MOCK_INTEGRATIONS.map((integration) => {
    const row = byType.get(integration.type)
    if (!row) return integration

    const config = (row.config ?? {}) as Record<string, string>
    const connectionDetails =
      integration.type === 'google_calendar'
        ? [config.calendarSummary, config.accountEmail].filter(Boolean).join(' - ') || undefined
        : integration.connectionDetails

    const primaryAction =
      integration.type === 'google_calendar'
        ? row.enabled && row.status === 'connected'
          ? 'Desconectar'
          : 'Conectar'
        : integration.primaryAction

    return {
      ...integration,
      status: row.status,
      connected: row.status === 'connected' && row.enabled,
      enabled: row.enabled,
      lastSyncAt: formatSyncDate(row.last_sync_at),
      errorMessage: row.last_sync_error ?? undefined,
      connectionDetails,
      primaryAction,
    }
  })
}

export async function getTenantSettings():
Promise<
  | { error: string }
  | {
      office: OfficeSettings
      agent: AgentSettings
      claims: AppJwtClaims
    }
> {
  const context = await getSettingsContext()
  if ('error' in context) return { error: context.error }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', context.tenantId)
    .single()

  if (error || !data) {
    return { error: 'Nao foi possivel carregar as configuracoes.' }
  }

  const tenant = data as unknown as TenantRow
  const service = createServiceClient()
  const officeCodeResult = await ensureOfficeCode(service, tenant)
  if (!officeCodeResult.officeCode) {
    return {
      error:
        officeCodeResult.error ??
        'Nao foi possivel carregar o codigo do escritorio.',
    }
  }

  return {
    office: toOfficeSettings(tenant, officeCodeResult.officeCode),
    agent: toAgentSettings(tenant),
    claims: {
      tenant_id: context.tenantId,
      app_role: context.role,
    },
  }
}

export async function getSettingsIntegrations(): Promise<Integration[]> {
  const context = await getSettingsContext()
  if ('error' in context) return MOCK_INTEGRATIONS

  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('id, tenant_id, type, status, config, secret_ref, enabled, last_sync_at, last_sync_error, created_at, updated_at')
    .eq('tenant_id', context.tenantId)

  const rows = (data ?? []) as unknown as IntegrationRow[]
  return mapIntegrations(rows)
}

export async function updateTenantSettings(
  input: OfficeSettings
): Promise<{ success: true } | { error: string }> {
  const context = await getSettingsContext()
  if ('error' in context) return { error: context.error }
  if (!canManageSettings(context.role)) {
    return { error: 'Sem permissao para editar configuracoes.' }
  }

  if (!input.name.trim() || !input.email.trim()) {
    return { error: 'Nome e email sao obrigatorios.' }
  }

  const service = createServiceClient()
  const { error } = await service
    .from('tenants')
    .update({
      name: input.name.trim(),
      display_name: input.displayName.trim() || input.name.trim(),
      cnpj: input.cnpj.trim() || null,
      email: input.email.trim(),
      phone: input.phone.trim() || null,
      timezone: input.timezone,
      primary_practice_area: input.primaryPracticeArea.trim() || null,
      logo_url: input.logoUrl ?? null,
      address: {
        street: input.address.street ?? '',
        number: input.address.number ?? '',
        complement: input.address.complement ?? '',
        city: input.address.city ?? '',
        state: input.address.state ?? '',
        zip: input.address.zip ?? '',
      },
    })
    .eq('id', context.tenantId)

  if (error) {
    console.error('[updateTenantSettings]', error)
    return { error: 'Erro ao salvar dados do escritorio.' }
  }

  revalidatePath('/settings/office')
  return { success: true }
}

export async function uploadTenantLogo(
  formData: FormData
): Promise<{ success: true; url: string } | { error: string }> {
  const context = await getSettingsContext()
  if ('error' in context) return { error: context.error }
  if (!canManageSettings(context.role)) {
    return { error: 'Sem permissao para alterar a logo do escritorio.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecione uma imagem valida.' }
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'O arquivo precisa ser uma imagem.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'A imagem deve ter no maximo 5MB.' }
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? 'png' : 'png'
  const path = `${context.tenantId}/logo.${extension}`
  const service = createServiceClient()

  try {
    await ensurePublicBucket(service, 'tenant-assets')
  } catch (bucketError) {
    console.error('[uploadTenantLogo][bucket]', bucketError)
    return { error: 'Erro ao preparar o storage da logo do escritorio.' }
  }

  let uploadResult = await service.storage
    .from('tenant-assets')
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    })

  const uploadStatusCode =
    typeof uploadResult.error?.statusCode === 'string'
      ? Number.parseInt(uploadResult.error.statusCode, 10)
      : undefined

  if (uploadResult.error && (uploadResult.error.status === 404 || uploadStatusCode === 404)) {
    try {
      await ensurePublicBucket(service, 'tenant-assets')
      uploadResult = await service.storage
        .from('tenant-assets')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        })
    } catch (bucketError) {
      console.error('[uploadTenantLogo][retry-bucket]', bucketError)
      return { error: 'Erro ao preparar o storage da logo do escritorio.' }
    }
  }

  if (uploadResult.error) {
    console.error('[uploadTenantLogo]', uploadResult.error)
    return { error: 'Erro ao enviar a logo do escritorio.' }
  }

  const { data } = service.storage.from('tenant-assets').getPublicUrl(path)
  const publicUrl = data.publicUrl

  const { error: updateError } = await service
    .from('tenants')
    .update({ logo_url: publicUrl })
    .eq('id', context.tenantId)

  if (updateError) {
    console.error('[uploadTenantLogo][update]', updateError)
    return { error: 'Erro ao salvar a logo do escritorio.' }
  }

  revalidatePath('/settings/office')
  return { success: true, url: publicUrl }
}

export async function updateAgentSettings(
  input: AgentSettings
): Promise<{ success: true } | { error: string }> {
  const context = await getSettingsContext()
  if ('error' in context) return { error: context.error }
  if (!canManageSettings(context.role)) {
    return { error: 'Sem permissao para editar configuracoes do agente.' }
  }

  const service = createServiceClient()
  const { error } = await service
    .from('tenants')
    .update({
      agent_config: {
        tone: input.tone,
        practiceAreas: input.practiceAreas,
        businessHours: input.businessHours,
        greetingMessage: input.greetingMessage,
        closingMessage: input.closingMessage,
        outOfHoursMessage: input.outOfHoursMessage,
        noContextMessage: input.noContextMessage,
        handoffRules: input.handoffRules,
        activeChannels: input.activeChannels,
      },
    })
    .eq('id', context.tenantId)

  if (error) {
    console.error('[updateAgentSettings]', error)
    return { error: 'Erro ao salvar configuracoes do agente.' }
  }

  revalidatePath('/settings/agent')
  return { success: true }
}

export async function setIntegrationEnabled(
  type: IntegrationType,
  enabled: boolean
): Promise<{ success: true } | { error: string }> {
  const context = await getSettingsContext()
  if ('error' in context) return { error: context.error }
  if (!canManageUsers(context.role)) {
    return { error: 'Sem permissao para gerenciar integracoes.' }
  }

  const service = createServiceClient()

  if (type === 'google_calendar') {
    const { error } = await service
      .from('integrations')
      .update({ enabled })
      .eq('tenant_id', context.tenantId)
      .eq('type', type)

    if (error) return { error: 'Erro ao atualizar integracao do Google Calendar.' }
  } else {
    const base = MOCK_INTEGRATIONS.find((item) => item.type === type)
    const { error } = await service
      .from('integrations')
      .upsert(
        {
          tenant_id: context.tenantId,
          type,
          status: enabled ? 'connected' : 'disconnected',
          enabled,
          config: {},
          last_sync_error: null,
        },
        { onConflict: 'tenant_id,type' }
      )

    if (error) {
      console.error('[setIntegrationEnabled]', error)
      return { error: `Erro ao atualizar integracao ${base?.name ?? type}.` }
    }
  }

  revalidatePath('/settings/integrations')
  return { success: true }
}
