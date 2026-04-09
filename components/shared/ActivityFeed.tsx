'use client'

import { useState, useEffect } from 'react'
import {
  UserPlus,
  MessageCircle,
  ArrowRightLeft,
  AlertTriangle,
  CalendarCheck,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ActivityType, type Activity } from '@/lib/mock/dashboard'

function formatRelativeTime(date: Date, now: number): string {
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `há ${diffD}d`
}

const iconMap: Record<ActivityType, LucideIcon> = {
  lead_created: UserPlus,
  message_received: MessageCircle,
  stage_changed: ArrowRightLeft,
  handoff: AlertTriangle,
  appointment: CalendarCheck,
}

const colorMap: Record<ActivityType, string> = {
  lead_created: 'text-brand bg-blue-50 dark:bg-blue-950/30',
  message_received: 'text-neutral bg-gray-100 dark:bg-gray-800/40',
  stage_changed: 'text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/30',
  handoff: 'text-warning bg-orange-50 dark:bg-orange-950/30',
  appointment: 'text-success bg-emerald-50 dark:bg-emerald-950/30',
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type]
            const color = colorMap[activity.type]
            return (
              <li key={activity.id} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {now ? formatRelativeTime(activity.timestamp, now) : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
