import { NextResponse, type NextRequest } from 'next/server'
import { isValidWebhookSecret } from '@/lib/integrations/n8n'
import { ingestProcessDiscovery, type DiscoveryPayload } from '@/lib/integrations/process-sync'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (!isValidWebhookSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body invalido.' }, { status: 400 })
  }

  const payload = body as {
    lawyer_oab_id?: string
    processes?: unknown[]
  }

  if (!payload.lawyer_oab_id || !Array.isArray(payload.processes)) {
    return NextResponse.json(
      { error: 'lawyer_oab_id e processes sao obrigatorios.' },
      { status: 400 }
    )
  }

  try {
    const result = await ingestProcessDiscovery(body as DiscoveryPayload)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[webhooks/n8n/process-discovery]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao processar discovery.' },
      { status: 200 }
    )
  }
}
