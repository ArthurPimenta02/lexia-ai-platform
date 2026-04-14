import { redirect } from 'next/navigation'
import { getSettingsIntegrations } from '@/actions/settings'
import { IntegrationsClient } from '@/components/settings/IntegrationsClient'
import { createClient } from '@/lib/supabase/server'
import { canManageSettings } from '@/lib/permissions'
import type { UserRole } from '@/types/database'

interface SettingsIntegrationsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getBannerMessage(status?: string, reason?: string) {
  if (status === 'connected') {
    return {
      tone: 'success',
      text: 'Google Calendar conectado com sucesso.',
    } as const
  }

  if (status === 'forbidden') {
    return {
      tone: 'error',
      text: 'Apenas admin ou manager podem gerenciar a integração com Google Calendar.',
    } as const
  }

  if (status === 'error') {
    return {
      tone: 'error',
      text: `Falha ao conectar Google Calendar${reason ? `: ${reason}` : '.'}`,
    } as const
  }

  return null
}

export default async function SettingsIntegrationsPage({
  searchParams,
}: SettingsIntegrationsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = user?.user_metadata?.tenant_id as string | undefined

  if (!tenantId || !user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('users')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const role = (membership?.role as UserRole | undefined) ?? 'viewer'
  if (!canManageSettings(role)) {
    return (
      <div className="max-w-2xl">
        <div className="border-b border-border px-6 py-5">
          <h1 className="text-lg font-semibold">Integracoes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Conecte o escritorio as ferramentas que sua equipe ja usa.
          </p>
        </div>
        <div className="p-6">
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Voce nao tem permissao para acessar esta tela.
          </p>
        </div>
      </div>
    )
  }

  const [integrations, rawParams] = await Promise.all([
    getSettingsIntegrations(),
    searchParams ?? Promise.resolve({}),
  ])
  const params = rawParams as Record<string, string | string[] | undefined>

  const googleStatus = typeof params.google === 'string' ? params.google : undefined
  const reason = typeof params.reason === 'string' ? params.reason : undefined
  const banner = getBannerMessage(googleStatus, reason)
  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Integrações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Conecte o escritório às ferramentas que sua equipe já usa.
        </p>
      </div>
      <div className="p-6">
        {banner ? (
          <div
            className={
              banner.tone === 'success'
                ? 'mb-4 rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'
            }
          >
            {banner.text}
          </div>
        ) : null}
        <IntegrationsClient initial={integrations} />
      </div>
    </div>
  )
}
