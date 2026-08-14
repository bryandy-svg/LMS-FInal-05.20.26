alter table public.trucking_requests
  add column if not exists roll_off_tons numeric;

alter table public.trucking_moves
  add column if not exists service_size text,
  add column if not exists tipping_fee text,
  add column if not exists roll_off_tons numeric,
  add column if not exists tipping_rate numeric not null default 0,
  add column if not exists tipping_rate_type text;

grant select, insert, update on public.trucking_requests, public.trucking_moves to anon, authenticated;
