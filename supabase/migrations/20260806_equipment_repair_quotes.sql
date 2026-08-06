-- Equipment repair quotations created from LMS-owned or outside-customer fleet.
-- Run once in the Supabase SQL Editor before deploying the matching app build.

create table if not exists public.equipment_repair_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  quote_date date not null default current_date,
  expires_on date not null,
  customer_name text not null,
  customer_po text,
  asset_source text not null default 'Fleet & Equipment',
  asset_tag text not null,
  asset_description text,
  outside_fleet_reference text,
  priority text not null default 'Medium',
  scope_of_work text not null,
  parts_amount numeric(14,2) not null default 0,
  labor_amount numeric(14,2) not null default 0,
  other_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  status text not null default 'Pending',
  work_order_no text,
  notes text,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_repair_quotes_expiry_check check (expires_on >= quote_date),
  constraint equipment_repair_quotes_amount_check check (parts_amount >= 0 and labor_amount >= 0 and other_amount >= 0 and total_amount >= 0)
);

create index if not exists equipment_repair_quotes_status_expiry_idx
  on public.equipment_repair_quotes (status, expires_on);
create index if not exists equipment_repair_quotes_asset_idx
  on public.equipment_repair_quotes (asset_source, asset_tag);

alter table public.work_orders
  add column if not exists source_repair_quote_no text;

create index if not exists work_orders_source_repair_quote_no_idx
  on public.work_orders (source_repair_quote_no);

insert into public.app_sequences (key, prefix, next_number)
values ('repair_quote', 'ERQ-', 1001)
on conflict (key) do nothing;

alter table public.equipment_repair_quotes enable row level security;

drop policy if exists "authenticated select equipment repair quotes" on public.equipment_repair_quotes;
create policy "authenticated select equipment repair quotes"
  on public.equipment_repair_quotes for select
  to authenticated
  using (true);

drop policy if exists "authenticated insert equipment repair quotes" on public.equipment_repair_quotes;
create policy "authenticated insert equipment repair quotes"
  on public.equipment_repair_quotes for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update equipment repair quotes" on public.equipment_repair_quotes;
create policy "authenticated update equipment repair quotes"
  on public.equipment_repair_quotes for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated delete equipment repair quotes" on public.equipment_repair_quotes;
create policy "authenticated delete equipment repair quotes"
  on public.equipment_repair_quotes for delete
  to authenticated
  using (true);

-- Supabase Data API exposure is explicit for newly created tables.
grant select, insert, update, delete on table public.equipment_repair_quotes to authenticated;

notify pgrst, 'reload schema';

-- Verification query (should return table/column names after this migration runs):
select
  to_regclass('public.equipment_repair_quotes') as repair_quote_table,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'work_orders'
      and column_name = 'source_repair_quote_no'
  ) as work_order_quote_link_ready;
