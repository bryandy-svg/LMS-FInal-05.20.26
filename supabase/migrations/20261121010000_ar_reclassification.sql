create or replace function public.post_ar_reclassification(p_batch text,p_date date,p_account text,p_reason text,p_allocations jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare item record; inv public.invoices; total numeric:=0; available numeric; paid numeric; opening numeric; party text;
begin
 if auth.uid() is null then raise exception 'Sign in before posting.'; end if;
 if not exists(select 1 from public.app_profiles where id=auth.uid() and (lower(role) in ('administrator','admin','owner','manager') or modules && array['all','accounting']::text[])) then raise exception 'Accounting access is required.';end if;
 if nullif(trim(p_batch),'') is null or nullif(trim(p_reason),'') is null or p_date is null then raise exception 'Batch, posting date and reason are required.';end if;
 if exists(select 1 from public.accounting_periods where status ilike 'closed' and p_date<=closed_through_date) then raise exception 'Posting date is in a closed period.';end if;
 if p_account ~* 'accounts receivable' or not exists(select 1 from public.chart_of_accounts where account=p_account) then raise exception 'Select a valid destination account.';end if;
 if jsonb_typeof(p_allocations)<>'array' or jsonb_array_length(p_allocations)=0 then raise exception 'Select invoice amounts.';end if;
 perform pg_advisory_xact_lock(hashtextextended('ar-batch:'||p_batch,0));
 if exists(select 1 from public.customer_payments where starts_with(receipt_no,p_batch||'-')) or exists(select 1 from public.general_ledger where reference=p_batch) then raise exception 'This batch was already posted. Refresh to review it.';end if;
 if (select count(*) from jsonb_array_elements(p_allocations))<>(select count(distinct x->>'id') from jsonb_array_elements(p_allocations) x) then raise exception 'Duplicate invoice allocation.';end if;
 for item in select (x->>'id')::uuid id,(x->>'amount')::numeric amount from jsonb_array_elements(p_allocations) x order by x->>'id' loop
  if item.amount is null or item.amount<=0 or item.amount<>round(item.amount,2) then raise exception 'Enter positive amounts with at most two decimal places.';end if;
  select * into strict inv from public.invoices where id=item.id for update;
  if inv.status ~* 'void|revers|cancel|written off|paid|reclassified' then raise exception 'Invoice % is no longer open.',inv.invoice_no;end if;
  if party is null then party:=inv.customer;elsif party is distinct from inv.customer then raise exception 'Select invoices for one customer.';end if;
  select coalesce(sum(qty*rate),0) into opening from public.invoice_lines where invoice_id=inv.id;
  select coalesce(sum(amount),0) into paid from public.customer_payments where invoice_no=inv.invoice_no and coalesce(status,'') !~* 'void|revers|cancel';
  select coalesce(sum(debit-credit),0) into available from public.general_ledger
   where (invoice_no=inv.invoice_no or (nullif(invoice_no,'') is null and reference=inv.invoice_no))
    and lower(trim(customer))=lower(trim(inv.customer)) and account ~* 'accounts receivable'
    and coalesce(status,'') !~* 'draft|unposted' and coalesce(posting_date,entry_date)<=p_date;
  if inv.type ~* '^beginning ar$' and inv.invoice_date<=p_date then available:=available+opening;end if;
  if item.amount>least(available,opening-paid)+0.005 then raise exception 'Invoice % has insufficient open AR on this date.',inv.invoice_no;end if;
  insert into public.customer_payments(receipt_no,payment_date,customer,invoice_no,amount,method,status,notes)
   values(p_batch||'-'||inv.invoice_no,p_date,inv.customer,inv.invoice_no,item.amount,'Reclassification','Posted',p_reason||' | Batch '||p_batch||' | Destination: '||p_account);
  insert into public.general_ledger(entry_date,posting_date,account,customer,invoice_no,invoice_date,due_date,description,reference,debit,credit,source,status)
   values(p_date,p_date,'Accounts Receivable (A/R)',inv.customer,inv.invoice_no,inv.invoice_date,inv.due_date,p_reason,p_batch,0,item.amount,'AR Reclassification','Posted');
  update public.invoices set status=case when opening-paid-item.amount<=0.005 then 'Reclassified' else 'Partial' end where id=inv.id;
  total:=total+item.amount;
 end loop;
 insert into public.general_ledger(entry_date,posting_date,account,customer,description,reference,debit,credit,source,status)
 values(p_date,p_date,p_account,party,p_reason,p_batch,total,0,'AR Reclassification','Posted');
end $$;
revoke all on function public.post_ar_reclassification(text,date,text,text,jsonb) from public,anon;
grant execute on function public.post_ar_reclassification(text,date,text,text,jsonb) to authenticated;
