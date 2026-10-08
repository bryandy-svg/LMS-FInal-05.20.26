alter table public.quotations add column if not exists freight_amount numeric(14,2) not null default 0 check (freight_amount >= 0);
