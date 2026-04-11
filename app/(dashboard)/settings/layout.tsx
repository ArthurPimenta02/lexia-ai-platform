import { SettingsSidebar } from '@/components/settings/SettingsSidebar'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <SettingsSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
