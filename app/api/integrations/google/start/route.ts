import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { buildGoogleAuthUrl, getGoogleIntegrationAuthContext } from '@/lib/google-calendar/server'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
  const context = await getGoogleIntegrationAuthContext()

  if ('error' in context) {
    if (context.error === 'not_authenticated') {
      return NextResponse.redirect(new URL('/login', appUrl))
    }

    if (context.error === 'missing_tenant_id') {
      return NextResponse.redirect(new URL('/onboarding', appUrl))
    }

    return NextResponse.redirect(new URL('/settings/integrations?google=error&reason=permission_check_failed', appUrl))
  }

  if (!context.canManage) {
    return NextResponse.redirect(new URL('/settings/integrations?google=forbidden', appUrl))
  }

  const state = randomUUID()
  const response = NextResponse.redirect(buildGoogleAuthUrl(state))
  response.cookies.set('lexia_google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  return response
}

