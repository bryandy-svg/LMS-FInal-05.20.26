alter table public.purchase_orders
  add column if not exists ap_support_wo_no text,
  add column if not exists ap_support_jobsite text,
  add column if not exists ap_support_equipment text,
  add column if not exists ap_support_parts_description text;

alter table public.check_runs
  add column if not exists wo_no text,
  add column if not exists po_no text,
  add column if not exists jobsite text,
  add column if not exists equipment text,
  add column if not exists parts_description text;

grant select, insert, update, delete on table public.purchase_orders to authenticated;
grant select, insert, update, delete on table public.check_runs to authenticated;
