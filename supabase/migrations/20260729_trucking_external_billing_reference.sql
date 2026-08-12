alter table public.trucking_moves
  add column if not exists billing_reference text;

grant select, update on public.trucking_moves to anon, authenticated;
