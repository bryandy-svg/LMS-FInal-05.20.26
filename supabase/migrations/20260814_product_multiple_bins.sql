-- Allows one Product Master SKU to be stored in more than one warehouse/bin.
-- Stock quantities remain controlled by stock_movements; this table is the allowed location list.

create table if not exists public.product_bins (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse text not null,
  bin_shelf text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_bins_location_unique unique (product_id, warehouse, bin_shelf)
);

create index if not exists product_bins_product_id_idx on public.product_bins(product_id);

insert into public.product_bins (product_id, warehouse, bin_shelf, is_primary)
select id, trim(warehouse), trim(bin_shelf), true
from public.products
where nullif(trim(coalesce(warehouse, '')), '') is not null
  and nullif(trim(coalesce(bin_shelf, '')), '') is not null
on conflict (product_id, warehouse, bin_shelf)
do update set is_primary = true, updated_at = now();

alter table public.product_bins enable row level security;

drop policy if exists "authenticated full access" on public.product_bins;
create policy "authenticated full access"
on public.product_bins for all to authenticated
using (true) with check (true);

