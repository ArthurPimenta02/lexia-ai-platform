'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, BarChart2, FileText, AlertTriangle, ClipboardList, TrendingUp, ExternalLink, Clock } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { FunnelChart } from '@/components/shared/FunnelChart'
import { ActivityFeed } from '@/components/shared/ActivityFeed'
import { AttentionNow } from '@/components/dashboard/AttentionNow'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import type {
  DashboardMetrics,
  FunnelStage,
  Activity,
  AttentionNowData,
  LeadDetailItem,
  ConversionDetailItem,
  PendenciaDetailItem,
} from '@/types/dashboard'
import type { LeadOrigin } from '@/types/database'

// ── Helpers ────────────────────────────────────────────────────────────────────

const ORIGIN_LABELS: Record<LeadOrigin, string> = {
  whatsapp: 'WhatsApp',
  web: 'Site',
  manual: 'Manual',
  referral: 'Indicação',
  advbox: 'AdvBox',
}

const URGENCY_COLORS: Record<string, string> = {
  Alta: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  Media: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  Baixa: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Sheet: Novos Leads (24h) ───────────────────────────────────────────────────

function NewLeadsSheet({
  open,
  onClose,
  leads,
}: {
  open: boolean
  onClose: () => void
  leads: LeadDetailItem[]
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novos Leads — últimas 24h</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum lead criado nas últimas 24h.
            </p>
          ) : (
            leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors group"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: lead.stageColor }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ORIGIN_LABELS[lead.origin as LeadOrigin] ?? lead.origin} · {formatDateTime(lead.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{lead.stageName}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))
          )}
        </div>
        {leads.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/leads"
              onClick={onClose}
              className="text-sm text-brand hover:underline"
            >
              Ver todos os leads →
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Sheet: Taxa de Conversão ──────────────────────────────────────────────────

function ConversionSheet({
  open,
  onClose,
  leads,
  rate,
}: {
  open: boolean
  onClose: () => void
  leads: ConversionDetailItem[]
  rate: number
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Taxa de Conversão — {rate}%</SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-sm text-muted-foreground">
          Leads que chegaram ao estágio <strong>Cliente</strong>
        </p>
        <div className="mt-4 space-y-1">
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum lead convertido ainda.
            </p>
          ) : (
            leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors group"
              >
                <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ORIGIN_LABELS[lead.origin as LeadOrigin] ?? lead.origin}
                    {lead.convertedAt ? ` · ${formatDate(lead.convertedAt)}` : ''}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              </Link>
            ))
          )}
        </div>
        {leads.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/leads"
              onClick={onClose}
              className="text-sm text-brand hover:underline"
            >
              Ver todos os leads →
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Sheet: Pendências em Aberto ───────────────────────────────────────────────

function PendenciasSheet({
  open,
  onClose,
  pendencias,
}: {
  open: boolean
  onClose: () => void
  pendencias: PendenciaDetailItem[]
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Pendências em Aberto</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {pendencias.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma pendência em aberto.
            </p>
          ) : (
            pendencias.map((p) => (
              <Link
                key={p.id}
                href={`/casos/${p.casoId}`}
                onClick={onClose}
                className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{p.descricao}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.casoTitulo}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-xs font-medium border-0 ${URGENCY_COLORS[p.urgencia]}`}
                    >
                      {p.urgencia}
                    </Badge>
                    {p.prazo && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(p.prazo)}
                      </span>
                    )}
                    {p.responsavel && (
                      <span className="text-xs text-muted-foreground truncate">
                        {p.responsavel}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-0.5" />
              </Link>
            ))
          )}
        </div>
        {pendencias.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/casos"
              onClick={onClose}
              className="text-sm text-brand hover:underline"
            >
              Ver todos os casos →
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── DashboardClient ────────────────────────────────────────────────────────────

type SheetType = 'newLeads' | 'conversion' | 'pendencias' | null

interface DashboardClientProps {
  metrics: DashboardMetrics
  funnel: FunnelStage[]
  activities: Activity[]
  attentionNow: AttentionNowData
  newLeadsDetail: LeadDetailItem[]
  conversionDetail: ConversionDetailItem[]
  pendenciasDetail: PendenciaDetailItem[]
}

export function DashboardClient({
  metrics,
  funnel,
  activities,
  attentionNow,
  newLeadsDetail,
  conversionDetail,
  pendenciasDetail,
}: DashboardClientProps) {
  const [openSheet, setOpenSheet] = useState<SheetType>(null)

  return (
    <>
      <div className="space-y-6">
        {/* Métricas — linha 1 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Novos Leads (24h)"
            value={metrics.newLeads24h}
            delta={metrics.newLeads24hDelta}
            icon={Users}
            iconColor="text-brand"
            iconBg="bg-blue-50 dark:bg-blue-950/30"
            onClick={() => setOpenSheet('newLeads')}
          />
          <MetricCard
            label="Total de Leads"
            value={metrics.totalLeads}
            icon={TrendingUp}
            iconColor="text-[#8B5CF6]"
            iconBg="bg-purple-50 dark:bg-purple-950/30"
            href="/leads"
          />
          <MetricCard
            label="Taxa de Conversão"
            value={`${metrics.conversionRate}%`}
            icon={BarChart2}
            iconColor="text-success"
            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
            onClick={() => setOpenSheet('conversion')}
          />
          <MetricCard
            label="Casos Ativos"
            value={metrics.activeCasos}
            icon={FileText}
            iconColor="text-[#8B5CF6]"
            iconBg="bg-purple-50 dark:bg-purple-950/30"
            href="/casos"
          />
        </div>

        {/* Métricas — linha 2 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard
            label="Pendências em Aberto"
            value={metrics.openPendencias}
            icon={ClipboardList}
            iconColor="text-warning"
            iconBg="bg-orange-50 dark:bg-orange-950/30"
            onClick={() => setOpenSheet('pendencias')}
          />
          <MetricCard
            label="Alertas Urgentes (Radar)"
            value={metrics.urgentRadarItems}
            icon={AlertTriangle}
            iconColor="text-error"
            iconBg="bg-red-50 dark:bg-red-950/30"
            href="/radar"
          />
        </div>

        {/* Funil + Atividades */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FunnelChart stages={funnel} />
          <ActivityFeed activities={activities} />
        </div>

        {/* Bloco "Precisa de atenção agora" */}
        <AttentionNow data={attentionNow} />
      </div>

      {/* Sheets */}
      <NewLeadsSheet
        open={openSheet === 'newLeads'}
        onClose={() => setOpenSheet(null)}
        leads={newLeadsDetail}
      />
      <ConversionSheet
        open={openSheet === 'conversion'}
        onClose={() => setOpenSheet(null)}
        leads={conversionDetail}
        rate={metrics.conversionRate}
      />
      <PendenciasSheet
        open={openSheet === 'pendencias'}
        onClose={() => setOpenSheet(null)}
        pendencias={pendenciasDetail}
      />
    </>
  )
}
