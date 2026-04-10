import { Mail, Phone, KanbanSquare, Tag } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Conversation } from '@/types/conversation'

interface LeadContextPanelProps {
  conversation: Conversation
}

const STATUS_COLORS: Record<string, string> = {
  Novo: 'bg-blue-100 text-blue-700',
  Qualificado: 'bg-violet-100 text-violet-700',
  Proposta: 'bg-yellow-100 text-yellow-700',
  Contrato: 'bg-emerald-100 text-emerald-700',
  Cliente: 'bg-green-100 text-green-700',
  Perdido: 'bg-gray-100 text-gray-600',
}

export function LeadContextPanel({ conversation }: LeadContextPanelProps) {
  const statusClass =
    STATUS_COLORS[conversation.leadStatus] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="flex h-full flex-col border-l">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Contexto do lead
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Lead info */}
        <div className="space-y-1">
          <p className="text-base font-semibold">{conversation.leadName}</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {conversation.leadStatus}
          </span>
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contato
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-foreground">
                {conversation.leadEmail}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-foreground">{conversation.leadPhone}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Responsible */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Responsável
          </p>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {conversation.responsible
                .split(' ')
                .filter((n) => n.length > 2)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </div>
            <span className="text-sm text-foreground">
              {conversation.responsible}
            </span>
          </div>
        </div>

        <Separator />

        {/* Source */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Canal de origem
          </p>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              {conversation.source}
            </Badge>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t px-5 py-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          render={<Link href={`/leads/${conversation.leadId}`} />}
          nativeButton={false}
        >
          <KanbanSquare className="h-4 w-4" />
          Ver ficha do lead
        </Button>
      </div>
    </div>
  )
}
