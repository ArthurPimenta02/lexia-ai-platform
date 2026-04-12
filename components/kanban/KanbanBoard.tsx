'use client'

import { useState, useRef, useCallback, useTransition } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createLead, updateLead, deleteLead, moveLeadStage } from '@/actions/leads'
import { KanbanColumn } from './KanbanColumn'
import { KanbanFormDialog } from './KanbanFormDialog'
import { KanbanDetailDialog } from './KanbanDetailDialog'
import type { Lead, LeadStage, LeadFormData } from '@/types/lead'
import type { KanbanLead, KanbanColumnConfig } from '@/types/kanban'

// ── adapter: Lead (DB) → KanbanLead (display) ────────────────────────────────

function leadToKanban(lead: Lead): KanbanLead {
  return {
    id:             lead.id,
    clientName:     lead.name,
    caseTitle:      lead.subject ?? lead.name,
    area:           (lead.area as KanbanLead['area']) ?? 'Cível',
    stageId:        lead.stageId,
    honorarios:     null,
    responsible:    lead.responsibleName ?? '—',
    origin:         lead.origin,
    nextAction:     '',
    nextActionDate: null,
    createdAt:      lead.createdAt,
    priority:       lead.urgency === 'Alta' ? 'high' : lead.urgency === 'Media' ? 'medium' : 'low',
  }
}

// ── adapter: LeadStage → KanbanColumnConfig ───────────────────────────────────

function stageToColumn(stage: LeadStage): KanbanColumnConfig {
  return {
    id:          stage.id,
    label:       stage.name,
    description: '',
    color:       stage.color,
    showValue:   stage.name === 'Proposta' || stage.name === 'Cliente',
  }
}

// ── KanbanBoard ───────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  initialLeads: Lead[]
  stages: LeadStage[]
}

export function KanbanBoard({ initialLeads, stages }: KanbanBoardProps) {
  const [leads, setLeads] = useState<KanbanLead[]>(initialLeads.map(leadToKanban))
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null)
  const [, startTransition] = useTransition()

  const columns: KanbanColumnConfig[] = stages.map(stageToColumn)

  // Drag-to-scroll state
  const boardRef = useRef<HTMLDivElement>(null)
  const isScrollDragging = useRef(false)
  const scrollStart = useRef({ x: 0, scrollLeft: 0 })

  const onBoardMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('[draggable="true"]') || target.closest('button') || target.closest('a')) return
    if (!boardRef.current) return
    isScrollDragging.current = true
    scrollStart.current = { x: e.clientX, scrollLeft: boardRef.current.scrollLeft }
    boardRef.current.style.cursor = 'grabbing'
    boardRef.current.style.userSelect = 'none'
  }, [])

  const onBoardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrollDragging.current || !boardRef.current) return
    const dx = e.clientX - scrollStart.current.x
    boardRef.current.scrollLeft = scrollStart.current.scrollLeft - dx
  }, [])

  const onBoardMouseUp = useCallback(() => {
    if (!boardRef.current) return
    isScrollDragging.current = false
    boardRef.current.style.cursor = ''
    boardRef.current.style.userSelect = ''
  }, [])

  // HTML5 drag state
  const [dragging, setDragging] = useState<KanbanLead | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const responsibles = Array.from(new Set(leads.map((l) => l.responsible).filter(r => r !== '—'))).sort()
  const areas = Array.from(new Set(leads.map((l) => l.area))).sort()

  const filtered = leads.filter((lead) => {
    const q = search.toLowerCase()
    const matchesSearch =
      q === '' ||
      lead.clientName.toLowerCase().includes(q) ||
      lead.caseTitle.toLowerCase().includes(q)
    const matchesArea = areaFilter === 'all' || lead.area === areaFilter
    const matchesResp = responsibleFilter === 'all' || lead.responsible === responsibleFilter
    return matchesSearch && matchesArea && matchesResp
  })

  function getColumnLeads(stageId: string): KanbanLead[] {
    return filtered.filter((l) => l.stageId === stageId)
  }

  function handleDrop(targetStageId: string) {
    if (!dragging || dragging.stageId === targetStageId) {
      setDragging(null)
      setDropTarget(null)
      return
    }

    // Optimistic update
    const previousStageId = dragging.stageId
    setLeads((prev) =>
      prev.map((l) => (l.id === dragging.id ? { ...l, stageId: targetStageId } : l))
    )
    setDragging(null)
    setDropTarget(null)

    startTransition(async () => {
      const result = await moveLeadStage(dragging.id, targetStageId)
      if ('error' in result) {
        // Revert on failure
        setLeads((prev) =>
          prev.map((l) => (l.id === dragging.id ? { ...l, stageId: previousStageId } : l))
        )
      }
    })
  }

  function handleSaveLead(updated: KanbanLead) {
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelectedLead(null)

    startTransition(async () => {
      const patch: Partial<LeadFormData> = {
        name:    updated.clientName,
        subject: updated.caseTitle,
        stageId: updated.stageId,
      }
      const result = await updateLead(updated.id, patch)
      if ('error' in result) {
        // Revert — reload from server would be ideal but keep simple for now
        console.error('handleSaveLead:', result.error)
      }
    })
  }

  function handleDeleteLead(id: string) {
    // Optimistic update
    setLeads((prev) => prev.filter((l) => l.id !== id))
    setSelectedLead(null)

    startTransition(async () => {
      const result = await deleteLead(id)
      if ('error' in result) {
        console.error('handleDeleteLead:', result.error)
      }
    })
  }

  function handleCreate(data: Omit<KanbanLead, 'id' | 'createdAt'>) {
    const formData: LeadFormData = {
      name:    data.clientName,
      email:   '',
      phone:   '',
      cpf:     '',
      subject: data.caseTitle,
      stageId: data.stageId,
      origin:  data.origin,
      urgency: data.priority === 'high' ? 'Alta' : data.priority === 'medium' ? 'Media' : 'Baixa',
    }

    startTransition(async () => {
      const result = await createLead(formData)
      if ('error' in result) {
        console.error('handleCreate:', result.error)
        return
      }
      // Add optimistic card with real id
      const newCard: KanbanLead = {
        ...data,
        id: result.id,
        createdAt: new Date().toISOString(),
      }
      setLeads((prev) => [newCard, ...prev])
    })

    setCreateOpen(false)
  }

  // Stats
  const terminalStageIds = new Set(stages.filter(s => s.isTerminal).map(s => s.id))
  const activeLeads = leads.filter((l) => !terminalStageIds.has(l.stageId)).length

  const valueStageNames = new Set(['Proposta', 'Cliente'])
  const valueStageIds = new Set(stages.filter(s => valueStageNames.has(s.name)).map(s => s.id))
  const pipelineValue = leads
    .filter((l) => valueStageIds.has(l.stageId))
    .reduce((sum, l) => sum + (l.honorarios ?? 0), 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)

  const selectClass = cn(
    'h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground',
    'outline-none focus-visible:border-ring dark:[color-scheme:dark] transition-colors'
  )

  const defaultStageId = stages.find(s => s.isDefault)?.id ?? stages[0]?.id ?? ''

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] flex-col gap-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente ou caso…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <select
          className={selectClass}
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          aria-label="Filtrar por área"
        >
          <option value="all">Todas as áreas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          className={selectClass}
          value={responsibleFilter}
          onChange={(e) => setResponsibleFilter(e.target.value)}
          aria-label="Filtrar por responsável"
        >
          <option value="all">Todos</option>
          {responsibles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{activeLeads}</span> ativos
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {fmt(pipelineValue)}
            </span>
          </div>

          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Caso
          </Button>
        </div>
      </div>

      {/* Board — horizontal scroll + drag-to-pan */}
      <div
        ref={boardRef}
        className="flex gap-4 overflow-x-auto pb-4 cursor-grab"
        onMouseDown={onBoardMouseDown}
        onMouseMove={onBoardMouseMove}
        onMouseUp={onBoardMouseUp}
        onMouseLeave={onBoardMouseUp}
      >
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            leads={getColumnLeads(col.id)}
            isDropTarget={dropTarget === col.id && dragging?.stageId !== col.id}
            draggingId={dragging?.id ?? null}
            onDragStart={(lead) => setDragging(lead)}
            onDragEnd={() => { setDragging(null); setDropTarget(null) }}
            onDragOver={(e) => { e.preventDefault(); setDropTarget(col.id) }}
            onDrop={() => handleDrop(col.id)}
            onDragLeave={() => setDropTarget(null)}
            onCardClick={(lead) => setSelectedLead(lead)}
          />
        ))}
      </div>

      <KanbanDetailDialog
        lead={selectedLead}
        open={selectedLead !== null}
        onOpenChange={(o) => { if (!o) setSelectedLead(null) }}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        stages={columns}
      />

      <KanbanFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialStageId={defaultStageId}
        onSubmit={handleCreate}
        stages={columns}
      />
    </div>
  )
}
