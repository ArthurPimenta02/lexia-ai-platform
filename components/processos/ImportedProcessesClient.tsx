'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Scale, Search } from 'lucide-react'
import { deleteImportedProcess } from '@/actions/processos-importados'
import { Input } from '@/components/ui/input'
import { DeleteImportedProcessDialog } from '@/components/processos/DeleteImportedProcessDialog'
import { ImportedProcessesTable } from '@/components/processos/ImportedProcessesTable'
import type { ImportedProcessItem } from '@/actions/processos-importados'

interface ImportedProcessesClientProps {
  initialProcesses: ImportedProcessItem[]
}

export function ImportedProcessesClient({ initialProcesses }: ImportedProcessesClientProps) {
  const router = useRouter()
  const [processes, setProcesses] = useState<ImportedProcessItem[]>(initialProcesses)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ImportedProcessItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return processes

    return processes.filter((processo) =>
      processo.cnjNumber.toLowerCase().includes(query)
      || processo.tribunal.toLowerCase().includes(query)
      || (processo.vara ?? '').toLowerCase().includes(query)
      || (processo.linkedCaseTitle ?? '').toLowerCase().includes(query)
    )
  }, [processes, search])

  function handleDelete(processo: ImportedProcessItem) {
    setDeletingId(processo.id)
    setProcesses((prev) => prev.filter((item) => item.id !== processo.id))

    startTransition(async () => {
      const result = await deleteImportedProcess(processo.id)
      if ('error' in result) {
        setProcesses((prev) => {
          const next = [...prev]
          next.push(processo)
          next.sort((a, b) => {
            const aTime = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0
            const bTime = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0
            return bTime - aTime
          })
          return next
        })
        setDeletingId(null)
        alert(result.error)
        return
      }

      setDeleteTarget(null)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-3">
        <Link
          href="/casos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Casos
        </Link>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-muted p-2">
              <Scale className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Processos importados</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Revise os processos descobertos pela OAB e crie manualmente o primeiro caso quando fizer sentido operacional.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold text-foreground">{processes.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-xs text-muted-foreground">Filtrados</p>
              <p className="text-lg font-semibold text-foreground">{filtered.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por CNJ, tribunal, vara ou caso..."
            className="h-10 pl-9"
          />
        </div>
      </div>

      <ImportedProcessesTable
        processes={filtered}
        deletingId={deletingId}
        onDeleteRequest={setDeleteTarget}
      />

      <DeleteImportedProcessDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deletingId == null) setDeleteTarget(null)
        }}
        cnjNumber={deleteTarget?.cnjNumber ?? ''}
        isDeleting={deleteTarget ? deletingId === deleteTarget.id : false}
        onConfirm={() => {
          if (!deleteTarget) return
          handleDelete(deleteTarget)
        }}
      />
    </div>
  )
}
