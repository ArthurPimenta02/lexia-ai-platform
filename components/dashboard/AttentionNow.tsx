import { AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AttentionNowData } from '@/types/dashboard'

const URGENCIA_COLORS: Record<'Alta' | 'Media' | 'Baixa', string> = {
  Alta: 'text-error bg-red-50 dark:bg-red-950/30',
  Media: 'text-warning bg-orange-50 dark:bg-orange-950/30',
  Baixa: 'text-neutral bg-gray-100 dark:bg-gray-800/40',
}

const TIPO_LABELS: Record<string, string> = {
  publicacao: 'Publicação',
  movimentacao: 'Movimentação',
  alerta_prazo: 'Prazo',
  acao_requerida: 'Ação Requerida',
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface Props {
  data: AttentionNowData
}

export function AttentionNow({ data }: Props) {
  const hasItems = data.urgentRadar.length > 0 || data.openPendencias.length > 0

  if (!hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Precisa de atenção agora
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum item crítico no momento. Bom trabalho!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-error" />
          Precisa de atenção agora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Radar urgente */}
        {data.urgentRadar.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Radar — Urgência Alta
            </p>
            <ul className="space-y-2">
              {data.urgentRadar.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${URGENCIA_COLORS[item.urgencia]}`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {TIPO_LABELS[item.tipo] ?? item.tipo}
                      {item.casoTitulo ? ` · ${item.casoTitulo}` : ''}
                    </p>
                  </div>
                  <Link
                    href="/radar"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Ver no Radar"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pendências abertas */}
        {data.openPendencias.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pendências em aberto
            </p>
            <ul className="space-y-2">
              {data.openPendencias.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${URGENCIA_COLORS[p.urgencia]}`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{p.descricao}</p>
                    {p.prazo && (
                      <p className="text-xs text-muted-foreground">
                        Prazo: {formatDate(p.prazo)}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/casos/${p.casoId}`}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Abrir caso"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
