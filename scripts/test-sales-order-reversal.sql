-- Integration regression. All fixtures and reversals roll back.
begin;
set local role authenticated;
do $$
declare
  pid uuid; oid uuid; ref text := 'TEST-REV-'||gen_random_uuid();
  inv text; second_inv text; d date := current_date; result jsonb; n numeric;
begin
  inv:=ref||'-I1'; second_inv:=ref||'-I2';
  insert into products(sku,name,category,unit,warehouse,qty) values(ref,'Reversal test','Parts','Each','Main',8) returning id into pid;
  insert into stock_movements(reference_no,movement_date,type,product_id,sku,qty,total_fifo_cost,document_no)
    values(ref||'-OPEN',d,'Beginning Inventory',pid,ref,10,100,ref||'-OPEN');
  insert into sales_orders(order_no,customer,customer_po,order_date,status,order_type,invoice_no,freight_amount,deposit_amount,deposit_invoice_no)
    values(ref,'Regression test',ref,d,'Invoiced','Backorder',inv,125,1102,ref||'-DEPOSIT') returning id into oid;
  insert into sales_order_lines(order_id,product_id,sku,qty,issued_qty,shipped_qty,invoiced_qty)
    values(oid,pid,ref,5,5,2,2);
  insert into invoices(invoice_no,invoice_date,due_date,customer,type,source_ref,status)
    values(inv,d,d,'Regression test','Parts Sales',ref,'Open'),(ref||'-DEPOSIT',d,d,'Regression test','Customer Deposit',ref,'Paid');
  insert into stock_movements(reference_no,movement_date,type,product_id,sku,qty,total_fifo_cost,document_no)
    values(ref||'-S1',d,'Invoice Issue',pid,ref,-2,20,inv);
  insert into general_ledger(entry_date,posting_date,account,invoice_no,reference,debit,credit,source)
    values(d,d,'Accounts Receivable (A/R)',inv,inv,40,0,'Sales Order Invoice'),(d,d,'Parts Sales',inv,inv,0,40,'Sales Order Invoice');
  result:=reverse_sales_order_and_reopen(ref,'Regression test',d,inv,null);
  if (select qty from products where id=pid)<>10 then raise exception 'Partial shipment restored ordered quantity instead of actual quantity'; end if;
  if not exists(select 1 from sales_orders where id=oid and status='Open' and invoice_no is null and freight_amount=125 and deposit_amount=1102 and special_order_status='Ready for Delivery') then raise exception 'Order not reopened/preserved'; end if;
  if not exists(select 1 from sales_order_lines where order_id=oid and issued_qty=5 and shipped_qty=0 and invoiced_qty=0) then raise exception 'Counters not reset'; end if;
  if not exists(select 1 from invoices where invoice_no=ref||'-DEPOSIT' and status='Paid') then raise exception 'Deposit was reversed'; end if;
  begin
    perform reverse_sales_order_and_reopen(ref,'Duplicate',d,inv,null);
    raise exception 'Duplicate reversal accepted';
  exception when others then
    if sqlerrm not like 'This order changed.%' then raise; end if;
  end;
  -- Reinvoice and reverse again: only the new cycle is reversed.
  insert into invoices(invoice_no,invoice_date,due_date,customer,type,source_ref,status) values(second_inv,d,d,'Regression test','Parts Sales',ref,'Open');
  update sales_orders set invoice_no=second_inv,status='Invoiced' where id=oid;
  update sales_order_lines set shipped_qty=5,invoiced_qty=5 where order_id=oid;
  update products set qty=5 where id=pid;
  insert into stock_movements(reference_no,movement_date,type,product_id,sku,qty,total_fifo_cost,document_no)
    values(ref||'-S2',d,'Invoice Issue',pid,ref,-5,50,second_inv);
  insert into general_ledger(entry_date,posting_date,account,invoice_no,reference,debit,credit,source)
    values(d,d,'Accounts Receivable (A/R)',second_inv,second_inv,100,0,'Sales Order Invoice'),(d,d,'Parts Sales',second_inv,second_inv,0,100,'Sales Order Invoice');
  perform reverse_sales_order_and_reopen(ref,'Second cycle',d,second_inv,null);
  if (select qty from products where id=pid)<>10 then raise exception 'Second cycle returned old stock twice'; end if;
  if exists(select 1 from general_ledger where reference in (ref,inv,second_inv) group by account having sum(debit-credit)<>0) then raise exception 'Second cycle duplicated accounting'; end if;
  if (select count(*) from general_ledger where reference=ref and source='Sales Order Reversal')<>4 then raise exception 'Old accounting reversed again'; end if;
  -- A missing shipment record must fail without changing any records.
  update sales_orders set invoice_no=second_inv,status='Invoiced' where id=oid;
  update sales_order_lines set shipped_qty=1,invoiced_qty=1 where order_id=oid;
  begin
    perform reverse_sales_order_and_reopen(ref,'Missing shipment',d,second_inv,null);
    raise exception 'Missing shipment accepted';
  exception when others then
    if sqlerrm not like 'Shipment history does not match%' then raise; end if;
  end;
  if (select qty from products where id=pid)<>10 then raise exception 'Failed transaction changed stock'; end if;
end $$;
rollback;
