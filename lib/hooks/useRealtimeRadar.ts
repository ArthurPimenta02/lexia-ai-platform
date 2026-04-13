'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RadarItem, RadarTipo, RadarUrgencia, RadarStatus } from '@/types/radar'
import type { RadarItemRow } from '@/types/database'

function rowToRadarItem(row: RadarItemRow): RadarItem {
  const aiSummary = row.ai_summary as Record<string, string> | null

  return {
    id: row.id,
    tipo: row.tipo as RadarTipo,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    casoId: row.caso_id ?? '',
    casoTitulo: row.caso_titulo ?? '',
    cliente: row.cliente_nome ?? '',
    data: row.created_at,
    urgencia: row.urgencia as RadarUrgencia,
    exigeAcao: row.exige_acao,
    status: row.status as RadarStatus,
    origem: row.origem as RadarItem['origem'],
    resumoIA: aiSummary?.resumo ?? '',
    explicacaoPratica: aiSummary?.explicacaoPratica ?? '',
    proximoPasso: aiSummary?.proximoPasso ?? '',
    riscoSeNaoAgir: aiSummary?.riscoSeNaoAgir ?? '',
    impactoNoCaso: aiSummary?.impactoNoCaso ?? '',
    dataResolucao: row.resolvido_em ?? undefined,
    referenciaExterna: row.referencia_externa ?? undefined,
  }
}

/**
 * useRealtimeRadar — subscribe em radar_items do tenant via Supabase Realtime.
 *
 * Chama onNewItem quando um novo item é inserido.
 * Garante deduplicação: o consumer deve checar existsIds antes de adicionar.
 */
export function useRealtimeRadar(
  tenantId: string | undefined,
  onNewItem: (item: RadarItem) => void,
  existingIds: Set<string>
) {
  useEffect(() => {
    if (!tenantId) return

    const supabase = createClient()

    const channelId = `radar:${tenantId}:${Date.now()}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'radar_items',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as RadarItemRow

          // Deduplicação: ignora se o item já existe no estado local
          if (existingIds.has(row.id)) return

          onNewItem(rowToRadarItem(row))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tenantId, onNewItem, existingIds])
}
