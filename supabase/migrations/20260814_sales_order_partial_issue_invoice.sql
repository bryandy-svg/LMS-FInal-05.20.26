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

-- Backfill stock reservations for older open/reserved Sales Orders. Allocate
-- current on-hand quantity chronologically so the same unit is not reserved
-- to two orders. SHP remains physically issued and is never reserved again.
with ranked_demand as (
  select
    sol.id,
    sol.sku,
    greatest(0, sol.qty - sol.shipped_qty) as open_qty,
    coalesce(p.qty, 0) as on_hand_qty,
    coalesce(sum(greatest(0, sol.qty - sol.shipped_qty)) over (
      partition by lower(trim(sol.sku))
      order by so.order_date, so.order_no, sol.id
      rows between unbounded preceding and 1 preceding
    ), 0) as prior_open_demand
  from public.sales_order_lines sol
  join public.sales_orders so on so.id = sol.order_id
  left join public.products p on lower(trim(p.sku)) = lower(trim(sol.sku))
  where lower(coalesce(so.status, '')) not similar to '%(fulfilled|delivered|paid|void|reversed|cancel)%'
    and lower(coalesce(so.status, '')) similar to '%(reserved|backorder)%'
    and sol.issued_qty <= sol.shipped_qty
)
update public.sales_order_lines sol
set issued_qty = sol.shipped_qty + greatest(
  0,
  least(rd.open_qty, rd.on_hand_qty - rd.prior_open_demand)
)
from ranked_demand rd
where rd.id = sol.id;

grant select, insert, update on table public.sales_order_lines to authenticated;
grant select, insert, update on table public.invoice_lines to authenticated;
