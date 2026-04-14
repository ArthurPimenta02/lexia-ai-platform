'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, Search, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CasosTable } from '@/components/casos/CasosTable'
import { CasoFormDialog } from '@/components/casos/CasoFormDialog'
import { createCaso, updateCaso, deleteCaso } from '@/actions/casos'
import type { CasoSummary, CasoArea, CasoStatus, CasoFormData } from '@/types/caso'
import { CASO_AREAS, CASO_STATUSES } from '@/types/caso'

interface CasosClientProps {
  initialCasos: CasoSummary[]
  users: { id: string; name: string }[]
  leads: { id: string; name: string }[]
}

export function CasosClient({ initialCasos, users, leads }: CasosClientProps) {
  const router = useRouter()
  const [casos, setCasos] = useState<CasoSummary[]>(initialCasos)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CasoStatus | ''>('')
  const [filterArea, setFilterArea] = useState<CasoArea | ''>('')
  const [filterResponsavel, setFilterResponsavel] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CasoSummary | undefined>()
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return casos.filter((c) => {
      if (q && !c.titulo.toLowerCase().includes(q) && !c.clienteNome.toLowerCase().includes(q) && !c.numeroInterno?.toLowerCase().includes(q)) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (filterArea && c.area !== filterArea) return false
      if (filterResponsavel && c.responsavelId !== filterResponsavel) return false
      return true
    })
  }, [casos, search, filterStatus, filterArea, filterResponsavel])

  const hasFilters = Boolean(search || filterStatus || filterArea || filterResponsavel)

  function clearFilters() {
    setSearch('')
    setFilterStatus('')
    setFilterArea('')
    setFilterResponsavel('')
  }

  async function handleCreate(data: CasoFormData) {
    // Optimistic insert
    const optimisticId = `optimistic-${Date.now()}`
    const responsavel = users.find((u) => u.id === data.responsavelId)
    const lead = leads.find((l) => l.id === data.leadId)
    const optimistic: CasoSummary = {
      id: optimisticId,
      titulo: data.titulo,
      numeroInterno: null,
      area: data.area,
      status: data.status,
      clienteId: null,
      clienteNome: data.clienteNome,
      responsavelId: data.responsavelId || null,
      responsavelNome: responsavel?.name ?? null,
      leadId: data.leadId || null,
      leadNome: lead?.name ?? null,
      dataAbertura: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      proximaAcao: data.proximaAcao || null,
      proximaAcaoData: data.proximaAcaoData || null,
      pendenciasAbertas: 0,
      processosCount: 0,
    }
    setCasos((prev) => [optimistic, ...prev])

    startTransition(async () => {
      const result = await createCaso(data)
      if ('error' in result) {
        setCasos((prev) => prev.filter((c) => c.id !== optimisticId))
        alert(result.error)
      } else {
        // Substitui o optimistic pelo ID real — o router.refresh() traz dados atualizados
        setCasos((prev) => prev.map((c) =>
          c.id === optimisticId ? { ...c, id: result.id } : c
        ))
        router.refresh()
      }
    })
  }

  async function handleEdit(data: CasoFormData) {
    if (!editTarget) return
    const id = editTarget.id
    const responsavel = users.find((u) => u.id === data.responsavelId)

    const lead = leads.find((l) => l.id === data.leadId)
    // Optimistic update
    setCasos((prev) => prev.map((c) =>
      c.id === id
        ? {
            ...c,
            titulo: data.titulo,
            area: data.area,
            status: data.status,
            clienteNome: data.clienteNome,
            responsavelId: data.responsavelId || null,
            responsavelNome: responsavel?.name ?? null,
            leadId: data.leadId || null,
            leadNome: lead?.name ?? null,
            proximaAcao: data.proximaAcao || null,
            proximaAcaoData: data.proximaAcaoData || null,
            updatedAt: new Date().toISOString(),
          }
        : c
    ))
    setEditTarget(undefined)

    startTransition(async () => {
      const result = await updateCaso(id, data)
      if ('error' in result) {
        // Rollback
        setCasos((prev) => prev.map((c) => c.id === id ? editTarget : c))
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  async function handleDelete(caso: CasoSummary) {
    if (!confirm(`Excluir o caso "${caso.titulo}"? Esta ação não pode ser desfeita.`)) return

    // Optimistic remove
    setCasos((prev) => prev.filter((c) => c.id !== caso.id))

    startTransition(async () => {
      const result = await deleteCaso(caso.id)
      if ('error' in result) {
        // Rollback
        setCasos((prev) => [caso, ...prev])
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  // Contadores por status para os chips de filtro rápido
  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    casos.forEach((c) => {
      counts[c.status] = (counts[c.status] ?? 0) + 1
    })
    return counts
  }, [casos])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Busca */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por caso, cliente ou nº..."
              className="pl-9 h-9"
            />
          </div>

          {/* Filtro status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CasoStatus | '')}
            className="h-9 rounded-md border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os status</option>
            {CASO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s} ({countByStatus[s] ?? 0})
              </option>
            ))}
          </select>

          {/* Filtro área */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as CasoArea | '')}
            className="h-9 rounded-md border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas as áreas</option>
            {CASO_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Filtro responsável */}
          <select
            value={filterResponsavel}
            onChange={(e) => setFilterResponsavel(e.target.value)}
            className="h-9 rounded-md border border-input bg-background text-foreground px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os responsáveis</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Limpar filtros */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/processos" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 gap-2' })}>
            Processos importados
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            Novo caso
          </Button>
        </div>
      </div>

      {/* Resultado */}
      <div className="text-xs text-muted-foreground px-1">
        {filtered.length} caso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        {hasFilters && ' (filtrado)'}
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <CasosTable
          casos={filtered}
          onEdit={(c) => setEditTarget(c)}
          onDelete={handleDelete}
        />
      </div>

      {/* Dialogs */}
      <CasoFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        users={users}
        leads={leads}
        onSave={handleCreate}
      />
      <CasoFormDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => { if (!open) setEditTarget(undefined) }}
        caso={editTarget}
        users={users}
        leads={leads}
        onSave={handleEdit}
      />
    </div>
  )
}
