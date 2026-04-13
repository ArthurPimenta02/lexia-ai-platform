import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { summarizeRadarItemInternal } from '@/actions/ai/radar-summary'
import type { RadarTipo, RadarUrgencia, RadarOrigem } from '@/types/database'

// ── POST /api/webhooks/radar ──────────────────────────────────────────────────
// Endpoint chamado pelo n8n ao detectar nova publicação, movimentação ou alerta.
//
// Segurança:
// - Valida X-Webhook-Secret
// - tenant_id NÃO é aceito do body como fonte de verdade.
//   Deriva tenant_id a partir de caso_id ou processo_id.
//   Só aceita tenant_id direto se nem caso_id nem processo_id foram fornecidos,
//   e mesmo assim valida que o tenant existe no banco.

interface WebhookBody {
  tipo: RadarTipo
  titulo: string
  descricao?: string
  caso_id?: string
  processo_id?: string
  tenant_id?: string           // fallback — usado só se não houver caso/processo
  urgencia?: RadarUrgencia
  exige_acao?: boolean
  external_id?: string
  external_source?: RadarOrigem
  client_name?: string         // nome do cliente para desnormalização
  caso_titulo?: string         // título do caso para desnormalização
}

export async function POST(request: NextRequest) {
  // 1. Valida segredo do webhook
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: WebhookBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.tipo || !body.titulo) {
    return NextResponse.json({ error: 'tipo e titulo são obrigatórios' }, { status: 400 })
  }

  const service = createServiceClient()

  // 2. Deriva tenant_id a partir de caso_id ou processo_id (fonte de verdade)
  let tenantId: string | null = null
  let casoTitulo: string | null = body.caso_titulo ?? null
  let clienteNome: string | null = body.client_name ?? null

  if (body.caso_id) {
    // Deriva tenant via caso — mais comum
    // Cast via unknown: o tipo gerado não inclui joins (relações)
    const { data: rawCaso } = await service
      .from('casos')
      .select('tenant_id, titulo, clients(name)')
      .eq('id', body.caso_id)
      .single()

    if (!rawCaso) {
      return NextResponse.json({ error: 'caso_id não encontrado' }, { status: 422 })
    }

    const caso = rawCaso as unknown as {
      tenant_id: string
      titulo: string
      clients: { name: string } | null
    }

    tenantId = caso.tenant_id
    casoTitulo = casoTitulo ?? caso.titulo
    clienteNome = clienteNome ?? caso.clients?.name ?? null

  } else if (body.processo_id) {
    // Deriva tenant via processo — quando não há caso vinculado ainda
    const { data: processo } = await service
      .from('processos')
      .select('tenant_id')
      .eq('id', body.processo_id)
      .single()

    if (!processo) {
      return NextResponse.json({ error: 'processo_id não encontrado' }, { status: 422 })
    }

    tenantId = processo.tenant_id

  } else if (body.tenant_id) {
    // Fallback: item solto sem caso ou processo — valida tenant no banco
    const { data: tenant } = await service
      .from('tenants')
      .select('id')
      .eq('id', body.tenant_id)
      .is('deleted_at', null)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 422 })
    }

    tenantId = tenant.id
  }

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Não foi possível determinar o tenant. Forneça caso_id, processo_id ou tenant_id.' },
      { status: 422 }
    )
  }

  // 3. Insere o radar_item
  const { data: inserted, error: insertError } = await service
    .from('radar_items')
    .insert({
      tenant_id: tenantId,
      caso_id: body.caso_id ?? null,
      processo_id: body.processo_id ?? null,
      tipo: body.tipo,
      urgencia: body.urgencia ?? 'Media',
      status: 'novo',
      origem: body.external_source ?? 'sistema',
      titulo: body.titulo,
      descricao: body.descricao ?? null,
      exige_acao: body.exige_acao ?? false,
      caso_titulo: casoTitulo,
      cliente_nome: clienteNome,
      referencia_externa: body.external_id ?? null,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('webhook/radar: erro ao inserir:', insertError)
    return NextResponse.json({ error: 'Erro interno ao criar item.' }, { status: 500 })
  }

  const itemId = inserted.id

  // 4. Cria notificação para o responsável do caso (se houver)
  if (body.caso_id) {
    const { data: caso } = await service
      .from('casos')
      .select('responsible_id')
      .eq('id', body.caso_id)
      .single()

    if (caso?.responsible_id) {
      await service.from('notifications').insert({
        tenant_id: tenantId,
        user_id: caso.responsible_id,
        tipo: 'radar_novo_item',
        titulo: body.urgencia === 'Alta'
          ? `⚠️ Novo alerta urgente: ${body.titulo}`
          : `Novo item no Radar: ${body.titulo}`,
        body: casoTitulo ? `Caso: ${casoTitulo}` : null,
        entity_type: 'radar_item',
        entity_id: itemId,
        read: false,
      })
    }
  }

  // 5. Dispara geração de Resumo Inteligente de forma assíncrona (não bloqueia response)
  // Usamos waitUntil se disponível, senão fire-and-forget com catch
  void summarizeRadarItemInternal(itemId).catch((err) => {
    console.error('webhook/radar: erro ao gerar resumo IA:', err)
  })

  return NextResponse.json({ ok: true, id: itemId }, { status: 201 })
}
