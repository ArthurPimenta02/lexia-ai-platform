import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lexia AI — Configurar workspace',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-secondary dark:bg-background px-6 py-12">
      <div className="mb-10 text-center">
        <span className="text-2xl font-bold text-brand">Lexia AI</span>
      </div>
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}
