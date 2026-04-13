import { createClient } from '@/lib/supabase/server'
import type {
  Activity,
  ActivityType,
  FunnelStage,
  DashboardMetrics,
  AttentionNowData,
  AttentionRadarItem,
  AttentionPendencia,
  LeadDetailItem,
  PendenciaDetailItem,
  ConversionDetailItem,
} from '@/types/dashboard'
import type { CasoTimelineRow, RadarItemRow } from '@/types/database'

// ── getNewLeadsToday ──────────────────────────────────────────────────────────
// Conta leads criados nas últimas 24h e calcula delta em relação às 24h anteriores.

export async function getNewLeadsToday(
  tenantId: string
): Promise<{ count: number; delta: number }> {
  const supabase = await createClient()
  const now = new Date()
  const since24h = new Date(now.getTime() - 86_400_000).toISOString()
  const since48h = new Date(now.getTime() - 2 * 86_400_000).toISOString()

  const [{ count: today }, { count: yesterday }] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('created_at', since24h),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('created_at', since48h)
      .lt('created_at', since24h),
  ])

  const todayCount = today ?? 0
  const yesterdayCount = yesterday ?? 0
  return { count: todayCount, delta: todayCount - yesterdayCount }
}

// ── getLeadsByStage ───────────────────────────────────────────────────────────
// Retorna contagem de leads agrupados por estágio, na ordem configurada pelo tenant.

export async function getLeadsByStage(tenantId: string): Promise<FunnelStage[]> {
  const supabase = await createClient()

  const { data: stages } = await supabase
    .from('lead_stages')
    .select('id, name, color, position')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: true })

  if (!stages || stages.length === 0) return []

  const { data: leads } = await supabase
    .from('leads')
    .select('stage_id')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  const countByStage: Record<string, number> = {}
  for (const lead of leads ?? []) {
    if (lead.stage_id) {
      countByStage[lead.stage_id] = (countByStage[lead.stage_id] ?? 0) + 1
    }
  }

  return stages.map((s) => ({
    stage: s.name,
    count: countByStage[s.id] ?? 0,
    color: s.color,
  }))
}

// ── getConversionRate ─────────────────────────────────────────────────────────
// Taxa de conversão = leads no estágio "Cliente" / total de leads não deletados.

export async function getConversionRate(tenantId: string): Promise<number> {
  const supabase = await createClient()

  // Busca o estágio terminal positivo chamado exatamente "Cliente"
  const { data: clienteStage } = await supabase
    .from('lead_stages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_terminal', true)
    .eq('name', 'Cliente')
    .maybeSingle()

  const [{ count: total }, { count: converted }] = await Promise.all([
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null),
    clienteStage
      ? supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)
          .eq('stage_id', clienteStage.id)
      : Promise.resolve({ count: 0 }),
  ])

  const totalCount = total ?? 0
  const convertedCount = converted ?? 0
  if (totalCount === 0) return 0
  return Math.round((convertedCount / totalCount) * 1000) / 10 // 1 casa decimal
}

// ── getActiveCasos ────────────────────────────────────────────────────────────
// Conta casos ativos (tudo que não está encerrado e não foi deletado).

export async function getActiveCasos(tenantId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('casos')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .neq('status', 'Encerrado')

  return count ?? 0
}

// ── getOpenPendencias ─────────────────────────────────────────────────────────
// Conta pendências abertas em todos os casos do tenant.

export async function getOpenPendencias(tenantId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('caso_pendencias')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('resolvida', false)

  return count ?? 0
}

// ── getUrgentRadarItems ───────────────────────────────────────────────────────
// Conta radar_items urgentes ainda não resolvidos.

export async function getUrgentRadarItems(tenantId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('radar_items')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('urgencia', 'Alta')
    .neq('status', 'resolvido')

  return count ?? 0
}

// ── getRecentActivity ─────────────────────────────────────────────────────────
// Combina caso_timeline e radar_items em um feed unificado, ordenado por data.

export async function getRecentActivity(
  tenantId: string,
  limit = 10
): Promise<Activity[]> {
  const supabase = await createClient()

  const fetchLimit = Math.ceil(limit * 1.5) // busca mais que o necessário antes de intercalar

  const [{ data: timelineRows }, { data: radarRows }] = await Promise.all([
    supabase
      .from('caso_timeline')
      .select('id, tipo, titulo, descricao, autor_nome, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(fetchLimit),
    supabase
      .from('radar_items')
      .select('id, tipo, titulo, urgencia, cliente_nome, created_at')
      .eq('tenant_id', tenantId)
      .neq('status', 'resolvido')
      .order('created_at', { ascending: false })
      .limit(fetchLimit),
  ])

  const timelineActivities: Activity[] = (timelineRows ?? []).map(
    (row: Pick<CasoTimelineRow, 'id' | 'tipo' | 'titulo' | 'descricao' | 'autor_nome' | 'created_at'>) => ({
      id: `timeline-${row.id}`,
      type: mapTimelineType(row.tipo),
      title: row.titulo,
      description: row.descricao ?? (row.autor_nome ? `por ${row.autor_nome}` : ''),
      timestamp: row.created_at,
    })
  )

  const radarActivities: Activity[] = (radarRows ?? []).map(
    (row: Pick<RadarItemRow, 'id' | 'tipo' | 'titulo' | 'urgencia' | 'cliente_nome' | 'created_at'>) => ({
      id: `radar-${row.id}`,
      type: 'radar_alert' as ActivityType,
      title: row.titulo,
      description: row.cliente_nome ? `Cliente: ${row.cliente_nome}` : `Urgência: ${row.urgencia}`,
      timestamp: row.created_at,
    })
  )

  // Intercala e ordena por data desc, limita ao solicitado
  return [...timelineActivities, ...radarActivities]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}

function mapTimelineType(tipo: string): ActivityType {
  switch (tipo) {
    case 'criacao':
      return 'lead_created'
    case 'nota_interna':
      return 'message_received'
    case 'prazo_criado':
      return 'appointment'
    case 'handoff':
      return 'handoff'
    default:
      return 'timeline_event'
  }
}

// ── getAttentionNow ───────────────────────────────────────────────────────────
// Bloco executivo: até 3 itens urgentes do radar + até 3 pendências abertas críticas.

export async function getAttentionNow(tenantId: string): Promise<AttentionNowData> {
  const supabase = await createClient()

  const [{ data: radarRows }, { data: pendenciaRows }] = await Promise.all([
    supabase
      .from('radar_items')
      .select('id, titulo, caso_titulo, urgencia, tipo, created_at')
      .eq('tenant_id', tenantId)
      .eq('urgencia', 'Alta')
      .neq('status', 'resolvido')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('caso_pendencias')
      .select('id, descricao, caso_id, urgencia, prazo')
      .eq('tenant_id', tenantId)
      .eq('resolvida', false)
      .order('prazo', { ascending: true, nullsFirst: false })
      .limit(10), // busca mais e ordena semanticamente antes de limitar a 3
  ])

  const urgentRadar: AttentionRadarItem[] = (radarRows ?? []).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    casoTitulo: (row.caso_titulo as string | null) ?? '',
    urgencia: row.urgencia as 'Alta' | 'Media' | 'Baixa',
    tipo: row.tipo,
    createdAt: row.created_at,
  }))

  const URGENCIA_ORDER: Record<string, number> = { Alta: 0, Media: 1, Baixa: 2 }

  const sortedPendencias = (pendenciaRows ?? [])
    .slice()
    .sort((a, b) => (URGENCIA_ORDER[a.urgencia] ?? 3) - (URGENCIA_ORDER[b.urgencia] ?? 3))
    .slice(0, 3)

  const openPendencias: AttentionPendencia[] = sortedPendencias.map((row) => ({
    id: row.id,
    descricao: row.descricao,
    casoId: row.caso_id,
    urgencia: row.urgencia as 'Alta' | 'Media' | 'Baixa',
    prazo: row.prazo ?? null,
  }))

  return { urgentRadar, openPendencias }
}

// ── getNewLeadsDetail ─────────────────────────────────────────────────────────
// Lista os leads criados nas últimas 24h com nome, estágio e origem.

export async function getNewLeadsDetail(tenantId: string): Promise<LeadDetailItem[]> {
  const supabase = await createClient()
  const since24h = new Date(Date.now() - 86_400_000).toISOString()

  type LeadWithStage = {
    id: string
    name: string
    origin: string | null
    urgency: string | null
    created_at: string
    lead_stages: { name: string; color: string } | null
  }

  const { data } = await supabase
    .from('leads')
    .select('id, name, origin, urgency, created_at, lead_stages ( name, color )')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .gte('created_at', since24h)
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown as LeadWithStage[]).map((row) => ({
    id: row.id,
    name: row.name,
    origin: row.origin ?? '',
    urgency: row.urgency ?? '',
    stageName: row.lead_stages?.name ?? '',
    stageColor: row.lead_stages?.color ?? '#6B7280',
    createdAt: row.created_at,
  }))
}

// ── getConversionDetail ───────────────────────────────────────────────────────
// Lista os leads convertidos (estágio "Cliente").

export async function getConversionDetail(tenantId: string): Promise<ConversionDetailItem[]> {
  const supabase = await createClient()

  const { data: clienteStage } = await supabase
    .from('lead_stages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_terminal', true)
    .eq('name', 'Cliente')
    .maybeSingle()

  if (!clienteStage) return []

  const { data } = await supabase
    .from('leads')
    .select('id, name, origin, converted_at, created_at')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .eq('stage_id', clienteStage.id)
    .order('converted_at', { ascending: false, nullsFirst: false })
    .limit(20)

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    origin: row.origin ?? '',
    convertedAt: row.converted_at ?? row.created_at,
  }))
}

// ── getPendenciasDetail ───────────────────────────────────────────────────────
// Lista todas as pendências abertas com caso vinculado.

export async function getPendenciasDetail(tenantId: string): Promise<PendenciaDetailItem[]> {
  const supabase = await createClient()

  type PendenciaWithCaso = {
    id: string
    descricao: string
    urgencia: string
    prazo: string | null
    responsavel: string | null
    caso_id: string
    casos: { titulo: string } | null
  }

  const URGENCIA_ORDER: Record<string, number> = { Alta: 0, Media: 1, Baixa: 2 }

  const { data } = await supabase
    .from('caso_pendencias')
    .select('id, descricao, urgencia, prazo, responsavel, caso_id, casos ( titulo )')
    .eq('tenant_id', tenantId)
    .eq('resolvida', false)
    .order('prazo', { ascending: true, nullsFirst: false })
    .limit(50)

  const rows = (data ?? []) as unknown as PendenciaWithCaso[]

  // Ordena por urgência semântica (Alta > Media > Baixa), depois por prazo
  rows.sort((a, b) => {
    const uDiff = (URGENCIA_ORDER[a.urgencia] ?? 3) - (URGENCIA_ORDER[b.urgencia] ?? 3)
    if (uDiff !== 0) return uDiff
    if (!a.prazo && !b.prazo) return 0
    if (!a.prazo) return 1
    if (!b.prazo) return -1
    return a.prazo.localeCompare(b.prazo)
  })

  return rows.map((row) => ({
    id: row.id,
    descricao: row.descricao,
    urgencia: row.urgencia as 'Alta' | 'Media' | 'Baixa',
    prazo: row.prazo ?? null,
    responsavel: row.responsavel ?? null,
    casoId: row.caso_id,
    casoTitulo: row.casos?.titulo ?? '',
  }))
}

// ── getDashboardMetrics ───────────────────────────────────────────────────────
// Agrega todas as métricas do dashboard em paralelo.

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const [newLeads, conversionRate, activeCasos, openPendencias, urgentRadarItems, totalLeads] =
    await Promise.all([
      getNewLeadsToday(tenantId),
      getConversionRate(tenantId),
      getActiveCasos(tenantId),
      getOpenPendencias(tenantId),
      getUrgentRadarItems(tenantId),
      // total de leads ativos (não deletados)
      createClient().then(async (s) => {
        const { count } = await s
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)
        return count ?? 0
      }),
    ])

  return {
    newLeads24h: newLeads.count,
    newLeads24hDelta: newLeads.delta,
    totalLeads,
    conversionRate,
    activeCasos,
    openPendencias,
    urgentRadarItems,
  }
}
