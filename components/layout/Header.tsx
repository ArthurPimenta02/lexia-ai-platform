'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from './NotificationBell'
import { useTheme } from '@/components/ThemeProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MobileSidebarTrigger } from './Sidebar'
import type { UserRole } from '@/types/database'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/kanban': 'Pipeline',
  '/casos': 'Casos',
  '/radar': 'Radar',
  '/calendar': 'Calendario',
  '/profile': 'Meu perfil',
  '/settings': 'Configuracoes',
  '/users': 'Usuarios',
}

function getTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return title
  }
  return 'Lexia AI'
}

type HeaderProfile = {
  name: string
  role: UserRole
  initials: string
  avatarUrl?: string
}

const roleLabel: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  lawyer: 'Advogado(a)',
  secretary: 'Secretaria(o)',
  viewer: 'Visualizador',
}

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const title = getTitle(pathname)
  const { theme, toggle } = useTheme()
  const [profile, setProfile] = useState<HeaderProfile>({
    name: 'Usuario',
    role: 'viewer',
    initials: 'U',
    avatarUrl: undefined,
  })

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user || cancelled) return

      const user = data.user
      const tenantId = user.user_metadata?.tenant_id as string | undefined
      const metadataRole = user.user_metadata?.app_role as UserRole | undefined

      if (tenantId) {
        const { data: row } = await supabase
          .from('users')
          .select('name, role, avatar_url')
          .eq('id', user.id)
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)
          .maybeSingle()

        if (row && !cancelled) {
          const safeName = row.name as string
          setProfile({
            name: safeName,
            role: row.role as UserRole,
            initials: getInitials(safeName),
            avatarUrl: (row.avatar_url as string | null) ?? undefined,
          })
          return
        }
      }

      const fallbackName =
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        'Usuario'

      if (!cancelled) {
        setProfile({
          name: fallbackName,
          role: metadataRole ?? 'viewer',
          initials: getInitials(fallbackName),
          avatarUrl: undefined,
        })
      }
    }

    void loadProfile()
    window.addEventListener('lexia-profile-updated', loadProfile)

    return () => {
      cancelled = true
      window.removeEventListener('lexia-profile-updated', loadProfile)
    }
  }, [])

  async function handleProfileNavigation() {
    router.push('/profile')
  }

  async function handleSettingsNavigation() {
    router.push('/settings/office')
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebarTrigger />
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

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

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Menu do usuario"
          >
            <Avatar className="h-8 w-8">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} /> : null}
              <AvatarFallback className="bg-brand text-xs font-medium text-white">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{roleLabel[profile.role]}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileNavigation}>Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsNavigation}>Configuracoes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
