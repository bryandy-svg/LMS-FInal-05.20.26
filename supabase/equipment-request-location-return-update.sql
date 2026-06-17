alter table public.equipment_requests
  add column if not exists location text,
  add column if not exists email_address text;

alter table public.assets
  add column if not exists return_date date;

grant usage on schema public to anon;
grant select, insert, update on table public.equipment_requests to anon;
grant select, update on table public.assets to anon;
