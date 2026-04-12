-- ============================================================
-- 021_auth_hooks.sql
-- Triggers e funções que conectam Supabase Auth ao schema
-- da aplicação. Roda automaticamente após signup.
-- ============================================================

-- ── Função: popula `users` após criação em auth.users ─────────────────────────
-- Chamada pelo trigger de signup. O tenant_id e role chegam
-- via raw_user_meta_data (passados no signUp() do frontend).
create or replace function handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  v_tenant_id uuid;
  v_role      user_role;
  v_name      text;
begin
  -- Lê metadados passados no signUp({ data: { tenant_id, role, name } })
  v_tenant_id := (new.raw_user_meta_data ->> 'tenant_id')::uuid;
  v_role      := coalesce(
                   (new.raw_user_meta_data ->> 'role')::user_role,
                   'lawyer'::user_role
                 );
  v_name      := coalesce(
                   new.raw_user_meta_data ->> 'name',
                   split_part(new.email, '@', 1)
                 );

  -- Só insere se tenant_id foi fornecido (fluxo normal de signup)
  if v_tenant_id is not null then
    insert into public.users (id, tenant_id, name, email, role, status)
    values (new.id, v_tenant_id, v_name, new.email, v_role, 'active');
  end if;

  return new;
end;
$$;

-- Trigger no schema auth (executa após insert em auth.users)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── Função: custom JWT claims ─────────────────────────────────────────────────
-- Injeta tenant_id e app_role no JWT do Supabase.
-- Configurar em: Dashboard → Authentication → Hooks → Custom JWT Claims
-- Hook type: "Customize Access Token"
--
-- IMPORTANTE: usar `app_role`, NÃO `role`.
-- O claim `role` é reservado pelo Supabase/PostgREST para papéis de banco.
-- Injetar um valor de aplicação em `role` causa o erro:
--   role "admin" does not exist
-- As políticas RLS devem ler: auth.jwt() ->> 'app_role'
create or replace function custom_jwt_claims(event jsonb)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  claims     jsonb;
  v_user_id  uuid;
  v_record   record;
begin
  claims    := event -> 'claims';
  v_user_id := (event ->> 'user_id')::uuid;

  -- Busca tenant_id e role (cargo) do usuário
  select tenant_id, role
  into v_record
  from public.users
  where id = v_user_id
    and status = 'active'
    and deleted_at is null;

  if found then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(v_record.tenant_id::text));
    -- Injeta como `app_role` — nunca como `role` (reservado ao PostgREST)
    claims := jsonb_set(claims, '{app_role}',  to_jsonb(v_record.role::text));
  end if;

  return claims;
end;
$$;


-- ── Função: soft delete cascata para auth.users ───────────────────────────────
-- Quando um usuário é desativado (status = 'inactive'), não remove do auth —
-- apenas bloqueia o acesso via JWT claims (app_role check nas policies).
-- Para remoção real, usar Supabase Admin API.
create or replace function handle_user_deactivated()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Nada a fazer automaticamente — acesso bloqueado via RLS (status check)
  -- Poderia notificar via pg_notify para invalidar sessões ativas
  return new;
end;
$$;

create trigger on_user_deactivated
  after update of status on public.users
  for each row
  when (old.status = 'active' and new.status = 'inactive')
  execute function handle_user_deactivated();
