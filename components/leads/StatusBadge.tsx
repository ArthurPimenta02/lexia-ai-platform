import { Badge } from '@/components/ui/badge'
import type { LeadStatus } from '@/types/lead'

interface StatusBadgeProps {
  stageName: LeadStatus
  stageColor: string
}

export function StatusBadge({ stageName, stageColor }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ backgroundColor: stageColor }}
      />
      {stageName}
    </Badge>
  )
}
