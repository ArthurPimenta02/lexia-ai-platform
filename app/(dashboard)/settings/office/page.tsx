import { OfficeForm } from '@/components/settings/OfficeForm'
import { MOCK_OFFICE } from '@/lib/mock/settings'

export default function SettingsOfficePage() {
  return (
    <div className="max-w-2xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Escritório</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Dados de identificação e contato do seu escritório.
        </p>
      </div>
      <OfficeForm initial={MOCK_OFFICE} />
    </div>
  )
}
