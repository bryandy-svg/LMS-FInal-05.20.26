CREATE OR REPLACE FUNCTION public.guard_work_order_po_receipts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare target_wo text := new.wo_no; pending record;
begin
  select p.po_no into pending from public.purchase_orders p
  where p.ap_support_wo_no=target_wo and p.purchase_purpose='Work Order'
    and coalesce(p.status,'') !~* 'void|cancel|reversed|written off'
    and exists(select 1 from public.purchase_order_lines l where l.po_id=p.id and l.qty>0)
    and not exists(select 1 from public.purchase_order_lines l where l.po_id=p.id and coalesce(l.destination_qty,l.qty)>0)
    and exists(select 1 from public.purchase_order_lines l where l.po_id=p.id and l.qty >
      coalesce((select sum(g.received_qty) from public.goods_receipts g where g.po_id=p.id
      and g.product_id=l.product_id and coalesce(g.status,'') !~* 'void|cancel|revers'),0))
  limit 1;
  if found then raise exception 'Cannot close %. PO % names this work order but its work-order quantities are all zero. Correct the allocation or change the PO to Inventory Stock.',target_wo,pending.po_no; end if;
  select * into pending from (
with linked as (
  select l.po_id,p.po_no,l.product_id,l.sku,
    coalesce(nullif(btrim(l.wo_no),''),case when exists (
      select 1 from public.work_order_parts part
      join public.work_orders w on w.id=part.wo_id
      where w.wo_no=p.ap_support_wo_no and part.product_id=l.product_id
        and strpos(part.notes,'Reserved from PO '||p.po_no||' for '||w.wo_no)>0
    ) then p.ap_support_wo_no end) as wo_no,
    least(l.qty,greatest(0,coalesce(l.destination_qty,l.qty))) as qty
  from public.purchase_order_lines l join public.purchase_orders p on p.id=l.po_id
  where (p.ap_support_wo_no=target_wo or exists (
    select 1 from public.purchase_order_lines t where t.po_id=p.id and t.wo_no=target_wo))
    and coalesce(p.status,'') !~* 'void|cancel|reversed|written off'
    and coalesce(l.sku,'') !~* '^sublet([[:space:]-]|$)'
    and coalesce(l.product_name,'') !~* '^sublet([[:space:]-]|$)'
), demand as (
  select po_id,po_no,product_id,sku,
    sum(qty) filter(where wo_no=target_wo) needed,
    sum(qty) filter(where wo_no is not null) all_allocated
  from linked where qty>0 group by po_id,po_no,product_id,sku
), quantities as (
  select d.*,coalesce((select sum(g.received_qty) from public.goods_receipts g
    where g.po_id=d.po_id and (g.product_id=d.product_id or (g.product_id is null or d.product_id is null) and g.sku=d.sku)
      and coalesce(g.status,'') !~* 'void|cancel|revers'),0) received,
    coalesce((select sum(part.accepted_qty) from public.work_order_parts part
      join public.work_orders w on w.id=part.wo_id where w.wo_no=target_wo
      and part.product_id=d.product_id and strpos(part.notes,'Reserved from PO '||d.po_no||' for '||w.wo_no)>0
      and coalesce(part.status,'') !~* 'void|cancel|return|removed|released'),0) accepted
  from demand d where needed>0
)
select po_no,sku,needed-case when received>=all_allocated then needed
  when all_allocated=needed then least(needed,received)
  else least(needed,received,accepted) end as outstanding from quantities
  ) x where outstanding>0 order by po_no,sku limit 1;
  if found then
    raise exception 'Cannot close %. PO %, part % still has % outstanding for this work order. Check the goods receipt and its work-order allocation.',target_wo,pending.po_no,pending.sku,pending.outstanding;
  end if;
  return new;
end $function$
;
create or replace function public.guard_po_receipts_before_close() returns trigger
language plpgsql set search_path='' as $$
declare pending record;
begin
 if lower(coalesce(new.po_type,'Standard'))='blanket'
 or (coalesce(new.status,'')||' '||coalesce(new.notes,'')) ~* 'landed cost ap|beginning ap|manual journal' then return new; end if;
 select d.sku,d.ordered-coalesce((select sum(g.received_qty) from public.goods_receipts g
 where g.po_id=new.id and (g.product_id=d.product_id or (g.product_id is null or d.product_id is null) and g.sku=d.sku)
 and coalesce(g.status,'') !~* 'void|cancel|revers'),0) outstanding into pending
 from (select l.product_id,l.sku,sum(l.qty) ordered from public.purchase_order_lines l
 where l.po_id=new.id and l.qty>0
 and coalesce(l.sku,'') !~* '^sublet([[:space:]-]|$)'
 and coalesce(l.product_name,'') !~* '^sublet([[:space:]-]|$)'
 group by l.product_id,l.sku) d
 where d.ordered>coalesce((select sum(g.received_qty) from public.goods_receipts g
 where g.po_id=new.id and (g.product_id=d.product_id or (g.product_id is null or d.product_id is null) and g.sku=d.sku)
 and coalesce(g.status,'') !~* 'void|cancel|revers'),0) limit 1;
 if found then raise exception 'Cannot close PO %. Part % still has % not received. Receive the remaining quantity before closing.',new.po_no,pending.sku,pending.outstanding; end if;
 return new;
end $$;
revoke all on function public.guard_po_receipts_before_close() from public,anon,authenticated;
create trigger purchase_orders_check_receipts before update of status on public.purchase_orders
for each row when (new.status='Closed PO' and old.status is distinct from new.status)
execute function public.guard_po_receipts_before_close();
