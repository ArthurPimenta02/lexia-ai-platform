-- ============================================================
-- 020_user_invites.sql
-- Convites enviados para novos membros do tenant.
-- Integra com Supabase Auth (convite via email) e Resend.
-- ============================================================

create table user_invites (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,

  email       text not null,
  name        text not null,
  role        user_role not null default 'lawyer',
  status      invite_status not null default 'pending',

  invited_by  uuid references users(id) on delete set null,

  -- Token único para validação do convite
  token       text not null unique default gen_random_uuid()::text,

  -- Datas
  invited_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,

  -- Quando aceito, referencia o usuário criado
  accepted_by uuid references users(id) on delete set null,

  unique (tenant_id, email)
);

-- Índices
create index user_invites_tenant_idx on user_invites(tenant_id, status);
create index user_invites_token_idx on user_invites(token);
create index user_invites_email_idx on user_invites(email);

-- Marca convites expirados automaticamente
create or replace function expire_invites()
returns void language sql as $$
  update user_invites
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
$$;

-- RLS
alter table user_invites enable row level security;

create policy "user_invites: admin/manager lêem do tenant"
  on user_invites for select
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );

create policy "user_invites: admin/manager inserem"
  on user_invites for insert
  with check (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );

create policy "user_invites: admin/manager atualizam"
  on user_invites for update
  using (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    and (auth.jwt() ->> 'role') in ('admin', 'manager')
  );
