alter table public.trucking_moves
  add column if not exists billing_status text not null default 'Unbilled',
  add column if not exists billed_at timestamptz,
  add column if not exists move_description text;

update public.trucking_moves
set billing_status = 'Unbilled'
where billing_status is null or billing_status not in ('Unbilled', 'Billed');

alter table public.trucking_moves
  drop constraint if exists trucking_moves_billing_status_check;

alter table public.trucking_moves
  add constraint trucking_moves_billing_status_check
  check (billing_status in ('Unbilled', 'Billed'));

grant select, update on public.trucking_moves to anon, authenticated;
