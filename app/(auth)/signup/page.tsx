'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp } from '@/actions/auth'

interface FormErrors {
  name?: string
  email?: string
  officeName?: string
  officeCode?: string
  oab?: string
  password?: string
  confirmPassword?: string
  server?: string
}

type SignupMode = 'create_office' | 'join_office'
const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function validate(
  mode: SignupMode,
  name: string,
  email: string,
  officeName: string,
  officeCode: string,
  isLawyer: boolean,
  oabNumber: string,
  password: string,
  confirmPassword: string
): FormErrors {
  const errors: FormErrors = {}
  if (!name.trim()) errors.name = 'Nome e obrigatorio.'
  if (!email) errors.email = 'E-mail e obrigatorio.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail valido.'
  if (mode === 'create_office' && !officeName.trim()) errors.officeName = 'Nome do escritorio e obrigatorio.'
  if (mode === 'join_office' && !officeCode.trim()) errors.officeCode = 'Codigo do escritorio e obrigatorio.'
  if (mode === 'create_office' && isLawyer && !/^\d{3,7}$/.test(oabNumber.trim())) {
    errors.oab = 'Informe um numero de OAB valido (apenas digitos, 3 a 7 caracteres).'
  }
  if (!password) errors.password = 'Senha e obrigatoria.'
  else if (password.length < 8) errors.password = 'Minimo de 8 caracteres.'
  if (!confirmPassword) errors.confirmPassword = 'Confirme sua senha.'
  else if (password && confirmPassword !== password) errors.confirmPassword = 'As senhas nao coincidem.'
  return errors
}

export default function SignupPage() {
  const [signupMode, setSignupMode] = useState<SignupMode>('create_office')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [officeName, setOfficeName] = useState('')
  const [officeCode, setOfficeCode] = useState('')
  const [isLawyer, setIsLawyer] = useState(false)
  const [oabNumber, setOabNumber] = useState('')
  const [oabState, setOabState] = useState('SP')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(signupMode, name, email, officeName, officeCode, isLawyer, oabNumber, password, confirmPassword)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const formData = new FormData()
    formData.set('name', name)
    formData.set('email', email)
    formData.set('signupMode', signupMode)
    formData.set('password', password)

    if (signupMode === 'create_office') {
      formData.set('officeName', officeName)
      formData.set('isLawyer', String(isLawyer))
      if (isLawyer) {
        formData.set('oabNumber', oabNumber.trim())
        formData.set('oabState', oabState)
      }
    } else {
      formData.set('officeCode', officeCode.toUpperCase())
    }

    const result = await signUp(formData)
    if (result?.error) {
      setErrors({ server: result.error })
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Criar conta" subtitle="Escolha se voce vai criar um escritorio novo ou entrar em um ja existente.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => {
              setSignupMode('create_office')
              clearError('officeCode')
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              signupMode === 'create_office'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Criar escritorio
          </button>
          <button
            type="button"
            onClick={() => {
              setSignupMode('join_office')
              clearError('officeName')
              clearError('oab')
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              signupMode === 'join_office'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar com codigo
          </button>
        </div>

        {errors.server && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {errors.server}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ana Silva"
            autoComplete="name"
            value={name}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setName(e.target.value)
              clearError('name')
            }}
            disabled={loading}
          />
          {errors.name && <p className="text-xs text-error">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@escritorio.com.br"
            autoComplete="email"
            value={email}
            aria-invalid={!!errors.email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError('email')
            }}
            disabled={loading}
          />
          {errors.email && <p className="text-xs text-error">{errors.email}</p>}
        </div>

        {signupMode === 'create_office' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="officeName">Nome do escritorio</Label>
              <Input
                id="officeName"
                type="text"
                placeholder="Silva & Associados"
                autoComplete="organization"
                value={officeName}
                aria-invalid={!!errors.officeName}
                onChange={(e) => {
                  setOfficeName(e.target.value)
                  clearError('officeName')
                }}
                disabled={loading}
              />
              {errors.officeName ? (
                <p className="text-xs text-error">{errors.officeName}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  O codigo do escritorio sera gerado automaticamente apos o cadastro.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isLawyer}
                  onChange={(e) => {
                    setIsLawyer(e.target.checked)
                    if (!e.target.checked) {
                      setOabNumber('')
                      setOabState('SP')
                      clearError('oab')
                    }
                  }}
                  disabled={loading}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Sou advogado e quero informar minha OAB agora</p>
                  <p className="text-xs text-muted-foreground">
                    Se voce for o advogado responsavel pelo escritorio, a Lexia pode salvar sua OAB ja no cadastro.
                  </p>
                </div>
              </label>

              {isLawyer ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-oab-number">Numero da OAB</Label>
                    <Input
                      id="signup-oab-number"
                      type="text"
                      placeholder="Ex: 123456"
                      value={oabNumber}
                      aria-invalid={!!errors.oab}
                      onChange={(e) => {
                        setOabNumber(e.target.value.replace(/\D/g, ''))
                        clearError('oab')
                      }}
                      disabled={loading}
                      maxLength={7}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-oab-state">UF</Label>
                    <select
                      id="signup-oab-state"
                      value={oabState}
                      onChange={(e) => setOabState(e.target.value)}
                      disabled={loading}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                    >
                      {BR_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {errors.oab ? <p className="text-xs text-error">{errors.oab}</p> : null}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="officeCode">Codigo do escritorio</Label>
            <Input
              id="officeCode"
              type="text"
              placeholder="A1B2C3D4"
              value={officeCode}
              aria-invalid={!!errors.officeCode}
              onChange={(e) => {
                setOfficeCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                clearError('officeCode')
              }}
              disabled={loading}
              maxLength={8}
            />
            {errors.officeCode ? (
              <p className="text-xs text-error">{errors.officeCode}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nesta fase, entradas por codigo recebem perfil inicial de visualizador.
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              value={password}
              aria-invalid={!!errors.password}
              className="pr-10"
              onChange={(e) => {
                setPassword(e.target.value)
                clearError('password')
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repita a senha"
              autoComplete="new-password"
              value={confirmPassword}
              aria-invalid={!!errors.confirmPassword}
              className="pr-10"
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                clearError('confirmPassword')
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" className="w-full bg-brand text-white hover:bg-brand-dark" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ja tem conta?{' '}
        <Link href="/login" className="font-medium text-brand transition-colors hover:text-brand-dark">
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}
