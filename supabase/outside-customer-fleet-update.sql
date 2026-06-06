create table if not exists outside_customer_fleet (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_name text not null,
  po_no text,
  vin text,
  model text,
  make text,
  description text,
  status text not null default 'Open',
  wo_no text,
  notes text,
  created_at timestamptz not null default now()
);

alter table outside_customer_fleet enable row level security;

insert into app_sequences(key, prefix, next_number)
values ('outside_fleet', 'OC-', 1001)
on conflict (key) do nothing;

drop policy if exists "authenticated full access" on outside_customer_fleet;
create policy "authenticated full access" on outside_customer_fleet for all to authenticated using (true) with check (true);
