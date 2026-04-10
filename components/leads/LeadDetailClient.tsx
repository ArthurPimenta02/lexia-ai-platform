'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  User,
  Building2,
  CalendarDays,
  PhoneCall,
  CalendarClock,
  GitBranch,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { LeadFormDialog } from './LeadFormDialog'
import { LeadTriagePanel } from './LeadTriagePanel'
import { MOCK_LEAD_TRIAGE } from '@/lib/mock/leads'
import type { Lead, LeadActivity } from '@/types/lead'

interface LeadDetailClientProps {
  lead: Lead
  activities: LeadActivity[]
}

const ACTIVITY_ICONS: Record<
  LeadActivity['type'],
  React.ComponentType<{ className?: string }>
> = {
  lead_created: UserPlus,
  email_sent: Mail,
  call_made: PhoneCall,
  meeting_scheduled: CalendarClock,
  stage_changed: GitBranch,
}

const ACTIVITY_COLORS: Record<LeadActivity['type'], string> = {
  lead_created: 'text-blue-500 bg-blue-500/10',
  email_sent: 'text-purple-500 bg-purple-500/10',
  call_made: 'text-green-500 bg-green-500/10',
  meeting_scheduled: 'text-orange-500 bg-orange-500/10',
  stage_changed: 'text-teal-500 bg-teal-500/10',
}

type FormData = Omit<Lead, 'id' | 'createdAt'>

export function LeadDetailClient({ lead, activities }: LeadDetailClientProps) {
  const [currentLead, setCurrentLead] = useState<Lead>(lead)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(data: FormData & { id?: string }) {
    setCurrentLead((prev) => ({ ...prev, ...data }))
    setEditOpen(false)
  }

  const createdAt = new Date(currentLead.createdAt).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' }
  )

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
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </div>

      {/* Hero card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{currentLead.name}</CardTitle>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {currentLead.company}
              </p>
            </div>
            <StatusBadge status={currentLead.status} />
          </div>
        </CardHeader>
      </Card>

      {/* Triagem Inteligente */}
      <LeadTriagePanel triage={MOCK_LEAD_TRIAGE[currentLead.id]} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow
              icon={Mail}
              label="E-mail"
              value={currentLead.email || '—'}
            />
            <InfoRow
              icon={Phone}
              label="Telefone"
              value={currentLead.phone || '—'}
            />
            <InfoRow
              icon={User}
              label="CPF"
              value={currentLead.cpf || '—'}
            />
            <InfoRow
              icon={CalendarDays}
              label="Criado em"
              value={createdAt}
            />
            <InfoRow
              icon={UserPlus}
              label="Responsável"
              value={currentLead.responsible || '—'}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            {currentLead.notes ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {currentLead.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma observação registrada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
                const date = new Date(activity.timestamp).toLocaleDateString(
                  'pt-BR',
                  { day: '2-digit', month: 'short', year: 'numeric' }
                )
                const time = new Date(activity.timestamp).toLocaleTimeString(
                  'pt-BR',
                  { hour: '2-digit', minute: '2-digit' }
                )

                return (
                  <li key={activity.id} className="relative">
                    {/* Icon dot on the timeline line */}
                    <div
                      className={`absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {date} às {time}
                      </p>
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
        onSubmit={handleEdit}
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
