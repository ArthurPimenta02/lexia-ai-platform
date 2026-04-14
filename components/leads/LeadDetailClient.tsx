'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  User,
  CalendarDays,
  PhoneCall,
  CalendarClock,
  GitBranch,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { LeadFormDialog } from './LeadFormDialog'
import { LeadTriagePanel } from './LeadTriagePanel'
import { updateLead } from '@/actions/leads'
import type { Lead, LeadActivity, LeadStage, LeadFormData } from '@/types/lead'
import type { CalendarEvent } from '@/types/calendar'
import { EVENT_STATUS_CONFIG, EVENT_TYPE_CONFIG } from '@/types/calendar'

interface LeadDetailClientProps {
  lead: Lead
  activities: LeadActivity[]
  stages: LeadStage[]
  appointments: CalendarEvent[]
}

const ACTIVITY_ICONS: Record<
  LeadActivity['type'],
  React.ComponentType<{ className?: string }>
> = {
  lead_created:      UserPlus,
  email_sent:        Mail,
  call_made:         PhoneCall,
  meeting_scheduled: CalendarClock,
  stage_changed:     GitBranch,
  message:           MessageSquare,
}

const ACTIVITY_COLORS: Record<LeadActivity['type'], string> = {
  lead_created:      'text-blue-500 bg-blue-500/10',
  email_sent:        'text-purple-500 bg-purple-500/10',
  call_made:         'text-green-500 bg-green-500/10',
  meeting_scheduled: 'text-orange-500 bg-orange-500/10',
  stage_changed:     'text-teal-500 bg-teal-500/10',
  message:           'text-slate-500 dark:text-slate-400 bg-slate-500/10 dark:bg-slate-500/20',
}

export function LeadDetailClient({
  lead,
  activities,
  stages,
  appointments,
}: LeadDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentLead, setCurrentLead] = useState<Lead>(lead)
  const [editOpen, setEditOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  function handleEdit(data: LeadFormData & { id?: string }) {
    if (!data.id) return
    setActionError(null)

    // Optimistic update
    const stage = stages.find((s) => s.id === data.stageId)
    setCurrentLead((prev) => ({
      ...prev,
      ...data,
      stageName:  stage?.name  ?? prev.stageName,
      stageColor: stage?.color ?? prev.stageColor,
    }))
    setEditOpen(false)

    startTransition(async () => {
      const result = await updateLead(data.id!, data)
      if ('error' in result) {
        setActionError(result.error)
        setCurrentLead(lead) // reverter
        return
      }
      router.refresh()
    })
  }

  const createdAt = new Date(currentLead.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/leads"
          className="inline-flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
        <Button size="sm" onClick={() => setEditOpen(true)} disabled={isPending}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Error */}
      {actionError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {/* Hero card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{currentLead.name}</CardTitle>
              {currentLead.area && (
                <p className="text-sm text-muted-foreground">{currentLead.area}</p>
              )}
            </div>
            <StatusBadge stageName={currentLead.stageName} stageColor={currentLead.stageColor} />
          </div>
        </CardHeader>
      </Card>

      {/* Triagem Inteligente */}
      <LeadTriagePanel leadId={currentLead.id} triage={currentLead.aiTriage} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={Mail}        label="E-mail"     value={currentLead.email ?? '—'} />
            <InfoRow icon={Phone}       label="Telefone"   value={currentLead.phone ?? '—'} />
            <InfoRow icon={User}        label="CPF"        value={currentLead.cpf ?? '—'} />
            <InfoRow icon={CalendarDays} label="Criado em" value={createdAt} />
            <InfoRow
              icon={UserPlus}
              label="Responsável"
              value={currentLead.responsibleName ?? '—'}
            />
          </CardContent>
        </Card>

        {/* Demanda / Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Demanda / Observações</CardTitle>
          </CardHeader>
          <CardContent>
            {currentLead.subject ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {currentLead.subject}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma observação registrada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Compromissos vinculados</CardTitle>
          <Link href="/calendar" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Abrir no calendário
          </Link>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum compromisso vinculado a este lead.
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {appointment.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAppointmentDateTime(appointment)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AppointmentPill
                      label={EVENT_TYPE_CONFIG[appointment.type].label}
                      className="border-border bg-background text-foreground"
                    />
                    <AppointmentPill
                      label={EVENT_STATUS_CONFIG[appointment.status].label}
                      className={`${EVENT_STATUS_CONFIG[appointment.status].bgColor} ${EVENT_STATUS_CONFIG[appointment.status].textColor}`}
                    />
                    <Link
                      href="/calendar"
                      className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'h-8 px-2 text-xs' })}
                    >
                      Ver no calendário
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity timeline */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-6">
              {activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type]
                const colorClass = ACTIVITY_COLORS[activity.type]
                const date = new Date(activity.timestamp).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                const time = new Date(activity.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit', minute: '2-digit',
                })

                return (
                  <li key={activity.id} className="relative">
                    <div
                      className={`absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{date} às {time}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <LeadFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={currentLead}
        stages={stages}
        onSubmit={handleEdit}
        isPending={isPending}
      />
    </div>
  )
}

function InfoRow({
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

function formatAppointmentDateTime(appointment: CalendarEvent) {
  const date = new Date(appointment.start)
  const dateLabel = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  if (appointment.allDay) {
    return `${dateLabel} · Dia inteiro`
  }

  const timeLabel = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${dateLabel} às ${timeLabel}`
}

function AppointmentPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  )
}
