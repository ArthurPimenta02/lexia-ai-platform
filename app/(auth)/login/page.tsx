'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/actions/auth'

interface FormErrors {
  email?: string
  password?: string
  server?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email) errors.email = 'E-mail é obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail válido.'
  if (!password) errors.password = 'Senha é obrigatória.'
  else if (password.length < 6) errors.password = 'Mínimo de 6 caracteres.'
  return errors
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(email, password)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const formData = new FormData()
    formData.set('email', email)
    formData.set('password', password)

    const result = await signIn(formData)
    // signIn faz redirect em caso de sucesso — só chega aqui se houve erro
    if (result?.error) {
      setErrors({ server: result.error })
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Bem-vindo de volta" subtitle="Entre com sua conta Lexia AI.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Erro do servidor */}
        {errors.server && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {errors.server}
          </div>
        )}

        {/* Email */}
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
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            disabled={loading}
          />
          {errors.email && <p className="text-xs text-error">{errors.email}</p>}
        </div>

        {/* Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/forgot-password" className="text-xs text-brand hover:text-brand-dark transition-colors">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              aria-invalid={!!errors.password}
              className="pr-10"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando…</> : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link href="/signup" className="text-brand hover:text-brand-dark font-medium transition-colors">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  )
}
