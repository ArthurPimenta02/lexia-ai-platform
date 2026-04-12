import { notFound } from 'next/navigation'
import { getLead, getLeadActivities } from '@/actions/leads'
import { getStages } from '@/actions/stages'
import { LeadDetailClient } from '@/components/leads/LeadDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params

  const [lead, activities, stages] = await Promise.all([
    getLead(id),
    getLeadActivities(id),
    getStages(),
  ])

  if (!lead) {
    notFound()
  }

  return <LeadDetailClient lead={lead} activities={activities} stages={stages} />
}
