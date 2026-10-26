create or replace function public.update_invoice_customer_po(p_invoice_id uuid, p_customer_id uuid, p_customer_po text, p_expected_customer text, p_expected_po text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare inv public.invoices%rowtype; new_customer text; prior jsonb; ar record; transfer_date date := (now() at time zone 'Pacific/Guam')::date; transfer_ref text; balance numeric; actor text;
begin
 if not exists(select 1 from public.app_profiles where id=auth.uid() and (role ~* 'admin|owner|controller|accounting' or modules && array['all','accounting','invoices'])) then raise exception 'Invoice editing permission required'; end if;
 select * into strict inv from public.invoices where id=p_invoice_id for update;
 if inv.customer is distinct from p_expected_customer or inv.customer_po is distinct from p_expected_po then raise exception 'Invoice changed. Refresh before saving.'; end if;
 if coalesce(inv.status,'') ~* 'paid|void|revers|cancel' then raise exception 'This invoice is read-only'; end if;
 select name into strict new_customer from public.customers where id=p_customer_id;
 if coalesce(trim(new_customer),'')='' then raise exception 'Select a saved customer'; end if;
 if coalesce(inv.payment_mode,'PO')='PO' and coalesce(trim(p_customer_po),'')='' then raise exception 'Customer PO number is required'; end if;
 if exists(select 1 from public.general_ledger where invoice_no=inv.invoice_no and source='Invoice Reversal') then raise exception 'Invoice has reversal history; use the invoice revision workflow'; end if;
 prior := to_jsonb(inv);
 actor := coalesce(auth.uid()::text,'');
 if inv.customer is distinct from new_customer then
  if exists(select 1 from public.accounting_periods where status='Closed' and closed_through_date>=transfer_date) then raise exception 'The transfer date is in a closed accounting period'; end if;
  perform id from public.general_ledger where invoice_no=inv.invoice_no order by id for update;
  if exists(select 1 from public.general_ledger where invoice_no=inv.invoice_no and account ~* 'accounts receivable' and coalesce(status,'') !~* 'void|revers|draft|unposted' group by customer having customer is distinct from inv.customer and abs(sum(coalesce(debit,0)-coalesce(credit,0)))>0.005) then raise exception 'Receivable belongs to another customer already. Review the ledger before transferring.'; end if;
  select coalesce(sum(coalesce(debit,0)-coalesce(credit,0)),0) into balance from public.general_ledger where invoice_no=inv.invoice_no and account ~* 'accounts receivable' and coalesce(status,'') !~* 'void|revers|draft|unposted';
  if balance<=0.005 then raise exception 'No positive posted receivable is available to transfer'; end if;
  transfer_ref := 'AR-TRANSFER-' || gen_random_uuid()::text;
  for ar in select account,sum(coalesce(debit,0)-coalesce(credit,0)) amount from public.general_ledger where invoice_no=inv.invoice_no and account ~* 'accounts receivable' and customer=inv.customer and coalesce(status,'') !~* 'void|revers|draft|unposted' group by account having abs(sum(coalesce(debit,0)-coalesce(credit,0)))>0.005 loop
   insert into public.general_ledger(entry_date,posting_date,account,customer,invoice_no,invoice_date,due_date,description,reference,debit,credit,source,status)
   values (transfer_date,transfer_date,ar.account,inv.customer,inv.invoice_no,inv.invoice_date,inv.due_date,'Transfer invoice receivable to '||new_customer,transfer_ref,greatest(-ar.amount,0),greatest(ar.amount,0),'Invoice Customer Transfer','Posted'),
   (transfer_date,transfer_date,ar.account,new_customer,inv.invoice_no,inv.invoice_date,inv.due_date,'Transfer invoice receivable from '||coalesce(inv.customer,''),transfer_ref,greatest(ar.amount,0),greatest(-ar.amount,0),'Invoice Customer Transfer','Posted');
  end loop;
 end if;
 update public.invoices set customer=new_customer,customer_po=nullif(trim(p_customer_po),'') where id=inv.id returning * into inv;
 insert into public.audit_log(event_type,table_name,record_key,action,module,user_name,user_email,reason,before_data,after_data)
 values('Updated','invoices',inv.invoice_no,'Customer / PO updated','Invoices',actor,coalesce(auth.jwt()->>'email',''),'Invoice customer and PO only; outstanding AR transferred once when customer changes.',prior,to_jsonb(inv)||jsonb_build_object('ar_transfer_reference',transfer_ref,'ar_transferred',balance));
 return to_jsonb(inv);
end $$;
revoke all on function public.update_invoice_customer_po(uuid,uuid,text,text,text) from public,anon;
grant execute on function public.update_invoice_customer_po(uuid,uuid,text,text,text) to authenticated;
