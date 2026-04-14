'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { disconnectGoogleCalendar } from '@/actions/google-calendar'
import { setIntegrationEnabled } from '@/actions/settings'
import { IntegrationCard } from './IntegrationCard'
import type { Integration } from '@/types/settings'

interface IntegrationsClientProps {
  initial: Integration[]
}

export function IntegrationsClient({ initial }: IntegrationsClientProps) {
  const router = useRouter()
  const [integrations, setIntegrations] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  function handleToggle(id: string) {
    const target = integrations.find((item) => item.id === id)
    if (!target) return
    const nextEnabled = !target.enabled
    setActionError(null)

    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, enabled: nextEnabled } : integration
      )
    )

    startTransition(async () => {
      const result = await setIntegrationEnabled(target.type, nextEnabled)
      if ('error' in result) {
        setIntegrations((prev) =>
          prev.map((integration) =>
            integration.id === id ? { ...integration, enabled: target.enabled } : integration
          )
        )
        setActionError(result.error)
        return
      }

      router.refresh()
    })
  }

  function handlePrimaryAction(integration: Integration) {
    if (integration.type !== 'google_calendar') return

    if (!integration.connected) {
      window.location.href = '/api/integrations/google/start'
      return
    }

    startTransition(async () => {
      setActionError(null)
      const result = await disconnectGoogleCalendar()
      if ('error' in result) {
        setActionError(result.error ?? 'Erro ao atualizar integracao.')
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
      {actionError ? (
        <p className="text-xs text-destructive">{actionError}</p>
      ) : null}
    </div>
  )
}
