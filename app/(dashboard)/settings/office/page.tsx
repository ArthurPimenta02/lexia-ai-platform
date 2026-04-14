import { redirect } from 'next/navigation'
import { OfficeForm } from '@/components/settings/OfficeForm'
import { getTenantSettings } from '@/actions/settings'
import { createClient } from '@/lib/supabase/server'
import { canManageSettings } from '@/lib/permissions'
import type { UserRole } from '@/types/database'

export default async function SettingsOfficePage() {
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
          <h1 className="text-lg font-semibold">Escritorio</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Dados de identificacao e contato do seu escritorio.
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

  const result = await getTenantSettings()
  const error = 'error' in result ? result.error : null
  const initial = 'error' in result ? null : result.office

  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Escritório</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Dados de identificação e contato do seu escritório.
        </p>
      </div>
      {error || !initial ? (
        <div className="p-6">
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error ?? 'Nao foi possivel carregar as configuracoes do escritorio.'}
          </p>
        </div>
      ) : (
        <OfficeForm initial={initial} />
      )}
    </div>
  )
}
