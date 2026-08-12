alter table public.purchase_orders
  add column if not exists po_type text not null default 'Standard',
  add column if not exists spending_limit numeric not null default 0;

alter table public.purchase_orders
  drop constraint if exists purchase_orders_po_type_check,
  add constraint purchase_orders_po_type_check check (po_type in ('Standard', 'Blanket'));

alter table public.purchase_orders
  drop constraint if exists purchase_orders_spending_limit_check,
  add constraint purchase_orders_spending_limit_check check (spending_limit >= 0);
