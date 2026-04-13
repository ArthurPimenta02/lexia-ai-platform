'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { summarizeRadarItem } from '@/actions/ai/radar-summary'
import { addTimelineEvent } from '@/actions/casos'
import { deleteRadarItem } from '@/actions/radar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Info,
  Zap,
  AlertTriangle,
  AlertCircle,
  Milestone,
  ShieldAlert,
  BriefcaseBusiness,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle2,
  TrendingUp,
  CalendarPlus,
  RefreshCw,
  ListPlus,
  Loader2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RadarTipoBadge, RadarUrgenciaBadge, RadarStatusBadge } from './RadarBadge'
import { RadarCriarPrazoDialog } from './RadarCriarPrazoDialog'
import { RADAR_ORIGEM_LABELS, RADAR_URGENCIA_COLORS } from '@/types/radar'
import type { RadarItem } from '@/types/radar'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Section({
  icon: Icon,
  title,
  children,
  iconColor,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  iconColor: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="h-3 w-3" style={{ color: iconColor }} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="pl-7 text-sm text-foreground/80 leading-relaxed">{children}</div>
    </div>
  )
}

interface RadarItemDetailProps {
  item: RadarItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolve?: (itemId: string) => void
  onMarkInAnalysis?: (itemId: string) => void
  onDelete?: (itemId: string) => void
}

export function RadarItemDetail({ item, open, onOpenChange, onResolve, onMarkInAnalysis, onDelete }: RadarItemDetailProps) {
  const router = useRouter()
  const [resumoExpanded, setResumoExpanded] = useState(true)
  const [prazoDialogOpen, setPrazoDialogOpen] = useState(false)
  const [confirmedAction, setConfirmedAction] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [localSummary, setLocalSummary] = useState<{
    resumo: string; explicacaoPratica: string; proximoPasso: string
    riscoSeNaoAgir: string; impactoNoCaso: string
  } | null>(null)
  const [prazos, setPrazos] = useState<{ titulo: string; dataLimite: string; tipo: string }[]>([])

  function flashConfirm(key: string) {
    setConfirmedAction(key)
    setTimeout(() => setConfirmedAction(null), 1500)
  }

  function handleVerCaso() {
    if (!item) return
    onOpenChange(false)
    router.push(`/casos/${item.casoId}`)
  }

  function handleAtualizarCaso() {
    if (!item) return
    onOpenChange(false)
    router.push(`/casos/${item.casoId}`)
  }

  function handleCriarPrazo() {
    setPrazoDialogOpen(true)
  }

  function handlePrazoSaved(prazo: { titulo: string; dataLimite: string; tipo: string }) {
    flashConfirm('prazo')
    setPrazoDialogOpen(false)
    setPrazos((prev) => [...prev, prazo])
  }

  async function handleAdicionarTimeline() {
    if (!item || !item.casoId) return
    const result = await addTimelineEvent(item.casoId, {
      tipo: 'movimentacao_processual',
      titulo: item.titulo,
      descricao: item.descricao || item.resumoIA || 'Movimentação registrada via Radar.',
      urgencia: item.urgencia === 'Alta' ? 'Alta' : item.urgencia === 'Media' ? 'Média' : 'Baixa',
    })
    if ('error' in result) {
      console.error('handleAdicionarTimeline:', result.error)
    } else {
      flashConfirm('timeline')
    }
  }

  async function handleGerarResumo() {
    if (!item) return
    setGeneratingSummary(true)
    setSummaryError(null)
    const result = await summarizeRadarItem(item.id)
    setGeneratingSummary(false)
    if ('error' in result) {
      setSummaryError(result.error)
    } else {
      setLocalSummary(result.summary)
    }
  }

  function handleMarcarResolvido() {
    if (!item) return
    if (confirm(`Marcar "${item.titulo}" como resolvido?`)) {
      onResolve?.(item.id)
      onOpenChange(false)
    }
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm(`Excluir "${item.titulo}"? Esta ação não pode ser desfeita.`)) return
    const result = await deleteRadarItem(item.id)
    if ('error' in result) {
      console.error('handleDelete:', result.error)
    } else {
      onDelete?.(item.id)
    }
  }

  if (!item) {
    return <Sheet open={false} onOpenChange={onOpenChange} />
  }

  const urgenciaColor = RADAR_URGENCIA_COLORS[item.urgencia]

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[720px] overflow-y-auto flex flex-col gap-0 p-0"
      >
        {/* Header — hierarquia: título → contexto → metadados → badges */}
        <SheetHeader className="p-6 pb-5 border-b border-border/60 space-y-0 gap-0">
          {/* Título — maior destaque */}
          <SheetTitle className="text-lg font-semibold leading-snug pr-10 mb-3">
            {item.titulo}
          </SheetTitle>

          {/* Contexto — caso + cliente (SheetDescription para acessibilidade, visualmente oculto) */}
          <SheetDescription className="sr-only">
            {item.casoTitulo} — {item.cliente}
          </SheetDescription>

          {/* Contexto visual — caso + cliente */}
          <div className="flex flex-col gap-1 mb-4">
            <span className="flex items-center gap-2 text-sm text-foreground/80">
              <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {item.casoTitulo}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              {item.cliente}
            </span>
          </div>

          {/* Linha de metadados — discretos */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(item.data)}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>{RADAR_ORIGEM_LABELS[item.origem]}</span>
            {item.referenciaExterna && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <ExternalLink className="h-3 w-3" />
                  {item.referenciaExterna}
                </span>
              </>
            )}
            {item.dataResolucao && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Resolvido em {new Date(item.dataResolucao).toLocaleDateString('pt-BR')}
                </span>
              </>
            )}
          </div>

          {/* Badges — tipo, urgência, status em sequência clara */}
          <div className="flex flex-wrap items-center gap-1.5">
            <RadarTipoBadge tipo={item.tipo} />
            <RadarUrgenciaBadge urgencia={item.urgencia} />
            <RadarStatusBadge status={item.status} />
            {item.exigeAcao && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
                <AlertCircle className="h-3 w-3" />
                Exige ação
              </span>
            )}
          </div>
        </SheetHeader>

        {/* Quick actions */}
        <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Ações rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleVerCaso}>
              <ExternalLink className="h-3.5 w-3.5" />
              Ver caso
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1.5 h-8 text-xs transition-colors',
                confirmedAction === 'prazo' && 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30'
              )}
              onClick={handleCriarPrazo}
            >
              {confirmedAction === 'prazo' ? (
                <><CheckCircle2 className="h-3.5 w-3.5" />Prazo registrado</>
              ) : (
                <><CalendarPlus className="h-3.5 w-3.5" />Criar prazo</>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleAtualizarCaso}>
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar caso
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'gap-1.5 h-8 text-xs transition-colors',
                confirmedAction === 'timeline' && 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30'
              )}
              onClick={handleAdicionarTimeline}
            >
              {confirmedAction === 'timeline' ? (
                <><CheckCircle2 className="h-3.5 w-3.5" />Adicionado</>
              ) : (
                <><ListPlus className="h-3.5 w-3.5" />Adicionar à timeline</>
              )}
            </Button>
            {item.status !== 'resolvido' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                onClick={handleMarcarResolvido}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marcar como resolvido
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30 ml-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Resumo Inteligente (IA) */}
        <div className="flex-1 p-6 space-y-6">
          <div className="rounded-xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-b from-violet-50/60 to-white dark:from-violet-950/30 dark:to-card overflow-hidden">
            {/* AI header */}
            <button
              onClick={() => setResumoExpanded((v) => !v)}
              className="w-full flex items-center justify-between p-4 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                    Resumo Inteligente
                  </p>
                  <p className="text-xs text-violet-600/70 dark:text-violet-400/70">
                    Análise gerada por IA
                  </p>
                </div>
              </div>
              {resumoExpanded ? (
                <ChevronUp className="h-4 w-4 text-violet-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-violet-500" />
              )}
            </button>

            {resumoExpanded && (() => {
              const resumo = localSummary?.resumo || item.resumoIA
              const explicacao = localSummary?.explicacaoPratica || item.explicacaoPratica
              const proximo = localSummary?.proximoPasso || item.proximoPasso
              const risco = localSummary?.riscoSeNaoAgir || item.riscoSeNaoAgir
              const impacto = localSummary?.impactoNoCaso || item.impactoNoCaso
              const semResumo = !resumo && !explicacao && !proximo

              if (semResumo) return (
                <div className="px-4 pb-4 border-t border-violet-100 dark:border-violet-800/40 pt-4 flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Resumo ainda não gerado para este item.
                  </p>
                  {summaryError && (
                    <p className="text-xs text-red-500 text-center">{summaryError}</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-violet-700 border-violet-300 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-700"
                    onClick={handleGerarResumo}
                    disabled={generatingSummary}
                  >
                    {generatingSummary
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Gerando…</>
                      : <><Sparkles className="h-3.5 w-3.5" />Gerar Resumo Inteligente</>
                    }
                  </Button>
                </div>
              )

              return (
              <div className="px-4 pb-4 space-y-4 border-t border-violet-100 dark:border-violet-800/40 pt-4">
                {/* Resumo do andamento */}
                <Section icon={Info} title="Resumo do andamento" iconColor="#7C3AED">
                  {resumo}
                </Section>

                {/* Explicação prática */}
                <Section icon={Zap} title="Explicação prática" iconColor="#2563EB">
                  {explicacao}
                </Section>

                {/* Urgência e ação */}
                <Section icon={AlertTriangle} title="Urgência e exige ação" iconColor={urgenciaColor}>
                  <div className="flex flex-col gap-1.5">
                    <span>
                      Urgência:{' '}
                      <span className="font-semibold" style={{ color: urgenciaColor }}>
                        {item.urgencia}
                      </span>
                    </span>
                    <span>
                      Exige ação imediata:{' '}
                      <span
                        className={cn(
                          'font-semibold',
                          item.exigeAcao ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {item.exigeAcao ? 'Sim' : 'Não'}
                      </span>
                    </span>
                  </div>
                </Section>

                {/* Próximo passo — highlighted */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                      <Milestone className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Próximo passo sugerido
                    </span>
                  </div>
                  <p className="pl-7 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                    {proximo}
                  </p>
                </div>

                {/* Impacto no caso */}
                <Section icon={TrendingUp} title="Impacto no caso" iconColor="#059669">
                  {impacto}
                </Section>

                {/* Risco se não agir */}
                <Section icon={ShieldAlert} title="Risco se não agir" iconColor="#EF4444">
                  {risco}
                </Section>
              </div>
            )
            })()}
          </div>

          {/* Descrição completa */}
          {item.descricao && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{item.descricao}</p>
            </div>
          )}

          {/* Metadata footer */}
          <div className="rounded-lg border border-border/60 bg-muted/30 divide-y divide-border/50 text-xs">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Caso</span>
              <span className="font-medium text-foreground truncate max-w-[240px] text-right">{item.casoId}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Origem</span>
              <span className="font-medium text-foreground">{RADAR_ORIGEM_LABELS[item.origem]}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium text-foreground">{formatDate(item.data)}</span>
            </div>
            {item.referenciaExterna && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Ref. externa</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{item.referenciaExterna}</span>
              </div>
            )}
          </div>

          {/* Prazos criados nesta sessão */}
          {prazos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prazos criados
              </p>
              <div className="rounded-lg border border-border/60 divide-y divide-border/50">
                {prazos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span className="text-sm text-foreground truncate">{p.titulo}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">
                      {new Date(p.dataLimite).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground px-1">
                Aparecerá em /calendar quando o módulo estiver conectado.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <RadarCriarPrazoDialog
      open={prazoDialogOpen}
      onOpenChange={setPrazoDialogOpen}
      item={item}
      onSave={(p) => handlePrazoSaved({ titulo: p.titulo, dataLimite: p.dataLimite, tipo: p.tipo })}
    />
    </>
  )
}
