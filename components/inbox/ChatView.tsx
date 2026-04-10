'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { HandoffBanner } from './HandoffBanner'
import type { Conversation, Message } from '@/types/conversation'

interface ChatViewProps {
  conversation: Conversation
  messages: Message[]
}

export function ChatView({ conversation, messages }: ChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b px-5 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {conversation.leadName
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')}
        </div>
        <div>
          <p className="text-sm font-semibold">{conversation.leadName}</p>
          <p className="text-xs text-muted-foreground">
            via {conversation.source} · {conversation.leadStatus}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((message, index) => {
          const prev = messages[index - 1]
          const showHandoff =
            message.isHandoff &&
            message.sender === 'agent' &&
            !prev?.isHandoff

          return (
            <div key={message.id}>
              <MessageBubble message={message} />
              {showHandoff && (
                <HandoffBanner timestamp={message.timestamp} />
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
