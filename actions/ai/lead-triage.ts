'use server'

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import type { LeadTriage } from '@/types/lead'

// ── triageLead ────────────────────────────────────────────────────────────────
// Gera triagem inteligente para um lead usando Claude via Vercel AI SDK.
// Salva o resultado em leads.ai_triage (JSONB) e retorna o objeto tipado.
//
// Configuração necessária: chave do provedor de IA nas variáveis de ambiente do servidor.

export async function triageLead(
  leadId: string
): Promise<{ triage: LeadTriage } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, name, email, phone, subject, area, origin, urgency, created_at')
    .eq('id', leadId)
    .is('deleted_at', null)
    .single()

  if (leadError || !lead) return { error: 'Lead não encontrado.' }

  const context = [
    `Nome: ${lead.name}`,
    lead.email   ? `E-mail: ${lead.email}`   : null,
    lead.phone   ? `Telefone: ${lead.phone}` : null,
    lead.subject ? `Demanda relatada: ${lead.subject}` : null,
    lead.area    ? `Área já identificada: ${lead.area}` : null,
    `Origem: ${lead.origin}`,
    `Urgência declarada: ${lead.urgency}`,
  ].filter(Boolean).join('\n')

  const prompt = `Você é um assistente jurídico especializado em triagem de leads para escritórios de advocacia brasileiros.

Analise os dados do lead abaixo e retorne um JSON com a triagem. Responda APENAS com o JSON, sem markdown, sem texto adicional.

DADOS DO LEAD:
${context}

FORMATO ESPERADO (JSON puro):
{
  "legalArea": "área jurídica principal (ex: Trabalhista, Cível, Família, Criminal, Empresarial, Tributário, Previdenciário, Consumidor, Imobiliário, Ambiental)",
  "demandSummary": "resumo claro da demanda em 2-3 frases",
  "urgency": "Alta | Média | Baixa",
  "routingSuggestion": "sugestão de encaminhamento interno (ex: advogado trabalhista sênior, consulta inicial, triagem complementar)",
  "intakeCards": [
    { "id": "1", "title": "título do ponto importante", "content": "detalhe relevante para o advogado" }
  ]
}

Gere no máximo 3 intakeCards com os pontos mais relevantes para o advogado que vai atender este lead.`

  try {
    const { text } = await generateText({
      model:           anthropic('claude-sonnet-4.6'),
      prompt,
      maxOutputTokens: 1024,
    })

    let parsed: unknown
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      console.error('triageLead: JSON inválido:', text)
      return { error: 'A IA retornou uma resposta em formato inválido. Tente novamente.' }
    }

    if (!isValidTriage(parsed)) {
      console.error('triageLead: estrutura inválida:', parsed)
      return { error: 'A IA retornou uma estrutura de triagem incompleta. Tente novamente.' }
    }

    const triage = parsed as LeadTriage

    const { error: updateError } = await supabase
      .from('leads')
      .update({ ai_triage: triage as unknown as Record<string, unknown> })
      .eq('id', leadId)
      .is('deleted_at', null)

    if (updateError) {
      console.error('triageLead: erro ao salvar:', updateError)
      return { error: 'Triagem gerada, mas falha ao salvar. Tente novamente.' }
    }

    return { triage }

  } catch (err) {
    console.error('triageLead: erro na API do Claude:', err)
    // Provider lança erro descritivo quando a chave não está configurada
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('API key') || message.includes('authentication')) {
      return { error: 'Integração com IA não configurada. Verifique as variáveis de ambiente.' }
    }
    return { error: 'Erro ao conectar com a IA. Tente novamente em instantes.' }
  }
}

// ── Validação de estrutura ────────────────────────────────────────────────────

function isValidTriage(value: unknown): value is LeadTriage {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  return (
    typeof t.legalArea         === 'string' &&
    typeof t.demandSummary     === 'string' &&
    typeof t.urgency           === 'string' &&
    ['Alta', 'Média', 'Baixa'].includes(t.urgency as string) &&
    typeof t.routingSuggestion === 'string' &&
    Array.isArray(t.intakeCards)
  )
}
