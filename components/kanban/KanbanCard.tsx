'use client'

import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KanbanLead } from '@/types/kanban'

interface KanbanCardProps {
  lead: KanbanLead
  isDragging?: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
}

function formatHonorarios(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getDeadlineStatus(dateStr: string | null): {
  label: string
  urgent: boolean
} {
  if (!dateStr) return { label: '', urgent: false }
  const now = new Date('2026-04-10T12:00:00Z')
  const date = new Date(dateStr)
  const diffMs = date.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffMs < 0) return { label: 'Atrasado', urgent: true }
  if (diffHours <= 8)
    return {
      label: `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      urgent: true,
    }
  if (diffDays <= 1) return { label: 'Amanhã', urgent: false }
  return {
    label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    urgent: false,
  }
}

export function KanbanCard({ lead, isDragging, onDragStart, onDragEnd, onClick }: KanbanCardProps) {
  const deadline = getDeadlineStatus(lead.nextActionDate)

  const initials = lead.responsible
    .replace(/^(Dr\.|Dra\.)\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart() }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm',
        'transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md',
        'active:cursor-grabbing',
        isDragging && 'rotate-[1.5deg] opacity-50',
        lead.priority === 'high' && 'border-l-[3px] border-l-red-400',
        lead.priority === 'medium' && 'border-l-[3px] border-l-amber-400',
      )}
    >
      {/* Area badge — neutral, no colored text */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
          {lead.area}
        </span>
        <span className="text-[10px] text-muted-foreground/70">{lead.origin}</span>
      </div>

      {/* Case title */}
      <p className="mb-0.5 text-sm font-medium text-card-foreground leading-snug">
        {lead.caseTitle}
      </p>

      {/* Client */}
      <p className="mb-2.5 text-xs text-muted-foreground">{lead.clientName}</p>

      {/* Honorários */}
      {lead.honorarios !== null && (
        <p className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {formatHonorarios(lead.honorarios)}
        </p>
      )}

      {/* Footer: avatar + deadline */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground shrink-0">
          {initials}
        </div>

        {deadline.label && (
          <div
            className={cn(
              'flex items-center gap-1 text-[11px]',
              deadline.urgent
                ? 'text-red-500 dark:text-red-400'
                : 'text-muted-foreground'
            )}
          >
            {deadline.urgent ? (
              <AlertCircle className="h-3 w-3 shrink-0" />
            ) : (
              <Clock className="h-3 w-3 shrink-0" />
            )}
            {deadline.label}
          </div>
        )}
      </div>
    </div>
  )
}
