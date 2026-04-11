'use client'

import { useState } from 'react'
import { Loader2, Building2, Scale, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from '@/actions/onboarding'

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface OabEntry { number: string; state: string }

interface FormErrors {
  displayName?: string
  oabs?: string
  server?: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState('')
  const [oabs, setOabs] = useState<OabEntry[]>([{ number: '', state: 'SP' }])
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function addOab() {
    setOabs((prev) => [...prev, { number: '', state: 'SP' }])
  }

  function removeOab(index: number) {
    setOabs((prev) => prev.filter((_, i) => i !== index))
  }

  function updateOab(index: number, field: keyof OabEntry, value: string) {
    setOabs((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)))
    if (errors.oabs) setErrors((prev) => ({ ...prev, oabs: undefined }))
  }

  function validateStep1() {
    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrors({ displayName: 'Informe o nome do escritório (mínimo 2 caracteres).' })
      return false
    }
    setErrors({})
    return true
  }

  function validateStep2() {
    const filled = oabs.filter((o) => o.number.trim())
    if (filled.length === 0) {
      setErrors({ oabs: 'Informe pelo menos 1 número de OAB.' })
      return false
    }
    for (const o of filled) {
      if (!/^\d{3,7}$/.test(o.number.trim())) {
        setErrors({ oabs: 'Número de OAB inválido (apenas dígitos, 3 a 7 caracteres).' })
        return false
      }
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

    const validOabs = oabs
      .filter((o) => o.number.trim())
      .map((o) => ({ oab_number: o.number.trim(), oab_state: o.state }))
    formData.set('oabs', JSON.stringify(validOabs))

    const result = await completeOnboarding(formData)
    // completeOnboarding redireciona em caso de sucesso — só chega aqui se houve erro
    if (result?.error) {
      setErrors({ server: result.error })
      setLoading(false)
    }
  }

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

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
            <h1 className="text-2xl font-bold text-foreground">Números de OAB</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Informe os números de OAB do escritório. Usamos esses dados para monitorar
              processos automaticamente via CNJ/Escavador.
            </p>
          </div>

          {/* Erro de servidor */}
          {errors.server && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              {errors.server}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-3">
              <Label>Números de OAB</Label>

              {oabs.map((oab, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Ex: 123456"
                      value={oab.number}
                      aria-invalid={!!errors.oabs && index === 0}
                      onChange={(e) => updateOab(index, 'number', e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      maxLength={7}
                    />
                  </div>
                  <select
                    value={oab.state}
                    onChange={(e) => updateOab(index, 'state', e.target.value)}
                    disabled={loading}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  >
                    {BR_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {oabs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOab(index)}
                      disabled={loading}
                      className="h-10 w-10 text-muted-foreground hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {errors.oabs && <p className="text-xs text-error">{errors.oabs}</p>}

              {oabs.length < 5 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addOab}
                  disabled={loading}
                  className="text-brand hover:text-brand-dark"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar outro número
                </Button>
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
