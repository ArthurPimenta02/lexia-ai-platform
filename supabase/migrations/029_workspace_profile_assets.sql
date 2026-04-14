-- ============================================================
-- 029_workspace_profile_assets.sql
-- Workspace real = tenant/escritorio + assets de tenant/usuario.
-- ============================================================

create or replace function generate_office_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    exit when not exists (
      select 1
      from tenants
      where office_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

alter table tenants
  add column office_code text;

update tenants
set office_code = generate_office_code()
where office_code is null;

alter table tenants
  alter column office_code set default generate_office_code(),
  alter column office_code set not null;

create unique index tenants_office_code_idx on tenants(office_code);

insert into storage.buckets (id, name, public)
values
  ('tenant-assets', 'tenant-assets', true),
  ('user-avatars', 'user-avatars', true)
on conflict (id) do nothing;
