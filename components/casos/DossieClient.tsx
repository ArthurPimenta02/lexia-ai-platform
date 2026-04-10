'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Plus,
  Paperclip,
  Calendar,
  User,
  Building2,
  Scale,
  Hash,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CasoStatusBadge, CasoAreaBadge, UrgenciaBadge } from '@/components/casos/CasoStatusBadge'
import { DossieInteligente } from '@/components/casos/DossieInteligente'
import { CasoFormDialog } from '@/components/casos/CasoFormDialog'
import { cn } from '@/lib/utils'
import type { Caso, TimelineEvent, TimelineEventTipo, Pendencia, Prazo, ProcessoVinculado, Documento } from '@/types/caso'
import { TIMELINE_EVENT_LABELS } from '@/types/caso'

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`
  return `há ${Math.floor(days / 30)} meses`
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

// ─── Timeline icon/color ──────────────────────────────────────────────────────

const TIMELINE_ICON: Record<TimelineEventTipo, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  criacao:                { icon: Plus,         colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-900/40' },
  nota_interna:           { icon: FileText,     colorClass: 'text-gray-500 dark:text-gray-400',      bgClass: 'bg-gray-100 dark:bg-gray-800' },
  documento_anexado:      { icon: Paperclip,    colorClass: 'text-blue-600 dark:text-blue-400',      bgClass: 'bg-blue-100 dark:bg-blue-900/40' },
  prazo_criado:           { icon: Clock,        colorClass: 'text-orange-600 dark:text-orange-400',  bgClass: 'bg-orange-100 dark:bg-orange-900/40' },
  movimentacao_processual:{ icon: Scale,        colorClass: 'text-violet-600 dark:text-violet-400',  bgClass: 'bg-violet-100 dark:bg-violet-900/40' },
  atualizacao_status:     { icon: ChevronRight, colorClass: 'text-indigo-600 dark:text-indigo-400',  bgClass: 'bg-indigo-100 dark:bg-indigo-900/40' },
  audiencia:              { icon: Calendar,     colorClass: 'text-pink-600 dark:text-pink-400',      bgClass: 'bg-pink-100 dark:bg-pink-900/40' },
  peticao:                { icon: FileText,     colorClass: 'text-teal-600 dark:text-teal-400',      bgClass: 'bg-teal-100 dark:bg-teal-900/40' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card shadow-sm', className)}>
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-foreground flex-1">{children}</span>
    </div>
  )
}

// ─── Seção: Visão Geral ───────────────────────────────────────────────────────

function SecaoVisaoGeral({ caso }: { caso: Caso }) {
  return (
    <SectionCard title="Visão Geral">
      <div className="divide-y divide-border/50">
        <InfoRow label="Cliente">
          <span className="font-medium">{caso.cliente}</span>
        </InfoRow>
        <InfoRow label="Área">
          <CasoAreaBadge area={caso.area} />
        </InfoRow>
        <InfoRow label="Status">
          <CasoStatusBadge status={caso.status} />
        </InfoRow>
        <InfoRow label="Responsável">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {caso.responsavel}
          </span>
        </InfoRow>
        {caso.advogados.length > 1 && (
          <InfoRow label="Equipe">
            <span className="text-muted-foreground">{caso.advogados.filter(a => a !== caso.responsavel).join(', ')}</span>
          </InfoRow>
        )}
        <InfoRow label="Abertura">
          {fmtDate(caso.dataAbertura)}
        </InfoRow>
        {caso.dataEncerramento && (
          <InfoRow label="Encerramento">
            {fmtDate(caso.dataEncerramento)}
          </InfoRow>
        )}
        <InfoRow label="Última atualização">
          <span className="text-muted-foreground">{fmtRelative(caso.ultimaAtualizacao)}</span>
        </InfoRow>
        {caso.descricao && (
          <InfoRow label="Descrição">
            <span className="text-muted-foreground leading-relaxed">{caso.descricao}</span>
          </InfoRow>
        )}
      </div>
    </SectionCard>
  )
}

// ─── Seção: Próxima ação + Pendências ─────────────────────────────────────────

function SecaoPendencias({ caso }: { caso: Caso }) {
  const abertas = caso.pendencias.filter((p) => !p.resolvida)
  const resolvidas = caso.pendencias.filter((p) => p.resolvida)

  return (
    <SectionCard title="Pendências e Próxima Ação">
      <div className="space-y-4">
        {/* Próxima ação */}
        {caso.proximaAcao && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-3 dark:bg-blue-950/40 dark:border-blue-900/60">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Próxima ação</p>
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">{caso.proximaAcao}</p>
            {caso.proximaAcaoData && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                até {fmtDate(caso.proximaAcaoData)}
              </p>
            )}
          </div>
        )}

        {/* Pendências abertas */}
        {abertas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pendências abertas ({abertas.length})
            </p>
            {abertas.map((p) => (
              <PendenciaItem key={p.id} pendencia={p} />
            ))}
          </div>
        )}

        {/* Pendências resolvidas */}
        {resolvidas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Resolvidas ({resolvidas.length})
            </p>
            {resolvidas.map((p) => (
              <PendenciaItem key={p.id} pendencia={p} />
            ))}
          </div>
        )}

        {caso.pendencias.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma pendência registrada</p>
        )}
      </div>
    </SectionCard>
  )
}

function PendenciaItem({ pendencia }: { pendencia: Pendencia }) {
  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg border px-3 py-2.5',
      pendencia.resolvida
        ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/30 opacity-60'
        : 'border-border bg-muted/20'
    )}>
      {pendencia.resolvida
        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
        : <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', pendencia.resolvida && 'line-through text-muted-foreground')}>
          {pendencia.descricao}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {!pendencia.resolvida && <UrgenciaBadge urgencia={pendencia.urgencia} />}
          {pendencia.responsavel && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />{pendencia.responsavel}
            </span>
          )}
          {pendencia.prazo && !pendencia.resolvida && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />até {fmtDate(pendencia.prazo)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Seção: Prazos ────────────────────────────────────────────────────────────

function SecaoPrazos({ prazos }: { prazos: Prazo[] }) {
  const sorted = [...prazos].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  return (
    <SectionCard title="Próximos Prazos">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhum prazo registrado</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((prazo) => {
            const days = daysUntil(prazo.data)
            const overdue = days < 0
            const urgent = days >= 0 && days <= 7
            return (
              <div key={prazo.id} className={cn(
                'flex items-start gap-3 rounded-lg border px-3 py-2.5',
                prazo.cumprido
                  ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/30 opacity-60'
                  : overdue
                  ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/30'
                  : urgent
                  ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/30'
                  : 'border-border bg-muted/20'
              )}>
                {prazo.cumprido
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  : overdue
                  ? <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  : <Clock className={cn('h-4 w-4 shrink-0 mt-0.5', urgent ? 'text-orange-500' : 'text-muted-foreground')} />
                }
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', prazo.cumprido && 'line-through text-muted-foreground')}>
                    {prazo.descricao}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn(
                      'text-xs font-medium',
                      overdue ? 'text-red-600' : urgent ? 'text-orange-600' : 'text-muted-foreground'
                    )}>
                      {fmtDate(prazo.data)}
                      {!prazo.cumprido && (overdue ? ' — vencido' : days === 0 ? ' — hoje' : days === 1 ? ' — amanhã' : ` — em ${days} dias`)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {prazo.tipo}
                    </Badge>
                    {!prazo.cumprido && <UrgenciaBadge urgencia={prazo.urgencia} />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Seção: Processos Vinculados ──────────────────────────────────────────────

function SecaoProcessos({ processos }: { processos: ProcessoVinculado[] }) {
  return (
    <SectionCard title={`Processos Vinculados (${processos.length})`}>
      {processos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhum processo vinculado</p>
      ) : (
        <div className="space-y-3">
          {processos.map((proc) => (
            <div key={proc.id} className="rounded-lg border border-border bg-muted/10 px-3 py-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-mono text-foreground font-medium">{proc.numero}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{proc.tribunal}</p>
                  <p className="text-xs text-muted-foreground">{proc.vara}</p>
                </div>
                {proc.link && (
                  <a href={proc.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
              <div className="border-t border-border/50 pt-1.5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Última movimentação:</span>{' '}
                  {fmtRelative(proc.ultimaMovimentacao)} — {proc.resumoUltimaMovimentacao}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Seção: Documentos ────────────────────────────────────────────────────────

function SecaoDocumentos({ documentos }: { documentos: Documento[] }) {
  return (
    <SectionCard title={`Documentos (${documentos.length})`}>
      {documentos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhum documento anexado</p>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/30 transition-colors group">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.tipo} · {doc.tamanho && `${doc.tamanho} · `}adicionado por {doc.criadoPor} em {fmtDate(doc.criadoEm)}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" title="Baixar (em breve)">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-border/50">
        <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground" disabled>
          <Paperclip className="h-3.5 w-3.5" />
          Anexar documento (Fase 3)
        </Button>
      </div>
    </SectionCard>
  )
}

// ─── Seção: Linha do Tempo ────────────────────────────────────────────────────

function SecaoTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return (
    <SectionCard title="Linha do Tempo">
      <div className="relative space-y-0">
        {sorted.map((event, i) => {
          const { icon: Icon, colorClass, bgClass } = TIMELINE_ICON[event.tipo]
          const isLast = i === sorted.length - 1
          return (
            <div key={event.id} className="flex gap-3 pb-4 relative">
              {/* Linha vertical */}
              {!isLast && (
                <div className="absolute left-[15px] top-7 bottom-0 w-px bg-border" />
              )}
              {/* Ícone */}
              <div className={cn('h-8 w-8 rounded-full shrink-0 flex items-center justify-center z-10', bgClass)}>
                <Icon className={cn('h-4 w-4', colorClass)} />
              </div>
              {/* Conteúdo */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className={cn('text-xs font-semibold uppercase tracking-wider', colorClass)}>
                      {TIMELINE_EVENT_LABELS[event.tipo]}
                    </span>
                    <p className="text-sm font-medium text-foreground mt-0.5">{event.titulo}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {fmtDateTime(event.data)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{event.descricao}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                    <User className="h-3 w-3" />{event.autor}
                  </span>
                  {event.processo && (
                    <span className="text-xs font-mono text-muted-foreground/70 flex items-center gap-1">
                      <Hash className="h-3 w-3" />{event.processo}
                    </span>
                  )}
                  {event.urgencia && <UrgenciaBadge urgencia={event.urgencia} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ─── Header do caso ───────────────────────────────────────────────────────────

function CasoHeader({ caso, onEdit }: { caso: Caso; onEdit: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/casos" className="hover:text-foreground transition-colors">Casos</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate">{caso.titulo}</span>
          </div>

          {/* Título */}
          <h1 className="text-xl font-semibold text-foreground leading-snug">{caso.titulo}</h1>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <CasoStatusBadge status={caso.status} />
            <CasoAreaBadge area={caso.area} />
            {caso.numero && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {caso.numero}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {caso.responsavel}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {caso.cliente}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Aberto em {new Date(caso.dataAbertura).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Atualizado {fmtRelative(caso.ultimaAtualizacao)}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled title="Em breve">
            <Calendar className="h-3.5 w-3.5" />
            Adicionar evento
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled title="Em breve">
            <Paperclip className="h-3.5 w-3.5" />
            Anexar documento
          </Button>
        </div>
      </div>

      {/* Próxima ação em destaque (se houver) */}
      {caso.proximaAcao && (
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <ArrowRight className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
          <span className="text-xs text-muted-foreground">Próxima ação:</span>
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{caso.proximaAcao}</span>
          {caso.proximaAcaoData && (
            <span className="text-xs text-blue-400 dark:text-blue-500 ml-auto shrink-0">
              até {fmtDate(caso.proximaAcaoData)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── DossieClient (root) ──────────────────────────────────────────────────────

interface DossieClientProps {
  caso: Caso
}

export function DossieClient({ caso: initialCaso }: DossieClientProps) {
  const [caso, setCaso] = useState<Caso>(initialCaso)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(data: { titulo: string; area: Caso['area']; status: Caso['status']; cliente: string; responsavel: string; descricao: string; proximaAcao: string }) {
    setCaso((prev) => ({
      ...prev,
      titulo: data.titulo,
      area: data.area,
      status: data.status,
      cliente: data.cliente,
      responsavel: data.responsavel,
      descricao: data.descricao || undefined,
      proximaAcao: data.proximaAcao || undefined,
      ultimaAtualizacao: new Date().toISOString(),
    }))
  }

  return (
    <div className="space-y-6">
      {/* Voltar */}
      <Link
        href="/casos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Casos
      </Link>

      {/* Header do caso */}
      <CasoHeader caso={caso} onEdit={() => setEditOpen(true)} />

      {/* Layout: duas colunas em desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <SecaoTimeline events={caso.timeline} />
          <SecaoProcessos processos={caso.processos} />
          <SecaoDocumentos documentos={caso.documentos} />
        </div>

        {/* Coluna lateral (1/3) */}
        <div className="space-y-6">
          {/* Dossiê Inteligente */}
          {caso.dossieInteligente && (
            <DossieInteligente dossie={caso.dossieInteligente} />
          )}

          <SecaoVisaoGeral caso={caso} />
          <SecaoPendencias caso={caso} />
          <SecaoPrazos prazos={caso.prazos} />
        </div>
      </div>

      {/* Dialog de edição */}
      <CasoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        caso={caso}
        onSave={handleEdit}
      />
    </div>
  )
}
