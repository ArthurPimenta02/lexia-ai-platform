'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { LeadStage, LeadStatus } from '@/types/lead'

// Estágios padrão do pipeline. Inseridos no seed.sql — esta lista é usada
// apenas para criar estágios caso o tenant ainda não os tenha (onboarding).
const DEFAULT_STAGES: Omit<LeadStage, 'id'>[] = [
  { name: 'Novo',        color: '#3B82F6', position: 0, isDefault: true,  isTerminal: false },
  { name: 'Qualificado', color: '#8B5CF6', position: 1, isDefault: true,  isTerminal: false },
  { name: 'Proposta',    color: '#FBBF24', position: 2, isDefault: true,  isTerminal: false },
  { name: 'Contrato',    color: '#34D399', position: 3, isDefault: true,  isTerminal: false },
  { name: 'Cliente',     color: '#10B981', position: 4, isDefault: true,  isTerminal: true  },
  { name: 'Perdido',     color: '#9CA3AF', position: 5, isDefault: true,  isTerminal: true  },
]

// ── getStages ─────────────────────────────────────────────────────────────────
// Retorna os estágios do tenant autenticado, ordenados por position.
// Se o tenant ainda não tiver estágios, cria os padrão automaticamente.

export async function getStages(): Promise<LeadStage[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('lead_stages')
    .select('id, name, color, position, is_default, is_terminal')
    .order('position', { ascending: true })

  if (error) throw new Error(`Erro ao buscar estágios: ${error.message}`)

  if (!data || data.length === 0) {
    // Tenant sem estágios — tenta criar os padrão
    const tenantId = user.user_metadata?.tenant_id as string | undefined
    if (!tenantId) return []
    try {
      return await createDefaultStages(tenantId)
    } catch (err) {
      // Se o tenant ainda não existe no banco (FK falha), retorna vazio
      // em vez de quebrar a página. Setup do banco pendente.
      console.warn('getStages: tenant não encontrado no banco ainda —', err)
      return []
    }
  }

  return data.map(rowToStage)
}

// ── createDefaultStages ───────────────────────────────────────────────────────
// Insere os 6 estágios padrão para um tenant. Usa upsert para ser idempotente.

export async function createDefaultStages(tenantId: string): Promise<LeadStage[]> {
  // Usa service client: criação de estágios padrão é operação de bootstrap
  // que precisa bypassar RLS (o usuário pode não ter app_role no JWT ainda).
  const service = createServiceClient()

  const rows = DEFAULT_STAGES.map((s) => ({
    tenant_id:   tenantId,
    name:        s.name,
    color:       s.color,
    position:    s.position,
    is_default:  s.isDefault,
    is_terminal: s.isTerminal,
  }))

  const { data, error } = await service
    .from('lead_stages')
    .upsert(rows, { onConflict: 'tenant_id,name' })
    .select('id, name, color, position, is_default, is_terminal')
    .order('position', { ascending: true })

  if (error) throw new Error(`Erro ao criar estágios padrão: ${error.message}`)

  return (data ?? []).map(rowToStage)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToStage(row: {
  id: string
  name: string
  color: string
  position: number
  is_default: boolean
  is_terminal: boolean
}): LeadStage {
  return {
    id:         row.id,
    name:       row.name as LeadStatus,
    color:      row.color,
    position:   row.position,
    isDefault:  row.is_default,
    isTerminal: row.is_terminal,
  }
}
