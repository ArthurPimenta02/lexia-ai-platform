'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Lead, LeadActivity, LeadFormData, LeadStatus, LeadTriage } from '@/types/lead'
import type { LeadRow, LeadStageRow, UserRow } from '@/types/database'

// ── Filtros de listagem ───────────────────────────────────────────────────────

export interface LeadFilters {
  search?: string
  stageId?: string
}

// ── getLeads ──────────────────────────────────────────────────────────────────
// Lista leads do tenant com estágio e responsável. RLS garante isolamento.

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  let query = supabase
    .from('leads')
    .select(`
      id, name, email, phone, cpf, subject, area, origin, urgency,
      stage_id, responsible_id, ai_triage, created_at, updated_at,
      lead_stages ( id, name, color, position, is_default, is_terminal ),
      users:responsible_id ( id, name )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.stageId) {
    query = query.eq('stage_id', filters.stageId)
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw new Error(`Erro ao buscar leads: ${error.message}`)

  return (data ?? []).map(rowToLead)
}

// ── getLead ───────────────────────────────────────────────────────────────────
// Retorna um lead individual com estágio e responsável. Null se não encontrado.

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('leads')
    .select(`
      id, name, email, phone, cpf, subject, area, origin, urgency,
      stage_id, responsible_id, ai_triage, created_at, updated_at,
      lead_stages ( id, name, color, position, is_default, is_terminal ),
      users:responsible_id ( id, name )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`Erro ao buscar lead: ${error.message}`)
  }

  return data ? rowToLead(data) : null
}

// ── getLeadActivities ─────────────────────────────────────────────────────────
// Retorna mensagens do lead como atividades. Cria atividade sintética de criação.

export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, created_at')
    .eq('id', leadId)
    .is('deleted_at', null)
    .single()

  const { data: messages } = await supabase
    .from('lead_messages')
    .select('id, content, sender_type, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  const activities: LeadActivity[] = []

  // Evento sintético de criação
  if (lead) {
    activities.push({
      id: `created-${lead.id}`,
      type: 'lead_created',
      description: `Lead ${lead.name} criado no sistema.`,
      timestamp: lead.created_at,
    })
  }

  // Mensagens do lead como atividades
  for (const msg of messages ?? []) {
    activities.push({
      id: msg.id,
      type: 'message',
      description: msg.content,
      timestamp: msg.created_at,
    })
  }

  return activities
}

// ── createLead ────────────────────────────────────────────────────────────────

export async function createLead(data: LeadFormData): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id não encontrado na sessão' }

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert({
      tenant_id:      tenantId,
      name:           data.name.trim(),
      email:          data.email.trim() || null,
      phone:          data.phone.trim() || null,
      cpf:            data.cpf.trim() || null,
      subject:        data.subject.trim() || null,
      stage_id:       data.stageId,
      origin:         data.origin,
      urgency:        data.urgency,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    console.error('createLead:', error)
    return { error: 'Erro ao criar lead. Tente novamente.' }
  }

  revalidatePath('/leads')
  revalidatePath('/kanban')
  return { id: inserted.id }
}

// ── updateLead ────────────────────────────────────────────────────────────────

export async function updateLead(
  id: string,
  data: Partial<LeadFormData>
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const patch: Record<string, unknown> = {}
  if (data.name    !== undefined) patch.name       = data.name.trim()
  if (data.email   !== undefined) patch.email      = data.email.trim() || null
  if (data.phone   !== undefined) patch.phone      = data.phone.trim() || null
  if (data.cpf     !== undefined) patch.cpf        = data.cpf.trim() || null
  if (data.subject !== undefined) patch.subject    = data.subject.trim() || null
  if (data.stageId !== undefined) patch.stage_id   = data.stageId
  if (data.origin  !== undefined) patch.origin     = data.origin
  if (data.urgency !== undefined) patch.urgency    = data.urgency

  const { error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('updateLead:', error)
    return { error: 'Erro ao atualizar lead. Tente novamente.' }
  }

  revalidatePath('/leads')
  revalidatePath('/kanban')
  revalidatePath(`/leads/${id}`)
  return { success: true }
}

// ── deleteLead ────────────────────────────────────────────────────────────────
// Soft delete: preenche deleted_at. RLS filtra automaticamente.

export async function deleteLead(id: string): Promise<{ success: true } | { error: string }> {
  // Autentica com o client do usuário para obter tenant_id da sessão
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const tenantId = user.user_metadata?.tenant_id as string | undefined
  if (!tenantId) return { error: 'tenant_id não encontrado na sessão' }

  // Usa service_role para contornar o bug de RLS no soft delete.
  // Segurança garantida manualmente: filtramos por tenant_id + deleted_at IS NULL,
  // garantindo que o usuário só pode excluir registros do próprio tenant.
  const admin = createServiceClient()
  const { error, count } = await admin
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .select()

  if (error) {
    console.error('[deleteLead] error:', JSON.stringify(error))
    return { error: `Erro ao excluir lead: ${error.message}` }
  }

  if (!count || count === 0) {
    return { error: 'Lead não encontrado ou já excluído.' }
  }

  revalidatePath('/leads')
  revalidatePath('/kanban')
  return { success: true }
}

// ── moveLeadStage ─────────────────────────────────────────────────────────────
// Atualiza stage_id — chamado pelo drag-and-drop do Kanban.

export async function moveLeadStage(
  id: string,
  stageId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('leads')
    .update({ stage_id: stageId })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    console.error('moveLeadStage:', error)
    return { error: 'Erro ao mover lead.' }
  }

  revalidatePath('/leads')
  revalidatePath('/kanban')
  return { success: true }
}

// ── rowToLead ─────────────────────────────────────────────────────────────────
// Converte o resultado do join banco → tipo Lead da UI.
// O Supabase retorna joins como objetos aninhados ou null.

type LeadWithJoins = LeadRow & {
  lead_stages: Pick<LeadStageRow, 'id' | 'name' | 'color' | 'position' | 'is_default' | 'is_terminal'> | null
  users: Pick<UserRow, 'id' | 'name'> | null
}

function rowToLead(row: LeadWithJoins): Lead {
  const stage = row.lead_stages

  // Triagem: parse do JSONB — valida estrutura mínima antes de aceitar
  let aiTriage: LeadTriage | null = null
  if (row.ai_triage && typeof row.ai_triage === 'object') {
    const t = row.ai_triage as Record<string, unknown>
    if (
      typeof t.legalArea       === 'string' &&
      typeof t.demandSummary   === 'string' &&
      typeof t.urgency         === 'string' &&
      typeof t.routingSuggestion === 'string' &&
      Array.isArray(t.intakeCards)
    ) {
      aiTriage = t as unknown as LeadTriage
    }
  }

  return {
    id:              row.id,
    name:            row.name,
    email:           row.email,
    phone:           row.phone,
    cpf:             row.cpf,
    subject:         row.subject,
    area:            row.area,
    origin:          row.origin,
    urgency:         row.urgency,
    stageId:         row.stage_id,
    stageName:       (stage?.name ?? 'Novo') as LeadStatus,
    stageColor:      stage?.color ?? '#6B7280',
    responsibleId:   row.responsible_id,
    responsibleName: row.users?.name ?? null,
    createdAt:       row.created_at,
    updatedAt:       row.updated_at,
    aiTriage,
  }
}
