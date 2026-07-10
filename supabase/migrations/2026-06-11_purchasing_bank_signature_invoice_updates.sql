alter table public.purchase_orders
  add column if not exists signature_data_url text;

alter table public.sales_orders
  add column if not exists signature_data_url text;

alter table public.goods_receipts
  add column if not exists base_unit_cost numeric default 0,
  add column if not exists landed_unit_cost numeric default 0,
  add column if not exists landed_cost_amount numeric default 0;

alter table public.bank_transactions
  add column if not exists bank_account text,
  add column if not exists upload_batch text;

grant select, insert, update on table public.purchase_orders to anon, authenticated;
grant select, insert, update on table public.sales_orders to anon, authenticated;
grant select, insert, update on table public.goods_receipts to anon, authenticated;
grant select, insert, update on table public.bank_transactions to anon, authenticated;
