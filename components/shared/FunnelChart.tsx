import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FunnelStage {
  stage: string
  count: number
  color: string
}

interface FunnelChartProps {
  stages: FunnelStage[]
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const max = Math.max(...stages.map((s) => s.count), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Pipeline de Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stages.map(({ stage, count, color }) => {
            const pct = Math.round((count / max) * 100)
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-right text-xs font-medium text-muted-foreground">
                  {stage}
                </span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted/40">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-bold text-foreground">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
