'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Bot, Plug, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
  { href: '/settings/office',       label: 'Escritório',  icon: Building2 },
  { href: '/settings/agent',        label: 'Agente IA',   icon: Bot },
  { href: '/settings/integrations', label: 'Integrações', icon: Plug },
  { href: '/settings/users',        label: 'Usuários',    icon: Users },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-48 shrink-0 border-r border-border bg-background">
      <div className="px-4 py-4">
        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Configurações
        </p>
        <nav className="space-y-0.5" aria-label="Navegação de configurações">
          {settingsNav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
