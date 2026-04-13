'use client'

import Link from 'next/link'
import { type LucideIcon, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  /** Navega para uma rota ao clicar no card */
  href?: string
  /** Abre um sheet/modal ao clicar no card */
  onClick?: () => void
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel = 'vs ontem',
  icon: Icon,
  iconColor = 'text-brand',
  iconBg = 'bg-blue-50 dark:bg-blue-950/30',
  href,
  onClick,
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0
  const hasDelta = delta !== undefined
  const isInteractive = Boolean(href || onClick)

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={cn('rounded-lg p-2', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {hasDelta && (
              <p
                className={cn(
                  'mt-1 flex items-center gap-1 text-xs font-medium',
                  isPositive ? 'text-success' : 'text-error',
                )}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {delta} {deltaLabel}
                </span>
              </p>
            )}
          </div>
          {isInteractive && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </>
  )

  if (href) {
    return (
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <Link href={href} className="block">
          {content}
        </Link>
      </Card>
    )
  }

  if (onClick) {
    return (
      <Card
        role="button"
        tabIndex={0}
        aria-label={label}
        className="group cursor-pointer transition-shadow hover:shadow-md"
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      >
        {content}
      </Card>
    )
  }

  return <Card>{content}</Card>
}
