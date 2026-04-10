import { CasosClient } from '@/components/casos/CasosClient'

export const metadata = {
  title: 'Casos — Lexia AI',
}

export default function CasosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Casos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operação jurídica — acompanhe todos os casos ativos do escritório
        </p>
      </div>
      <CasosClient />
    </div>
  )
}
