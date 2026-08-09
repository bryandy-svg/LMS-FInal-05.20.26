alter table public.trucking_moves
  add column if not exists tipping_charge numeric not null default 0;

grant select, insert, update on public.trucking_moves to anon, authenticated;
