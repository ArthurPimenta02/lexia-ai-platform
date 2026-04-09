import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
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
}

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel = 'vs ontem',
  icon: Icon,
  iconColor = 'text-brand',
  iconBg = 'bg-blue-50 dark:bg-blue-950/30',
}: MetricCardProps) {
  const isPositive = delta !== undefined && delta >= 0
  const hasDelta = delta !== undefined

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={cn('rounded-lg p-2', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </span>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
