import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import {
  getDashboardMetrics,
  getLeadsByStage,
  getRecentActivity,
  getAttentionNow,
  getNewLeadsDetail,
  getConversionDetail,
  getPendenciasDetail,
} from '@/lib/queries/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard — Lexia AI',
  description: 'Visão executiva do escritório',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = user?.user_metadata?.tenant_id as string | undefined

  if (!tenantId) {
    redirect('/onboarding')
  }

  const [
    metrics,
    funnel,
    activities,
    attentionNow,
    newLeadsDetail,
    conversionDetail,
    pendenciasDetail,
  ] = await Promise.all([
    getDashboardMetrics(tenantId),
    getLeadsByStage(tenantId),
    getRecentActivity(tenantId, 10),
    getAttentionNow(tenantId),
    getNewLeadsDetail(tenantId),
    getConversionDetail(tenantId),
    getPendenciasDetail(tenantId),
  ])

  return (
    <DashboardClient
      metrics={metrics}
      funnel={funnel}
      activities={activities}
      attentionNow={attentionNow}
      newLeadsDetail={newLeadsDetail}
      conversionDetail={conversionDetail}
      pendenciasDetail={pendenciasDetail}
    />
  )
}
