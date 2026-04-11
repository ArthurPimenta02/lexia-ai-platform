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
      <div className="p-4 space-y-2.5">
        {/* Row 1: tipo + urgência (prioridade visual máxima) */}
        <div className="flex items-center gap-1.5">
          <RadarTipoBadge tipo={item.tipo} />
          <RadarUrgenciaBadge urgencia={item.urgencia} />
        </div>

        {/* Row 2: título */}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {item.titulo}
        </p>

        {/* Row 3: caso + cliente — discretos, mesma linha quando possível */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BriefcaseBusiness className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{item.casoTitulo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{item.cliente}</span>
          </div>
        </div>

        {/* Row 4: rodapé — status, origem e tempo no mesmo nível, todos discretos */}
        <div className="flex items-center gap-2 pt-0.5">
          <RadarStatusBadge status={item.status} />
          {item.exigeAcao && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
              <AlertCircle className="h-2.5 w-2.5" />
              Exige ação
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground/70">
            {RADAR_ORIGEM_LABELS[item.origem]} · {formatRelative(item.data)}
          </span>
        </div>
      </div>
    </div>
  )
}
