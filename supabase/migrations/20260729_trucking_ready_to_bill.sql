alter table public.trucking_moves
  add column if not exists billing_batch text;

alter table public.trucking_moves
  drop constraint if exists trucking_moves_billing_status_check;

alter table public.trucking_moves
  add constraint trucking_moves_billing_status_check
  check (billing_status in ('Unbilled', 'Ready to Bill', 'Billed'));

grant select, update on public.trucking_moves to anon, authenticated;
