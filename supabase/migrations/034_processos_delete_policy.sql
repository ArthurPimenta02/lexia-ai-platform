-- ============================================================
-- 034_processos_delete_policy.sql
-- Permite exclusao de processos por membros qualificados.
-- Escopo: admin, manager e lawyer.
-- ============================================================

drop policy if exists "processos: membros qualificados removem" on processos;
create policy "processos: membros qualificados removem"
  on processos for delete
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'app_role') in ('admin', 'manager', 'lawyer')
  );
