alter table public.sales_order_lines
  add column if not exists description text,
  add column if not exists unit text;
