'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { RadarFilters } from './RadarFilters'
import { RadarList } from './RadarList'
import { RadarItemDetail } from './RadarItemDetail'
import { useRealtimeRadar } from '@/lib/hooks/useRealtimeRadar'
import { markResolved, markInAnalysis, deleteRadarItem } from '@/actions/radar'
import type { RadarItem, RadarStatus, RadarTipo, RadarUrgencia } from '@/types/radar'

const PERIOD_MS: Record<'hoje' | '7dias' | '30dias' | 'tudo', number> = {
  hoje: 86_400_000,
  '7dias': 7 * 86_400_000,
  '30dias': 30 * 86_400_000,
  tudo: Infinity,
}

interface RadarClientProps {
  initialItems: RadarItem[]
  tenantId: string | undefined
}

export function RadarClient({ initialItems, tenantId }: RadarClientProps) {
  const [items, setItems] = useState<RadarItem[]>(initialItems)
  const [selectedItem, setSelectedItem] = useState<RadarItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<RadarTipo | ''>('')
  const [filterUrgencia, setFilterUrgencia] = useState<RadarUrgencia | ''>('')
  const [filterCaso, setFilterCaso] = useState('')
  const [filterExigeAcao, setFilterExigeAcao] = useState<'todos' | 'sim' | 'nao'>('todos')
  const [filterPeriodo, setFilterPeriodo] = useState<'hoje' | '7dias' | '30dias' | 'tudo'>('tudo')

  // Set de IDs para deduplicação no Realtime — inicializado com os itens SSR
  const existingIdsRef = useRef<Set<string>>(new Set(initialItems.map((i) => i.id)))

  const handleNewItem = useCallback((item: RadarItem) => {
    // Deduplicação: ignora se já existe no estado atual
    if (existingIdsRef.current.has(item.id)) return
    existingIdsRef.current.add(item.id)
    setItems((prev) => [item, ...prev])
  }, [])

  // Realtime: novos itens aparecem no topo automaticamente
  useRealtimeRadar(tenantId, handleNewItem, existingIdsRef.current)

  const casosDisponiveis = useMemo(() => {
    const seen = new Map<string, { id: string; titulo: string }>()
    for (const r of items) {
      if (r.casoId && !seen.has(r.casoId)) {
        seen.set(r.casoId, { id: r.casoId, titulo: r.casoTitulo })
      }
    }
    return Array.from(seen.values())
  }, [items])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const maxAge = PERIOD_MS[filterPeriodo]
    const now = Date.now()

    return items.filter((r) => {
      if (q && !r.titulo.toLowerCase().includes(q) && !r.cliente.toLowerCase().includes(q)) return false
      if (filterTipo && r.tipo !== filterTipo) return false
      if (filterUrgencia && r.urgencia !== filterUrgencia) return false
      if (filterCaso && r.casoId !== filterCaso) return false
      if (filterExigeAcao === 'sim' && !r.exigeAcao) return false
      if (filterExigeAcao === 'nao' && r.exigeAcao) return false
      if (maxAge !== Infinity && now - new Date(r.data).getTime() > maxAge) return false
      return true
    })
  }, [items, search, filterTipo, filterUrgencia, filterCaso, filterExigeAcao, filterPeriodo])

  const hasFilters = Boolean(
    search || filterTipo || filterUrgencia || filterCaso || filterExigeAcao !== 'todos' || filterPeriodo !== 'tudo'
  )

  function clearFilters() {
    setSearch('')
    setFilterTipo('')
    setFilterUrgencia('')
    setFilterCaso('')
    setFilterExigeAcao('todos')
    setFilterPeriodo('tudo')
  }

  function handleItemClick(item: RadarItem) {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open)
    if (!open) {
      setTimeout(() => setSelectedItem(null), 300)
    }
  }

  async function handleResolve(itemId: string) {
    const original = items.find((r) => r.id === itemId)
    if (!original) return

    const now = new Date().toISOString()
    setItems((prev) =>
      prev.map((r) =>
        r.id === itemId
          ? ({ ...r, status: 'resolvido' as RadarStatus, dataResolucao: now, exigeAcao: false })
          : r
      )
    )

    const result = await markResolved(itemId)
    if ('error' in result) {
      console.error('handleResolve:', result.error)
      setItems((prev) => prev.map((r) => (r.id === itemId ? original : r)))
    }
  }

  function handleDelete(itemId: string) {
    existingIdsRef.current.delete(itemId)
    setItems((prev) => prev.filter((r) => r.id !== itemId))
    if (selectedItem?.id === itemId) {
      setSheetOpen(false)
      setTimeout(() => setSelectedItem(null), 300)
    }
  }

  async function handleMarkInAnalysis(itemId: string) {
    const original = items.find((r) => r.id === itemId)
    if (!original) return

    setItems((prev) =>
      prev.map((r) =>
        r.id === itemId ? ({ ...r, status: 'em_analise' as RadarStatus }) : r
      )
    )
    const result = await markInAnalysis(itemId)
    if ('error' in result) {
      console.error('handleMarkInAnalysis:', result.error)
      setItems((prev) => prev.map((r) => (r.id === itemId ? original : r)))
    }
  }

  return (
    <div className="space-y-4">
      <RadarFilters
        search={search}
        onSearchChange={setSearch}
        filterTipo={filterTipo}
        onTipoChange={setFilterTipo}
        filterUrgencia={filterUrgencia}
        onUrgenciaChange={setFilterUrgencia}
        filterCaso={filterCaso}
        onCasoChange={setFilterCaso}
        filterExigeAcao={filterExigeAcao}
        onExigeAcaoChange={setFilterExigeAcao}
        filterPeriodo={filterPeriodo}
        onPeriodoChange={setFilterPeriodo}
        casosDisponiveis={casosDisponiveis}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      <div className="text-xs text-muted-foreground px-1">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        {hasFilters && ' (filtrado)'}
      </div>

      <RadarList items={filtered} onItemClick={handleItemClick} onDeleteItem={handleDelete} />

      <RadarItemDetail
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onResolve={handleResolve}
        onMarkInAnalysis={handleMarkInAnalysis}
        onDelete={handleDelete}
      />
    </div>
  )
}
