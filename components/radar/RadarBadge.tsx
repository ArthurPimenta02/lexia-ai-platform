import { cn } from '@/lib/utils'
import {
  FileText,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  RADAR_TIPO_COLORS,
  RADAR_TIPO_LABELS,
  RADAR_URGENCIA_COLORS,
  RADAR_URGENCIA_LABELS,
  RADAR_STATUS_COLORS,
  RADAR_STATUS_LABELS,
} from '@/types/radar'
import type { RadarTipo, RadarUrgencia, RadarStatus } from '@/types/radar'

const TIPO_ICONS: Record<RadarTipo, React.ElementType> = {
  publicacao: FileText,
  movimentacao: Activity,
  alerta_prazo: Clock,
  acao_requerida: AlertCircle,
}

export function RadarTipoBadge({
  tipo,
  className,
}: {
  tipo: RadarTipo
  className?: string
}) {
  const color = RADAR_TIPO_COLORS[tipo]
  const Icon = TIPO_ICONS[tipo]

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
      <Icon className="h-3 w-3 flex-shrink-0" />
      {RADAR_TIPO_LABELS[tipo]}
    </span>
  )
}

export function RadarUrgenciaBadge({
  urgencia,
  className,
}: {
  urgencia: RadarUrgencia
  className?: string
}) {
  const color = RADAR_URGENCIA_COLORS[urgencia]
  const arrow = urgencia === 'Alta' ? '↑' : urgencia === 'Media' ? '→' : '↓'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <span>{arrow}</span>
      {RADAR_URGENCIA_LABELS[urgencia]}
    </span>
  )
}

export function RadarStatusBadge({
  status,
  className,
}: {
  status: RadarStatus
  className?: string
}) {
  const color = RADAR_STATUS_COLORS[status]

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
      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {RADAR_STATUS_LABELS[status]}
    </span>
  )
}
