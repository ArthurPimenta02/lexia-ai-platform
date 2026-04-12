'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { CasoStatusBadge, CasoAreaBadge } from '@/components/casos/CasoStatusBadge'
import { MoreHorizontal, ExternalLink, Pencil, Trash2, AlertCircle, Clock, FileText } from 'lucide-react'
import type { CasoSummary } from '@/types/caso'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} sem.`
  return `há ${Math.floor(days / 30)} meses`
}

interface CasosTableProps {
  casos: CasoSummary[]
  onEdit: (caso: CasoSummary) => void
  onDelete: (caso: CasoSummary) => void
}

export function CasosTable({ casos, onEdit, onDelete }: CasosTableProps) {
  const router = useRouter()
  if (casos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum caso encontrado</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Tente ajustar os filtros ou crie um novo caso</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Caso</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Área</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Cliente</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Responsável</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Próxima ação</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Atualização</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">Processos</th>
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {casos.map((caso) => (
            <tr
              key={caso.id}
              className="hover:bg-muted/30 transition-colors group"
            >
              {/* Caso */}
              <td className="px-4 py-3 max-w-[240px]">
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/casos/${caso.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                  >
                    {caso.titulo}
                  </Link>
                  {caso.numeroInterno && (
                    <span className="text-xs text-muted-foreground font-mono">{caso.numeroInterno}</span>
                  )}
                  {caso.pendenciasAbertas > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                      <AlertCircle className="h-3 w-3" />
                      {caso.pendenciasAbertas} pendência{caso.pendenciasAbertas > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </td>

              {/* Área */}
              <td className="px-4 py-3 whitespace-nowrap">
                <CasoAreaBadge area={caso.area} />
              </td>

              {/* Cliente */}
              <td className="px-4 py-3 max-w-[150px]">
                <span className="truncate block text-foreground">{caso.clienteNome}</span>
              </td>

              {/* Responsável */}
              <td className="px-4 py-3 max-w-[140px]">
                <span className="truncate block text-muted-foreground">
                  {caso.responsavelNome ?? '—'}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3 whitespace-nowrap">
                <CasoStatusBadge status={caso.status} />
              </td>

              {/* Próxima ação */}
              <td className="px-4 py-3 max-w-[200px]">
                {caso.proximaAcao ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground line-clamp-2 leading-snug">
                      {caso.proximaAcao}
                    </span>
                    {caso.proximaAcaoData && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        até {formatDate(caso.proximaAcaoData)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </td>

              {/* Última atualização */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm text-muted-foreground">
                  {formatRelative(caso.updatedAt)}
                </span>
              </td>

              {/* Processos */}
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {caso.processosCount}
                </span>
              </td>

              {/* Ações */}
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/casos/${caso.id}`)} className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Abrir dossiê
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(caso)} className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(caso)}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
