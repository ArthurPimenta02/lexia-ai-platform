-- ============================================================
-- 026_fix_soft_delete_rls.sql
-- Corrige RLS para operações de soft delete (UPDATE deleted_at).
--
-- PROBLEMA: As políticas UPDATE de `leads` e `casos` não tinham
-- cláusula WITH CHECK explícita. O Postgres usa a cláusula USING
-- como WITH CHECK quando esta é omitida. A política SELECT filtra
-- deleted_at IS NULL, e o Postgres re-verifica a visibilidade do
-- row após o UPDATE — quando deleted_at é preenchido, o row deixa
-- de passar a política SELECT, causando erro silencioso:
--   "new row violates row-level security policy for table"
--
-- SOLUÇÃO: Adicionar WITH CHECK explícito nas políticas UPDATE de
-- `leads` e `casos` que exige apenas tenant_id correto (sem
-- restrição de deleted_at), permitindo que o soft delete funcione.
-- ============================================================

-- ── leads ──────────────────────────────────────────────────────────────────────
-- Remove políticas UPDATE antigas (ambas as versões — 007 e 023)

drop policy if exists "leads: advogado/secretária/admin atualizam" on leads;
drop policy if exists "leads: membros qualificados atualizam" on leads;

-- Recria com WITH CHECK que permite soft delete (deleted_at preenchido)
create policy "leads: membros qualificados atualizam"
  on leads for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer', 'secretary')
  )
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Remove política soft-delete duplicada do 007 (era também FOR UPDATE, redundante)
drop policy if exists "leads: admin/manager deletam (soft)" on leads;

-- ── casos ──────────────────────────────────────────────────────────────────────
-- Remove políticas UPDATE antigas (ambas as versões — 009 e 023)

drop policy if exists "casos: advogado/admin atualizam" on casos;
drop policy if exists "casos: membros qualificados atualizam" on casos;

-- Recria com WITH CHECK que permite soft delete (deleted_at preenchido)
create policy "casos: membros qualificados atualizam"
  on casos for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  )
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
