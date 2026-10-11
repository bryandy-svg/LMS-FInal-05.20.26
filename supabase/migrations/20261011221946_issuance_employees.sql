create table public.issuance_employees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  name_key text generated always as (lower(btrim(name))) stored unique,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.issuance_employees enable row level security;
grant select, insert on public.issuance_employees to authenticated;
create policy issuance_employees_read on public.issuance_employees for select to authenticated
using (exists (select 1 from public.app_profiles p where p.id = (select auth.uid())));
create policy issuance_employees_create on public.issuance_employees for insert to authenticated
with check (created_by = (select auth.uid()) and exists (
  select 1 from public.app_profiles p where p.id = (select auth.uid())
  and (p.role ~* 'admin|owner' or p.modules && array['all','purchasing','supplies'])
));
