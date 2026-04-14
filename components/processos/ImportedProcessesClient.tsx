'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ImportedProcessesTable } from '@/components/processos/ImportedProcessesTable'
import type { ImportedProcessItem } from '@/actions/processos-importados'

interface ImportedProcessesClientProps {
  initialProcesses: ImportedProcessItem[]
}

export function ImportedProcessesClient({ initialProcesses }: ImportedProcessesClientProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return initialProcesses

    return initialProcesses.filter((processo) =>
      processo.cnjNumber.toLowerCase().includes(query)
      || processo.tribunal.toLowerCase().includes(query)
      || (processo.vara ?? '').toLowerCase().includes(query)
      || (processo.linkedCaseTitle ?? '').toLowerCase().includes(query)
    )
  }, [initialProcesses, search])

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/casos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Casos
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-foreground">Processos importados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revise os processos descobertos pela OAB e crie manualmente o primeiro caso quando fizer sentido operacional.
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por CNJ, tribunal, vara ou caso..."
          className="pl-9"
        />
      </div>

      <ImportedProcessesTable processes={filtered} />
    </div>
  )
}
