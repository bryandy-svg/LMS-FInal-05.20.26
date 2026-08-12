alter table public.invoices
  add column if not exists void_date date,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by text,
  add column if not exists void_reason text;

comment on column public.invoices.void_date is
  'User-selected posting date for the balanced invoice void/reversal entry.';

comment on column public.invoices.voided_at is
  'System timestamp when the void workflow was completed.';

alter table public.work_orders
  add column if not exists void_date date;

comment on column public.work_orders.void_date is
  'User-selected void date validated against the open accounting period.';
