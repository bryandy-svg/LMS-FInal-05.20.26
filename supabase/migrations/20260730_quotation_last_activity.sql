alter table public.quotations
  add column if not exists last_activity_at timestamptz not null default now();

update public.quotations
set last_activity_at = coalesce(last_activity_at, quote_date::timestamptz, now());
