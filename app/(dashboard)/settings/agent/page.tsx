import { AgentForm } from '@/components/settings/AgentForm'
import { MOCK_AGENT } from '@/lib/mock/settings'

export default function SettingsAgentPage() {
  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Agente IA</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure o comportamento do agente de atendimento do seu escritório.
        </p>
      </div>
      <AgentForm initial={MOCK_AGENT} />
    </div>
  )
}
