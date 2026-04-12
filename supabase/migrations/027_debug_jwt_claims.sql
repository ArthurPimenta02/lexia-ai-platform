-- ============================================================
-- 027_debug_jwt_claims.sql
-- Função temporária de diagnóstico — retorna os JWT claims
-- que o Postgres enxerga na sessão atual.
-- Remover após diagnóstico.
-- ============================================================

create or replace function debug_jwt_claims()
returns jsonb
security definer
set search_path = public
language sql
as $$
  select jsonb_build_object(
    'sub',        auth.jwt() ->> 'sub',
    'tenant_id',  auth.jwt() ->> 'tenant_id',
    'app_role',   auth.jwt() ->> 'app_role',
    'role',       auth.jwt() ->> 'role',
    'email',      auth.jwt() ->> 'email'
  );
$$;

grant execute on function debug_jwt_claims() to authenticated;
