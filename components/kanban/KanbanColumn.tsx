'use client'

import { cn } from '@/lib/utils'
import { KanbanCard } from './KanbanCard'
import type { KanbanColumnConfig, KanbanLead } from '@/types/kanban'

interface KanbanColumnProps {
  column: KanbanColumnConfig
  leads: KanbanLead[]
  isDropTarget: boolean
  draggingId: string | null
  onDragStart: (lead: KanbanLead) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragLeave: () => void
  onCardClick: (lead: KanbanLead) => void
}

function formatTotal(leads: KanbanLead[]): string | null {
  const total = leads.reduce((sum, l) => sum + (l.honorarios ?? 0), 0)
  if (total === 0) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(total)
}

export function KanbanColumn({
  column,
  leads,
  isDropTarget,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
  onCardClick,
}: KanbanColumnProps) {
  const total = column.showValue ? formatTotal(leads) : null

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={cn(
        'min-w-[280px] max-w-[280px] rounded-xl p-3 transition-all duration-200',
        'bg-muted/50 border-2',
        isDropTarget
          ? 'border-primary/50 border-dashed bg-primary/5'
          : 'border-transparent'
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h2 className="text-sm font-semibold text-foreground">
            {column.label}
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {leads.length}
          </span>
        </div>
        {total && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {total}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex min-h-[80px] flex-col gap-2">
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            isDragging={draggingId === lead.id}
            onDragStart={() => onDragStart(lead)}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick(lead)}
          />
        ))}

        {leads.length === 0 && !isDropTarget && (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground/50">Nenhum caso aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}
