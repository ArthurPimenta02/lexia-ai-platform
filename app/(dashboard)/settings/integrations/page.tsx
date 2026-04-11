import { IntegrationsClient } from '@/components/settings/IntegrationsClient'
import { MOCK_INTEGRATIONS } from '@/lib/mock/settings'

export default function SettingsIntegrationsPage() {
  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Integrações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Conecte o escritório às ferramentas que sua equipe já usa.
        </p>
      </div>
      <div className="p-6">
        <IntegrationsClient initial={MOCK_INTEGRATIONS} />
      </div>
    </div>
  )
}
