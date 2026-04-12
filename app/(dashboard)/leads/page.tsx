import { getLeads } from '@/actions/leads'
import { getStages } from '@/actions/stages'
import { LeadsClient } from '@/components/leads/LeadsClient'

export default async function LeadsPage() {
  const [leads, stages] = await Promise.all([
    getLeads(),
    getStages(),
  ])

  return <LeadsClient initialLeads={leads} stages={stages} />
}
