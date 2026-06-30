create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_no text unique not null,
  customer text not null,
  customer_po text,
  quote_date date not null,
  valid_until date,
  status text not null default 'Draft',
  accepted_date date,
  sales_order_no text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotation_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotations(id) on delete cascade,
  product_id uuid references public.products(id),
  sku text not null,
  product_name text,
  unit text,
  qty numeric not null check (qty >= 0),
  price numeric not null default 0,
  amount numeric generated always as (qty * price) stored
);

alter table public.quotations enable row level security;
alter table public.quotation_lines enable row level security;

drop policy if exists "authenticated full access" on public.quotations;
create policy "authenticated full access" on public.quotations
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on public.quotation_lines;
create policy "authenticated full access" on public.quotation_lines
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.quotations to authenticated;
grant select, insert, update, delete on table public.quotation_lines to authenticated;

insert into public.app_sequences(key, prefix, next_number)
values ('quote', 'QT-', 1001)
on conflict (key) do nothing;
