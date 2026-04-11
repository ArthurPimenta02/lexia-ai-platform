'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/layout/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/actions/auth'

interface FormErrors {
  password?: string
  confirm?: string
  server?: string
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!password) errs.password = 'Senha é obrigatória.'
    else if (password.length < 8) errs.password = 'Mínimo de 8 caracteres.'
    if (!confirm) errs.confirm = 'Confirme sua senha.'
    else if (confirm !== password) errs.confirm = 'As senhas não coincidem.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const formData = new FormData()
    formData.set('password', password)
    formData.set('confirm', confirm)

    const result = await resetPassword(formData)
    // resetPassword redireciona em caso de sucesso — só chega aqui se houve erro
    if (result?.error) {
      setErrors({ server: result.error })
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Redefinir senha" subtitle="Crie uma nova senha para sua conta.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.server && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {errors.server}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              value={password}
              aria-invalid={!!errors.password}
              className="pr-10"
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
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

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={!!errors.confirm}
              className="pr-10"
              onChange={(e) => {
                setConfirm(e.target.value)
                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }))
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm && <p className="text-xs text-error">{errors.confirm}</p>}
        </div>

        <Button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando…</> : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthCard>
  )
}
