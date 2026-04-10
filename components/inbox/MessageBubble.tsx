'use client'

import { cn } from '@/lib/utils'
import type { Message } from '@/types/conversation'

interface MessageBubbleProps {
  message: Message
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user'
  const isAgent = message.sender === 'agent'

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      {isAgent && (
        <span className="text-xs font-medium text-violet-600 px-1">Agente IA</span>
      )}
      {!isAgent && !isUser && (
        <span className="text-xs text-muted-foreground px-1">{message.senderName}</span>
      )}
      {isUser && (
        <span className="text-xs text-muted-foreground px-1">{message.senderName}</span>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser && 'bg-primary text-primary-foreground rounded-br-sm',
          isAgent && 'bg-violet-50 text-violet-900 border border-violet-100 rounded-bl-sm',
          !isUser && !isAgent && 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {message.content}
      </div>

      <span className="text-[11px] text-muted-foreground px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}
