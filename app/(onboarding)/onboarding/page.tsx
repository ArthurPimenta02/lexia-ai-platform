'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingPage() {
  const router = useRouter()
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceName.trim()) {
      setWorkspaceError('Nome do workspace é obrigatório.')
      return
    }
    if (workspaceName.trim().length < 2) {
      setWorkspaceError('Mínimo de 2 caracteres.')
      return
    }

    setLoading(true)
    // Fake — sem persistência real ainda
    await new Promise((r) => setTimeout(r, 1400))
    router.push('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa 1 de 1</span>
          <span>100%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border">
          <div className="h-1.5 rounded-full bg-brand transition-all duration-500" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
          <Building2 className="h-6 w-6 text-brand" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Configure seu workspace</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O workspace é o espaço do seu escritório dentro da Lexia AI. Você pode convidar
          sua equipe depois.
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="workspaceName">Nome do escritório</Label>
          <Input
            id="workspaceName"
            type="text"
            placeholder="Ex: Silva & Associados"
            autoComplete="organization"
            autoFocus
            value={workspaceName}
            aria-invalid={!!workspaceError}
            onChange={(e) => {
              setWorkspaceName(e.target.value)
              if (workspaceError) setWorkspaceError('')
            }}
            className="h-11 text-base"
            disabled={loading}
          />
          {workspaceError ? (
            <p className="text-xs text-error">{workspaceError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Este será o nome exibido para todos os membros do workspace.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-brand hover:bg-brand-dark text-white text-base"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando workspace…
            </>
          ) : (
            'Criar workspace e entrar'
          )}
        </Button>
      </form>
    </div>
  )
}
