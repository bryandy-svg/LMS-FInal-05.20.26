-- Reusable customer-billing labor rates for Work Orders.

create table if not exists public.labor_pricing_rates (
  id uuid primary key default gen_random_uuid(),
  rate_type text not null check (rate_type in ('Internal', 'External Customer', 'Special Rate')),
  rate_name text not null,
  hourly_rate numeric(12,2) not null default 0 check (hourly_rate >= 0),
  description text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists labor_pricing_rates_type_name_uq
  on public.labor_pricing_rates (lower(rate_type), lower(rate_name));

insert into public.labor_pricing_rates (rate_type, rate_name, hourly_rate, description)
values
  ('Internal', 'Internal', 0, 'Approved internal work-order labor billing rate.'),
  ('External Customer', 'External Customer', 0, 'Approved external-customer work-order labor billing rate.')
on conflict do nothing;

alter table public.labor_pricing_rates enable row level security;

drop policy if exists "authenticated full access labor pricing rates" on public.labor_pricing_rates;
create policy "authenticated full access labor pricing rates"
on public.labor_pricing_rates for all to authenticated
using (true) with check (true);

grant select, insert, update on table public.labor_pricing_rates to authenticated;
