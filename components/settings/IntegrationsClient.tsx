'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { disconnectGoogleCalendar } from '@/actions/google-calendar'
import { IntegrationCard } from './IntegrationCard'
import type { Integration } from '@/types/settings'

interface IntegrationsClientProps {
  initial: Integration[]
}

export function IntegrationsClient({ initial }: IntegrationsClientProps) {
  const router = useRouter()
  const [integrations, setIntegrations] = useState(initial)
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string) {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, enabled: !integration.enabled } : integration
      )
    )
  }

  function handlePrimaryAction(integration: Integration) {
    if (integration.type !== 'google_calendar') return

    if (!integration.connected) {
      window.location.href = '/api/integrations/google/start'
      return
    }

    startTransition(async () => {
      const result = await disconnectGoogleCalendar()
      if ('error' in result) {
        alert(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onToggle={handleToggle}
            onPrimaryAction={handlePrimaryAction}
          />
        ))}
      </div>
      {isPending ? (
        <p className="text-xs text-muted-foreground">
          Atualizando integração do Google Calendar…
        </p>
      ) : null}
    </div>
  )
}
