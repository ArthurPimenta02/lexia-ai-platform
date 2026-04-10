'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CasosTable } from '@/components/casos/CasosTable'
import { CasoFormDialog } from '@/components/casos/CasoFormDialog'
import { MOCK_CASOS, AREAS_DISPONIVEIS, STATUS_DISPONIVEIS, RESPONSAVEIS_DISPONIVEIS } from '@/lib/mock/casos'
import type { Caso, CasoArea, CasoStatus } from '@/types/caso'

export function CasosClient() {
  const [casos, setCasos] = useState<Caso[]>(MOCK_CASOS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CasoStatus | ''>('')
  const [filterArea, setFilterArea] = useState<CasoArea | ''>('')
  const [filterResponsavel, setFilterResponsavel] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Caso | undefined>()

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return casos.filter((c) => {
      if (q && !c.titulo.toLowerCase().includes(q) && !c.cliente.toLowerCase().includes(q) && !c.numero?.toLowerCase().includes(q)) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (filterArea && c.area !== filterArea) return false
      if (filterResponsavel && c.responsavel !== filterResponsavel) return false
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

  function handleCreate(data: { titulo: string; area: CasoArea; status: CasoStatus; cliente: string; responsavel: string; descricao: string; proximaAcao: string }) {
    const novo: Caso = {
      id: `caso-${Date.now()}`,
      titulo: data.titulo,
      area: data.area,
      status: data.status,
      cliente: data.cliente,
      responsavel: data.responsavel,
      advogados: [data.responsavel],
      descricao: data.descricao || undefined,
      proximaAcao: data.proximaAcao || undefined,
      dataAbertura: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      processos: [],
      prazos: [],
      pendencias: [],
      documentos: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          tipo: 'criacao',
          titulo: 'Caso aberto',
          descricao: `Caso criado manualmente.`,
          data: new Date().toISOString(),
          autor: data.responsavel,
        },
      ],
    }
    setCasos((prev) => [novo, ...prev])
  }

  function handleEdit(data: { titulo: string; area: CasoArea; status: CasoStatus; cliente: string; responsavel: string; descricao: string; proximaAcao: string }) {
    if (!editTarget) return
    setCasos((prev) =>
      prev.map((c) =>
        c.id === editTarget.id
          ? {
              ...c,
              titulo: data.titulo,
              area: data.area,
              status: data.status,
              cliente: data.cliente,
              responsavel: data.responsavel,
              descricao: data.descricao || undefined,
              proximaAcao: data.proximaAcao || undefined,
              ultimaAtualizacao: new Date().toISOString(),
            }
          : c
      )
    )
    setEditTarget(undefined)
  }

  function handleDelete(caso: Caso) {
    if (confirm(`Excluir o caso "${caso.titulo}"? Esta ação não pode ser desfeita.`)) {
      setCasos((prev) => prev.filter((c) => c.id !== caso.id))
    }
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
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os status</option>
            {STATUS_DISPONIVEIS.map((s) => (
              <option key={s} value={s}>
                {s} ({countByStatus[s] ?? 0})
              </option>
            ))}
          </select>

          {/* Filtro área */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as CasoArea | '')}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todas as áreas</option>
            {AREAS_DISPONIVEIS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Filtro responsável */}
          <select
            value={filterResponsavel}
            onChange={(e) => setFilterResponsavel(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Todos os responsáveis</option>
            {RESPONSAVEIS_DISPONIVEIS.map((r) => (
              <option key={r} value={r}>{r}</option>
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

        <Button onClick={() => setCreateOpen(true)} size="sm" className="h-9 gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Novo caso
        </Button>
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
        onSave={handleCreate}
      />
      <CasoFormDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => { if (!open) setEditTarget(undefined) }}
        caso={editTarget}
        onSave={handleEdit}
      />
    </div>
  )
}
