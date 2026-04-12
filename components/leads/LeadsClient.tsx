'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createLead, updateLead, deleteLead } from '@/actions/leads'
import { LeadsTable } from './LeadsTable'
import { LeadFormDialog } from './LeadFormDialog'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import type { Lead, LeadStage, LeadFormData } from '@/types/lead'

interface LeadsClientProps {
  initialLeads: Lead[]
  stages: LeadStage[]
}

export function LeadsClient({ initialLeads, stages }: LeadsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filtered = leads.filter((lead) => {
    const q = search.toLowerCase()
    const matchesSearch =
      q === '' || lead.name.toLowerCase().includes(q)
    const matchesStage =
      stageFilter === 'all' || lead.stageId === stageFilter
    return matchesSearch && matchesStage
  })

  function handleCreate(data: LeadFormData) {
    setActionError(null)
    startTransition(async () => {
      const result = await createLead(data)
      if ('error' in result) {
        setActionError(result.error)
        return
      }
      setCreateOpen(false)
      router.refresh()
    })
  }

  function handleEdit(data: LeadFormData & { id?: string }) {
    if (!data.id) return
    setActionError(null)

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== data.id) return l
        const stage = stages.find((s) => s.id === data.stageId)
        return {
          ...l,
          ...data,
          stageName:  stage?.name  ?? l.stageName,
          stageColor: stage?.color ?? l.stageColor,
        }
      })
    )
    setEditTarget(null)

    startTransition(async () => {
      const result = await updateLead(data.id!, data)
      if ('error' in result) {
        setActionError(result.error)
        // Reverter optimistic update
        setLeads(initialLeads)
        return
      }
      router.refresh()
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    setActionError(null)
    const targetId = deleteTarget.id

    // Optimistic removal
    setLeads((prev) => prev.filter((l) => l.id !== targetId))
    setDeleteTarget(null)

    startTransition(async () => {
      const result = await deleteLead(targetId)
      if ('error' in result) {
        setActionError(result.error)
        // Reverter
        setLeads(initialLeads)
      }
      router.refresh()
    })
  }

  const selectClass = cn(
    'h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground',
    'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
    'dark:bg-input/30 transition-colors'
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Stage filter */}
          <select
            className={selectClass}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            aria-label="Filtrar por estágio"
          >
            <option value="all">Todos os estágios</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => setCreateOpen(true)} disabled={isPending}>
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Error */}
      {actionError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'}
        {search || stageFilter !== 'all' ? ' encontrado(s)' : ' no total'}
      </p>

      {/* Table */}
      <LeadsTable
        leads={filtered}
        onEdit={setEditTarget}
        onDelete={setDeleteTarget}
      />

      {/* Dialogs */}
      <LeadFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        stages={stages}
        onSubmit={handleCreate}
        isPending={isPending}
      />

      <LeadFormDialog
        open={editTarget !== null}
        onOpenChange={(o) => { if (!o) setEditTarget(null) }}
        initialData={editTarget ?? undefined}
        stages={stages}
        onSubmit={handleEdit}
        isPending={isPending}
      />

      <DeleteLeadDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        leadName={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
      />
    </div>
  )
}
