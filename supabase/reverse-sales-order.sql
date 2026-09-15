-- One transaction: reverse outstanding postings and shipments, then reopen.
-- SECURITY INVOKER preserves the application's existing table permissions/RLS.
create or replace function public.reverse_sales_order_and_reopen(
  p_order_no text, p_reason text, p_posting_date date,
  p_expected_invoice_no text, p_expected_delivered_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  o sales_orders%rowtype;
  docs text[];
  active_invoices text[];
  r record;
  batch uuid := gen_random_uuid();
  before_order jsonb;
begin
  if nullif(trim(p_reason),'') is null or p_posting_date is null then
    raise exception 'A reason and posting date are required.';
  end if;
  select * into strict o from sales_orders where order_no=p_order_no for update;
  if coalesce(o.invoice_no,'') <> coalesce(p_expected_invoice_no,'')
     or o.delivered_at is distinct from p_expected_delivered_at then
    raise exception 'This order changed. Refresh before reversing.';
  end if;
  if o.status ~* 'void|reversed|cancel' then raise exception 'This order is already inactive.'; end if;
  if nullif(o.work_order_no,'') is not null then
    raise exception 'Reverse the linked Work Order before changing its sales order.';
  end if;
  perform 1 from accounting_periods where status='Closed' for share;
  if exists(select 1 from accounting_periods where status='Closed' and closed_through_date>=p_posting_date) then
    raise exception 'The reversal posting date is in a closed accounting period.';
  end if;
  perform 1 from sales_order_lines where order_id=o.id for update;
  if not exists(select 1 from sales_order_lines where order_id=o.id and (shipped_qty>0 or invoiced_qty>0)) then
    raise exception 'There is no shipment or invoice to reverse. Refresh the order.';
  end if;
  perform 1 from invoices where source_ref=o.order_no and coalesce(type,'') !~* 'customer deposit' for update;
  select coalesce(array_agg(invoice_no),'{}') into docs from invoices
    where source_ref=o.order_no and coalesce(type,'') !~* 'customer deposit';
  select coalesce(array_agg(invoice_no),'{}') into active_invoices from invoices
    where source_ref=o.order_no and coalesce(type,'') !~* 'customer deposit' and status !~* 'void|revers|cancel';
  perform 1 from customer_payments where invoice_no=any(active_invoices) for update;
  if exists(select 1 from customer_payments where invoice_no=any(active_invoices) and coalesce(status,'') !~* 'void|revers|cancel') then
    raise exception 'Reverse the invoice payment first, then reverse this sales order.';
  end if;
  docs := array_append(docs,o.order_no);
  before_order := to_jsonb(o);
  if exists(select 1 from sales_order_lines l where l.order_id=o.id and coalesce(l.shipped_qty,0)>0
    and coalesce((select -sum(m.qty) from stock_movements m where m.document_no=any(docs)
      and m.sku=l.sku and m.type in ('Invoice Issue','Sale Issue','Sales Order Reversal')),0)<l.shipped_qty) then
    raise exception 'Shipment history does not match this order. No changes were saved.';
  end if;
  if (select abs(coalesce(sum(debit-credit),0)) from general_ledger where reference=any(docs)
    and source in ('Sales Order','Sales Fulfillment','Sales Order Invoice','Sales Order Reversal') and status='Posted')>0.005 then
    raise exception 'The order accounting entries are not balanced. No changes were saved.';
  end if;
  -- Net all original and reversal entries by invoice. Earlier cycles net to zero.
  -- Deposit receipts are deliberately excluded; deposit applications on invoices reverse normally.
  for r in select account,invoice_no,customer,vendor,sum(debit-credit) net
    from general_ledger where reference=any(docs)
      and source in ('Sales Order','Sales Fulfillment','Sales Order Invoice','Sales Order Reversal')
      and status='Posted' group by account,invoice_no,customer,vendor
    having sum(debit-credit)<>0
  loop
    insert into general_ledger(entry_date,posting_date,account,invoice_no,customer,vendor,
      description,reference,debit,credit,source,status)
    values(p_posting_date,p_posting_date,r.account,r.invoice_no,r.customer,r.vendor,
      'Reverse '||o.order_no||': '||trim(p_reason),o.order_no,greatest(-r.net,0),greatest(r.net,0),'Sales Order Reversal','Posted');
  end loop;
  -- Use actual movements, including component shipments, instead of ordered quantity.
  for r in select product_id,sku,-sum(qty) return_qty,
      -sum(case when qty<0 then -abs(coalesce(total_fifo_cost,0)) else abs(coalesce(total_fifo_cost,0)) end) return_cost
    from stock_movements where document_no=any(docs)
      and type in ('Invoice Issue','Sale Issue','Sale Issue - Mother Component','Sales Order Reversal')
    group by product_id,sku having sum(qty)<0 order by product_id
  loop
    update products set qty=qty+r.return_qty where id=r.product_id;
    if not found then raise exception 'Cannot restore stock for missing product %',r.sku; end if;
    insert into stock_movements(reference_no,movement_date,type,product_id,sku,product_name,
      sold_to,qty,to_warehouse,to_bin_shelf,unit_fifo_cost,total_fifo_cost,document_no,entered_by,reason)
    select 'REV-'||batch||'-'||r.sku,p_posting_date,'Sales Order Reversal',id,sku,name,
      o.customer,r.return_qty,warehouse,bin_shelf,r.return_cost/r.return_qty,r.return_cost,o.order_no,
      coalesce(auth.uid()::text,current_user),'Reversal: '||trim(p_reason) from products where id=r.product_id;
  end loop;
  update invoices set status='Reversed',notes=concat_ws(E'\n',notes,'Reversed with '||o.order_no||': '||trim(p_reason))
    where invoice_no=any(active_invoices);
  -- ISS remains reserved; reset customer release and billing counters only.
  update sales_order_lines set shipped_qty=0,invoiced_qty=0 where order_id=o.id;
  update sales_orders set status='Open',invoice_no=null,delivered_at=null,
    special_order_status=case when order_type ~* 'special order|backorder' then 'Ready for Delivery' else 'Unfulfilled' end,
    notes=concat_ws(E'\n',notes,'Reversed and reopened '||p_posting_date||': '||trim(p_reason)) where id=o.id;
  -- The quotation stays linked: the same sales order is continuing.
  insert into audit_log(event_type,module,record_ref,summary,source,table_name,record_key,action,before_data,after_data)
    select 'Reversal','Sales Orders',o.order_no,'Reversed and reopened sales order','app','sales_orders',o.order_no,
      'Reverse and reopen',before_order,to_jsonb(s) from sales_orders s where id=o.id;
  return jsonb_build_object('order_no',o.order_no,'status','Open','reversal_id',batch);
end $$;
revoke all on function public.reverse_sales_order_and_reopen(text,text,date,text,timestamptz) from public,anon;
grant execute on function public.reverse_sales_order_and_reopen(text,text,date,text,timestamptz) to authenticated;
