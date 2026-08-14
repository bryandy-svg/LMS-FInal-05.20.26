-- Partial Sales Order fulfillment and multiple invoices per Sales Order.

alter table public.sales_order_lines
  add column if not exists issued_qty numeric not null default 0,
  add column if not exists shipped_qty numeric not null default 0,
  add column if not exists invoiced_qty numeric not null default 0;

alter table public.sales_order_lines
  drop constraint if exists sales_order_lines_issued_qty_check,
  add constraint sales_order_lines_issued_qty_check check (issued_qty >= 0 and issued_qty <= qty),
  drop constraint if exists sales_order_lines_shipped_qty_check,
  add constraint sales_order_lines_shipped_qty_check check (shipped_qty >= 0 and shipped_qty <= issued_qty),
  drop constraint if exists sales_order_lines_invoiced_qty_check,
  add constraint sales_order_lines_invoiced_qty_check check (invoiced_qty >= 0 and invoiced_qty <= shipped_qty);

alter table public.invoice_lines
  add column if not exists ordered_qty numeric,
  add column if not exists issued_qty numeric,
  add column if not exists shipped_qty numeric;

-- Preserve historical meaning: orders already completed before this migration
-- were fully issued, shipped, and invoiced.
update public.sales_order_lines sol
set issued_qty = sol.qty,
    shipped_qty = sol.qty,
    invoiced_qty = sol.qty
from public.sales_orders so
where so.id = sol.order_id
  and lower(coalesce(so.status, '')) in ('fulfilled', 'issued', 'delivered', 'posted', 'paid')
  and sol.issued_qty = 0
  and sol.shipped_qty = 0
  and sol.invoiced_qty = 0;

grant select, insert, update on table public.sales_order_lines to authenticated;
grant select, insert, update on table public.invoice_lines to authenticated;

