import { NextResponse, type NextRequest } from 'next/server'
import { isValidWebhookSecret } from '@/lib/integrations/n8n'
import { ingestProcessUpdate, type ProcessUpdatePayload } from '@/lib/integrations/process-sync'

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
    processo_id?: string
    external_id?: string
    cnj_number?: string
    updates?: unknown[]
  }

  if (!Array.isArray(payload.updates) || payload.updates.length === 0) {
    return NextResponse.json({ error: 'updates e obrigatorio.' }, { status: 400 })
  }

  if (!payload.processo_id && !payload.external_id && !payload.cnj_number) {
    return NextResponse.json(
      { error: 'Informe processo_id, external_id ou cnj_number.' },
      { status: 400 }
    )
  }

  try {
    const result = await ingestProcessUpdate(body as ProcessUpdatePayload)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[webhooks/n8n/process-update]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao processar update.' },
      { status: 200 }
    )
  }
}
