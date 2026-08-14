create or replace function public.get_product_inventory_control_totals()
returns table (
  product_id uuid,
  sku text,
  reserved_qty numeric,
  issued_qty numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with product_keys as (
    select p.id, p.sku, lower(trim(p.sku)) as sku_key
    from public.products p
  ),
  reservations as (
    select
      coalesce(sol.product_id, (select pk.id from product_keys pk where pk.sku_key = lower(trim(sol.sku)) limit 1)) as product_id,
      sum(greatest(coalesce(sol.issued_qty, 0) - coalesce(sol.shipped_qty, 0), 0))::numeric as reserved_qty
    from public.sales_order_lines sol
    join public.sales_orders so on so.id = sol.order_id
    where coalesce(so.status, '') !~* '(fulfilled|delivered|paid|void|reversed|cancel)'
    group by 1
  ),
  movement_issues as (
    select
      coalesce(sm.product_id, (select pk.id from product_keys pk where pk.sku_key = lower(trim(sm.sku)) limit 1)) as product_id,
      sum(abs(sm.qty))::numeric as issued_qty
    from public.stock_movements sm
    where sm.qty < 0
      and coalesce(sm.type, '') ~* '(sale issue|invoice issue|repair|work order|suppl)'
      and coalesce(sm.type, '') !~* '(revers|return)'
    group by 1
  ),
  accepted_work_order_parts as (
    select
      coalesce(wop.product_id, (select pk.id from product_keys pk where pk.sku_key = lower(trim(wop.sku)) limit 1)) as product_id,
      wo.wo_no as document_no,
      sum(coalesce(wop.accepted_qty, 0))::numeric as accepted_qty
    from public.work_order_parts wop
    left join public.work_orders wo on wo.id = wop.wo_id
    where coalesce(wop.accepted_qty, 0) > 0
      and coalesce(wop.status, '') !~* '(void|revers|return|release|cancel)'
    group by 1, 2
  ),
  moved_work_order_parts as (
    select
      coalesce(sm.product_id, (select pk.id from product_keys pk where pk.sku_key = lower(trim(sm.sku)) limit 1)) as product_id,
      sm.document_no,
      sum(abs(sm.qty))::numeric as moved_qty
    from public.stock_movements sm
    where sm.qty < 0
      and coalesce(sm.type, '') ~* '(repair|work order)'
      and coalesce(sm.type, '') !~* '(revers|return)'
    group by 1, 2
  ),
  missing_work_order_issues as (
    select
      accepted.product_id,
      sum(greatest(accepted.accepted_qty - coalesce(moved.moved_qty, 0), 0))::numeric as missing_qty
    from accepted_work_order_parts accepted
    left join moved_work_order_parts moved
      on moved.product_id = accepted.product_id
     and moved.document_no is not distinct from accepted.document_no
    group by accepted.product_id
  ),
  invoiced_parts as (
    select
      coalesce(il.product_id, (select pk.id from product_keys pk where pk.sku_key = lower(trim(il.sku)) limit 1)) as product_id,
      i.invoice_no as document_no,
      sum(coalesce(il.qty, 0))::numeric as invoice_qty
    from public.invoice_lines il
    join public.invoices i on i.id = il.invoice_id
    where coalesce(i.status, '') !~* '(void|reversed|cancel)'
      and coalesce(il.sku, '') <> ''
    group by 1, 2
  ),
  moved_invoice_parts as (
    select
      coalesce(sm.product_id, (select pk.id from product_keys pk where pk.sku_key = lower(trim(sm.sku)) limit 1)) as product_id,
      sm.document_no,
      sum(abs(sm.qty))::numeric as moved_qty
    from public.stock_movements sm
    where sm.qty < 0
      and coalesce(sm.type, '') ~* '(sale issue|invoice issue)'
      and coalesce(sm.type, '') !~* '(revers|return)'
    group by 1, 2
  ),
  missing_invoice_issues as (
    select
      invoiced.product_id,
      sum(greatest(invoiced.invoice_qty - coalesce(moved.moved_qty, 0), 0))::numeric as missing_qty
    from invoiced_parts invoiced
    left join moved_invoice_parts moved
      on moved.product_id = invoiced.product_id
     and moved.document_no = invoiced.document_no
    group by invoiced.product_id
  )
  select
    pk.id,
    pk.sku,
    coalesce(r.reserved_qty, 0),
    coalesce(mi.issued_qty, 0)
      + coalesce(mwo.missing_qty, 0)
      + coalesce(minv.missing_qty, 0)
  from product_keys pk
  left join reservations r on r.product_id = pk.id
  left join movement_issues mi on mi.product_id = pk.id
  left join missing_work_order_issues mwo on mwo.product_id = pk.id
  left join missing_invoice_issues minv on minv.product_id = pk.id;
$$;

grant execute on function public.get_product_inventory_control_totals() to authenticated;
grant execute on function public.get_product_inventory_control_totals() to anon;
