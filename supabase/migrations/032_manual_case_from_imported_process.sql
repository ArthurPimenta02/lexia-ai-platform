-- ============================================================
-- 032_manual_case_from_imported_process.sql
-- Criação manual e segura de caso a partir de processo importado.
--
-- Decisão:
-- - NÃO colocamos unique global em case_process_links(processo_id),
--   porque a arquitetura permite múltiplos casos por processo no futuro.
-- - Em vez disso, rastreamos apenas a "primeira criação manual"
--   em casos.origin_processo_id, com índice único parcial.
-- - A função RPC abaixo faz a criação em transação única.
-- ============================================================

alter table casos
  add column if not exists origin_processo_id uuid references processos(id) on delete set null;

create unique index if not exists casos_origin_processo_uidx
  on casos(origin_processo_id)
  where origin_processo_id is not null and deleted_at is null;

create index if not exists casos_origin_processo_idx
  on casos(tenant_id, origin_processo_id)
  where origin_processo_id is not null and deleted_at is null;

create or replace function create_case_from_imported_process(
  p_tenant_id uuid,
  p_actor_id uuid,
  p_processo_id uuid
)
returns table (
  caso_id uuid,
  created boolean,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_processo processos%rowtype;
  v_existing_case_id uuid;
  v_new_case_id uuid;
  v_title text;
begin
  select *
    into v_processo
  from processos
  where id = p_processo_id
    and tenant_id = p_tenant_id
  for update;

  if not found then
    return query select null::uuid, false, 'Processo nao encontrado para o tenant autenticado.';
    return;
  end if;

  select c.id
    into v_existing_case_id
  from case_process_links cpl
  join casos c on c.id = cpl.caso_id
  where cpl.tenant_id = p_tenant_id
    and cpl.processo_id = p_processo_id
    and c.deleted_at is null
  limit 1;

  if v_existing_case_id is not null then
    return query select v_existing_case_id, false, 'Este processo ja esta vinculado a um caso.';
    return;
  end if;

  select id
    into v_existing_case_id
  from casos
  where tenant_id = p_tenant_id
    and origin_processo_id = p_processo_id
    and deleted_at is null
  limit 1;

  if v_existing_case_id is not null then
    return query select v_existing_case_id, false, 'Este processo ja gerou um caso manual anteriormente.';
    return;
  end if;

  v_title := coalesce(nullif(v_processo.classe, ''), 'Processo judicial') || ' - ' || v_processo.cnj_number;

  insert into casos (
    tenant_id,
    client_id,
    responsible_id,
    titulo,
    area,
    status,
    descricao,
    observacoes,
    origin_processo_id
  )
  values (
    p_tenant_id,
    null,
    null,
    v_title,
    'A definir',
    'Ativo',
    coalesce(v_processo.assunto, v_processo.classe, 'Caso criado manualmente a partir de processo importado.'),
    'Caso criado manualmente a partir do processo importado ' || v_processo.cnj_number || '. Cliente nao definido e area juridica pendente de classificacao pela operacao.',
    p_processo_id
  )
  returning id into v_new_case_id;

  insert into case_process_links (
    tenant_id,
    caso_id,
    processo_id,
    linked_by,
    role_note,
    is_primary
  )
  values (
    p_tenant_id,
    v_new_case_id,
    p_processo_id,
    p_actor_id,
    'Processo importado - vinculacao manual inicial',
    true
  );

  insert into caso_timeline (
    tenant_id,
    caso_id,
    processo_id,
    cnj_number,
    tipo,
    titulo,
    descricao,
    autor_id,
    autor_nome,
    metadata,
    is_automated
  )
  values (
    p_tenant_id,
    v_new_case_id,
    p_processo_id,
    v_processo.cnj_number,
    'criacao',
    'Caso criado a partir de processo importado',
    'Criacao manual a partir do processo ' || v_processo.cnj_number || '.',
    p_actor_id,
    'Lexia AI',
    jsonb_build_object(
      'origin', 'imported_process',
      'processo_id', p_processo_id
    ),
    false
  );

  return query select v_new_case_id, true, 'Caso criado com sucesso a partir do processo importado.';
exception
  when unique_violation then
    select id
      into v_existing_case_id
    from casos
    where tenant_id = p_tenant_id
      and origin_processo_id = p_processo_id
      and deleted_at is null
    limit 1;

    if v_existing_case_id is not null then
      return query select v_existing_case_id, false, 'Este processo ja foi convertido em caso por outra operacao.';
      return;
    end if;

    return query select null::uuid, false, 'Nao foi possivel criar o caso por conflito de concorrencia.';
end;
$$;
