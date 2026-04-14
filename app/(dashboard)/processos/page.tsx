import { redirect } from 'next/navigation'
import { getImportedProcesses } from '@/actions/processos-importados'
import { ImportedProcessesClient } from '@/components/processos/ImportedProcessesClient'

export const metadata = {
  title: 'Processos importados - Lexia AI',
}

export default async function ProcessosImportadosPage() {
  const result = await getImportedProcesses()

  if ('error' in result) {
    if (result.error === 'Nao autenticado.' || result.error === 'tenant_id nao encontrado na sessao.') {
      redirect('/login')
    }

    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {result.error}
      </div>
    )
  }

  return <ImportedProcessesClient initialProcesses={result} />
}
