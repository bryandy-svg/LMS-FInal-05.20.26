create table if not exists public.customer_equipment_forms (
  id uuid primary key default gen_random_uuid(),
  form_no text not null unique,
  form_type text not null check (form_type in ('Drop-Off', 'Acceptance/Release')),
  form_date date not null default current_date,
  customer_name text not null,
  customer_reference text,
  asset_source text,
  asset_tag text not null,
  equipment_name text,
  serial_no text,
  license_plate text,
  work_order_no text,
  linked_dropoff_no text,
  issues_reported text,
  condition_notes text,
  accessories_received text,
  work_completed text,
  release_condition text,
  customer_print_name text not null,
  head_mechanic_name text not null,
  customer_signature_data_url text not null,
  head_mechanic_signature_data_url text not null,
  status text not null default 'Completed',
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_equipment_forms enable row level security;

drop policy if exists "customer equipment forms select" on public.customer_equipment_forms;
create policy "customer equipment forms select" on public.customer_equipment_forms
for select to authenticated using ((select auth.uid()) is not null);

drop policy if exists "customer equipment forms insert" on public.customer_equipment_forms;
create policy "customer equipment forms insert" on public.customer_equipment_forms
for insert to authenticated with check ((select auth.uid()) is not null);

drop policy if exists "customer equipment forms update" on public.customer_equipment_forms;
create policy "customer equipment forms update" on public.customer_equipment_forms
for update to authenticated using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

grant select, insert, update on public.customer_equipment_forms to authenticated;

create index if not exists customer_equipment_forms_customer_idx on public.customer_equipment_forms (customer_name);
create index if not exists customer_equipment_forms_asset_idx on public.customer_equipment_forms (asset_tag);
create index if not exists customer_equipment_forms_type_date_idx on public.customer_equipment_forms (form_type, form_date desc);
