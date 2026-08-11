-- Work-order closing dates and mechanic cycle-time reporting.
-- Safe to run more than once.

alter table public.work_orders
  add column if not exists ready_to_close_at timestamptz,
  add column if not exists closed_date date,
  add column if not exists closed_by text;

-- Historical work orders remain unchanged. The application can interpret the
-- older Ready to Close / Closed markers in Notes, while all new activity uses
-- these structured fields.

create index if not exists work_orders_closed_date_idx
  on public.work_orders (closed_date);

grant select, update (ready_to_close_at, closed_date, closed_by)
  on public.work_orders to authenticated;
