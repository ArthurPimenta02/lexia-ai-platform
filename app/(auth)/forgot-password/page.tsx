'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, MailCheck } from 'lucide-react'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setEmailError('E-mail é obrigatório.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Informe um e-mail válido.'); return }

    setLoading(true)
    setServerError('')
    const formData = new FormData()
    formData.set('email', email)

    const result = await forgotPassword(formData)
    setLoading(false)

    if (result?.error) {
      setServerError(result.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <MailCheck className="h-8 w-8 text-success" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos as instruções de recuperação para{' '}
            <span className="font-medium text-foreground">{email}</span>.
            <br />
            Não esqueça de checar a caixa de spam.
          </p>
        </div>
        <Link href="/login" className="inline-block text-sm text-brand hover:text-brand-dark font-medium transition-colors">
          ← Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <AuthCard title="Recuperar senha" subtitle="Informe seu e-mail e enviaremos as instruções.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {serverError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email" type="email" placeholder="voce@escritorio.com.br" autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
            aria-invalid={!!emailError}
            disabled={loading}
          />
          {emailError && <p className="text-xs text-error">{emailError}</p>}
        </div>

        <Button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</> : 'Enviar instruções'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-brand hover:text-brand-dark font-medium transition-colors">
          Voltar para o login
        </Link>
      </p>
    </AuthCard>
  )
}
