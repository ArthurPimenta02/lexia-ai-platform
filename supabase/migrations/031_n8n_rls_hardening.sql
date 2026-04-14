-- ============================================================
-- 031_n8n_rls_hardening.sql
-- Hardening de RLS para entidades de sincronizacao juridica.
--
-- Garante que process_parties e process_updates sempre validem
-- o tenant via processos, inclusive quando o processo ainda nao
-- esta vinculado a casos.
-- ============================================================

-- ── process_parties ──────────────────────────────────────────────────────────

drop policy if exists "process_parties: advogado/admin inserem" on process_parties;
drop policy if exists "process_parties: membros qualificados inserem" on process_parties;

create policy "process_parties: membros qualificados inserem"
  on process_parties for insert
  with check (
    exists (
      select 1 from processos p
      where p.id = process_parties.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "process_parties: membros qualificados atualizam" on process_parties;
create policy "process_parties: membros qualificados atualizam"
  on process_parties for update
  using (
    exists (
      select 1 from processos p
      where p.id = process_parties.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "process_parties: membros qualificados removem" on process_parties;
create policy "process_parties: membros qualificados removem"
  on process_parties for delete
  using (
    exists (
      select 1 from processos p
      where p.id = process_parties.processo_id
        and p.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

-- ── process_updates ──────────────────────────────────────────────────────────

drop policy if exists "process_updates: advogado/admin inserem" on process_updates;
drop policy if exists "process_updates: membros qualificados inserem" on process_updates;

create policy "process_updates: membros qualificados inserem"
  on process_updates for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and exists (
      select 1 from processos p
      where p.id = process_updates.processo_id
        and p.tenant_id = process_updates.tenant_id
    )
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );

drop policy if exists "process_updates: membros qualificados atualizam" on process_updates;
create policy "process_updates: membros qualificados atualizam"
  on process_updates for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and exists (
      select 1 from processos p
      where p.id = process_updates.processo_id
        and p.tenant_id = process_updates.tenant_id
    )
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );
