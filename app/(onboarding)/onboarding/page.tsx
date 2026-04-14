'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from '@/actions/onboarding'

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface FormErrors {
  displayName?: string
  oab?: string
  server?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState('')
  const [isLawyer, setIsLawyer] = useState(false)
  const [oabNumber, setOabNumber] = useState('')
  const [oabState, setOabState] = useState('SP')
  const [searchNow, setSearchNow] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [completedState, setCompletedState] = useState<{
    title: string
    description: string
  } | null>(null)

  function validateStep1() {
    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrors({ displayName: 'Informe o nome do escritório (mínimo 2 caracteres).' })
      return false
    }
    setErrors({})
    return true
  }

  function validateStep2() {
    if (!isLawyer) {
      setErrors({})
      return true
    }

    if (!oabNumber.trim()) {
      setErrors({ oab: 'Informe o numero da sua OAB ou desmarque a opcao de cadastro agora.' })
      return false
    }

    if (!/^\d{3,7}$/.test(oabNumber.trim())) {
      setErrors({ oab: 'Numero de OAB invalido (apenas digitos, 3 a 7 caracteres).' })
      return false
    }
    setErrors({})
    return true
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep2()) return

    setLoading(true)
    const formData = new FormData()
    formData.set('displayName', displayName.trim())
    if (isLawyer && oabNumber.trim()) {
      formData.set('oabNumber', oabNumber.trim())
      formData.set('oabState', oabState)
      formData.set('searchNow', String(searchNow))
    }

    const result = await completeOnboarding(formData)
    if (result?.error) {
      setErrors({ server: result.error })
      setLoading(false)
      return
    }

    if (result?.success) {
      if (result.oabSaved && result.discoveryRequested) {
        setCompletedState({
          title: 'Onboarding concluido',
          description: 'Sua OAB foi salva e a busca inicial dos seus processos foi iniciada.',
        })
      } else if (result.oabSaved) {
        setCompletedState({
          title: 'Onboarding concluido',
          description: result.discoveryError
            ? 'Sua OAB foi salva, mas a busca inicial nao pode ser iniciada agora. Voce podera buscar depois no seu perfil.'
            : 'Sua OAB foi salva. Voce podera buscar seus processos depois no seu perfil.',
        })
      } else {
        setCompletedState({
          title: 'Onboarding concluido',
          description: 'Seu escritorio foi configurado. Se quiser, voce podera cadastrar sua OAB depois no seu perfil.',
        })
      }

      setLoading(false)
    }
  }

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

  if (completedState) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
            <Scale className="h-6 w-6 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{completedState.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {completedState.description}
          </p>
        </div>

        <Button
          type="button"
          className="w-full h-11 bg-brand hover:bg-brand-dark text-white text-base"
          onClick={() => router.push('/dashboard')}
        >
          Entrar na plataforma
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Etapa {step} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border">
          <div
            className="h-1.5 rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
              <Building2 className="h-6 w-6 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Configure seu escritório</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Como o seu escritório será exibido para os membros da equipe dentro da Lexia AI.
            </p>
          </div>

          {/* Erro de servidor */}
          {errors.server && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              {errors.server}
            </div>
          )}

          <form onSubmit={handleNext} noValidate className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Nome do escritório</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Ex: Silva & Associados"
                autoComplete="organization"
                autoFocus
                value={displayName}
                aria-invalid={!!errors.displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: undefined }))
                }}
                className="h-11 text-base"
                disabled={loading}
              />
              {errors.displayName ? (
                <p className="text-xs text-error">{errors.displayName}</p>
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
              Continuar
            </Button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
              <Scale className="h-6 w-6 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Cadastre sua OAB para importar seus processos</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esse cadastro e opcional neste momento. Se voce for advogado, pode informar sua OAB
              agora e iniciar a primeira busca dos seus processos ao concluir o onboarding.
            </p>
          </div>

          {/* Erro de servidor */}
          {errors.server && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              {errors.server}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isLawyer}
                  onChange={(e) => {
                    setIsLawyer(e.target.checked)
                    if (!e.target.checked) {
                      setOabNumber('')
                      setSearchNow(false)
                      setErrors((prev) => ({ ...prev, oab: undefined }))
                    }
                  }}
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Sou advogado e quero cadastrar minha OAB agora</p>
                  <p className="text-xs text-muted-foreground">
                    A OAB fica vinculada ao seu usuario e podera ser editada depois no perfil.
                  </p>
                </div>
              </label>

              {isLawyer && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-oab-number">Numero da OAB</Label>
                      <Input
                        id="onboarding-oab-number"
                        type="text"
                        placeholder="Ex: 123456"
                        value={oabNumber}
                        aria-invalid={!!errors.oab}
                        onChange={(e) => {
                          setOabNumber(e.target.value.replace(/\D/g, ''))
                          if (errors.oab) setErrors((prev) => ({ ...prev, oab: undefined }))
                        }}
                        disabled={loading}
                        maxLength={7}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="onboarding-oab-state">UF</Label>
                      <select
                        id="onboarding-oab-state"
                        value={oabState}
                        onChange={(e) => setOabState(e.target.value)}
                        disabled={loading}
                        className="h-10 rounded-md border border-input bg-background text-foreground px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                      >
                        {BR_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {errors.oab && <p className="text-xs text-error">{errors.oab}</p>}

                  <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3">
                    <input
                      type="checkbox"
                      checked={searchNow}
                      onChange={(e) => setSearchNow(e.target.checked)}
                      disabled={loading || !oabNumber.trim()}
                      className="mt-1 h-4 w-4 rounded border-input"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Buscar meus processos agora</p>
                      <p className="text-xs text-muted-foreground">
                        Ao concluir o onboarding, a Lexia vai reutilizar o fluxo ja existente de discovery via n8n.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full h-11 bg-brand hover:bg-brand-dark text-white text-base"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  'Concluir e entrar'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Voltar
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
