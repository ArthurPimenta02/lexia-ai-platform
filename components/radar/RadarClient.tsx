'use client'

import { useState, useMemo } from 'react'
import { RadarFilters } from './RadarFilters'
import { RadarList } from './RadarList'
import { RadarItemDetail } from './RadarItemDetail'
import { MOCK_RADAR } from '@/lib/mock/radar'
import type { RadarItem, RadarTipo, RadarUrgencia } from '@/types/radar'

const PERIOD_MS: Record<'hoje' | '7dias' | '30dias' | 'tudo', number> = {
  hoje: 86_400_000,
  '7dias': 7 * 86_400_000,
  '30dias': 30 * 86_400_000,
  tudo: Infinity,
}

export function RadarClient() {
  const [selectedItem, setSelectedItem] = useState<RadarItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<RadarTipo | ''>('')
  const [filterUrgencia, setFilterUrgencia] = useState<RadarUrgencia | ''>('')
  const [filterCaso, setFilterCaso] = useState('')
  const [filterExigeAcao, setFilterExigeAcao] = useState<'todos' | 'sim' | 'nao'>('todos')
  const [filterPeriodo, setFilterPeriodo] = useState<'hoje' | '7dias' | '30dias' | 'tudo'>('tudo')

  const casosDisponiveis = useMemo(() => {
    const seen = new Map<string, { id: string; titulo: string }>()
    for (const r of MOCK_RADAR) {
      if (!seen.has(r.casoId)) seen.set(r.casoId, { id: r.casoId, titulo: r.casoTitulo })
    }
    return Array.from(seen.values())
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const maxAge = PERIOD_MS[filterPeriodo]
    const now = Date.now()

    return MOCK_RADAR.filter((r) => {
      if (q && !r.titulo.toLowerCase().includes(q) && !r.cliente.toLowerCase().includes(q)) return false
      if (filterTipo && r.tipo !== filterTipo) return false
      if (filterUrgencia && r.urgencia !== filterUrgencia) return false
      if (filterCaso && r.casoId !== filterCaso) return false
      if (filterExigeAcao === 'sim' && !r.exigeAcao) return false
      if (filterExigeAcao === 'nao' && r.exigeAcao) return false
      if (maxAge !== Infinity && now - new Date(r.data).getTime() > maxAge) return false
      return true
    })
  }, [search, filterTipo, filterUrgencia, filterCaso, filterExigeAcao, filterPeriodo])

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

      <RadarList items={filtered} onItemClick={handleItemClick} />

      <RadarItemDetail
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  )
}
