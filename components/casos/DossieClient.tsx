'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  ExternalLink,
  ChevronRight,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CasoStatusBadge, CasoAreaBadge, UrgenciaBadge } from '@/components/casos/CasoStatusBadge'
import { DossieInteligente } from '@/components/casos/DossieInteligente'
import { CasoFormDialog } from '@/components/casos/CasoFormDialog'
import { cn } from '@/lib/utils'
import { updateCaso, updatePendencia, createPendencia, addTimelineEvent } from '@/actions/casos'
import type { Caso, TimelineEvent, TimelineEventTipo, Pendencia, ProcessoVinculado, Documento, CasoFormData, PendenciaInput, UrgenciaNivel } from '@/types/caso'
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
          <span className="font-medium">{caso.clienteNome}</span>
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
            {caso.responsavelNome ?? '—'}
          </span>
        </InfoRow>
        <InfoRow label="Abertura">
          {fmtDate(caso.dataAbertura)}
        </InfoRow>
        {caso.dataEncerramento && (
          <InfoRow label="Encerramento">
            {fmtDate(caso.dataEncerramento)}
          </InfoRow>
        )}
        <InfoRow label="Última atualização">
          <span className="text-muted-foreground">{fmtRelative(caso.updatedAt)}</span>
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

// ─── Seção: Pendências ────────────────────────────────────────────────────────

interface SecaoPendenciasProps {
  caso: Caso
  pendencias: Pendencia[]
  onResolve: (id: string) => void
  onAdd: (data: PendenciaInput) => void
  resolving: Set<string>
}

function SecaoPendencias({ caso, pendencias, onResolve, onAdd, resolving }: SecaoPendenciasProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [newDescricao, setNewDescricao] = useState('')
  const [newPrazo, setNewPrazo] = useState('')
  const [newResponsavel, setNewResponsavel] = useState('')
  const [newUrgencia, setNewUrgencia] = useState<UrgenciaNivel>('Baixa')

  const abertas = pendencias.filter((p) => !p.resolvida)
  const resolvidas = pendencias.filter((p) => p.resolvida)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDescricao.trim()) return
    onAdd({
      descricao: newDescricao,
      prazo: newPrazo ? new Date(newPrazo).toISOString() : null,
      responsavel: newResponsavel || null,
      urgencia: newUrgencia,
    })
    setNewDescricao('')
    setNewPrazo('')
    setNewResponsavel('')
    setNewUrgencia('Baixa')
    setAddOpen(false)
  }

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
              <PendenciaItem
                key={p.id}
                pendencia={p}
                onResolve={() => onResolve(p.id)}
                resolving={resolving.has(p.id)}
              />
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

        {pendencias.length === 0 && !addOpen && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma pendência registrada</p>
        )}

        {/* Form de nova pendência */}
        {addOpen && (
          <form onSubmit={handleAdd} className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="space-y-1">
              <Label className="text-xs">Descrição *</Label>
              <Input
                value={newDescricao}
                onChange={(e) => setNewDescricao(e.target.value)}
                placeholder="Descreva a pendência..."
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Prazo</Label>
                <Input
                  type="date"
                  value={newPrazo}
                  onChange={(e) => setNewPrazo(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Urgência</Label>
                <select
                  value={newUrgencia}
                  onChange={(e) => setNewUrgencia(e.target.value as UrgenciaNivel)}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Responsável</Label>
              <Input
                value={newResponsavel}
                onChange={(e) => setNewResponsavel(e.target.value)}
                placeholder="Nome do responsável"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={!newDescricao.trim()}>Adicionar</Button>
            </div>
          </form>
        )}

        {/* Botão adicionar */}
        {!addOpen && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar pendência
          </Button>
        )}
      </div>
    </SectionCard>
  )
}

function PendenciaItem({
  pendencia,
  onResolve,
  resolving,
}: {
  pendencia: Pendencia
  onResolve?: () => void
  resolving?: boolean
}) {
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
      {!pendencia.resolvida && onResolve && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-green-600"
          onClick={onResolve}
          disabled={resolving}
        >
          {resolving ? '...' : 'Resolver'}
        </Button>
      )}
    </div>
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
                  {proc.vara && <p className="text-xs text-muted-foreground">{proc.vara}</p>}
                </div>
                {proc.isPrimary && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                    Principal
                  </span>
                )}
              </div>
              {proc.resumoUltimaMovimentacao && (
                <div className="border-t border-border/50 pt-1.5">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Última movimentação:</span>{' '}
                    {proc.ultimaMovimentacao ? fmtRelative(proc.ultimaMovimentacao) + ' — ' : ''}
                    {proc.resumoUltimaMovimentacao}
                  </p>
                </div>
              )}
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
          Anexar documento (em breve)
        </Button>
      </div>
    </SectionCard>
  )
}

// ─── Seção: Linha do Tempo ────────────────────────────────────────────────────

interface SecaoTimelineProps {
  events: TimelineEvent[]
  casoId: string
  onAddNote: (titulo: string, descricao: string) => void
  addingNote: boolean
}

function SecaoTimeline({ events, casoId: _casoId, onAddNote, addingNote }: SecaoTimelineProps) {
  const sorted = [...events].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteTitulo, setNoteTitulo] = useState('')
  const [noteDesc, setNoteDesc] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!noteTitulo.trim()) return
    onAddNote(noteTitulo, noteDesc)
    setNoteTitulo('')
    setNoteDesc('')
    setNoteOpen(false)
  }

  return (
    <SectionCard title="Linha do Tempo">
      <div className="relative space-y-0">
        {sorted.map((event, i) => {
          const { icon: Icon, colorClass, bgClass } = TIMELINE_ICON[event.tipo]
          const isLast = i === sorted.length - 1
          return (
            <div key={event.id} className="flex gap-3 pb-4 relative">
              {!isLast && (
                <div className="absolute left-[15px] top-7 bottom-0 w-px bg-border" />
              )}
              <div className={cn('h-8 w-8 rounded-full shrink-0 flex items-center justify-center z-10', bgClass)}>
                <Icon className={cn('h-4 w-4', colorClass)} />
              </div>
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
                {event.descricao && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{event.descricao}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                    <User className="h-3 w-3" />{event.autor}
                  </span>
                  {event.urgencia && <UrgenciaBadge urgencia={event.urgencia} />}
                </div>
              </div>
            </div>
          )
        })}

        {sorted.length === 0 && !noteOpen && (
          <p className="text-sm text-muted-foreground text-center py-2">Sem eventos na linha do tempo</p>
        )}
      </div>

      {/* Form de nota interna */}
      {noteOpen ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="space-y-1">
            <Label className="text-xs">Título *</Label>
            <Input
              value={noteTitulo}
              onChange={(e) => setNoteTitulo(e.target.value)}
              placeholder="Título da nota..."
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <textarea
              value={noteDesc}
              onChange={(e) => setNoteDesc(e.target.value)}
              placeholder="Detalhes da nota interna..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setNoteOpen(false)}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={!noteTitulo.trim() || addingNote} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {addingNote ? 'Salvando...' : 'Registrar nota'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-muted-foreground"
            onClick={() => setNoteOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar nota interna
          </Button>
        </div>
      )}
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
            {caso.numeroInterno && (
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {caso.numeroInterno}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {caso.responsavelNome ?? '—'}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {caso.clienteNome}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Aberto em {new Date(caso.dataAbertura).toLocaleDateString('pt-BR')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Atualizado {fmtRelative(caso.updatedAt)}
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
            <Paperclip className="h-3.5 w-3.5" />
            Anexar documento
          </Button>
        </div>
      </div>

      {/* Próxima ação em destaque */}
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
  users: { id: string; name: string }[]
}

export function DossieClient({ caso: initialCaso, users }: DossieClientProps) {
  const router = useRouter()
  const [caso, setCaso] = useState<Caso>(initialCaso)
  const [editOpen, setEditOpen] = useState(false)
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const [addingNote, setAddingNote] = useState(false)

  function handleEdit(data: CasoFormData) {
    const responsavel = users.find((u) => u.id === data.responsavelId)
    // Optimistic update
    setCaso((prev) => ({
      ...prev,
      titulo: data.titulo,
      area: data.area,
      status: data.status,
      clienteNome: data.clienteNome,
      responsavelId: data.responsavelId || null,
      responsavelNome: responsavel?.name ?? null,
      descricao: data.descricao || null,
      proximaAcao: data.proximaAcao || null,
      proximaAcaoData: data.proximaAcaoData || null,
      updatedAt: new Date().toISOString(),
    }))

    startTransition(async () => {
      const result = await updateCaso(caso.id, data)
      if ('error' in result) {
        setCaso(initialCaso)
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleResolve(pendenciaId: string) {
    setResolvingIds((prev) => new Set(prev).add(pendenciaId))
    // Optimistic update
    setCaso((prev) => ({
      ...prev,
      pendencias: prev.pendencias.map((p) =>
        p.id === pendenciaId ? { ...p, resolvida: true } : p
      ),
    }))

    startTransition(async () => {
      const result = await updatePendencia(pendenciaId, caso.id, true)
      if ('error' in result) {
        // Rollback
        setCaso((prev) => ({
          ...prev,
          pendencias: prev.pendencias.map((p) =>
            p.id === pendenciaId ? { ...p, resolvida: false } : p
          ),
        }))
        alert(result.error)
      } else {
        router.refresh()
      }
      setResolvingIds((prev) => {
        const next = new Set(prev)
        next.delete(pendenciaId)
        return next
      })
    })
  }

  function handleAddPendencia(data: PendenciaInput) {
    // Optimistic insert
    const optimisticId = `opt-${Date.now()}`
    const optimistic: Pendencia = {
      id: optimisticId,
      ...data,
      resolvida: false,
      createdAt: new Date().toISOString(),
    }
    setCaso((prev) => ({ ...prev, pendencias: [optimistic, ...prev.pendencias] }))

    startTransition(async () => {
      const result = await createPendencia(caso.id, data)
      if ('error' in result) {
        setCaso((prev) => ({
          ...prev,
          pendencias: prev.pendencias.filter((p) => p.id !== optimisticId),
        }))
        alert(result.error)
      } else {
        setCaso((prev) => ({
          ...prev,
          pendencias: prev.pendencias.map((p) =>
            p.id === optimisticId ? { ...p, id: result.id } : p
          ),
        }))
        router.refresh()
      }
    })
  }

  function handleAddNote(titulo: string, descricao: string) {
    setAddingNote(true)
    // Optimistic insert
    const optimisticEvent: TimelineEvent = {
      id: `opt-${Date.now()}`,
      tipo: 'nota_interna',
      titulo,
      descricao: descricao || null,
      data: new Date().toISOString(),
      autor: 'Você',
      urgencia: null,
      metadata: {},
    }
    setCaso((prev) => ({ ...prev, timeline: [optimisticEvent, ...prev.timeline] }))

    startTransition(async () => {
      const result = await addTimelineEvent(caso.id, {
        tipo: 'nota_interna',
        titulo,
        descricao,
      })
      if ('error' in result) {
        setCaso((prev) => ({
          ...prev,
          timeline: prev.timeline.filter((e) => e.id !== optimisticEvent.id),
        }))
        alert(result.error)
      } else {
        setCaso((prev) => ({
          ...prev,
          timeline: prev.timeline.map((e) =>
            e.id === optimisticEvent.id ? { ...e, id: result.id } : e
          ),
        }))
        router.refresh()
      }
      setAddingNote(false)
    })
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
          <SecaoTimeline
            events={caso.timeline}
            casoId={caso.id}
            onAddNote={handleAddNote}
            addingNote={addingNote}
          />
          <SecaoProcessos processos={caso.processos} />
          <SecaoDocumentos documentos={caso.documentos} />
        </div>

        {/* Coluna lateral (1/3) */}
        <div className="space-y-6">
          {/* Dossiê Inteligente */}
          <DossieInteligente
            dossie={caso.dossieInteligente}
            casoId={caso.id}
            onDossieGenerated={(dossie) => setCaso((prev) => ({
              ...prev,
              dossieInteligente: dossie,
              dossieGeradoEm: dossie.geradoEm,
            }))}
          />

          <SecaoVisaoGeral caso={caso} />
          <SecaoPendencias
            caso={caso}
            pendencias={caso.pendencias}
            onResolve={handleResolve}
            onAdd={handleAddPendencia}
            resolving={resolvingIds}
          />
        </div>
      </div>

      {/* Dialog de edição */}
      <CasoFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        caso={{
          id: caso.id,
          titulo: caso.titulo,
          numeroInterno: caso.numeroInterno,
          area: caso.area,
          status: caso.status,
          clienteId: caso.clienteId,
          clienteNome: caso.clienteNome,
          responsavelId: caso.responsavelId,
          responsavelNome: caso.responsavelNome,
          dataAbertura: caso.dataAbertura,
          updatedAt: caso.updatedAt,
          proximaAcao: caso.proximaAcao,
          proximaAcaoData: caso.proximaAcaoData,
          pendenciasAbertas: caso.pendencias.filter((p) => !p.resolvida).length,
          processosCount: caso.processos.length,
        }}
        users={users}
        onSave={handleEdit}
      />
    </div>
  )
}
