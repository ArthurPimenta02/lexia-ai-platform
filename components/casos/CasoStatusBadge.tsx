import { CASO_STATUS_COLORS, CASO_AREA_COLORS, URGENCIA_COLORS } from '@/types/caso'
import type { CasoStatus, CasoArea, UrgenciaNivel } from '@/types/caso'
import { cn } from '@/lib/utils'

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface CasoStatusBadgeProps {
  status: CasoStatus
  className?: string
}

export function CasoStatusBadge({ status, className }: CasoStatusBadgeProps) {
  const color = CASO_STATUS_COLORS[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {status}
    </span>
  )
}

// ─── Área Badge ───────────────────────────────────────────────────────────────

interface CasoAreaBadgeProps {
  area: CasoArea
  className?: string
}

export function CasoAreaBadge({ area, className }: CasoAreaBadgeProps) {
  const color = CASO_AREA_COLORS[area]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}35`,
      }}
    >
      {area}
    </span>
  )
}

// ─── Urgência Badge ───────────────────────────────────────────────────────────

interface UrgenciaBadgeProps {
  urgencia: UrgenciaNivel
  className?: string
}

export function UrgenciaBadge({ urgencia, className }: UrgenciaBadgeProps) {
  const color = URGENCIA_COLORS[urgencia]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {urgencia === 'Alta' && '↑ '}
      {urgencia === 'Baixa' && '↓ '}
      {urgencia}
    </span>
  )
}
