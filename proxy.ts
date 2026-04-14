import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * proxy.ts — Proteção de rotas + refresh de sessão Supabase via cookies.
 * Next.js 16+ usa "proxy.ts" como nova convenção (substitui "middleware.ts").
 */
export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh da sessão — NUNCA remover este bloco.
  // Garante que os cookies de sessão sejam renovados a cada request.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Rotas de API, assets e arquivos estáticos — não interceptar ────────────
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // ── Rotas públicas (sem sessão requerida) ──────────────────────────────────
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/accept-invite']
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r))
  const allowWhenAuthenticatedPublicRoutes = ['/reset-password', '/accept-invite']
  const canStayOnPublicRouteWhenAuthenticated = allowWhenAuthenticatedPublicRoutes.some((r) =>
    pathname.startsWith(r)
  )

  let isInactiveUser = false
  if (user) {
    const tenantId = user.user_metadata?.tenant_id as string | undefined
    if (tenantId) {
      const { data: membership } = await supabase
        .from('users')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('id', user.id)
        .maybeSingle()

      isInactiveUser = membership?.status === 'inactive'
    }
  }

  // Sem sessão → redireciona para /login (exceto rotas públicas)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Com sessão → não deixa acessar login/signup novamente
  if (user && isInactiveUser && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'inactive_user')
    return NextResponse.redirect(url)
  }

  if (user && !isInactiveUser && isPublicRoute && !canStayOnPublicRouteWhenAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Raiz com sessão → redireciona para dashboard
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
