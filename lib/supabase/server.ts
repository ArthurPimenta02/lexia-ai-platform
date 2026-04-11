import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server client — usar em Server Components, Server Actions e API routes.
 *
 * Lê e escreve cookies via next/headers para manter a sessão sincronizada.
 * Deve ser chamado dentro de um request context (não em módulo global).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll é chamado em Server Components (read-only).
            // O middleware garante o refresh do cookie antes da resposta.
          }
        },
      },
    }
  )
}

/**
 * Service role client — usar APENAS em contextos seguros de servidor
 * (webhooks, jobs, operações administrativas).
 * Bypassa RLS — usar com extremo cuidado.
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
