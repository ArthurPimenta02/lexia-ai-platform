'use client'

import { useState } from 'react'
import { BriefcaseBusiness, AlertCircle, User, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RadarTipoBadge, RadarUrgenciaBadge, RadarStatusBadge } from './RadarBadge'
import { RADAR_ORIGEM_LABELS } from '@/types/radar'
import { deleteRadarItem } from '@/actions/radar'
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
  onDelete: (itemId: string) => void
}

export function RadarCard({ item, onClick, onDelete }: RadarCardProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Excluir "${item.titulo}"?`)) return
    setDeleting(true)
    const result = await deleteRadarItem(item.id)
    if ('error' in result) {
      console.error(result.error)
      setDeleting(false)
    } else {
      onDelete(item.id)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(item)}
      className={cn(
        'group relative rounded-lg border bg-card shadow-sm cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        item.exigeAcao && 'border-l-4 border-l-amber-500',
        deleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Botão excluir — aparece no hover */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 z-10 hidden group-hover:flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        aria-label="Excluir item"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="p-4 space-y-2.5">
        {/* Row 1: tipo + urgência */}
        <div className="flex items-center gap-1.5">
          <RadarTipoBadge tipo={item.tipo} />
          <RadarUrgenciaBadge urgencia={item.urgencia} />
        </div>

        {/* Row 2: título */}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug pr-4">
          {item.titulo}
        </p>

        {/* Row 3: caso + cliente */}
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

        {/* Row 4: rodapé */}
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
