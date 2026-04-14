'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { AuthCard } from '@/components/layout/AuthCard'
import { createClient } from '@/lib/supabase/client'

function parseHashParams(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(raw)
}

export default function AcceptInvitePage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [message, setMessage] = useState('Validando convite...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        const url = new URL(window.location.href)
        const query = url.searchParams
        const hash = parseHashParams(url.hash)

        const errorDescription =
          query.get('error_description') ??
          hash.get('error_description')

        if (errorDescription) {
          if (!mounted) return
          setError(`Convite invalido: ${errorDescription}`)
          return
        }

        const tokenHash = query.get('token_hash') ?? hash.get('token_hash')
        const type = (query.get('type') ?? hash.get('type')) as EmailOtpType | null

        if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })
          if (verifyError) {
            if (!mounted) return
            setError(`Falha ao validar convite: ${verifyError.message}`)
            return
          }
        } else {
          const accessToken = query.get('access_token') ?? hash.get('access_token')
          const refreshToken = query.get('refresh_token') ?? hash.get('refresh_token')

          if (!accessToken || !refreshToken) {
            if (!mounted) return
            setError('Link de convite invalido ou expirado. Solicite um novo convite.')
            return
          }

          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            if (!mounted) return
            setError(`Falha ao criar sessao do convite: ${sessionError.message}`)
            return
          }
        }

        if (!mounted) return
        setMessage('Convite validado. Redirecionando para criacao de senha...')
        router.replace('/reset-password')
      } catch (e) {
        if (!mounted) return
        const reason = e instanceof Error ? e.message : 'erro desconhecido'
        setError(`Falha ao processar convite: ${reason}`)
      }
    }

    void run()

    return () => {
      mounted = false
    }
  }, [router, supabase])

  return (
    <AuthCard
      title="Aceitando convite"
      subtitle="Estamos preparando sua conta no escritorio."
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {message}
          </div>
        )}
      </div>
    </AuthCard>
  )
}
