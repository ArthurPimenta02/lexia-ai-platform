'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItemProps {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
}

export function NavItem({ href, label, icon: Icon, onClick }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
        isActive
          ? 'bg-brand text-white'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}
