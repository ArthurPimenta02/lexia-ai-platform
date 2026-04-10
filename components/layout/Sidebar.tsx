'use client'

import { useState } from 'react'
import { LayoutDashboard, Users, Inbox, Calendar, Settings, UserCog, Menu, ChevronsUpDown, Check, Plus, Building2, Kanban } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NavItem } from './NavItem'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/kanban', label: 'Pipeline', icon: Kanban },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/calendar', label: 'Calendário', icon: Calendar },
  { href: '/settings', label: 'Configurações', icon: Settings },
  { href: '/users', label: 'Usuários', icon: UserCog },
]

// Mock — substituído por dados reais em M8/M9
const mockWorkspaces = [
  { id: '1', name: 'Silva & Associados' },
  { id: '2', name: 'Ferreira Advocacia' },
]

function WorkspaceSwitcher() {
  const [activeId, setActiveId] = useState(mockWorkspaces[0].id)
  const active = mockWorkspaces.find((w) => w.id === activeId) ?? mockWorkspaces[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {/* Ícone do workspace */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand text-white">
          <Building2 className="h-3.5 w-3.5" />
        </div>

        {/* Nome — truncado se longo */}
        <span className="flex-1 truncate text-left font-medium text-foreground">
          {active.name}
        </span>

        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>

          {mockWorkspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => setActiveId(ws.id)}
              className="gap-2"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand/10 text-brand">
                <Building2 className="h-3 w-3" />
              </div>
              <span className="flex-1 truncate">{ws.name}</span>
              {ws.id === activeId && <Check className="h-3.5 w-3.5 text-brand" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className={cn('gap-2 text-muted-foreground')}
          onClick={() => {
            // Navega para o onboarding para criar novo workspace — fake por enquanto
            window.location.href = '/onboarding'
          }}
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed border-border">
            <Plus className="h-3 w-3" />
          </div>
          <span>Criar workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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

      {/* Workspace switcher */}
      <div className="border-t border-border p-3">
        <WorkspaceSwitcher />
      </div>
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
          render={
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
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
