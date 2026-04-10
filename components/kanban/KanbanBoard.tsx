'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MOCK_KANBAN_LEADS } from '@/lib/mock/kanban'
import { KANBAN_COLUMNS } from '@/types/kanban'
import { KanbanColumn } from './KanbanColumn'
import { KanbanFormDialog } from './KanbanFormDialog'
import { KanbanDetailDialog } from './KanbanDetailDialog'
import type { KanbanLead, KanbanStage } from '@/types/kanban'

type FormData = Omit<KanbanLead, 'id' | 'createdAt'>

export function KanbanBoard() {
  const [leads, setLeads] = useState<KanbanLead[]>(MOCK_KANBAN_LEADS)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null)

  // Drag-to-scroll state
  const boardRef = useRef<HTMLDivElement>(null)
  const isScrollDragging = useRef(false)
  const scrollStart = useRef({ x: 0, scrollLeft: 0 })

  const onBoardMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only pan on the board background itself (not on cards/buttons)
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

  const responsibles = Array.from(new Set(leads.map((l) => l.responsible))).sort()
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

  function getColumnLeads(stageId: KanbanStage): KanbanLead[] {
    return filtered.filter((l) => l.stage === stageId)
  }

  function handleDrop(targetStage: KanbanStage) {
    if (!dragging || dragging.stage === targetStage) {
      setDragging(null)
      setDropTarget(null)
      return
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === dragging.id ? { ...l, stage: targetStage } : l))
    )
    setDragging(null)
    setDropTarget(null)
  }

  function handleSaveLead(updated: KanbanLead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setSelectedLead(null)
  }

  function handleDeleteLead(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    setSelectedLead(null)
  }

  function handleCreate(data: FormData) {
    const newLead: KanbanLead = {
      ...data,
      id: `k-${Date.now()}`,
      createdAt: '2026-04-10T12:00:00Z',
    }
    setLeads((prev) => [newLead, ...prev])
    setCreateOpen(false)
  }

  // Stats
  const activeLeads = leads.filter((l) => l.stage !== 'encerrado').length
  const pipelineValue = leads
    .filter((l) => l.stage === 'cliente_ativo' || l.stage === 'proposta')
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

  return (
    // Full height flex column — board gets remaining space and scrolls horizontally
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
          {/* Quick stats */}
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
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            leads={getColumnLeads(col.id)}
            isDropTarget={dropTarget === col.id && dragging?.stage !== col.id}
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
      />

      <KanbanFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialStage="novo_lead"
        onSubmit={handleCreate}
      />
    </div>
  )
}
