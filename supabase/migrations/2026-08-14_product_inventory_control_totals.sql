create or replace function public.get_product_inventory_control_totals()
returns table (
  product_id uuid,
  sku text,
  reserved_qty numeric,
  issued_qty numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with reservations as (
    select
      lower(trim(sol.sku)) as sku_key,
      sum(greatest(coalesce(sol.issued_qty, 0) - coalesce(sol.shipped_qty, 0), 0))::numeric as reserved_qty
    from public.sales_order_lines sol
    join public.sales_orders so on so.id = sol.order_id
    where coalesce(so.status, '') !~* '(fulfilled|delivered|paid|void|reversed|cancel)'
    group by lower(trim(sol.sku))
  ),
  issues as (
    select
      lower(trim(sm.sku)) as sku_key,
      sum(abs(sm.qty))::numeric as issued_qty
    from public.stock_movements sm
    where sm.qty < 0
      and coalesce(sm.type, '') ~* '(sale issue|invoice issue|repair|work order|suppl)'
    group by lower(trim(sm.sku))
  )
  select
    p.id,
    p.sku,
    coalesce(r.reserved_qty, 0),
    coalesce(i.issued_qty, 0)
  from public.products p
  left join reservations r on r.sku_key = lower(trim(p.sku))
  left join issues i on i.sku_key = lower(trim(p.sku));
$$;

grant execute on function public.get_product_inventory_control_totals() to authenticated;
grant execute on function public.get_product_inventory_control_totals() to anon;
