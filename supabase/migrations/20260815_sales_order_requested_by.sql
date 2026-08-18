alter table if exists public.sales_orders
  add column if not exists requested_by text;
