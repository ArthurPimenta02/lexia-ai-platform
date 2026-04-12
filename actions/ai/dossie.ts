'use server'

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getCaso } from '@/actions/casos'
import { revalidatePath } from 'next/cache'
import type { DossieInteligente } from '@/types/caso'

// ── generateDossie ────────────────────────────────────────────────────────────
// Gera dossiê inteligente para um caso usando Claude.
// Salva o resultado em casos.dossie_ia (JSONB) e retorna o objeto tipado.

export async function generateDossie(
  casoId: string
): Promise<{ dossie: DossieInteligente } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  // 1. Carrega contexto completo do caso
  const caso = await getCaso(casoId)
  if (!caso) return { error: 'Caso não encontrado.' }

  // 2. Monta contexto para o prompt
  const pendenciasAbertas = caso.pendencias.filter((p) => !p.resolvida)
  const timelineRecente = caso.timeline.slice(0, 10)

  const contexto = [
    `Título: ${caso.titulo}`,
    `Área: ${caso.area}`,
    `Status: ${caso.status}`,
    caso.descricao ? `Descrição: ${caso.descricao}` : null,
    caso.proximaAcao ? `Próxima ação registrada: ${caso.proximaAcao}` : null,
    caso.proximaAcaoData ? `Prazo da próxima ação: ${new Date(caso.proximaAcaoData).toLocaleDateString('pt-BR')}` : null,
    '',
    `Cliente: ${caso.clienteNome}`,
    caso.responsavelNome ? `Responsável: ${caso.responsavelNome}` : null,
    '',
    caso.processos.length > 0 ? [
      'PROCESSOS VINCULADOS:',
      ...caso.processos.map((p) =>
        `  - ${p.numero} (${p.tribunal}${p.vara ? ` / ${p.vara}` : ''})` +
        (p.ultimaMovimentacao ? ` — última mov: ${new Date(p.ultimaMovimentacao).toLocaleDateString('pt-BR')}` : '') +
        (p.resumoUltimaMovimentacao ? ` — ${p.resumoUltimaMovimentacao}` : '')
      ),
    ].join('\n') : 'Nenhum processo vinculado',
    '',
    pendenciasAbertas.length > 0 ? [
      'PENDÊNCIAS ABERTAS:',
      ...pendenciasAbertas.map((p) =>
        `  - [${p.urgencia}] ${p.descricao}` +
        (p.prazo ? ` (prazo: ${new Date(p.prazo).toLocaleDateString('pt-BR')})` : '') +
        (p.responsavel ? ` — ${p.responsavel}` : '')
      ),
    ].join('\n') : 'Nenhuma pendência aberta',
    '',
    timelineRecente.length > 0 ? [
      'HISTÓRICO RECENTE (linha do tempo):',
      ...timelineRecente.map((e) =>
        `  - [${new Date(e.data).toLocaleDateString('pt-BR')}] ${e.titulo}: ${e.descricao ?? ''}`
      ),
    ].join('\n') : null,
  ].filter(Boolean).join('\n')

  const prompt = `Você é um assistente jurídico especializado em análise de casos para escritórios de advocacia brasileiros.

Analise os dados do caso abaixo e gere um dossiê inteligente. Responda APENAS com o JSON, sem markdown, sem texto adicional.

DADOS DO CASO:
${contexto}

FORMATO ESPERADO (JSON puro):
{
  "resumo": "Resumo claro e objetivo do caso em 2-3 frases, cobrindo a natureza da demanda, o estágio atual e o contexto geral",
  "pontosCriticos": ["Ponto crítico 1", "Ponto crítico 2"],
  "pendenciasIdentificadas": ["Pendência identificada pela análise da IA 1", "Pendência identificada 2"],
  "proximosMarcosEsperados": ["Marco esperado 1", "Marco esperado 2"],
  "ultimaMovimentacaoRelevante": "Descrição da última movimentação mais relevante para o advogado saber",
  "proximoPasso": "Sugestão direta e acionável do próximo passo mais importante a ser tomado no caso",
  "contextoRetomada": "Contexto conciso (2-3 frases) para o advogado retomar o caso rapidamente após um período sem atividade",
  "geradoEm": "${new Date().toISOString()}"
}

Regras:
- pontosCriticos: máximo 4 itens, apenas riscos ou questões realmente críticas
- pendenciasIdentificadas: máximo 4 itens, foque no que ainda não está na lista de pendências
- proximosMarcosEsperados: máximo 3 marcos processuais ou operacionais esperados
- Seja específico e útil para um advogado — evite generalidades
- Use linguagem jurídica brasileira`

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4.6'),
      prompt,
      maxOutputTokens: 1500,
    })

    let parsed: unknown
    try {
      parsed = JSON.parse(text.trim())
    } catch {
      console.error('generateDossie: JSON inválido:', text)
      return { error: 'A IA retornou uma resposta em formato inválido. Tente novamente.' }
    }

    if (!isValidDossie(parsed)) {
      console.error('generateDossie: estrutura inválida:', parsed)
      return { error: 'A IA retornou uma estrutura incompleta. Tente novamente.' }
    }

    const dossie = parsed as DossieInteligente
    dossie.geradoEm = new Date().toISOString()

    // 5. Salva no banco
    const { error: updateError } = await supabase
      .from('casos')
      .update({
        dossie_ia: dossie as unknown as Record<string, unknown>,
        dossie_gerado_em: dossie.geradoEm,
      })
      .eq('id', casoId)

    if (updateError) {
      console.error('generateDossie: erro ao salvar:', updateError)
      return { error: 'Dossiê gerado, mas falha ao salvar. Tente novamente.' }
    }

    revalidatePath(`/casos/${casoId}`)
    return { dossie }

  } catch (err) {
    console.error('generateDossie: erro na API do Claude:', err)
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('API key') || message.includes('authentication')) {
      return { error: 'Integração com IA não configurada. Verifique as variáveis de ambiente.' }
    }
    return { error: 'Erro ao conectar com a IA. Tente novamente em instantes.' }
  }
}

// ── Validação de estrutura ────────────────────────────────────────────────────

function isValidDossie(value: unknown): value is DossieInteligente {
  if (!value || typeof value !== 'object') return false
  const d = value as Record<string, unknown>
  return (
    typeof d.resumo                     === 'string' &&
    Array.isArray(d.pontosCriticos)     &&
    Array.isArray(d.pendenciasIdentificadas) &&
    Array.isArray(d.proximosMarcosEsperados) &&
    typeof d.ultimaMovimentacaoRelevante === 'string' &&
    typeof d.proximoPasso               === 'string' &&
    typeof d.contextoRetomada           === 'string'
  )
}
