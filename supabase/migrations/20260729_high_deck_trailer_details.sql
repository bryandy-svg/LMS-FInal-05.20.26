alter table public.trucking_requests
  add column if not exists material_description text,
  add column if not exists unit_of_measurement text,
  add column if not exists weight_lb numeric,
  add column if not exists dimensions text;

alter table public.trucking_moves
  add column if not exists material_description text,
  add column if not exists unit_of_measurement text,
  add column if not exists weight_lb numeric,
  add column if not exists dimensions text;

grant select, insert, update on public.trucking_requests to anon, authenticated;
grant select, insert, update on public.trucking_moves to anon, authenticated;
