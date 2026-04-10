'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ConversationList } from './ConversationList'
import { ChatView } from './ChatView'
import { LeadContextPanel } from './LeadContextPanel'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/lib/mock/inbox'
import type { Conversation } from '@/types/conversation'

export function InboxClient() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0].id)
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const filtered = useMemo(
    () =>
      conversations.filter((c) =>
        c.leadName.toLowerCase().includes(search.toLowerCase()),
      ),
    [conversations, search],
  )

  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0]
  const messages = MOCK_MESSAGES[selectedId] ?? []

  function handleSelect(id: string) {
    setSelectedId(id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    )
    setMobileView('chat')
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Desktop / Tablet: two or three columns ── */}
      <div className="hidden md:flex w-full">
        {/* Conversation list — fixed 280px */}
        <div className="w-[280px] shrink-0">
          <ConversationList
            conversations={filtered}
            selectedId={selectedId}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
          />
        </div>

        {/* Chat — flex 1 */}
        <div className="flex-1 min-w-0">
          <ChatView conversation={selected} messages={messages} />
        </div>

        {/* Context panel — visible on desktop (lg+) */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <LeadContextPanel conversation={selected} />
        </div>

        {/* Tablet: context panel in Sheet */}
        <div className="lg:hidden flex items-start pt-4 pr-2">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
            >
              <PanelRight className="h-4 w-4" />
              <span className="sr-only">Ver contexto do lead</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-0">
              <LeadContextPanel conversation={selected} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Mobile: single-view navigation ── */}
      <div className="flex md:hidden w-full flex-col">
        {mobileView === 'list' ? (
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={filtered}
              selectedId={selectedId}
              search={search}
              onSearchChange={setSearch}
              onSelect={handleSelect}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Mobile top bar */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setMobileView('list')}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Button>
              <span className="truncate text-sm font-medium">
                {selected.leadName}
              </span>
              <div className="ml-auto">
                <Sheet>
                  <SheetTrigger
                    render={
                      <Button variant="ghost" size="icon" className="h-8 w-8" />
                    }
                  >
                    <PanelRight className="h-4 w-4" />
                    <span className="sr-only">Ver contexto do lead</span>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] p-0">
                    <LeadContextPanel conversation={selected} />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatView conversation={selected} messages={messages} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
