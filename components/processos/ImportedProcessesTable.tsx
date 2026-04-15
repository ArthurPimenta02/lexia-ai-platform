'use client'

import Link from 'next/link'
import { CheckCircle2, ExternalLink, FileSearch, Link2, ShieldAlert } from 'lucide-react'
import { CreateCasoFromProcessButton } from '@/components/processos/CreateCasoFromProcessButton'
import { DeleteImportedProcessButton } from '@/components/processos/DeleteImportedProcessButton'
import type { ImportedProcessItem } from '@/actions/processos-importados'
import { cn } from '@/lib/utils'

interface ImportedProcessesTableProps {
  processes: ImportedProcessItem[]
  deletingId: string | null
  onDeleteRequest: (processo: ImportedProcessItem) => void
}

function formatDateTime(iso: string | null) {
  if (!iso) return 'Nunca sincronizado'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SYNC_LABELS = {
  pending: 'Pendente',
  synced: 'Sincronizado',
  error: 'Erro',
  stale: 'Desatualizado',
} as const

const SYNC_STYLES = {
  pending: 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
  synced: 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  error: 'border-red-200 bg-red-100 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
  stale: 'border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300',
} as const

function ProcessCaseStatus({ processo }: { processo: ImportedProcessItem }) {
  if (processo.hasLinkedCase && processo.linkedCaseId) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Vinculado
        </span>
        <Link
          href={`/casos/${processo.linkedCaseId}`}
          className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
        >
          {processo.linkedCaseTitle || 'Abrir caso'}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
      <ShieldAlert className="h-3.5 w-3.5" />
      Pendente
    </span>
  )
}

function ProcessActions({
  processo,
  deletingId,
  onDeleteRequest,
}: {
  processo: ImportedProcessItem
  deletingId: string | null
  onDeleteRequest: (processo: ImportedProcessItem) => void
}) {
  const isDeleting = deletingId === processo.id

  if (processo.hasLinkedCase) {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-input px-3 py-2 text-xs text-muted-foreground opacity-70"
        >
          <Link2 className="h-4 w-4" />
          Ja vinculado
        </button>
        <DeleteImportedProcessButton
          disabled
          isDeleting={isDeleting}
          onClick={() => onDeleteRequest(processo)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <CreateCasoFromProcessButton processoId={processo.id} />
      <DeleteImportedProcessButton
        isDeleting={isDeleting}
        onClick={() => onDeleteRequest(processo)}
      />
    </div>
  )
}

export function ImportedProcessesTable({ processes, deletingId, onDeleteRequest }: ImportedProcessesTableProps) {
  if (processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <FileSearch className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum processo importado encontrado</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Quando a discovery por OAB trouxer processos, eles aparecerao aqui para criacao manual do caso.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {processes.map((processo) => (
          <article key={processo.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all font-mono text-sm text-foreground">{processo.cnjNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ultima sync: {formatDateTime(processo.lastSyncedAt)}
                </p>
              </div>
              <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {processo.radarCount}
              </span>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-muted/20 p-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tribunal</p>
                <p className="text-sm text-foreground">{processo.tribunal}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Vara</p>
                <p className="text-sm text-foreground">{processo.vara || 'Vara nao informada'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {processo.status}
                </span>
                <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium', SYNC_STYLES[processo.syncStatus as keyof typeof SYNC_STYLES] ?? SYNC_STYLES.pending)}>
                  {SYNC_LABELS[processo.syncStatus as keyof typeof SYNC_LABELS] ?? processo.syncStatus}
                </span>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Caso</p>
                <ProcessCaseStatus processo={processo} />
              </div>
            </div>

            <div className="mt-4">
              <ProcessActions
                processo={processo}
                deletingId={deletingId}
                onDeleteRequest={onDeleteRequest}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">CNJ</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tribunal / Vara</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sync</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Radar</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Caso</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processes.map((processo) => (
              <tr key={processo.id} className="align-top hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-foreground">{processo.cnjNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Ultima sync: {formatDateTime(processo.lastSyncedAt)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">{processo.tribunal}</p>
                    <p className="text-xs text-muted-foreground">{processo.vara || 'Vara nao informada'}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{processo.status}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', SYNC_STYLES[processo.syncStatus as keyof typeof SYNC_STYLES] ?? SYNC_STYLES.pending)}>
                    {SYNC_LABELS[processo.syncStatus as keyof typeof SYNC_LABELS] ?? processo.syncStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {processo.radarCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ProcessCaseStatus processo={processo} />
                </td>
                <td className="px-4 py-3 text-right">
                  <ProcessActions
                    processo={processo}
                    deletingId={deletingId}
                    onDeleteRequest={onDeleteRequest}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
