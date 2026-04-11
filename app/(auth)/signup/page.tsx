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
  password?: string
  confirmPassword?: string
  server?: string
}

function validate(name: string, email: string, officeName: string, password: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {}
  if (!name.trim()) errors.name = 'Nome é obrigatório.'
  if (!email) errors.email = 'E-mail é obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail válido.'
  if (!officeName.trim()) errors.officeName = 'Nome do escritório é obrigatório.'
  if (!password) errors.password = 'Senha é obrigatória.'
  else if (password.length < 8) errors.password = 'Mínimo de 8 caracteres.'
  if (!confirmPassword) errors.confirmPassword = 'Confirme sua senha.'
  else if (password && confirmPassword !== password) errors.confirmPassword = 'As senhas não coincidem.'
  return errors
}

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [officeName, setOfficeName] = useState('')
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
    const errs = validate(name, email, officeName, password, confirmPassword)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const formData = new FormData()
    formData.set('name', name)
    formData.set('email', email)
    formData.set('officeName', officeName)
    formData.set('password', password)

    const result = await signUp(formData)
    // signUp faz redirect em caso de sucesso — só chega aqui se houve erro
    if (result?.error) {
      setErrors({ server: result.error })
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Criar conta" subtitle="Comece grátis. Sem cartão de crédito.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Erro do servidor */}
        {errors.server && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {errors.server}
          </div>
        )}

        {/* Nome */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name" type="text" placeholder="Ana Silva" autoComplete="name"
            value={name} aria-invalid={!!errors.name}
            onChange={(e) => { setName(e.target.value); clearError('name') }}
            disabled={loading}
          />
          {errors.name && <p className="text-xs text-error">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email" type="email" placeholder="voce@escritorio.com.br" autoComplete="email"
            value={email} aria-invalid={!!errors.email}
            onChange={(e) => { setEmail(e.target.value); clearError('email') }}
            disabled={loading}
          />
          {errors.email && <p className="text-xs text-error">{errors.email}</p>}
        </div>

        {/* Nome do escritório */}
        <div className="space-y-1.5">
          <Label htmlFor="officeName">Nome do escritório</Label>
          <Input
            id="officeName" type="text" placeholder="Silva & Associados" autoComplete="organization"
            value={officeName} aria-invalid={!!errors.officeName}
            onChange={(e) => { setOfficeName(e.target.value); clearError('officeName') }}
            disabled={loading}
          />
          {errors.officeName && <p className="text-xs text-error">{errors.officeName}</p>}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password" type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres" autoComplete="new-password"
              value={password} aria-invalid={!!errors.password} className="pr-10"
              onChange={(e) => { setPassword(e.target.value); clearError('password') }}
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error">{errors.password}</p>}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword" type={showConfirm ? 'text' : 'password'}
              placeholder="Repita a senha" autoComplete="new-password"
              value={confirmPassword} aria-invalid={!!errors.confirmPassword} className="pr-10"
              onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
              disabled={loading}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'} tabIndex={-1}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta…</> : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="text-brand hover:text-brand-dark font-medium transition-colors">
          Entrar
        </Link>
      </p>
    </AuthCard>
  )
}
