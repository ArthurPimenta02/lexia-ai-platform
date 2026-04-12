'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ChevronDown, ChevronUp,
  AlertCircle, Minus, CheckCircle2,
  Scale, UserCheck, FileText, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { triageLead } from '@/actions/ai/lead-triage'
import type { LeadTriage, UrgencyLevel } from '@/types/lead'

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  Alta:  '#EF4444',
  Média: '#F97316',
  Baixa: '#10B981',
}

const URGENCY_ICONS: Record<UrgencyLevel, React.ComponentType<{ className?: string }>> = {
  Alta:  AlertCircle,
  Média: Minus,
  Baixa: CheckCircle2,
}

interface LeadTriagePanelProps {
  leadId: string
  triage: LeadTriage | null
}

export function LeadTriagePanel({ leadId, triage: initialTriage }: LeadTriagePanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(true)
  const [triage, setTriage] = useState<LeadTriage | null>(initialTriage)
  const [triageError, setTriageError] = useState<string | null>(null)

  function handleGenerate() {
    setTriageError(null)
    startTransition(async () => {
      const result = await triageLead(leadId)
      if ('error' in result) {
        setTriageError(result.error)
        return
      }
      setTriage(result.triage)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex w-full items-center justify-between gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-2 text-left"
            aria-expanded={open}
          >
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-brand" />
              Triagem Inteligente
            </CardTitle>
            {open
              ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            }
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={isPending}
            className="shrink-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
            {isPending ? 'Gerando…' : triage ? 'Atualizar' : 'Gerar triagem'}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {triageError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {triageError}
            </p>
          )}

          {!triage ? (
            <p className="text-sm text-muted-foreground italic">
              {isPending
                ? 'Analisando o lead com IA…'
                : 'Triagem não realizada. Clique em "Gerar triagem" para analisar este lead.'}
            </p>
          ) : (
            <>
              {/* Área jurídica + Urgência */}
              <div className="flex flex-wrap gap-4">
                <InfoItem icon={Scale} label="Área jurídica" value={triage.legalArea} />
                <UrgencyItem urgency={triage.urgency} />
              </div>

              {/* Resumo da demanda */}
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Resumo da demanda
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {triage.demandSummary}
                </p>
              </div>

              {/* Encaminhamento */}
              <InfoItem
                icon={UserCheck}
                label="Encaminhamento sugerido"
                value={triage.routingSuggestion}
              />

              {/* Intake cards */}
              {triage.intakeCards.length > 0 && (
                <div className="space-y-2">
                  {triage.intakeCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1"
                    >
                      <p className="text-xs font-semibold text-foreground">{card.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function UrgencyItem({ urgency }: { urgency: UrgencyLevel }) {
  const Icon = URGENCY_ICONS[urgency]
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Urgência</p>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: URGENCY_COLORS[urgency] }}
        >
          {urgency}
        </span>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
