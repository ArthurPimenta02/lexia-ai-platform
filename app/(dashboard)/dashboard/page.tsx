import { LayoutDashboard, Users, Inbox, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  {
    label: 'Leads ativos',
    value: '—',
    icon: Users,
    color: 'text-brand',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    label: 'Conversas hoje',
    value: '—',
    icon: Inbox,
    color: 'text-success',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    label: 'Agendamentos',
    value: '—',
    icon: Calendar,
    color: 'text-warning',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    label: 'Total de clientes',
    value: '—',
    icon: LayoutDashboard,
    color: 'text-neutral',
    bg: 'bg-gray-100 dark:bg-gray-800/40',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <span className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conecte o backend para ver dados reais
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder pipeline preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Pipeline de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {['Novo', 'Qualificado', 'Proposta', 'Contrato', 'Cliente'].map((stage) => (
              <div
                key={stage}
                className="flex min-w-[160px] flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stage}
                </span>
                <div className="h-16 rounded-md border border-dashed border-border bg-background" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
