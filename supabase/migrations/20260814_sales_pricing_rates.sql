-- Reusable Sales Order pricing categories calculated from inventory/FIFO unit cost.

create table if not exists public.sales_pricing_rates (
  id uuid primary key default gen_random_uuid(),
  rate_type text not null check (rate_type in ('Internal', 'External Customer', 'Special Markup')),
  rate_name text not null,
  markup_percent numeric(10,4) not null default 0 check (markup_percent >= -100 and markup_percent <= 10000),
  description text,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sales_pricing_rates_type_name_uq
  on public.sales_pricing_rates (lower(rate_type), lower(rate_name));

insert into public.sales_pricing_rates (rate_type, rate_name, markup_percent, description)
values
  ('Internal', 'Internal', 0, 'Internal company pricing. Update the markup percentage to the approved internal rate.'),
  ('External Customer', 'External Customer', 0, 'External customer pricing. Update the markup percentage to the approved external rate.')
on conflict do nothing;

alter table public.sales_pricing_rates enable row level security;

drop policy if exists "authenticated full access sales pricing rates" on public.sales_pricing_rates;
create policy "authenticated full access sales pricing rates"
on public.sales_pricing_rates for all to authenticated
using (true) with check (true);

grant select, insert, update on table public.sales_pricing_rates to authenticated;

alter table public.sales_orders
  add column if not exists pricing_rate_id uuid references public.sales_pricing_rates(id) on delete set null,
  add column if not exists pricing_rate_name text,
  add column if not exists pricing_markup_percent numeric(10,4);

grant select, insert, update on table public.sales_orders to authenticated;
