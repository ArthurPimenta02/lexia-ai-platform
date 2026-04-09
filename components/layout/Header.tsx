'use client'

import { usePathname } from 'next/navigation'
import { Bell, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileSidebarTrigger } from './Sidebar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/inbox': 'Inbox',
  '/calendar': 'Calendário',
  '/settings': 'Configurações',
  '/users': 'Usuários',
}

function getTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'Lexia AI'
}

export function Header() {
  const pathname = usePathname()
  const title = getTitle(pathname)
  const { theme, toggle } = useTheme()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — só mobile */}
        <MobileSidebarTrigger />
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Alternar tema" onClick={toggle}>
          {theme === null ? (
            <span className="h-5 w-5" />
          ) : theme === 'dark' ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Menu do usuário"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand text-white text-xs font-medium">
                U
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
