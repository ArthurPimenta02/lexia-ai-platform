'use client'

import { useState } from 'react'
import { IntegrationCard } from './IntegrationCard'
import type { Integration } from '@/types/settings'

interface IntegrationsClientProps {
  initial: Integration[]
}

export function IntegrationsClient({ initial }: IntegrationsClientProps) {
  const [integrations, setIntegrations] = useState(initial)

  function handleToggle(id: string) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
