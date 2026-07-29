alter table public.trucking_requests
  add column if not exists materials_loaded text,
  add column if not exists number_of_loads numeric,
  add column if not exists cy_per_load numeric,
  add column if not exists total_cy numeric;

alter table public.trucking_moves
  add column if not exists materials_loaded text,
  add column if not exists number_of_loads numeric,
  add column if not exists cy_per_load numeric,
  add column if not exists total_cy numeric;

grant select, insert, update on public.trucking_requests to anon, authenticated;
grant select, insert, update on public.trucking_moves to anon, authenticated;
