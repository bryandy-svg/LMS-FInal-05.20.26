-- Save customer PO lines and release their reduced customer allocation atomically.
create or replace function public.save_customer_po_allocations(p_po_id uuid,p_lines jsonb,p_expected jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p purchase_orders%rowtype; so sales_orders%rowtype; old_line purchase_order_lines%rowtype; sl sales_order_lines%rowtype; entry jsonb; old_rows jsonb:='[]'; changes jsonb:='[]'; k text; old_qty numeric; new_qty numeric; reduction numeric; remaining numeric; take_qty numeric; note_qty text; ref text;
begin
 if current_user not in ('postgres','service_role') and not exists(select 1 from app_profiles where id=auth.uid() and (modules && array['all','purchasing'] or role ilike '%admin%')) then raise exception 'Purchase order access required'; end if;
 if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_typeof(p_expected) is distinct from 'array' then raise exception 'Invalid PO lines'; end if;
 select * into strict p from purchase_orders where id=p_po_id for update;
 if p.purchase_purpose<>'Customer Order' then raise exception 'Customer Order PO required'; end if;
 ref:=coalesce(nullif(p.linked_sales_order_no,''),substring(p.notes from '\[Reorder Source:\s*([^\]]+)\]'));
 select * into strict so from sales_orders where order_no=ref for update;
 perform 1 from purchase_order_lines where po_id=p_po_id order by id for update;
 perform 1 from sales_order_lines where order_id=so.id order by id for update;
 if (select count(*) from purchase_order_lines where po_id=p_po_id)<>jsonb_array_length(p_expected) then raise exception 'PO lines changed. Reopen the PO before saving.'; end if;
 for old_line in select * from purchase_order_lines where po_id=p_po_id loop
  select value into entry from jsonb_array_elements(p_expected) where value->>'id'=old_line.id::text;
  if entry is null or coalesce(entry->>'sku','')<>coalesce(old_line.sku,'') or (entry->>'qty')::numeric is distinct from old_line.qty or (entry->>'destination_qty')::numeric is distinct from old_line.destination_qty then raise exception 'PO allocation changed. Reopen the PO before saving.'; end if;
  note_qty:=null;
  select substring(trim(x) from '(-?[0-9]+(?:\.[0-9]+)?)\s*\.?$') into note_qty from unnest(string_to_array(coalesce(substring(p.notes from 'Customer allocation:\s*([^\n]+)'),''),',')) x where lower(left(trim(x),length(trim(old_line.sku))+1))=lower(trim(old_line.sku)||' ') limit 1;
  old_qty:=least(old_line.qty,greatest(0,coalesce(old_line.destination_qty,note_qty::numeric,old_line.qty)));
  old_rows:=old_rows||jsonb_build_array(jsonb_build_object('sku',lower(trim(old_line.sku)),'qty',old_qty));
 end loop;
 if exists(select 1 from jsonb_array_elements(p_lines) x group by x->>'id' having count(*)>1) then raise exception 'Duplicate PO line'; end if;
 for entry in select value from jsonb_array_elements(p_lines) loop
  if entry->>'id' is null or entry->>'qty' is null or entry->>'destination_qty' is null or coalesce(trim(entry->>'sku'),'')='' or entry->>'qty' in ('NaN','Infinity','-Infinity') or entry->>'destination_qty' in ('NaN','Infinity','-Infinity') or (entry->>'qty')::numeric<=0 or (entry->>'destination_qty')::numeric<0 or (entry->>'destination_qty')::numeric>(entry->>'qty')::numeric then raise exception 'Reserved quantity must be between zero and ordered quantity'; end if;
  if exists(select 1 from purchase_order_lines where id=(entry->>'id')::uuid and po_id<>p_po_id) then raise exception 'PO line belongs to another order'; end if;
 end loop;
 for k in select distinct value->>'sku' from jsonb_array_elements(old_rows) loop
  select coalesce(sum((value->>'qty')::numeric),0) into old_qty from jsonb_array_elements(old_rows) where value->>'sku'=k;
  select coalesce(sum((value->>'destination_qty')::numeric),0) into new_qty from jsonb_array_elements(p_lines) where lower(trim(value->>'sku'))=k;
  reduction:=greatest(0,old_qty-new_qty);
  if reduction=0 then continue; end if;
  if coalesce(so.status,'') ~* 'fulfilled|delivered|paid|void|reversed|cancel' or nullif(so.invoice_no,'') is not null or coalesce(so.deposit_amount,0)>0 then raise exception 'Sales Order % has finalized billing or a deposit. Correct that document before redirecting its quantity.',so.order_no; end if;
  select coalesce(sum(greatest(0,qty-greatest(coalesce(shipped_qty,0),coalesce(invoiced_qty,0)))),0) into remaining from sales_order_lines where order_id=so.id and lower(trim(sku))=k;
  if reduction>remaining then raise exception '% cannot be reduced by %: quantity is shipped, invoiced, or no longer on %.',k,reduction,so.order_no; end if;
  remaining:=reduction;
  for sl in select * from sales_order_lines where order_id=so.id and lower(trim(sku))=k order by id loop
   take_qty:=least(remaining,greatest(0,sl.qty-greatest(coalesce(sl.shipped_qty,0),coalesce(sl.invoiced_qty,0))));
   if take_qty>0 then update sales_order_lines set qty=sl.qty-take_qty,issued_qty=least(coalesce(sl.issued_qty,0),sl.qty-take_qty) where id=sl.id; remaining:=remaining-take_qty; end if;
  end loop;
  changes:=changes||jsonb_build_array(jsonb_build_object('sku',k,'to_stock',reduction));
 end loop;
 -- Never erase receipt history or reduce the commitment below received quantity.
 if exists(select 1 from (select lower(trim(sku)) sku,sum(received_qty) qty from goods_receipts where po_id=p_po_id and coalesce(status,'') !~* 'void|revers|cancel' group by lower(trim(sku))) g where g.qty>(select coalesce(sum((value->>'qty')::numeric),0) from jsonb_array_elements(p_lines) where lower(trim(value->>'sku'))=lower(trim(g.sku)))) then raise exception 'Ordered quantity cannot be reduced below received quantity'; end if;
 insert into purchase_order_lines(id,po_id,wo_no,product_id,sku,product_name,qty,unit_cost,unit,foreign_unit_cost,allocated_landed_cost,landed_unit_cost,destination_qty)
 select x.id,p_po_id,x.wo_no,x.product_id,x.sku,x.product_name,x.qty,x.unit_cost,x.unit,x.foreign_unit_cost,x.allocated_landed_cost,x.landed_unit_cost,x.destination_qty from jsonb_populate_recordset(null::purchase_order_lines,p_lines) x
 on conflict(id) do update set wo_no=excluded.wo_no,product_id=excluded.product_id,sku=excluded.sku,product_name=excluded.product_name,qty=excluded.qty,unit_cost=excluded.unit_cost,unit=excluded.unit,foreign_unit_cost=excluded.foreign_unit_cost,allocated_landed_cost=excluded.allocated_landed_cost,landed_unit_cost=excluded.landed_unit_cost,destination_qty=excluded.destination_qty;
 delete from purchase_order_lines where po_id=p_po_id and id not in(select (value->>'id')::uuid from jsonb_array_elements(p_lines));
 if jsonb_array_length(changes)>0 then
  update sales_orders set notes=concat_ws(E'\n',notes,'PO '||p.po_no||' allocation redirected to stock '||(now() at time zone 'Pacific/Guam')::date||': '||changes::text),
   status=case when not exists(select 1 from sales_order_lines where order_id=so.id and qty>0) then 'Cancelled' when not exists(select 1 from sales_order_lines where order_id=so.id and coalesce(issued_qty,0)<qty) then 'Reserved' else 'Backordered' end,
   special_order_status=case when not exists(select 1 from sales_order_lines where order_id=so.id and qty>0) then 'Cancelled' when not exists(select 1 from sales_order_lines where order_id=so.id and coalesce(issued_qty,0)<qty) then 'Ready for Delivery' else 'Awaiting Stock' end where id=so.id;
 end if;
 return jsonb_build_object('order_no',so.order_no,'adjustments',changes);
end $$;
revoke all on function public.save_customer_po_allocations(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.save_customer_po_allocations(uuid,jsonb,jsonb) to authenticated,service_role;
