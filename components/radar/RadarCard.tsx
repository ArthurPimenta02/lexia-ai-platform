'use client'

import { BriefcaseBusiness, AlertCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RadarTipoBadge, RadarUrgenciaBadge, RadarStatusBadge } from './RadarBadge'
import { RADAR_ORIGEM_LABELS } from '@/types/radar'
import type { RadarItem } from '@/types/radar'

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (mins < 60) return `há ${mins}min`
  if (hours < 24) return `há ${hours}h`
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`
  return `há ${Math.floor(days / 30)} mês`
}

interface RadarCardProps {
  item: RadarItem
  onClick: (item: RadarItem) => void
}

export function RadarCard({ item, onClick }: RadarCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(item)}
      className={cn(
        'relative rounded-lg border bg-card shadow-sm cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        item.exigeAcao && 'border-l-4 border-l-amber-500'
      )}
    >
      {/* Exige ação badge */}
      {item.exigeAcao && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
          <AlertCircle className="h-2.5 w-2.5" />
          Ação
        </span>
      )}

      <div className="p-4 space-y-3">
        {/* Row 1: badges */}
        <div className="flex flex-wrap items-center gap-1.5 pr-16">
          <RadarTipoBadge tipo={item.tipo} />
          <RadarUrgenciaBadge urgencia={item.urgencia} />
          <RadarStatusBadge status={item.status} className="ml-auto" />
        </div>

        {/* Row 2: title */}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {item.titulo}
        </p>

        {/* Row 3: caso + cliente */}
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span className="truncate font-medium text-foreground/70">{item.casoTitulo}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground -mt-1.5">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.cliente}</span>
        </div>

        {/* Row 4: metadata */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wide">
            {RADAR_ORIGEM_LABELS[item.origem]}
          </span>
          <span className="text-[11px] text-muted-foreground">{formatRelative(item.data)}</span>
        </div>
      </div>
    </div>
  )
}
