-- Recoverable full transaction reset for LMS.
--
-- DELETED (with a recoverable JSON snapshot first):
--   Inventory transactions, purchasing, sales, billing, accounting transactions,
--   rentals, loaded beginning balances, and other non-fleet operational records.
--
-- PRESERVED:
--   public.assets (including asset IDs and every QR field), app_profiles/auth users,
--   chart_of_accounts, product SKUs/descriptions/prices/master fields, customers, vendors, mechanics, warehouses,
--   categories, units, asset locations/types, fuel jobsites, fuel logs,
--   equipment requests, outside customer fleet, every work order/issue/part/labor
--   record, every trucking request/schedule/assigned task/ticket, trucking rate
--   sheet, master terms/settings, accounting periods, and sequences.
--
-- No rows are deleted merely by installing this SQL. Deletion happens only when
-- bryan.dy@lmsfm.com calls public.create_recoverable_transaction_reset().

begin;

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
    'approval_queue','audit_log','backup_exports','bank_beginning_balances','bank_transactions',
    'check_runs','customer_payments','document_attachments','general_ledger',
    'goods_receipts','import_reviews','invoice_lines','invoices',
    'master_data_issues','purchase_order_lines','purchase_orders',
    'quotation_lines','quotations','rentals','sales_order_lines','sales_orders',
    'stock_movements','system_notifications'
  ]::text[];
$$;

create or replace function public.transaction_reset_delete_order()
returns text[]
language sql
immutable
as $$
  select array[
    'invoice_lines','purchase_order_lines','goods_receipts','quotation_lines',
    'sales_order_lines',
    'approval_queue','audit_log','backup_exports','bank_beginning_balances','bank_transactions',
    'check_runs','customer_payments','document_attachments','general_ledger',
    'import_reviews','invoices','master_data_issues','purchase_orders',
    'quotations','rentals','sales_orders','stock_movements','system_notifications'
  ]::text[];
$$;

create or replace function public.transaction_reset_restore_order()
returns text[]
language sql
immutable
as $$
  -- The fleet/trucking tables remain here only for backward-compatible recovery
  -- of a snapshot created with an older reset definition. New resets do not
  -- snapshot or delete these preserved tables.
  select array[
    'approval_queue','audit_log','backup_exports','bank_beginning_balances','bank_transactions',
    'check_runs','customer_payments','document_attachments','equipment_requests',
    'fuel_logs','general_ledger','import_reviews','invoices',
    'outside_customer_fleet','purchase_orders','quotations','rentals',
    'sales_orders','stock_movements','system_notifications','trucking_requests',
    'work_orders','invoice_lines','purchase_order_lines','goods_receipts',
    'quotation_lines','sales_order_lines','trucking_moves',
    'trucking_request_lines','work_order_issues','work_order_labor',
    'work_order_parts','master_data_issues'
  ]::text[];
$$;

create or replace function public.transaction_reset_preview()
returns table(table_name text, rows_to_delete bigint)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target text;
  row_count bigint;
begin
  perform public.assert_transaction_reset_owner();
  foreach target in array public.transaction_reset_table_names() loop
    if to_regclass(format('public.%I', target)) is not null then
      execute format('select count(*) from public.%I', target) into row_count;
      table_name := target;
      rows_to_delete := row_count;
      return next;
    end if;
  end loop;

  select count(*) into row_count
  from public.products
  where coalesce(qty, 0) <> 0
     or coalesce(cost, 0) <> 0;
  table_name := 'products (qty/cost reset)';
  rows_to_delete := row_count;
  return next;
end;
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
    if to_regclass(format('public.%I', target)) is not null then
      execute format(
        'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t',
        target
      ) into snapshot;
      insert into public.transaction_reset_backups(reset_id, table_name, rows_json)
      values (reset_uuid, target, snapshot);
    end if;
  end loop;

  -- Product Master is preserved, but its live inventory quantity and cost are
  -- transactional state. Snapshot only those fields so they can be recovered
  -- without deleting or replacing the product master records.
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', p.id,
      'sku', p.sku,
      'qty', p.qty,
      'cost', p.cost
    )),
    '[]'::jsonb
  )
  into snapshot
  from public.products p;

  insert into public.transaction_reset_backups(reset_id, table_name, rows_json)
  values (reset_uuid, '__product_inventory__', snapshot);

  foreach target in array public.transaction_reset_delete_order() loop
    if to_regclass(format('public.%I', target)) is not null then
      -- Supabase safe-update requires an explicit WHERE clause, including for
      -- intentional owner-only full-table resets.
      execute format('delete from public.%I where true', target);
    end if;
  end loop;

  update public.products
  set qty = 0,
      cost = 0
  where true;

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
  writable_columns text;
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
    if to_regclass(format('public.%I', target)) is not null then
      execute format('delete from public.%I where true', target);
    end if;
  end loop;

  foreach target in array public.transaction_reset_restore_order() loop
    select b.rows_json into snapshot
    from public.transaction_reset_backups b
    where b.reset_id = p_reset_id and b.table_name = target;

    if to_regclass(format('public.%I', target)) is not null
       and snapshot is not null
       and jsonb_array_length(snapshot) > 0 then
      select string_agg(format('%I', attribute.attname), ', ' order by attribute.attnum)
      into writable_columns
      from pg_catalog.pg_attribute attribute
      where attribute.attrelid = to_regclass(format('public.%I', target))
        and attribute.attnum > 0
        and not attribute.attisdropped
        and attribute.attgenerated = ''
        and attribute.attidentity <> 'a';

      if writable_columns is null then
        raise exception 'No writable columns found while recovering table %.', target;
      end if;

      execute format(
        'insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
        target, writable_columns, writable_columns, target
      ) using snapshot;
    end if;
  end loop;

  select b.rows_json into snapshot
  from public.transaction_reset_backups b
  where b.reset_id = p_reset_id
    and b.table_name = '__product_inventory__';

  if snapshot is not null and jsonb_array_length(snapshot) > 0 then
    update public.products p
    set qty = saved.qty,
        cost = saved.cost
    from jsonb_to_recordset(snapshot) as saved(
      id uuid,
      sku text,
      qty numeric,
      cost numeric
    )
    where p.id = saved.id
       or (saved.id is null and p.sku = saved.sku);
  end if;

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
returns table(
  id uuid,
  created_at timestamptz,
  created_by text,
  status text,
  recovered_at timestamptz,
  finalized_at timestamptz
)
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
revoke all on function public.transaction_reset_preview() from public;
revoke all on function public.create_recoverable_transaction_reset() from public;
revoke all on function public.recover_transaction_reset(uuid) from public;
revoke all on function public.finalize_transaction_reset(uuid) from public;
revoke all on function public.transaction_reset_status() from public;

grant execute on function public.transaction_reset_preview() to authenticated;
grant execute on function public.create_recoverable_transaction_reset() to authenticated;
grant execute on function public.recover_transaction_reset(uuid) to authenticated;
grant execute on function public.finalize_transaction_reset(uuid) to authenticated;
grant execute on function public.transaction_reset_status() to authenticated;

commit;

-- SAFE PREVIEW (does not delete anything):
-- select * from public.transaction_reset_preview() order by table_name;
--
-- CREATE SNAPSHOT AND DELETE (returns the recovery UUID):
-- select public.create_recoverable_transaction_reset();
--
-- RECOVER BEFORE FINALIZING:
-- select public.recover_transaction_reset('PASTE-RECOVERY-UUID-HERE'::uuid);
--
-- PERMANENTLY DESTROY THE SNAPSHOT (cannot be undone afterward):
-- select public.finalize_transaction_reset('PASTE-RECOVERY-UUID-HERE'::uuid);
