alter table public.purchase_orders
  add column if not exists signature_printed_name text,
  add column if not exists signature_signed_date date,
  add column if not exists internal_signature_data_url text,
  add column if not exists internal_signature_name text,
  add column if not exists internal_signature_remarks text;

grant select, insert, update on table public.purchase_orders to anon;
grant select, insert, update on table public.purchase_orders to authenticated;
