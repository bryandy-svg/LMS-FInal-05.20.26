alter table public.trucking_requests
  add column if not exists payment_mode text;

alter table public.trucking_moves
  add column if not exists payment_mode text;

alter table public.trucking_requests
  drop constraint if exists trucking_requests_payment_mode_check;

alter table public.trucking_requests
  add constraint trucking_requests_payment_mode_check
  check (payment_mode is null or payment_mode in ('Cash', 'Credit Card', 'PO'));

grant select, insert, update on public.trucking_requests to anon, authenticated;
grant select, insert, update on public.trucking_moves to anon, authenticated;
