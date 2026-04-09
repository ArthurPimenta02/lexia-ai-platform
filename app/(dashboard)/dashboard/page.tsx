import { Users, Inbox, Calendar, TrendingUp } from 'lucide-react'
import { MetricCard } from '@/components/shared/MetricCard'
import { FunnelChart } from '@/components/shared/FunnelChart'
import { ActivityFeed } from '@/components/shared/ActivityFeed'
import { mockMetrics, mockFunnel, mockActivities } from '@/lib/mock/dashboard'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Novos Leads (24h)"
          value={mockMetrics.newLeads24h}
          delta={mockMetrics.newLeads24hDelta}
          icon={Users}
          iconColor="text-brand"
          iconBg="bg-blue-50 dark:bg-blue-950/30"
        />
        <MetricCard
          label="Total de Leads"
          value={mockMetrics.totalLeads}
          delta={mockMetrics.totalLeadsDelta}
          deltaLabel="este mês"
          icon={TrendingUp}
          iconColor="text-[#8B5CF6]"
          iconBg="bg-purple-50 dark:bg-purple-950/30"
        />
        <MetricCard
          label="Taxa de Conversão"
          value={`${mockMetrics.conversionRate}%`}
          delta={mockMetrics.conversionRateDelta}
          deltaLabel="vs mês anterior"
          icon={Inbox}
          iconColor="text-success"
          iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <MetricCard
          label="Atendimentos Hoje"
          value={mockMetrics.attendancesToday}
          delta={mockMetrics.attendancesTodayDelta}
          icon={Calendar}
          iconColor="text-warning"
          iconBg="bg-orange-50 dark:bg-orange-950/30"
        />
      </div>

      {/* Funil + Atividades */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FunnelChart stages={mockFunnel} />
        <ActivityFeed activities={mockActivities} />
      </div>
    </div>
  )
}
