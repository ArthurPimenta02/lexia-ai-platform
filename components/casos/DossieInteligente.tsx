'use client'

import { useState, useTransition } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  ListChecks,
  Milestone,
  Clock,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateDossie } from '@/actions/ai/dossie'
import type { DossieInteligente as DossieData } from '@/types/caso'

interface DossieInteligenteProps {
  dossie: DossieData | null
  casoId: string
  onDossieGenerated: (dossie: DossieData) => void
}

interface SectionProps {
  icon: React.ElementType
  title: string
  iconClass: string
  titleClass: string
  children: React.ReactNode
}

function Section({ icon: Icon, title, iconClass, titleClass, children }: SectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4 shrink-0', iconClass)} />
        <span className={cn('text-xs font-semibold uppercase tracking-wider', titleClass)}>
          {title}
        </span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  )
}

export function DossieInteligente({ dossie, casoId, onDossieGenerated }: DossieInteligenteProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateDossie(casoId)
      if ('error' in result) {
        setError(result.error)
      } else {
        onDossieGenerated(result.dossie)
      }
    })
  }

  const geradoEm = dossie
    ? new Date(dossie.geradoEm).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-b from-violet-50/60 to-white dark:from-violet-950/30 dark:to-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-100 dark:border-violet-800/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              Dossiê Inteligente
            </span>
            <span className="ml-2 text-xs text-violet-400 dark:text-violet-500 font-normal">
              por Claude
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-violet-400 hover:text-violet-600 hover:bg-violet-100 dark:text-violet-500 dark:hover:text-violet-300 dark:hover:bg-violet-900/50"
            onClick={handleGenerate}
            disabled={isPending}
            title={dossie ? 'Regenerar dossiê' : 'Gerar dossiê'}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
          </Button>
          {dossie && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-violet-400 hover:text-violet-600 hover:bg-violet-100 dark:text-violet-500 dark:hover:text-violet-300 dark:hover:bg-violet-900/50"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Sem dossiê ainda */}
      {!dossie && !isPending && (
        <div className="px-4 py-6 text-center space-y-3">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            Gere um dossiê inteligente para obter uma análise completa deste caso com IA.
          </p>
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
          <Button
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleGenerate}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gerar Dossiê
          </Button>
        </div>
      )}

      {/* Gerando... */}
      {isPending && (
        <div className="px-4 py-6 text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-violet-600 dark:text-violet-400">Analisando o caso com IA...</p>
          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
        </div>
      )}

      {/* Dossiê gerado */}
      {dossie && !isPending && !collapsed && (
        <div className="px-4 py-4 space-y-5">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Resumo */}
          <Section
            icon={Info}
            title="Resumo do caso"
            iconClass="text-violet-600 dark:text-violet-400"
            titleClass="text-violet-700 dark:text-violet-400"
          >
            <p className="text-sm text-foreground/80 leading-relaxed">{dossie.resumo}</p>
          </Section>

          {/* Última movimentação relevante */}
          <Section
            icon={Clock}
            title="Última movimentação relevante"
            iconClass="text-blue-600 dark:text-blue-400"
            titleClass="text-blue-700 dark:text-blue-400"
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
              {dossie.ultimaMovimentacaoRelevante}
            </p>
          </Section>

          {/* Pontos críticos */}
          {dossie.pontosCriticos.length > 0 && (
            <Section
              icon={AlertTriangle}
              title="Pontos críticos"
              iconClass="text-red-600 dark:text-red-400"
              titleClass="text-red-700 dark:text-red-400"
            >
              <ul className="space-y-1.5">
                {dossie.pontosCriticos.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 dark:bg-red-500 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Pendências identificadas */}
          {dossie.pendenciasIdentificadas.length > 0 && (
            <Section
              icon={ListChecks}
              title="Pendências identificadas"
              iconClass="text-amber-600 dark:text-amber-400"
              titleClass="text-amber-700 dark:text-amber-400"
            >
              <ul className="space-y-1.5">
                {dossie.pendenciasIdentificadas.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 dark:bg-amber-500 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Próximos marcos */}
          {dossie.proximosMarcosEsperados.length > 0 && (
            <Section
              icon={Milestone}
              title="Próximos marcos esperados"
              iconClass="text-emerald-600 dark:text-emerald-400"
              titleClass="text-emerald-700 dark:text-emerald-400"
            >
              <ul className="space-y-1.5">
                {dossie.proximosMarcosEsperados.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 dark:bg-emerald-500 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Próximo passo sugerido */}
          <div className="rounded-lg border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 px-4 py-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wider">
              <ArrowRight className="h-3.5 w-3.5" />
              Próximo passo sugerido
            </div>
            <p className="text-sm text-violet-900 dark:text-violet-100 leading-relaxed font-medium">
              {dossie.proximoPasso}
            </p>
          </div>

          {/* Contexto de retomada */}
          <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5">
            <p className="text-xs text-muted-foreground font-medium mb-1">Contexto para retomada rápida</p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">{dossie.contextoRetomada}</p>
          </div>

          {/* Footer */}
          <div className="pt-1 flex items-center gap-1.5 text-xs text-violet-400 dark:text-violet-600">
            <Sparkles className="h-3 w-3" />
            Gerado em {geradoEm} · Claude Sonnet
          </div>
        </div>
      )}
    </div>
  )
}
