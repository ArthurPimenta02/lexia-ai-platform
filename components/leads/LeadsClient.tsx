'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MOCK_LEADS } from '@/lib/mock/leads'
import { LeadsTable } from './LeadsTable'
import { LeadFormDialog } from './LeadFormDialog'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import type { Lead, LeadStatus } from '@/types/lead'

const STATUSES: LeadStatus[] = [
  'Novo',
  'Qualificado',
  'Proposta',
  'Contrato',
  'Cliente',
  'Perdido',
]

type FormData = Omit<Lead, 'id' | 'createdAt'>

export function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Lead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)

  const filtered = leads.filter((lead) => {
    const q = search.toLowerCase()
    const matchesSearch =
      q === '' ||
      lead.name.toLowerCase().includes(q) ||
      lead.company.toLowerCase().includes(q)
    const matchesStatus =
      statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function handleCreate(data: FormData) {
    const newLead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setLeads((prev) => [newLead, ...prev])
    setCreateOpen(false)
  }

  function handleEdit(data: FormData & { id?: string }) {
    if (!data.id) return
    setLeads((prev) =>
      prev.map((l) => (l.id === data.id ? { ...l, ...data } : l))
    )
    setEditTarget(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id))
    setDeleteTarget(null)
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
              placeholder="Buscar por nome ou empresa…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Status filter */}
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LeadStatus | 'all')
            }
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'lead' : 'leads'}
        {search || statusFilter !== 'all' ? ' encontrado(s)' : ' no total'}
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
        onSubmit={handleCreate}
      />

      <LeadFormDialog
        open={editTarget !== null}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null)
        }}
        initialData={editTarget ?? undefined}
        onSubmit={handleEdit}
      />

      <DeleteLeadDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
        leadName={deleteTarget?.name ?? ''}
        onConfirm={handleDelete}
      />
    </div>
  )
}
