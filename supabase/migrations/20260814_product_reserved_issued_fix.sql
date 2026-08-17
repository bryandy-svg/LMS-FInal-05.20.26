-- Product Master Reserved/Issued support.
-- Safe to run more than once.

alter table public.sales_order_lines
  add column if not exists issued_qty numeric not null default 0,
  add column if not exists shipped_qty numeric not null default 0,
  add column if not exists invoiced_qty numeric not null default 0;

-- Backfill older active reservations chronologically without allocating the
-- same on-hand unit to more than one Sales Order.
with ranked_demand as (
  select
    sol.id,
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
