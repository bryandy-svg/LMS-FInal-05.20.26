create or replace function public.review_or_reverse_check_journals(p_run_no text,p_date date,p_reason text,p_snapshot text default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare r public.check_runs%rowtype; refs text[]; ref text; entries jsonb; fingerprint text; n integer; ap numeric; bal numeric; payment_ap numeric; payment_cash numeric; g public.general_ledger%rowtype; result jsonb;
begin
 if not exists(select 1 from public.app_profiles where id=auth.uid() and (role ~* 'admin|owner|controller|accounting' or modules && array['all','accounting','checkrun'])) then raise exception 'Accounting permission required'; end if;
 if p_date is null or p_date>(now() at time zone 'Pacific/Guam')::date or coalesce(trim(p_reason),'')='' then raise exception 'Valid reversal date and reason required'; end if;
 if exists(select 1 from public.accounting_periods where status='Closed' and closed_through_date>=p_date) then raise exception 'Reversal date is in a closed period'; end if;
 select * into strict r from public.check_runs where check_run_no=p_run_no for update;
 if r.status ~* 'void|revers|cancel' then raise exception 'This check has already been voided'; end if;
 select array_agg(distinct trim(value)) into refs from regexp_split_to_table(coalesce(r.reference,''),'[,;]') value where trim(value)<>'';
 if coalesce(array_length(refs,1),0)=0 then raise exception 'No original journal references linked to this check'; end if;
 -- Lock every original line before validating or writing any reversal.
 perform id from public.general_ledger where reference=any(refs) or reference=p_run_no order by id for update;
 foreach ref in array refs loop
   select count(*),coalesce(sum(debit-credit),0),coalesce(sum(case when account ~* 'accounts payable' then credit-debit else 0 end),0)
   into n,bal,ap from public.general_ledger where reference=ref and source='Manual Journal' and coalesce(status,'') !~* 'reversed|void|draft|unposted';
   if n<2 or abs(bal)>0.005 or abs(ap)<0.005 then raise exception 'Journal % must be an active, balanced original payable journal. Purchase-order/receipt bills require their document cancellation workflow.',ref; end if;
   if exists(select 1 from public.general_ledger where reference=ref and (source<>'Manual Journal' or coalesce(status,'') ~* 'reversed|void|draft|unposted')) or exists(select 1 from public.general_ledger where reference='REV-'||ref) then raise exception 'Journal % has already been adjusted or reversed; review it separately',ref; end if;
   if exists(select 1 from public.general_ledger where reference=ref and account ~* 'accounts payable' and lower(trim(coalesce(vendor,'')))<>lower(trim(coalesce(r.vendor,'')))) then raise exception 'Journal % contains another vendor payable',ref; end if;
   if exists(select 1 from public.check_runs other where other.id<>r.id and coalesce(other.status,'') !~* 'void|revers|cancel' and ref=any(regexp_split_to_array(coalesce(other.reference,''),'\s*[,;]\s*'))) then raise exception 'Journal % is linked to another active check run',ref; end if;
 end loop;
 if exists(select 1 from public.general_ledger other where other.account ~* 'accounts payable' and lower(trim(coalesce(other.vendor,'')))=lower(trim(coalesce(r.vendor,''))) and coalesce(other.invoice_no,'')<>'' and other.invoice_no in (select invoice_no from public.general_ledger where reference=any(refs) and account ~* 'accounts payable') and other.reference<>p_run_no and not(other.reference=any(refs))) then raise exception 'Another transaction affects this invoice; review the settlement before cancellation'; end if;
 if exists(select 1 from public.general_ledger where reference=p_run_no and (source<>'Check Run' or coalesce(status,'') ~* 'void|revers|draft|unposted')) then raise exception 'Payment journal has been adjusted; review it separately'; end if;
 select coalesce(sum(case when account ~* 'accounts payable' then credit-debit else 0 end),0) into ap from public.general_ledger where reference=any(refs) and source='Manual Journal';
 if abs(ap-r.amount)>0.005 or r.amount<=0 then raise exception 'The original payable total does not match the full check amount; partial settlements require separate review'; end if;
 if exists(select 1 from public.general_ledger where reference=p_run_no||'-VOID') or exists(select 1 from public.bank_transactions where reference=p_run_no||'-VOID') then raise exception 'A payment reversal already exists; review it separately'; end if;
 select count(*),coalesce(sum(debit-credit),0),coalesce(sum(case when account ~* 'accounts payable' then debit-credit else 0 end),0),coalesce(sum(case when account=coalesce(r.payment_account,r.bank_account,'FHB Checking') then credit-debit else 0 end),0)
 into n,bal,payment_ap,payment_cash from public.general_ledger where reference=p_run_no and source='Check Run';
 if n<>2 or abs(bal)>0.005 or abs(payment_ap-r.amount)>0.005 or abs(payment_cash-r.amount)>0.005 then raise exception 'A complete posted payment journal matching this check is required'; end if;
 if exists(select 1 from public.general_ledger where (reference=any(refs) or (reference=p_run_no and source='Check Run')) and coalesce(posting_date,entry_date)>p_date) then raise exception 'Reversal cannot precede the original posting date'; end if;
 select jsonb_agg(jsonb_build_object('id',id,'reference',reference,'account',account,'vendor',vendor,'debit',credit,'credit',debit,'source',source) order by reference,id) into entries from public.general_ledger where (reference=any(refs) and source='Manual Journal') or (reference=p_run_no and source='Check Run');
 fingerprint:=md5(entries::text||to_jsonb(r)::text||p_date::text||trim(p_reason));
 result:=jsonb_build_object('run',r.check_run_no,'check',r.check_no,'vendor',r.vendor,'amount',r.amount,'date',p_date,'reason',trim(p_reason),'entries',entries,'snapshot',fingerprint);
 if p_snapshot is null then return result; end if;
 if p_snapshot<>fingerprint then raise exception 'The entries changed after review. Reopen and review again'; end if;
 for g in select * from public.general_ledger where (reference=any(refs) and source='Manual Journal') or (reference=p_run_no and source='Check Run') loop
   insert into public.general_ledger(entry_date,posting_date,account,customer,vendor,invoice_no,invoice_date,due_date,description,reference,bank_reference,work_order_no,jobsite,equipment,debit,credit,source,status)
   values(p_date,p_date,g.account,g.customer,g.vendor,g.invoice_no,g.invoice_date,g.due_date,'Full cancellation of '||p_run_no||' / '||g.reference||': '||trim(p_reason),case when g.source='Manual Journal' then 'REV-'||g.reference else p_run_no||'-VOID' end,g.bank_reference,g.work_order_no,g.jobsite,g.equipment,g.credit,g.debit,case when g.source='Manual Journal' then 'Manual Journal Reversal' else 'Check Run Void' end,'Posted');
 end loop;
 update public.general_ledger set status='Reversed' where reference=any(refs) and source='Manual Journal';
 insert into public.bank_transactions(tx_date,bank_account,description,reference,amount,status,matched_reference,notes)
 values(p_date,coalesce(r.payment_account,r.bank_account,'FHB Checking'),'Void check '||coalesce(r.check_no,p_run_no),p_run_no||'-VOID',r.amount,'Matched',r.reference,'Full cancellation: '||trim(p_reason));
 update public.check_runs set status='Void',notes=coalesce(notes,'')||E'\n[VOID '||to_char(p_date,'MM/DD/YYYY')||'] '||trim(p_reason)||E'\n[ORIGINAL JOURNALS REVERSED] '||array_to_string(refs,', ')||' | By '||auth.uid()::text where id=r.id;
 return result||jsonb_build_object('completed',true);
end $$;
revoke all on function public.review_or_reverse_check_journals(text,date,text,text) from public,anon;
grant execute on function public.review_or_reverse_check_journals(text,date,text,text) to authenticated;
