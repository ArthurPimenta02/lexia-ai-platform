'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, Minus, CheckCircle2, Scale, UserCheck, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { URGENCY_COLORS } from '@/lib/mock/leads'
import type { LeadTriage, UrgencyLevel } from '@/types/lead'

const URGENCY_ICONS: Record<UrgencyLevel, React.ComponentType<{ className?: string }>> = {
  Alta: AlertCircle,
  Média: Minus,
  Baixa: CheckCircle2,
}

interface LeadTriagePanelProps {
  triage: LeadTriage | undefined
}

export function LeadTriagePanel({ triage }: LeadTriagePanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand" />
            Triagem Inteligente
          </CardTitle>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {!triage ? (
            <p className="text-sm text-muted-foreground italic">
              Triagem não realizada para este lead.
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
              <InfoItem icon={UserCheck} label="Encaminhamento sugerido" value={triage.routingSuggestion} />

              {/* Intake cards */}
              {triage.intakeCards.length > 0 && (
                <div className="space-y-2">
                  {triage.intakeCards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        'rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1'
                      )}
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
  icon: Icon,
  label,
  value,
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
