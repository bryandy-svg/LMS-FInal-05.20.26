alter table public.work_orders
  add column if not exists jobsite_location text;

grant select, insert, update on table public.work_orders to authenticated;
