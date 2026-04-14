import { NextResponse, type NextRequest } from 'next/server'
import { isValidWebhookSecret } from '@/lib/integrations/n8n'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!isValidWebhookSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    body = null
  }

  return NextResponse.json(
    {
      ok: true,
      stub: true,
      message: 'Webhook agent-log preparado para fases futuras.',
      received: body,
    },
    { status: 200 }
  )
}
