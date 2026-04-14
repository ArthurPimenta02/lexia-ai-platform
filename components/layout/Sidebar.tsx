'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Menu,
  ChevronsUpDown,
  Check,
  Building2,
  Kanban,
  Radar,
  BriefcaseBusiness,
  Copy,
  Scale,
} from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'

type WorkspaceSummary = {
  id: string
  name: string
  officeCode: string
  logoUrl?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/kanban', label: 'Pipeline', icon: Kanban },
  { href: '/casos', label: 'Casos', icon: BriefcaseBusiness },
  { href: '/processos', label: 'Processos', icon: Scale },
  { href: '/radar', label: 'Radar', icon: Radar },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/settings/office', label: 'Configuracoes', icon: Settings, activePrefix: '/settings' },
]

function WorkspaceSwitcher() {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadWorkspace() {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user || cancelled) return

      const tenantId = data.user.user_metadata?.tenant_id as string | undefined
      if (!tenantId) return

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, display_name, office_code, logo_url')
        .eq('id', tenantId)
        .single()

      if (tenant && !cancelled) {
        setWorkspace({
          id: tenant.id as string,
          name: tenant.display_name as string,
          officeCode: ((tenant.office_code as string | null) ?? '').trim() || '--------',
          logoUrl: (tenant.logo_url as string | null) ?? undefined,
        })
        return
      }

      if (tenantError && !cancelled) {
        const fallback = await supabase
          .from('tenants')
          .select('id, display_name, logo_url')
          .eq('id', tenantId)
          .single()

        if (fallback.data) {
          setWorkspace({
            id: fallback.data.id as string,
            name: fallback.data.display_name as string,
            officeCode: '--------',
            logoUrl: (fallback.data.logo_url as string | null) ?? undefined,
          })
        }
      }
    }

    void loadWorkspace()
    window.addEventListener('lexia-office-updated', loadWorkspace)

    return () => {
      cancelled = true
      window.removeEventListener('lexia-office-updated', loadWorkspace)
    }
  }, [])

  const active = workspace ?? {
    id: 'loading',
    name: 'Carregando escritorio...',
    officeCode: '--------',
    logoUrl: undefined,
  }

  async function handleCopyCode() {
    if (!workspace) return
    await navigator.clipboard.writeText(workspace.officeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleManageOffice() {
    router.push('/settings/office')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand text-white">
          {active.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.logoUrl} alt={active.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-3.5 w-3.5" />
          )}
        </div>

        <span className="flex-1 truncate text-left font-medium text-foreground">
          {active.name}
        </span>

        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Escritorio atual</DropdownMenuLabel>
          <DropdownMenuItem className="gap-2" disabled>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand/10 text-brand">
              <Building2 className="h-3 w-3" />
            </div>
            <span className="flex-1 truncate">{active.name}</span>
            <Check className="h-3.5 w-3.5 text-brand" />
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyCode} disabled={!workspace} className="gap-2">
          <Copy className="h-4 w-4" />
          {copied ? 'Codigo copiado' : `Codigo: ${active.officeCode}`}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleManageOffice} className={cn('gap-2')}>
          <Settings className="h-4 w-4" />
          <span>Gerenciar escritorio</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-semibold text-brand">Lexia AI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegacao principal">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            activePrefix={item.activePrefix}
            onClick={onNavClick}
          />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <WorkspaceSwitcher />
      </div>
    </div>
  )
}

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
          <SheetTitle className="sr-only">Menu de navegacao</SheetTitle>
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
