import { getLeads } from '@/actions/leads'
import { getStages } from '@/actions/stages'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

export default async function KanbanPage() {
  const [leads, stages] = await Promise.all([getLeads(), getStages()])
  return <KanbanBoard initialLeads={leads} stages={stages} />
}
