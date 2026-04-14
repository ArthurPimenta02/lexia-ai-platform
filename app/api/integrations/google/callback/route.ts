import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeGoogleCode,
  fetchPrimaryGoogleCalendar,
  getGoogleIntegrationAuthContext,
  saveGoogleCalendarConnection,
} from '@/lib/google-calendar/server'

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
}

function clearOauthState(response: NextResponse) {
  response.cookies.set('lexia_google_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl(request)
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')
  const storedState = request.cookies.get('lexia_google_oauth_state')?.value

  if (oauthError) {
    return clearOauthState(
      NextResponse.redirect(new URL(`/settings/integrations?google=error&reason=${encodeURIComponent(oauthError)}`, appUrl))
    )
  }

  if (!code || !state || !storedState || state !== storedState) {
    return clearOauthState(
      NextResponse.redirect(new URL('/settings/integrations?google=error&reason=state_mismatch', appUrl))
    )
  }

  const context = await getGoogleIntegrationAuthContext()

  if ('error' in context) {
    if (context.error === 'not_authenticated') {
      return clearOauthState(NextResponse.redirect(new URL('/login', appUrl)))
    }

    if (context.error === 'missing_tenant_id') {
      return clearOauthState(NextResponse.redirect(new URL('/onboarding', appUrl)))
    }

    return clearOauthState(
      NextResponse.redirect(new URL('/settings/integrations?google=error&reason=permission_check_failed', appUrl))
    )
  }

  if (!context.canManage) {
    return clearOauthState(NextResponse.redirect(new URL('/settings/integrations?google=forbidden', appUrl)))
  }

  try {
    const tokens = await exchangeGoogleCode(code)
    const primaryCalendar = await fetchPrimaryGoogleCalendar(tokens.access_token)

    await saveGoogleCalendarConnection({
      tenantId: context.tenantId,
      userId: context.userId,
      tokens,
      calendarId: primaryCalendar.id,
      calendarSummary: primaryCalendar.summary,
      accountEmail: primaryCalendar.id,
    })

    return clearOauthState(
      NextResponse.redirect(new URL('/settings/integrations?google=connected', appUrl))
    )
  } catch (callbackError) {
    return clearOauthState(
      NextResponse.redirect(
        new URL(
          `/settings/integrations?google=error&reason=${encodeURIComponent(callbackError instanceof Error ? callbackError.message : 'oauth_callback_failed')}`,
          appUrl
        )
      )
    )
  }
}

