'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser client — usar em Client Components e para Supabase Realtime.
 * Não usar para Server Actions ou API routes (usar server.ts).
 *
 * Singleton via módulo ES — o mesmo client é reutilizado entre renders.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
