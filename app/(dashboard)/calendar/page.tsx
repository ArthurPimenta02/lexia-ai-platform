import { getGoogleCalendarIntegrationStatus } from '@/actions/google-calendar'
import { getAppointmentFormOptions, getAppointments } from '@/actions/appointments'
import { CalendarClient } from '@/components/calendar/CalendarClient'

export default async function CalendarPage() {
  const [appointmentsResult, optionsResult, googleResult] = await Promise.all([
    getAppointments(),
    getAppointmentFormOptions(),
    getGoogleCalendarIntegrationStatus(),
  ])

  const events = 'appointments' in appointmentsResult ? appointmentsResult.appointments : []
  const formOptions = 'options' in optionsResult
    ? optionsResult.options
    : { casos: [], leads: [], responsaveis: [] }
  const googleIntegration = 'integration' in googleResult
    ? (googleResult.integration ?? { connected: false, enabled: false, status: 'disconnected' as const })
    : { connected: false, enabled: false, status: 'disconnected' as const }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CalendarClient
        events={events}
        formOptions={formOptions}
        googleIntegration={googleIntegration}
      />
    </div>
  )
}
