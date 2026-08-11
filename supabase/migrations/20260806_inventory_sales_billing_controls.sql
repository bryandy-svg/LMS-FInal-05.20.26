-- Inventory and Sales & Billing control fields
-- Safe to run more than once.

alter table if exists public.customers
  add column if not exists credit_limit numeric(14,2) not null default 0,
  add column if not exists credit_status text not null default 'Active';

alter table if exists public.customers
  drop constraint if exists customers_credit_limit_nonnegative;

alter table if exists public.customers
  add constraint customers_credit_limit_nonnegative check (credit_limit >= 0);

create index if not exists customers_credit_status_idx
  on public.customers (credit_status);

comment on column public.customers.credit_limit is
  'Zero means no configured limit. Positive values are checked against open AR before new PO/credit sales.';

comment on column public.customers.credit_status is
  'Use Active, Hold, Blocked, or Inactive. Hold/Blocked require Manager or Administrator override.';
