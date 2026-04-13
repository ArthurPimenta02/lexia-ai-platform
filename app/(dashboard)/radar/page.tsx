import type { Metadata } from 'next'
import { RadarClient } from '@/components/radar/RadarClient'
import { getRadarItems } from '@/actions/radar'
import { createClient } from '@/lib/supabase/server'
import type { RadarItem } from '@/types/radar'

export const metadata: Metadata = {
  title: 'Radar — Lexia AI',
  description: 'Central de monitoramento de publicações, movimentações e alertas de prazo',
}

export default async function RadarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = user?.user_metadata?.tenant_id as string | undefined

  // Carga inicial SSR — o client não precisa fazer fetch redundante
  const result = await getRadarItems()
  const initialItems: RadarItem[] = 'items' in result ? result.items : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Radar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Central de monitoramento — publicações, movimentações e alertas de prazo
        </p>
      </div>
      <RadarClient initialItems={initialItems} tenantId={tenantId} />
    </div>
  )
}
