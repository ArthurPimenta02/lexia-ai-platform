import { notFound } from 'next/navigation'
import { MOCK_LEADS, MOCK_LEAD_ACTIVITIES } from '@/lib/mock/leads'
import { LeadDetailClient } from '@/components/leads/LeadDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params
  const lead = MOCK_LEADS.find((l) => l.id === id)

  if (!lead) {
    notFound()
  }

  const activities = MOCK_LEAD_ACTIVITIES[id] ?? []

  return <LeadDetailClient lead={lead} activities={activities} />
}
