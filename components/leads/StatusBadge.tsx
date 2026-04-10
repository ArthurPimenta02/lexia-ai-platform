import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS } from '@/lib/mock/leads'
import type { LeadStatus } from '@/types/lead'

interface StatusBadgeProps {
  status: LeadStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {status}
    </Badge>
  )
}
