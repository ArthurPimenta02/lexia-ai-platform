import { getLeads } from '@/actions/leads'
import { getStages } from '@/actions/stages'
import { LeadsClient } from '@/components/leads/LeadsClient'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tenantId = user?.user_metadata?.tenant_id as string | undefined

  const [leads, stages, membership] = await Promise.all([
    getLeads(),
    getStages(),
    tenantId
      ? supabase
          .from('users')
          .select('role')
          .eq('tenant_id', tenantId)
          .eq('id', user!.id)
          .is('deleted_at', null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const currentRole = (membership.data?.role as UserRole | undefined) ?? 'viewer'

  return <LeadsClient initialLeads={leads} stages={stages} currentRole={currentRole} />
}
