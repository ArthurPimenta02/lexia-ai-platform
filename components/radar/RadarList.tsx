import { Radar } from 'lucide-react'
import { RadarCard } from './RadarCard'
import type { RadarItem } from '@/types/radar'

type DateGroup = 'hoje' | 'semana' | 'anteriores'

const GROUP_LABELS: Record<DateGroup, string> = {
  hoje: 'Hoje',
  semana: 'Esta semana',
  anteriores: 'Anteriores',
}

function getGroup(iso: string): DateGroup {
  const now = new Date()
  const itemDate = new Date(iso)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 6)

  if (itemDate >= todayStart) return 'hoje'
  if (itemDate >= weekStart) return 'semana'
  return 'anteriores'
}

function sortItems(items: RadarItem[]): RadarItem[] {
  return [...items].sort((a, b) => {
    // Exige ação first
    if (a.exigeAcao && !b.exigeAcao) return -1
    if (!a.exigeAcao && b.exigeAcao) return 1
    // Then by date descending (most recent first)
    return new Date(b.data).getTime() - new Date(a.data).getTime()
  })
}

interface RadarListProps {
  items: RadarItem[]
  onItemClick: (item: RadarItem) => void
}

export function RadarList({ items, onItemClick }: RadarListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <Radar className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-base font-medium text-foreground">Nenhum item encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros aplicados</p>
      </div>
    )
  }

  const groups: Record<DateGroup, RadarItem[]> = { hoje: [], semana: [], anteriores: [] }
  for (const item of items) {
    groups[getGroup(item.data)].push(item)
  }

  const groupOrder: DateGroup[] = ['hoje', 'semana', 'anteriores']

  return (
    <div className="space-y-8">
      {groupOrder.map((group) => {
        const groupItems = sortItems(groups[group])
        if (groupItems.length === 0) return null

        return (
          <div key={group} className="space-y-4">
            {/* Group header */}
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {GROUP_LABELS[group]}
              </h3>
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
                {groupItems.length}
              </span>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupItems.map((item) => (
                <RadarCard key={item.id} item={item} onClick={onItemClick} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
