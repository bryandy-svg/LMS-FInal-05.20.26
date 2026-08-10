alter table public.work_orders
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by text,
  add column if not exists void_reason text;

grant select, insert, update on table public.work_orders to authenticated;
grant select, insert, update on table public.work_order_issues to authenticated;
grant select, insert, update on table public.work_order_parts to authenticated;
