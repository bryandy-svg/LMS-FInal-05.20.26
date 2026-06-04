-- LMS Imports production zero-balance reset
-- Run this in the PROD Supabase SQL Editor when you want production to start with:
--   inventory balance/value = 0
--   stock movement = 0
--   general ledger = 0
--   AP/AR/sales/purchase/repair/rental transactions = 0
--   Trial Balance = 0, because Trial Balance is generated from General Ledger
--
-- This keeps master records:
--   assets and QR codes, fleet values, equipment requests, products/SKUs,
--   vendors, customers, users, mechanics, chart of accounts, locations,
--   terms, categories, units, warehouses.

do $$
declare
  t text;
  tables_to_clear text[] := array[
    -- Child/detail rows first
    'invoice_lines',
    'sales_order_lines',
    'purchase_order_lines',
    'work_order_labor',
    'work_order_parts',
    'work_order_issues',
    'equipment_request_items',

    -- Operating/financial transactions
    'customer_payments',
    'check_runs',
    'bank_transactions',
    'bank_beginning_balances',
    'invoices',
    'rentals',
    'sales_orders',
    'goods_receipts',
    'purchase_orders',
    'landed_costs',
    'landed_cost_lines',
    'work_orders',

    -- Ledgers and period locks
    'stock_movements',
    'general_ledger',
    'accounting_periods'
  ];
begin
  foreach t in array tables_to_clear loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I', t);
      raise notice 'Cleared table: %', t;
    else
      raise notice 'Skipped missing table: %', t;
    end if;
  end loop;

  -- Force-clear the two screens shown in the app: Stock Movement and GL Details.
  if to_regclass('public.stock_movements') is not null then
    delete from public.stock_movements;
  end if;

  if to_regclass('public.general_ledger') is not null then
    delete from public.general_ledger;
  end if;

  -- Product master stays, but every inventory quantity column must be zero.
  if to_regclass('public.products') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'products' and column_name = 'qty'
    ) then
      update public.products set qty = 0;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'products' and column_name = 'on_hand'
    ) then
      update public.products set on_hand = 0;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'products' and column_name = 'quantity_on_hand'
    ) then
      update public.products set quantity_on_hand = 0;
    end if;

    raise notice 'Product inventory quantities reset to zero. Product master rows were kept.';
  else
    raise notice 'Skipped missing table: products';
  end if;

  -- If a future multi-location inventory table exists, keep the location master but zero/delete balances.
  if to_regclass('public.product_locations') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'product_locations' and column_name = 'qty'
    ) then
      update public.product_locations set qty = 0;
      raise notice 'Product location quantities reset to zero.';
    end if;
  end if;

  if to_regclass('public.inventory_locations') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'inventory_locations' and column_name = 'qty'
    ) then
      update public.inventory_locations set qty = 0;
      raise notice 'Inventory location quantities reset to zero.';
    end if;
  end if;

  -- Reset document numbering for clean new transactions.
  if to_regclass('public.app_sequences') is not null then
    update public.app_sequences set next_number = 1001 where key in ('product','vendor','customer','asset','mechanic','invoice','payment','checkrun','equipment_request','outside_fleet');
    update public.app_sequences set next_number = 7001 where key = 'po';
    update public.app_sequences set next_number = 6001 where key = 'gr';
    update public.app_sequences set next_number = 1001 where key = 'so';
    update public.app_sequences set next_number = 1000 where key = 'wo';
    update public.app_sequences set next_number = 3001 where key = 'rental';
    update public.app_sequences set next_number = 5001 where key = 'stock';
    raise notice 'Document sequences reset.';
  end if;
end $$;

-- Verification 1: these should all return 0 rows.
select 'general_ledger' as area, count(*) as rows_remaining from public.general_ledger
union all select 'stock_movements', count(*) from public.stock_movements
union all select 'purchase_orders', count(*) from public.purchase_orders
union all select 'goods_receipts', count(*) from public.goods_receipts
union all select 'sales_orders', count(*) from public.sales_orders
union all select 'invoices', count(*) from public.invoices
union all select 'customer_payments', count(*) from public.customer_payments
union all select 'check_runs', count(*) from public.check_runs
union all select 'work_orders', count(*) from public.work_orders;

-- Verification 2: product master remains, but quantity/value should be zero.
select
  count(*) as product_master_rows_kept,
  coalesce(sum(qty), 0) as total_qty_after_reset,
  coalesce(sum(qty * coalesce(cost, 0)), 0) as total_inventory_value_after_reset
from public.products;

-- Verification 3: this should return no rows.
select
  sku,
  name,
  source_vendor,
  warehouse,
  bin_shelf,
  qty,
  cost,
  qty * coalesce(cost, 0) as inventory_value
from public.products
where coalesce(qty, 0) <> 0
order by sku
limit 50;
