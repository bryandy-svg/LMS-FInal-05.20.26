create table if not exists public.transaction_reset_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text not null,
  status text not null default 'Recoverable'
    check (status in ('Recoverable', 'Recovered', 'Finalized')),
  recovered_at timestamptz,
  finalized_at timestamptz
);

create table if not exists public.transaction_reset_backups (
  reset_id uuid not null references public.transaction_reset_runs(id) on delete cascade,
  table_name text not null,
  rows_json jsonb not null default '[]'::jsonb,
  primary key (reset_id, table_name)
);

alter table public.transaction_reset_runs enable row level security;
alter table public.transaction_reset_backups enable row level security;

create or replace function public.assert_transaction_reset_owner()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'bryan.dy@lmsfm.com' then
    raise exception 'Only bryan.dy@lmsfm.com can manage transaction resets.';
  end if;
end;
$$;

create or replace function public.transaction_reset_table_names()
returns text[]
language sql
immutable
as $$
  select array[
    'approval_queue','audit_log','backup_exports','bank_transactions',
    'check_runs','customer_payments','document_attachments','equipment_requests',
    'general_ledger','goods_receipts','import_reviews','invoice_lines','invoices',
    'master_data_issues','purchase_order_lines','purchase_orders',
    'quotation_lines','quotations','rentals','sales_order_lines','sales_orders',
    'stock_movements','system_notifications','trucking_moves',
    'trucking_request_lines','trucking_requests','work_order_issues',
    'work_order_labor','work_order_parts','work_orders'
  ]::text[];
$$;

create or replace function public.transaction_reset_delete_order()
returns text[]
language sql
immutable
as $$
  select array[
    'invoice_lines','purchase_order_lines','goods_receipts','quotation_lines',
    'sales_order_lines','trucking_request_lines','trucking_moves',
    'work_order_issues','work_order_labor','work_order_parts',
    'approval_queue','audit_log','backup_exports','bank_transactions',
    'check_runs','customer_payments','document_attachments','equipment_requests',
    'general_ledger','import_reviews','invoices','master_data_issues',
    'purchase_orders','quotations','rentals','sales_orders','stock_movements',
    'system_notifications','trucking_requests','work_orders'
  ]::text[];
$$;

create or replace function public.transaction_reset_restore_order()
returns text[]
language sql
immutable
as $$
  select array[
    'approval_queue','audit_log','backup_exports','bank_transactions',
    'check_runs','customer_payments','document_attachments','equipment_requests',
    'general_ledger','import_reviews','invoices','purchase_orders','quotations',
    'rentals','sales_orders','stock_movements','system_notifications',
    'trucking_requests','work_orders','invoice_lines','purchase_order_lines',
    'goods_receipts','quotation_lines','sales_order_lines','trucking_moves',
    'trucking_request_lines','work_order_issues','work_order_labor',
    'work_order_parts','master_data_issues'
  ]::text[];
$$;

create or replace function public.create_recoverable_transaction_reset()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  reset_uuid uuid;
  target text;
  snapshot jsonb;
begin
  perform public.assert_transaction_reset_owner();
  perform pg_advisory_xact_lock(hashtext('lms-recoverable-transaction-reset'));

  if exists (select 1 from public.transaction_reset_runs where status = 'Recoverable') then
    raise exception 'A recoverable reset already exists. Recover or finalize it first.';
  end if;

  insert into public.transaction_reset_runs(created_by)
  values (lower(auth.jwt() ->> 'email'))
  returning id into reset_uuid;

  foreach target in array public.transaction_reset_table_names() loop
    execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t', target)
      into snapshot;
    insert into public.transaction_reset_backups(reset_id, table_name, rows_json)
    values (reset_uuid, target, snapshot);
  end loop;

  foreach target in array public.transaction_reset_delete_order() loop
    execute format('delete from public.%I', target);
  end loop;

  return reset_uuid;
end;
$$;

create or replace function public.recover_transaction_reset(p_reset_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target text;
  snapshot jsonb;
begin
  perform public.assert_transaction_reset_owner();
  perform pg_advisory_xact_lock(hashtext('lms-recoverable-transaction-reset'));

  if not exists (
    select 1 from public.transaction_reset_runs
    where id = p_reset_id and status = 'Recoverable'
  ) then
    raise exception 'Recoverable reset not found.';
  end if;

  foreach target in array public.transaction_reset_delete_order() loop
    execute format('delete from public.%I', target);
  end loop;

  foreach target in array public.transaction_reset_restore_order() loop
    select rows_json into snapshot
    from public.transaction_reset_backups
    where reset_id = p_reset_id and table_name = target;
    if snapshot is not null and jsonb_array_length(snapshot) > 0 then
      execute format(
        'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',
        target, target
      ) using snapshot;
    end if;
  end loop;

  update public.transaction_reset_runs
  set status = 'Recovered', recovered_at = now()
  where id = p_reset_id;
end;
$$;

create or replace function public.finalize_transaction_reset(p_reset_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_transaction_reset_owner();
  perform pg_advisory_xact_lock(hashtext('lms-recoverable-transaction-reset'));

  if not exists (
    select 1 from public.transaction_reset_runs
    where id = p_reset_id and status = 'Recoverable'
  ) then
    raise exception 'Recoverable reset not found.';
  end if;

  delete from public.transaction_reset_backups where reset_id = p_reset_id;
  update public.transaction_reset_runs
  set status = 'Finalized', finalized_at = now()
  where id = p_reset_id;
end;
$$;

create or replace function public.transaction_reset_status()
returns table(id uuid, created_at timestamptz, created_by text, status text, recovered_at timestamptz, finalized_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_transaction_reset_owner();
  return query
    select r.id, r.created_at, r.created_by, r.status, r.recovered_at, r.finalized_at
    from public.transaction_reset_runs r
    order by r.created_at desc
    limit 10;
end;
$$;

revoke all on function public.assert_transaction_reset_owner() from public;
revoke all on function public.create_recoverable_transaction_reset() from public;
revoke all on function public.recover_transaction_reset(uuid) from public;
revoke all on function public.finalize_transaction_reset(uuid) from public;
revoke all on function public.transaction_reset_status() from public;

grant execute on function public.create_recoverable_transaction_reset() to authenticated;
grant execute on function public.recover_transaction_reset(uuid) to authenticated;
grant execute on function public.finalize_transaction_reset(uuid) to authenticated;
grant execute on function public.transaction_reset_status() to authenticated;
