'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, UserPlus, AlertCircle, Clock, Calendar, GitBranch } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MOCK_NOTIFICATIONS, type MockNotification, type NotificationType } from '@/lib/mock/dashboard'

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  lead_novo: UserPlus,
  handoff: AlertCircle,
  prazo: Clock,
  reuniao: Calendar,
  status: GitBranch,
}

const TYPE_COLORS: Record<NotificationType, string> = {
  lead_novo: 'text-blue-500 bg-blue-500/10',
  handoff: 'text-red-500 bg-red-500/10',
  prazo: 'text-orange-500 bg-orange-500/10',
  reuniao: 'text-green-500 bg-green-500/10',
  status: 'text-purple-500 bg-purple-500/10',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<MockNotification[]>(MOCK_NOTIFICATIONS)
  const unread = notifications.filter((n) => !n.read).length
  const router = useRouter()

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function handleClick(notif: MockNotification) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    )
    if (notif.leadId) {
      router.push(`/leads/${notif.leadId}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-md outline-none ring-offset-background transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          {unread > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {unread} não {unread === 1 ? 'lida' : 'lidas'}
            </span>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação.
            </p>
          ) : (
            notifications.map((notif) => {
              const Icon = TYPE_ICONS[notif.type]
              const colorClass = TYPE_COLORS[notif.type]
              return (
                <DropdownMenuItem
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer',
                    !notif.read && 'bg-muted/50',
                    !notif.leadId && 'cursor-default'
                  )}
                >
                  <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className={cn('text-sm leading-tight', !notif.read && 'font-medium')}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {notif.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {relativeTime(notif.timestamp)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        {unread > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-4 py-2">
              <button
                onClick={markAllRead}
                className="w-full text-center text-xs text-brand hover:underline"
              >
                Marcar todas como lidas
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
