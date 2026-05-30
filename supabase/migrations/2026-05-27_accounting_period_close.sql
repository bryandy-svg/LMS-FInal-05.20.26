create table if not exists accounting_periods (
  id uuid primary key default gen_random_uuid(),
  period_name text not null unique,
  closed_through_date date,
  status text not null default 'Open',
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  notes text
);

alter table accounting_periods add column if not exists closed_through_date date;
alter table accounting_periods add column if not exists status text not null default 'Open';
alter table accounting_periods add column if not exists closed_by text;
alter table accounting_periods add column if not exists closed_at timestamptz;
alter table accounting_periods add column if not exists reopened_by text;
alter table accounting_periods add column if not exists reopened_at timestamptz;
alter table accounting_periods add column if not exists notes text;

alter table accounting_periods enable row level security;
drop policy if exists "authenticated full access" on accounting_periods;
create policy "authenticated full access" on accounting_periods
for all to authenticated
using (true)
with check (true);
