import { MOCK_EVENTS } from '@/lib/mock/appointments'
import { CalendarClient } from '@/components/calendar/CalendarClient'

export default function CalendarPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <CalendarClient events={MOCK_EVENTS} />
    </div>
  )
}
