import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RADAR_TIPO_LABELS, RADAR_URGENCIA_LABELS } from '@/types/radar'
import type { RadarTipo, RadarUrgencia } from '@/types/radar'

interface RadarFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  filterTipo: RadarTipo | ''
  onTipoChange: (v: RadarTipo | '') => void
  filterUrgencia: RadarUrgencia | ''
  onUrgenciaChange: (v: RadarUrgencia | '') => void
  filterCaso: string
  onCasoChange: (v: string) => void
  filterExigeAcao: 'todos' | 'sim' | 'nao'
  onExigeAcaoChange: (v: 'todos' | 'sim' | 'nao') => void
  filterPeriodo: 'hoje' | '7dias' | '30dias' | 'tudo'
  onPeriodoChange: (v: 'hoje' | '7dias' | '30dias' | 'tudo') => void
  casosDisponiveis: { id: string; titulo: string }[]
  hasFilters: boolean
  onClearFilters: () => void
}

const SELECT_CLASS =
  'h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function RadarFilters({
  search,
  onSearchChange,
  filterTipo,
  onTipoChange,
  filterUrgencia,
  onUrgenciaChange,
  filterCaso,
  onCasoChange,
  filterExigeAcao,
  onExigeAcaoChange,
  filterPeriodo,
  onPeriodoChange,
  casosDisponiveis,
  hasFilters,
  onClearFilters,
}: RadarFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Busca */}
      <div className="relative min-w-[220px] flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por título, cliente..."
          className="pl-9 h-9"
        />
      </div>

      {/* Tipo */}
      <select
        value={filterTipo}
        onChange={(e) => onTipoChange(e.target.value as RadarTipo | '')}
        className={SELECT_CLASS}
      >
        <option value="">Todos os tipos</option>
        {(Object.keys(RADAR_TIPO_LABELS) as RadarTipo[]).map((t) => (
          <option key={t} value={t}>
            {RADAR_TIPO_LABELS[t]}
          </option>
        ))}
      </select>

      {/* Urgência */}
      <select
        value={filterUrgencia}
        onChange={(e) => onUrgenciaChange(e.target.value as RadarUrgencia | '')}
        className={SELECT_CLASS}
      >
        <option value="">Todas as urgências</option>
        {(Object.keys(RADAR_URGENCIA_LABELS) as RadarUrgencia[]).map((u) => (
          <option key={u} value={u}>
            {RADAR_URGENCIA_LABELS[u]}
          </option>
        ))}
      </select>

      {/* Caso */}
      <select
        value={filterCaso}
        onChange={(e) => onCasoChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">Todos os casos</option>
        {casosDisponiveis.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titulo.length > 40 ? `${c.titulo.slice(0, 40)}…` : c.titulo}
          </option>
        ))}
      </select>

      {/* Exige ação */}
      <select
        value={filterExigeAcao}
        onChange={(e) => onExigeAcaoChange(e.target.value as 'todos' | 'sim' | 'nao')}
        className={SELECT_CLASS}
      >
        <option value="todos">Exige ação: todos</option>
        <option value="sim">Exige ação: sim</option>
        <option value="nao">Exige ação: não</option>
      </select>

      {/* Período */}
      <select
        value={filterPeriodo}
        onChange={(e) => onPeriodoChange(e.target.value as 'hoje' | '7dias' | '30dias' | 'tudo')}
        className={SELECT_CLASS}
      >
        <option value="tudo">Qualquer período</option>
        <option value="hoje">Hoje</option>
        <option value="7dias">Últimos 7 dias</option>
        <option value="30dias">Últimos 30 dias</option>
      </select>

      {/* Limpar */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  )
}
