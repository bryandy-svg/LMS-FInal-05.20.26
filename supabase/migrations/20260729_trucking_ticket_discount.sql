alter table public.trucking_moves
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists amount_to_bill numeric;

update public.trucking_moves
set amount_to_bill = greatest(0, coalesce(amount, 0) - coalesce(discount_amount, 0))
where amount_to_bill is null;

alter table public.trucking_moves
  drop constraint if exists trucking_moves_discount_amount_check;

alter table public.trucking_moves
  add constraint trucking_moves_discount_amount_check
  check (discount_amount >= 0 and discount_amount <= coalesce(amount, 0));

grant select, insert, update on public.trucking_moves to anon, authenticated;
