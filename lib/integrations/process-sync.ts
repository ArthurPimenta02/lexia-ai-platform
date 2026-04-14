import { createServiceClient } from '@/lib/supabase/server'
import {
  buildProcessUpdateDedupeKey,
  inferRadarPayloadFromUpdate,
  normalizeDateOnly,
  type NormalizedDiscoveredProcess,
  type NormalizedProcessParty,
  type NormalizedProcessUpdate,
} from '@/lib/integrations/n8n'
import type { ProcessoRow, SyncSource } from '@/types/database'

export interface DiscoveryPayload {
  lawyer_oab_id: string
  external_source?: SyncSource
  processes: NormalizedDiscoveredProcess[]
  auto_create_case?: boolean
}

export interface ProcessUpdatePayload {
  processo_id?: string
  external_id?: string | null
  cnj_number?: string | null
  external_source?: SyncSource
  processo?: Partial<NormalizedDiscoveredProcess> | null
  payload_raw?: Record<string, unknown> | null
  updates: NormalizedProcessUpdate[]
}

interface LinkedCaseContext {
  casoId: string | null
  casoTitulo: string | null
  clienteNome: string | null
  responsibleId: string | null
}

function isNonEmpty(value: string | null | undefined): value is string {
  return Boolean(value && value.trim())
}

function normalizeProcessUpsert(input: NormalizedDiscoveredProcess, externalSource: SyncSource, lawyerOabId: string) {
  return {
    cnj_number: input.cnj_number.trim(),
    tribunal: input.tribunal.trim(),
    vara: input.vara?.trim() || null,
    comarca: input.comarca?.trim() || null,
    uf: input.uf?.trim() || null,
    classe: input.classe?.trim() || null,
    assunto: input.assunto?.trim() || null,
    status: input.status ?? 'Em andamento',
    valor_causa: input.valor_causa ?? null,
    data_distribuicao: normalizeDateOnly(input.data_distribuicao),
    data_ultima_mov: normalizeDateOnly(input.data_ultima_mov),
    external_id: input.external_id?.trim() || null,
    external_source: externalSource,
    sync_status: 'synced' as const,
    sync_error: null,
    last_synced_at: new Date().toISOString(),
    payload_raw: input.payload_raw ?? null,
    discovered_via_oab_id: lawyerOabId,
  }
}

async function replaceProcessParties(
  processoId: string,
  parties: NormalizedProcessParty[] | undefined,
  snapshotComplete = false
) {
  if (!parties) return

  const service = createServiceClient()

  const rows = parties
    .filter((party) => party.nome.trim())
    .map((party) => ({
      processo_id: processoId,
      party_type: party.party_type,
      nome: party.nome.trim(),
      cpf: party.cpf?.trim() || null,
      cnpj: party.cnpj?.trim() || null,
      oab: party.oab?.trim() || null,
      external_id: party.external_id?.trim() || null,
    }))

  if (rows.length === 0) return

  if (snapshotComplete) {
    await service.from('process_parties').delete().eq('processo_id', processoId)

    const { error } = await service.from('process_parties').insert(rows)
    if (error) {
      throw new Error(`Erro ao sincronizar partes do processo: ${error.message}`)
    }
    return
  }

  const { data: existingRows, error: existingError } = await service
    .from('process_parties')
    .select('id, party_type, nome, cpf, cnpj, oab, external_id')
    .eq('processo_id', processoId)

  if (existingError) {
    throw new Error(`Erro ao consultar partes existentes: ${existingError.message}`)
  }

  const existingKeys = new Set(
    ((existingRows ?? []) as Array<{
      party_type: string
      nome: string
      cpf: string | null
      cnpj: string | null
      oab: string | null
      external_id: string | null
    }>).map((row) =>
      [
        row.party_type,
        row.nome.trim().toLowerCase(),
        row.external_id ?? '',
        row.oab ?? '',
        row.cpf ?? '',
        row.cnpj ?? '',
      ].join('|')
    )
  )

  const rowsToInsert = rows.filter((row) => {
    const key = [
      row.party_type,
      row.nome.trim().toLowerCase(),
      row.external_id ?? '',
      row.oab ?? '',
      row.cpf ?? '',
      row.cnpj ?? '',
    ].join('|')

    return !existingKeys.has(key)
  })

  if (rowsToInsert.length === 0) return

  const { error } = await service.from('process_parties').insert(rowsToInsert)
  if (error && error.code !== '23505') {
    throw new Error(`Erro ao sincronizar partes do processo: ${error.message}`)
  }
}

async function findExistingProcess(params: {
  tenantId: string
  externalSource: SyncSource
  externalId?: string | null
  cnjNumber: string
}) {
  const service = createServiceClient()

  if (isNonEmpty(params.externalId)) {
    const { data } = await service
      .from('processos')
      .select('id')
      .eq('tenant_id', params.tenantId)
      .eq('external_source', params.externalSource)
      .eq('external_id', params.externalId.trim())
      .maybeSingle()

    if (data?.id) return data.id as string
  }

  const { data } = await service
    .from('processos')
    .select('id')
    .eq('tenant_id', params.tenantId)
    .eq('cnj_number', params.cnjNumber.trim())
    .maybeSingle()

  return (data?.id as string | undefined) ?? null
}

async function resolveLinkedCaseContext(processoId: string): Promise<LinkedCaseContext> {
  const service = createServiceClient()
  const { data, error } = await service
    .from('case_process_links')
    .select(`
      caso_id,
      is_primary,
      casos (
        id,
        titulo,
        responsible_id,
        clients ( name )
      )
    `)
    .eq('processo_id', processoId)

  if (error || !data || data.length === 0) {
    return { casoId: null, casoTitulo: null, clienteNome: null, responsibleId: null }
  }

  const rows = data as unknown as Array<{
    caso_id: string
    is_primary: boolean
    casos: {
      id: string
      titulo: string
      responsible_id: string | null
      clients: { name: string } | null
    } | null
  }>

  const chosen = rows.find((row) => row.is_primary && row.casos) ?? rows.find((row) => row.casos) ?? null
  if (!chosen?.casos) {
    return { casoId: null, casoTitulo: null, clienteNome: null, responsibleId: null }
  }

  return {
    casoId: chosen.casos.id,
    casoTitulo: chosen.casos.titulo,
    clienteNome: chosen.casos.clients?.name ?? null,
    responsibleId: chosen.casos.responsible_id ?? null,
  }
}

async function resolveProcessForUpdate(payload: ProcessUpdatePayload): Promise<ProcessoRow> {
  const service = createServiceClient()

  if (payload.processo_id) {
    const { data, error } = await service
      .from('processos')
      .select('*')
      .eq('id', payload.processo_id)
      .single()

    if (error || !data) {
      throw new Error('Processo interno nao encontrado para sincronizacao.')
    }

    return data as unknown as ProcessoRow
  }

  if (isNonEmpty(payload.external_id)) {
    const { data, error } = await service
      .from('processos')
      .select('*')
      .eq('external_source', payload.external_source ?? 'escavador')
      .eq('external_id', payload.external_id.trim())

    if (error) {
      throw new Error(`Erro ao localizar processo por external_id: ${error.message}`)
    }

    const rows = (data ?? []) as unknown as ProcessoRow[]
    if (rows.length === 1) return rows[0]
    if (rows.length === 0) throw new Error('Nenhum processo encontrado para o external_id informado.')
    throw new Error('external_id ambiguo entre tenants. Envie processo_id interno.')
  }

  if (isNonEmpty(payload.cnj_number)) {
    const { data, error } = await service
      .from('processos')
      .select('*')
      .eq('cnj_number', payload.cnj_number.trim())

    if (error) {
      throw new Error(`Erro ao localizar processo por CNJ: ${error.message}`)
    }

    const rows = (data ?? []) as unknown as ProcessoRow[]
    if (rows.length === 1) return rows[0]
    if (rows.length === 0) throw new Error('Nenhum processo encontrado para o CNJ informado.')
    throw new Error('CNJ ambiguo entre tenants. Envie processo_id interno.')
  }

  throw new Error('Payload de update precisa identificar o processo por processo_id, external_id ou cnj_number.')
}

export async function ingestProcessDiscovery(payload: DiscoveryPayload) {
  const service = createServiceClient()
  const externalSource = payload.external_source ?? 'escavador'

  const { data: lawyerOab, error: oabError } = await service
    .from('lawyer_oabs')
    .select('id, tenant_id')
    .eq('id', payload.lawyer_oab_id)
    .single()

  if (oabError || !lawyerOab) {
    throw new Error('lawyer_oab_id invalido para process-discovery.')
  }

  let created = 0
  let updated = 0
  let partiesReplaced = 0

  for (const process of payload.processes) {
    const existingId = await findExistingProcess({
      tenantId: lawyerOab.tenant_id as string,
      externalSource,
      externalId: process.external_id ?? null,
      cnjNumber: process.cnj_number,
    })

    const row = normalizeProcessUpsert(process, externalSource, payload.lawyer_oab_id)

    let processoId = existingId
    if (existingId) {
      const { error } = await service
        .from('processos')
        .update(row)
        .eq('tenant_id', lawyerOab.tenant_id as string)
        .eq('id', existingId)

      if (error) {
        throw new Error(`Erro ao atualizar processo descoberto: ${error.message}`)
      }

      updated += 1
    } else {
      const { data: inserted, error } = await service
        .from('processos')
        .insert({
          tenant_id: lawyerOab.tenant_id as string,
          ...row,
        })
        .select('id')
        .single()

      if (error && error.code !== '23505') {
        throw new Error(`Erro ao inserir processo descoberto: ${error.message}`)
      }

      if (!inserted && error?.code === '23505') {
        processoId = await findExistingProcess({
          tenantId: lawyerOab.tenant_id as string,
          externalSource,
          externalId: process.external_id ?? null,
          cnjNumber: process.cnj_number,
        })
      } else {
        processoId = inserted?.id as string
      }

      if (!processoId) {
        throw new Error('Falha ao resolver processo apos tentativa de upsert.')
      }

      created += 1
    }

    if (processoId) {
      await replaceProcessParties(
        processoId,
        process.parties,
        Boolean(process.parties_snapshot_complete)
      )
      partiesReplaced += process.parties?.length ?? 0
    }
  }

  await service
    .from('lawyer_oabs')
    .update({
      discovery_done: true,
      discovery_at: new Date().toISOString(),
      discovery_count: payload.processes.length,
    })
    .eq('id', payload.lawyer_oab_id)

  return {
    ok: true,
    tenantId: lawyerOab.tenant_id as string,
    created,
    updated,
    partiesReplaced,
    autoCreateCaseApplied: false,
    autoCreateCaseSkipped: Boolean(payload.auto_create_case),
  }
}

export async function ingestProcessUpdate(payload: ProcessUpdatePayload) {
  const service = createServiceClient()
  const processo = await resolveProcessForUpdate(payload)
  const now = new Date().toISOString()
  const externalSource = payload.external_source ?? processo.external_source

  const latestUpdateDate = payload.updates
    .map((update) => normalizeDateOnly(update.data_movimentacao))
    .filter(Boolean)
    .sort()
    .at(-1) ?? processo.data_ultima_mov

  const processPatch = {
    tribunal: payload.processo?.tribunal?.trim() || processo.tribunal,
    vara: payload.processo?.vara?.trim() || processo.vara,
    comarca: payload.processo?.comarca?.trim() || processo.comarca,
    uf: payload.processo?.uf?.trim() || processo.uf,
    classe: payload.processo?.classe?.trim() || processo.classe,
    assunto: payload.processo?.assunto?.trim() || processo.assunto,
    status: payload.processo?.status ?? processo.status,
    valor_causa: payload.processo?.valor_causa ?? processo.valor_causa,
    data_distribuicao: normalizeDateOnly(payload.processo?.data_distribuicao) ?? processo.data_distribuicao,
    data_ultima_mov: latestUpdateDate,
    payload_raw: payload.payload_raw ?? payload.processo?.payload_raw ?? processo.payload_raw,
    sync_status: 'synced' as const,
    sync_error: null,
    last_synced_at: now,
  }

  const { error: processError } = await service
    .from('processos')
    .update(processPatch)
    .eq('tenant_id', processo.tenant_id)
    .eq('id', processo.id)

  if (processError) {
    throw new Error(`Erro ao atualizar metadata do processo: ${processError.message}`)
  }

  const updateRows = payload.updates.reduce<Array<{
    tenant_id: string
    processo_id: string
    tipo: NormalizedProcessUpdate['tipo']
    titulo: string
    descricao: string | null
    data_movimentacao: string
    external_id: string | null
    external_source: SyncSource
    payload_raw: Record<string, unknown> | null
    dedupe_key: string
  }>>((rows, update) => {
    const movementDate = normalizeDateOnly(update.data_movimentacao)
    if (!movementDate) return rows

    rows.push({
      tenant_id: processo.tenant_id,
      processo_id: processo.id,
      tipo: update.tipo,
      titulo: update.titulo.trim(),
      descricao: update.descricao?.trim() || null,
      data_movimentacao: movementDate,
      external_id: update.external_id?.trim() || null,
      external_source: externalSource,
      payload_raw: update.payload_raw ?? null,
      dedupe_key: buildProcessUpdateDedupeKey({
        processoId: processo.id,
        externalId: update.external_id ?? null,
        tipo: update.tipo,
        titulo: update.titulo,
        descricao: update.descricao ?? null,
        dataMovimentacao: update.data_movimentacao,
        externalSource,
      }),
    })

    return rows
  }, [])

  const dedupeKeys = updateRows.map((row) => row.dedupe_key)

  const { data: existingUpdates, error: existingError } = dedupeKeys.length === 0
    ? { data: [], error: null }
    : await service
        .from('process_updates')
        .select('id, dedupe_key')
        .eq('tenant_id', processo.tenant_id)
        .in('dedupe_key', dedupeKeys)

  if (existingError) {
    throw new Error(`Erro ao consultar updates existentes: ${existingError.message}`)
  }

  const existingKeys = new Set(
    ((existingUpdates ?? []) as Array<{ dedupe_key: string }>).map((row) => row.dedupe_key)
  )

  const freshUpdates = updateRows.filter((row) => !existingKeys.has(row.dedupe_key))
  let insertedUpdates: Array<{
    id: string
    tipo: NormalizedProcessUpdate['tipo']
    titulo: string
    descricao: string | null
    external_id: string | null
  }> = []

  if (freshUpdates.length > 0) {
    const { data, error } = await service
      .from('process_updates')
      .insert(freshUpdates)
      .select('id, tipo, titulo, descricao, external_id')

    if (error && error.code !== '23505') {
      throw new Error(`Erro ao inserir process_updates: ${error.message}`)
    }

    if (error?.code === '23505') {
      insertedUpdates = []
    } else {
      insertedUpdates = (data ?? []) as Array<{
        id: string
        tipo: NormalizedProcessUpdate['tipo']
        titulo: string
        descricao: string | null
        external_id: string | null
      }>
    }
  }

  const linkedCase = await resolveLinkedCaseContext(processo.id)
  let radarCreated = 0
  let timelineCreated = 0
  let notificationsCreated = 0

  for (const inserted of insertedUpdates) {
    const radar = inferRadarPayloadFromUpdate({
      tipo: inserted.tipo,
      titulo: inserted.titulo,
      descricao: inserted.descricao,
      externalSource,
    })

    const { error: radarError } = await service
      .from('radar_items')
      .insert({
        tenant_id: processo.tenant_id,
        caso_id: linkedCase.casoId,
        processo_id: processo.id,
        process_update_id: inserted.id,
        source_update_id: inserted.id,
        tipo: radar.tipo,
        urgencia: radar.urgencia,
        status: 'novo',
        origem: radar.origem,
        titulo: inserted.titulo,
        descricao: inserted.descricao,
        exige_acao: radar.exigeAcao,
        caso_titulo: linkedCase.casoTitulo,
        cliente_nome: linkedCase.clienteNome,
        referencia_externa: inserted.external_id,
      })

    if (!radarError || radarError.code === '23505') {
      radarCreated += 1
    }

    if (linkedCase.casoId) {
      const { error: timelineError } = await service
        .from('caso_timeline')
        .insert({
          tenant_id: processo.tenant_id,
          caso_id: linkedCase.casoId,
          processo_id: processo.id,
          cnj_number: processo.cnj_number,
          tipo: 'movimentacao_processual',
          titulo: inserted.titulo,
          descricao: inserted.descricao,
          autor_nome: 'Escavador / n8n',
          is_automated: true,
          urgencia: radar.urgencia,
          metadata: {
            source_update_id: inserted.id,
            source: externalSource,
          },
        })

      if (!timelineError) {
        timelineCreated += 1
      }

      if (linkedCase.responsibleId) {
        const { error: notificationError } = await service
          .from('notifications')
          .insert({
            tenant_id: processo.tenant_id,
            user_id: linkedCase.responsibleId,
            tipo: 'caso_atualizacao',
            titulo: `Nova movimentacao em ${linkedCase.casoTitulo ?? processo.cnj_number}`,
            body: inserted.titulo,
            entity_type: 'caso',
            entity_id: linkedCase.casoId,
            read: false,
          })

        if (!notificationError) {
          notificationsCreated += 1
        }
      }
    }
  }

  if (insertedUpdates.length > 0) {
    const { error: markProcessedError } = await service
      .from('process_updates')
      .update({
        processed: true,
        processed_at: now,
        sync_error: null,
      })
      .eq('tenant_id', processo.tenant_id)
      .in('id', insertedUpdates.map((update) => update.id))

    if (markProcessedError) {
      throw new Error(`Erro ao marcar updates como processados: ${markProcessedError.message}`)
    }
  }

  return {
    ok: true,
    tenantId: processo.tenant_id,
    processoId: processo.id,
    insertedUpdates: insertedUpdates.length,
    ignoredUpdates: updateRows.length - insertedUpdates.length,
    radarCreated,
    timelineCreated,
    notificationsCreated,
  }
}
