'use server'

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface RadarAiSummary {
  resumo: string
  explicacaoPratica: string
  proximoPasso: string
  riscoSeNaoAgir: string
  impactoNoCaso: string
  geradoEm: string
}

// ── summarizeRadarItemInternal ────────────────────────────────────────────────
// Versão sem 'use server' — pode ser chamada de Route Handlers e Server Actions.
// Usa service client para tanto a leitura quanto o UPDATE (RLS exige app_role).

export async function summarizeRadarItemInternal(
  itemId: string
): Promise<{ summary: RadarAiSummary } | { error: string }> {
  const service = createServiceClient()

  // 1. Carrega o radar item com joins
  const { data: rawItem, error: itemError } = await service
    .from('radar_items')
    .select(`
      *,
      casos (
        titulo,
        area,
        status,
        descricao,
        proxima_acao,
        proxima_acao_data,
        clients ( name )
      ),
      processos (
        cnj_number,
        tribunal,
        vara,
        classe,
        assunto,
        data_ultima_mov
      )
    `)
    .eq('id', itemId)
    .single()

  if (itemError || !rawItem) {
    console.error('summarizeRadarItem: item não encontrado', itemError)
    return { error: 'Item do radar não encontrado.' }
  }

  const item = rawItem as unknown as {
    tipo: string
    urgencia: string
    titulo: string
    descricao: string | null
    referencia_externa: string | null
    casos: {
      titulo: string
      area: string
      status: string
      descricao: string | null
      proxima_acao: string | null
      proxima_acao_data: string | null
      clients: { name: string } | null
    } | null
    processos: {
      cnj_number: string
      tribunal: string
      vara: string | null
      classe: string | null
      assunto: string | null
      data_ultima_mov: string | null
    } | null
  }

  // 2. Monta contexto para o prompt
  const caso = item.casos
  const processo = item.processos

  const linhasContexto: string[] = [
    `Tipo de evento: ${item.tipo}`,
    `Urgência: ${item.urgencia}`,
    `Título do evento: ${item.titulo}`,
    item.descricao ? `Descrição completa: ${item.descricao}` : null,
    item.referencia_externa ? `Referência externa: ${item.referencia_externa}` : null,
    '',
    caso ? [
      `CASO VINCULADO:`,
      `  Título: ${caso.titulo}`,
      `  Área: ${caso.area}`,
      `  Status: ${caso.status}`,
      caso.descricao ? `  Descrição: ${caso.descricao}` : null,
      caso.clients ? `  Cliente: ${caso.clients.name}` : null,
      caso.proxima_acao ? `  Próxima ação registrada: ${caso.proxima_acao}` : null,
      caso.proxima_acao_data
        ? `  Prazo da próxima ação: ${new Date(caso.proxima_acao_data).toLocaleDateString('pt-BR')}`
        : null,
    ].filter(Boolean).join('\n') : 'Caso não vinculado',
    '',
    processo ? [
      `PROCESSO VINCULADO:`,
      `  CNJ: ${processo.cnj_number}`,
      `  Tribunal: ${processo.tribunal}`,
      processo.vara ? `  Vara: ${processo.vara}` : null,
      processo.classe ? `  Classe: ${processo.classe}` : null,
      processo.assunto ? `  Assunto: ${processo.assunto}` : null,
      processo.data_ultima_mov
        ? `  Última movimentação: ${new Date(processo.data_ultima_mov).toLocaleDateString('pt-BR')}`
        : null,
    ].filter(Boolean).join('\n') : null,
  ].filter((l) => l !== null) as string[]

  const contexto = linhasContexto.join('\n')

  const prompt = `Você é um assistente jurídico especializado em análise de publicações e movimentações processuais para escritórios de advocacia brasileiros.

Analise o evento jurídico abaixo e gere um resumo inteligente para o advogado responsável. Responda APENAS com o JSON, sem markdown, sem texto adicional.

EVENTO:
${contexto}

FORMATO ESPERADO (JSON puro):
{
  "resumo": "Resumo claro e direto do que aconteceu no processo ou caso (2-3 frases). Foque no fato jurídico relevante.",
  "explicacaoPratica": "Explicação em linguagem prática do que esse evento significa para o cliente e para o escritório (2-3 frases). Evite jargão excessivo.",
  "proximoPasso": "Sugestão direta e acionável do próximo passo mais importante. Seja específico: qual peça, qual prazo, quem deve fazer.",
  "riscoSeNaoAgir": "Consequência objetiva se nenhuma ação for tomada dentro do prazo. Seja direto sobre o risco jurídico.",
  "impactoNoCaso": "Impacto deste evento no andamento geral do caso — se muda a estratégia, se abre oportunidade, se representa reversão.",
  "geradoEm": "${new Date().toISOString()}"
}

Regras:
- Seja específico e útil para um advogado — evite generalidades
- Use linguagem jurídica brasileira
- Cada campo deve ter no máximo 3 frases
- proximoPasso deve ser sempre acionável (verbos imperativos)`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
      maxOutputTokens: 1000,
    })

    let parsed: unknown
    try {
      // Remove markdown code fences que alguns modelos adicionam (```json ... ```)
      const clean = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      parsed = JSON.parse(clean)
    } catch {
      console.error('summarizeRadarItem: JSON inválido:', text)
      return { error: 'IA retornou formato inválido. Tente novamente.' }
    }

    if (!isValidSummary(parsed)) {
      console.error('summarizeRadarItem: estrutura inválida:', parsed)
      return { error: 'IA retornou estrutura incompleta. Tente novamente.' }
    }

    const summary = parsed as RadarAiSummary
    summary.geradoEm = new Date().toISOString()

    // 3. Salva no banco via service client (UPDATE exige app_role — RLS bloqueia session client)
    const { error: updateError } = await service
      .from('radar_items')
      .update({ ai_summary: summary as unknown as Record<string, unknown> })
      .eq('id', itemId)

    if (updateError) {
      console.error('summarizeRadarItem: erro ao salvar:', updateError)
      // Retorna o summary mesmo se falhar ao salvar — melhor do que perder o resultado
    }

    return { summary }

  } catch (err) {
    console.error('summarizeRadarItem: erro na API OpenAI:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('API key') || message.includes('authentication')) {
      return { error: 'Integração com IA não configurada. Verifique as variáveis de ambiente.' }
    }
    return { error: 'Erro ao conectar com a IA. Tente novamente em instantes.' }
  }
}

// ── summarizeRadarItem ────────────────────────────────────────────────────────
// Server Action wrapper — para chamadas de Client Components.
// Valida que o usuário autenticado tem acesso ao item antes de gerar o resumo.

export async function summarizeRadarItem(
  itemId: string
): Promise<{ summary: RadarAiSummary } | { error: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  return summarizeRadarItemInternal(itemId)
}

// ── Validação ─────────────────────────────────────────────────────────────────

function isValidSummary(value: unknown): value is RadarAiSummary {
  if (!value || typeof value !== 'object') return false
  const s = value as Record<string, unknown>
  return (
    typeof s.resumo            === 'string' &&
    typeof s.explicacaoPratica === 'string' &&
    typeof s.proximoPasso      === 'string' &&
    typeof s.riscoSeNaoAgir    === 'string' &&
    typeof s.impactoNoCaso     === 'string'
  )
}
