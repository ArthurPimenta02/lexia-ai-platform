import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const tenantId = user?.user_metadata?.tenant_id as string | undefined
  let shouldShowOabBanner = false

  if (user && tenantId) {
    const { data: membership } = await supabase
      .from('users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (membership?.role === 'lawyer') {
      const { data: primaryOab } = await supabase
        .from('lawyer_oabs')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .maybeSingle()

      shouldShowOabBanner = !primaryOab
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary dark:bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          {shouldShowOabBanner ? (
            <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-950 dark:text-amber-100">
                      Falta cadastrar sua OAB
                    </p>
                    <p>
                      Para importar seus processos e iniciar a sincronizacao juridica da Lexia, cadastre sua OAB no seu perfil.
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile#oab-setup"
                  className="inline-flex items-center justify-center rounded-md border border-amber-400/60 bg-amber-100 px-3 py-2 text-sm font-medium transition-colors hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/40 dark:hover:bg-amber-900/60"
                >
                  Cadastrar minha OAB
                </Link>
              </div>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
