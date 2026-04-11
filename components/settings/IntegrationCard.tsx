'use client'

import {
  MessageCircle,
  CalendarDays,
  Search,
  FolderSync,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Integration, IntegrationStatus } from '@/types/settings'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, React.ElementType> = {
  MessageCircle,
  CalendarDays,
  Search,
  FolderSync,
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Conectado
      </span>
    )
  }
  if (status === 'disconnected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        Desconectado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <Clock className="h-3 w-3" />
      Em breve
    </span>
  )
}

interface IntegrationCardProps {
  integration: Integration
  onToggle: (id: string) => void
}

export function IntegrationCard({ integration, onToggle }: IntegrationCardProps) {
  const Icon = ICON_MAP[integration.logoIcon] ?? MessageCircle
  const isComingSoon = integration.status === 'coming_soon'

  return (
    <Card className={cn('transition-opacity', isComingSoon && 'opacity-70')}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            integration.connected
              ? 'bg-brand/10 text-brand'
              : isComingSoon
              ? 'bg-muted text-muted-foreground'
              : 'bg-red-50 text-red-500 dark:bg-red-950/40'
          )}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{integration.name}</span>
              <StatusBadge status={integration.status} />
            </div>

            {/* Description */}
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {integration.description}
            </p>

            {/* Last sync */}
            {integration.lastSyncAt && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Última sincronização: {integration.lastSyncAt}
              </p>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-3">
              {/* Toggle on/off */}
              {!isComingSoon && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={integration.enabled}
                  aria-label={`${integration.enabled ? 'Desabilitar' : 'Habilitar'} ${integration.name}`}
                  onClick={() => onToggle(integration.id)}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                    integration.enabled ? 'bg-brand' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                      integration.enabled ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              )}

              {/* Primary CTA */}
              <Button
                variant={isComingSoon ? 'outline' : integration.connected ? 'outline' : 'default'}
                size="sm"
                disabled={isComingSoon}
                className="h-7 text-xs"
              >
                {integration.primaryAction}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
