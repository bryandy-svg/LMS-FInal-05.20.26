alter table public.trucking_requests
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

alter table public.trucking_moves
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

grant select, update on public.trucking_requests to anon, authenticated;
grant select, update on public.trucking_moves to anon, authenticated;
