import type { Metadata } from 'next'
import { RadarClient } from '@/components/radar/RadarClient'

export const metadata: Metadata = {
  title: 'Radar — Lexia AI',
  description: 'Central de monitoramento de publicações, movimentações e alertas de prazo',
}

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Radar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Central de monitoramento — publicações, movimentações e alertas de prazo
        </p>
      </div>
      <RadarClient />
    </div>
  )
}
