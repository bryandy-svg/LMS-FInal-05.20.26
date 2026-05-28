-- LMS Imports inventory, fleet, repairs, rentals, and accounting schema for Supabase.
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique not null,
  full_name text not null,
  role text not null default 'User',
  modules text[] not null default array['dashboard'],
  created_at timestamptz not null default now()
);

create table if not exists app_sequences (
  key text primary key,
  prefix text not null,
  next_number integer not null
);

create table if not exists master_terms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  days integer not null default 0
);

create table if not exists incoterms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  notes text
);

create table if not exists standard_po_notes (
  id uuid primary key default gen_random_uuid(),
  title text unique not null,
  body text not null
);

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  name text unique not null,
  email text,
  phone text,
  address text,
  terms text,
  tax_id text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  name text unique not null,
  email text,
  phone text,
  address text,
  terms text,
  tax_id text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  address text,
  notes text
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text not null,
  unit text not null,
  warehouse text not null,
  bin_shelf text,
  qty numeric not null default 0,
  reorder_point numeric not null default 0,
  cost numeric,
  selling_price numeric,
  markup_percent numeric,
  source_vendor text,
  photo_url text,
  barcode text,
  batch_lot text,
  expiry_date date,
  status text not null default 'Active',
  compatible_with text,
  notes text,
  created_at timestamptz not null default now(),
  constraint product_price_rule check (
    (selling_price is not null and markup_percent is null)
    or (selling_price is null and markup_percent is not null)
    or (selling_price is null and markup_percent is null)
  )
);

create table if not exists product_alternates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  alternate_sku text not null
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  reference_no text unique not null,
  movement_date date not null,
  type text not null,
  product_id uuid references products(id),
  sku text not null,
  product_name text,
  vendor text,
  sold_to text,
  sold_date date,
  qty numeric not null,
  from_warehouse text,
  from_bin_shelf text,
  to_warehouse text,
  to_bin_shelf text,
  unit_fifo_cost numeric,
  total_fifo_cost numeric,
  document_no text,
  entered_by text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text unique not null,
  vendor text not null,
  po_date date not null,
  jobsite_project text not null default 'General',
  expected_date date,
  payment_terms text,
  incoterm text,
  foreign_order boolean not null default false,
  foreign_country text,
  currency_code text not null default 'USD',
  exchange_rate numeric not null default 1,
  freight_amount numeric not null default 0,
  landed_cost_enabled boolean not null default false,
  landed_cost_method text not null default 'By Value',
  duty_amount numeric not null default 0,
  other_landed_cost_amount numeric not null default 0,
  vendor_invoice_no text,
  vendor_invoice_date date,
  due_date date,
  vendor_invoice_amount numeric default 0,
  posting_date date,
  match_status text not null default 'Pending',
  payment_status text not null default 'Not Ready',
  status text not null default 'Draft',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  po_id uuid references purchase_orders(id) on delete cascade,
  wo_no text,
  product_id uuid references products(id),
  sku text not null,
  product_name text,
  unit text,
  qty numeric not null check (qty >= 0),
  foreign_unit_cost numeric not null default 0,
  unit_cost numeric not null default 0,
  allocated_landed_cost numeric not null default 0,
  landed_unit_cost numeric not null default 0,
  amount numeric generated always as (qty * unit_cost) stored
);

create table if not exists goods_receipts (
  id uuid primary key default gen_random_uuid(),
  gr_no text unique not null,
  gr_date date not null,
  po_id uuid references purchase_orders(id) on delete cascade,
  po_no text not null,
  vendor text,
  product_id uuid references products(id),
  sku text not null,
  product_name text,
  ordered_qty numeric not null default 0,
  received_qty numeric not null default 0,
  unit_cost numeric not null default 0,
  received_amount numeric generated always as (received_qty * unit_cost) stored,
  receipt_warehouse text,
  receipt_bin_shelf text,
  vendor_invoice_no text,
  vendor_invoice_date date,
  vendor_invoice_amount numeric default 0,
  received_by text,
  receipt_type text not null default 'Partial',
  status text not null default 'Received',
  notes text,
  constraint received_not_more_than_ordered check (received_qty <= ordered_qty)
);

create table if not exists sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer text not null,
  customer_po text,
  payment_mode text not null default 'PO',
  manager_override boolean not null default false,
  override_by text,
  override_reason text,
  order_date date not null,
  status text not null default 'Open',
  invoice_no text,
  notes text,
  created_at timestamptz not null default now(),
  constraint customer_po_or_override check (
    coalesce(customer_po, '') <> ''
    or (manager_override = true and coalesce(override_by, '') <> '' and coalesce(override_reason, '') <> '')
  )
);

create table if not exists sales_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references sales_orders(id) on delete cascade,
  product_id uuid references products(id),
  sku text not null,
  product_name text,
  qty numeric not null check (qty >= 0),
  price numeric not null default 0,
  amount numeric generated always as (qty * price) stored
);

create table if not exists asset_locations (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  gps text,
  notes text
);

create table if not exists asset_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text unique not null,
  type text not null,
  general_type text,
  name text not null,
  make text,
  model text,
  year text,
  color text,
  vin_serial text,
  plate text,
  location text,
  parent_asset_id uuid references assets(id) on delete set null,
  parent_asset_tag text,
  relationship_type text,
  compatible_with text,
  old_qr_code text,
  last_update_date date,
  qr_printed_tagged text,
  gps_location text,
  scanned_date timestamptz,
  repair_po_no text,
  status text not null default 'In Service',
  odometer numeric default 0,
  engine_hours numeric default 0,
  fuel_power text,
  assigned_operator text,
  requested_by text,
  approved_by text,
  purchase_date date,
  purchase_cost numeric default 0,
  insurance_policy text,
  registration_expiry date,
  photo_url text,
  qr_update_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists mechanics (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  name text unique not null,
  hourly_rate numeric not null default 0,
  phone text,
  email text,
  specialty text,
  status text not null default 'Active',
  notes text
);

create table if not exists equipment_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text unique not null,
  request_date date not null default current_date,
  asset_id uuid references assets(id) on delete set null,
  asset_tag text,
  asset_name text,
  requested_by text not null,
  requested_signature text,
  po_no text,
  from_date date not null,
  to_date date not null,
  approved_by text,
  status text not null default 'Requested',
  notes text,
  created_at timestamptz not null default now(),
  constraint equipment_requests_date_check check (to_date >= from_date)
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  wo_no text unique not null,
  wo_date date not null,
  asset_id uuid references assets(id),
  asset_tag text,
  bill_to_customer text,
  customer_po text,
  manager_override boolean not null default false,
  override_by text,
  override_reason text,
  work_type text not null default 'Repair',
  priority text not null default 'Medium',
  vendor_shop text,
  odometer numeric default 0,
  engine_hours numeric default 0,
  description text,
  status text not null default 'Open',
  next_due_date date,
  next_due_odometer numeric default 0,
  next_due_hours numeric default 0,
  invoice_no text,
  notes text,
  created_at timestamptz not null default now(),
  constraint wo_po_or_override check (
    coalesce(customer_po, '') <> ''
    or (manager_override = true and coalesce(override_by, '') <> '' and coalesce(override_reason, '') <> '')
    or coalesce(bill_to_customer, '') = ''
  )
);

create table if not exists work_order_issues (
  id uuid primary key default gen_random_uuid(),
  wo_id uuid references work_orders(id) on delete cascade,
  issue_date date not null,
  issue text not null,
  status text not null default 'Open',
  assigned_mechanic text,
  work_notes text
);

create table if not exists work_order_parts (
  id uuid primary key default gen_random_uuid(),
  wo_id uuid references work_orders(id) on delete cascade,
  issue text,
  product_id uuid references products(id),
  sku text not null,
  product_name text,
  qty_needed numeric not null default 0,
  unit_cost numeric not null default 0,
  amount numeric generated always as (qty_needed * unit_cost) stored,
  availability text not null default 'OK',
  status text not null default 'Reserved',
  accepted_qty numeric not null default 0,
  notes text
);

create table if not exists work_order_labor (
  id uuid primary key default gen_random_uuid(),
  wo_id uuid references work_orders(id) on delete cascade,
  mechanic text not null,
  issue text,
  clock_in timestamptz,
  clock_out timestamptz,
  hourly_rate numeric not null default 0,
  work_done text,
  constraint clock_out_not_before_in check (clock_out is null or clock_in is null or clock_out >= clock_in)
);

create table if not exists rentals (
  id uuid primary key default gen_random_uuid(),
  rental_no text unique not null,
  customer text not null,
  customer_po text,
  manager_override boolean not null default false,
  override_by text,
  override_reason text,
  item_type text not null,
  item_id uuid,
  item_ref text,
  start_date date not null,
  end_date date,
  invoice_timing text not null default 'At start',
  rate_type text not null default 'Daily',
  rate numeric not null default 0,
  deposit numeric not null default 0,
  status text not null default 'Reserved',
  checkout_reading text,
  return_reading text,
  invoice_no text,
  notes text
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  invoice_date date not null,
  due_date date not null,
  customer text not null,
  type text not null,
  source_ref text,
  status text not null default 'Open',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  unit text,
  qty numeric not null default 1,
  rate numeric not null default 0,
  amount numeric generated always as (qty * rate) stored
);

create table if not exists customer_payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique not null,
  payment_date date not null,
  customer text not null,
  invoice_no text,
  amount numeric not null default 0,
  method text,
  bank_reference text,
  status text not null default 'Posted',
  notes text
);

create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  old_account text,
  old_account_code text,
  account_code text,
  account text unique not null,
  report_group text,
  type text not null,
  normal_balance text not null,
  notes text
);

alter table chart_of_accounts add column if not exists old_account text;
alter table chart_of_accounts add column if not exists old_account_code text;
alter table chart_of_accounts add column if not exists account_code text;
alter table chart_of_accounts add column if not exists report_group text;

create table if not exists general_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  posting_date date not null,
  account text not null,
  customer text,
  vendor text,
  invoice_no text,
  invoice_date date,
  due_date date,
  mechanic text,
  asset text,
  description text,
  reference text,
  debit numeric not null default 0,
  credit numeric not null default 0,
  source text,
  status text not null default 'Posted',
  created_at timestamptz not null default now()
);

create table if not exists bank_transactions (
  id uuid primary key default gen_random_uuid(),
  tx_date date not null,
  bank_account text,
  description text,
  reference text,
  amount numeric not null default 0,
  status text not null default 'Unmatched',
  matched_reference text,
  notes text
);

alter table bank_transactions add column if not exists bank_account text;

create table if not exists bank_beginning_balances (
  id uuid primary key default gen_random_uuid(),
  bank_account text not null,
  as_of_date date not null,
  beginning_balance numeric not null default 0,
  notes text,
  unique(bank_account, as_of_date)
);

create table if not exists accounting_periods (
  id uuid primary key default gen_random_uuid(),
  period_name text not null unique,
  closed_through_date date,
  status text not null default 'Open',
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  notes text
);

create table if not exists check_runs (
  id uuid primary key default gen_random_uuid(),
  check_run_no text unique not null,
  payment_date date not null,
  payment_mode text not null default 'Check',
  payment_account text not null,
  bank_account text,
  check_no text,
  vendor text,
  reference text,
  invoice_no text,
  invoice_date date,
  due_date date,
  amount numeric not null default 0,
  status text not null default 'Draft',
  notes text
);

insert into app_sequences(key, prefix, next_number) values
('product', 'SKU-', 1001),
('vendor', 'V-', 1001),
('customer', 'C-', 1001),
('po', 'PO-', 7001),
('gr', 'GR-', 6001),
('so', 'SO-', 1001),
('asset', 'AST-', 1001),
('wo', 'WO-', 1000),
('mechanic', 'M-', 1001),
('rental', 'R-', 3001),
('invoice', 'INV-', 1001),
('payment', 'PAY-', 1001),
('checkrun', 'CHK-', 1001),
('equipment_request', 'ER-', 1001),
('stock', 'SM-', 5001)
on conflict (key) do nothing;

insert into master_terms(name, days) values ('Due on receipt',0), ('Net 15',15), ('Net 30',30), ('Net 45',45), ('Net 60',60), ('Net 90',90), ('50% payment upon order',0)
on conflict (name) do update set days = excluded.days;
insert into incoterms(name, notes) values ('FOB','Free on Board'), ('CIF','Cost, Insurance, and Freight'), ('DDP','Delivered Duty Paid'), ('EXW','Ex Works')
on conflict (name) do update set notes = excluded.notes;
insert into standard_po_notes(title, body) values
('Standard receiving note','Vendor must include PO number, packing slip, and invoice reference with every shipment.'),
('Freight note','Freight charges must be shown separately from parts or material cost.'),
('Warranty note','All parts are subject to manufacturer warranty and return approval.')
on conflict (title) do update set body = excluded.body;
insert into warehouses(name) values ('Main'), ('Back Room'), ('Showroom'), ('Transit')
on conflict (name) do nothing;
insert into categories(name) values ('Finished Goods'), ('Packaging'), ('Supplies'), ('Service Parts')
on conflict (name) do nothing;
insert into units(name) values ('Each'), ('Box'), ('Set'), ('Hour'), ('Day')
on conflict (name) do nothing;
insert into asset_types(name) values ('Vehicle'), ('Heavy Equipment'), ('Trailer'), ('Generator'), ('Compressor')
on conflict (name) do nothing;
insert into asset_locations(name) values ('Main'), ('Warehouse'), ('Job Site'), ('Yard')
on conflict (name) do nothing;

alter table app_profiles enable row level security;
alter table app_sequences enable row level security;
alter table master_terms enable row level security;
alter table incoterms enable row level security;
alter table standard_po_notes enable row level security;
alter table vendors enable row level security;
alter table customers enable row level security;
alter table warehouses enable row level security;
alter table categories enable row level security;
alter table units enable row level security;
alter table products enable row level security;
alter table product_alternates enable row level security;
alter table stock_movements enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_lines enable row level security;
alter table goods_receipts enable row level security;
alter table sales_orders enable row level security;
alter table sales_order_lines enable row level security;
alter table asset_locations enable row level security;
alter table asset_types enable row level security;
alter table assets enable row level security;
alter table equipment_requests enable row level security;
alter table mechanics enable row level security;
alter table work_orders enable row level security;
alter table work_order_issues enable row level security;
alter table work_order_parts enable row level security;
alter table work_order_labor enable row level security;
alter table rentals enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table customer_payments enable row level security;
alter table chart_of_accounts enable row level security;
alter table general_ledger enable row level security;
alter table accounting_periods enable row level security;
alter table bank_transactions enable row level security;
alter table check_runs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'app_profiles','app_sequences','master_terms','incoterms','standard_po_notes','vendors','customers','warehouses','categories','units','products','product_alternates',
    'stock_movements','purchase_orders','purchase_order_lines','goods_receipts','sales_orders','sales_order_lines','asset_locations','asset_types',
    'assets','equipment_requests','mechanics','work_orders','work_order_issues','work_order_parts','work_order_labor','rentals','invoices','invoice_lines',
    'customer_payments','chart_of_accounts','general_ledger','accounting_periods','bank_transactions','check_runs'
  ] loop
    execute format('drop policy if exists "authenticated full access" on %I', t);
    execute format('create policy "authenticated full access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true), ('asset-photos', 'asset-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "authenticated app photo access" on storage.objects;
create policy "authenticated app photo access"
on storage.objects for all
to authenticated
using (bucket_id in ('product-photos', 'asset-photos'))
with check (bucket_id in ('product-photos', 'asset-photos'));
