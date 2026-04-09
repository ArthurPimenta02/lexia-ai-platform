'use client'

import { useState } from 'react'
import { LayoutDashboard, Users, Inbox, Calendar, Settings, UserCog, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NavItem } from './NavItem'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/settings', label: 'Configurações', icon: Settings },
  { href: '/users', label: 'Usuários', icon: UserCog },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-semibold text-brand">Lexia AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegação principal">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            onClick={onNavClick}
          />
        ))}
      </nav>
    </div>
  )
}

// Exportado separadamente para o Header montar no lado esquerdo em mobile
export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" aria-label="Abrir menu" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SidebarContent onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background sm:flex">
      <SidebarContent />
    </aside>
  )
}
