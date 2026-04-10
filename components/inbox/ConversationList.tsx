'use client'

import { Search, MessageCircle, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/conversation'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string
  search: string
  onSearchChange: (value: string) => void
  onSelect: (id: string) => void
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  if (diffH < 24) return `${diffH}h`
  return `${diffD}d`
}

const SOURCE_ICON = {
  WhatsApp: MessageCircle,
  site: Globe,
}

const SOURCE_COLOR = {
  WhatsApp: 'text-green-600',
  site: 'text-blue-600',
}

export function ConversationList({
  conversations,
  selectedId,
  search,
  onSearchChange,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="mb-3 text-base font-semibold">Inbox</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const SourceIcon = SOURCE_ICON[conv.source]
            const isSelected = conv.id === selectedId

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b px-4 py-3.5 text-left transition-colors hover:bg-muted/50',
                  isSelected && 'bg-muted',
                )}
              >
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {conv.leadName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-sm',
                        conv.unreadCount > 0 ? 'font-semibold' : 'font-medium',
                      )}
                    >
                      {conv.leadName}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p
                      className={cn(
                        'truncate text-xs',
                        conv.unreadCount > 0
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge className="shrink-0 h-5 min-w-[20px] px-1.5 text-[10px]">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1">
                    <SourceIcon
                      className={cn('h-3 w-3', SOURCE_COLOR[conv.source])}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {conv.source}
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
