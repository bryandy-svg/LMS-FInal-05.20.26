create extension if not exists pgcrypto;

create table if not exists public.fuel_jobsites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fuel_logs (
  id uuid primary key default gen_random_uuid(),
  report_no text,
  fuel_date date,
  jobsite text,
  driver_name text,
  asset_source text,
  asset_tag text,
  equipment_name text,
  gallons numeric default 0,
  time_in time,
  time_out time,
  mileage_hours numeric default 0,
  receiver_name text,
  receiver_signature text,
  notes text,
  status text default 'Posted',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists fuel_logs_report_no_idx on public.fuel_logs(report_no);
create index if not exists fuel_logs_fuel_date_idx on public.fuel_logs(fuel_date);
create index if not exists fuel_logs_asset_tag_idx on public.fuel_logs(asset_tag);
create index if not exists fuel_logs_jobsite_idx on public.fuel_logs(jobsite);

insert into public.app_sequences(key, prefix, next_number)
values ('fuel', 'FUEL-', 1000)
on conflict (key) do nothing;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.fuel_jobsites to anon, authenticated;
grant select, insert, update, delete on table public.fuel_logs to anon, authenticated;
