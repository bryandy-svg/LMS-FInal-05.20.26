alter table public.trucking_moves
  add column if not exists discount_percent numeric not null default 0;

update public.trucking_moves
set discount_percent = round(
  (discount_amount / nullif(greatest(amount - coalesce(tipping_charge, 0), 0), 0) * 100)::numeric,
  4
)
where coalesce(discount_percent, 0) = 0
  and coalesce(discount_amount, 0) > 0
  and greatest(amount - coalesce(tipping_charge, 0), 0) > 0;

alter table public.trucking_moves
  drop constraint if exists trucking_moves_discount_percent_check;

alter table public.trucking_moves
  add constraint trucking_moves_discount_percent_check
  check (discount_percent between 0 and 100);

grant select, insert, update on public.trucking_moves to anon, authenticated;
