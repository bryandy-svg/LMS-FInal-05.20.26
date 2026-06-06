-- LMS Imports control-center support tables.
-- Run this once in each Supabase project: test and production.

create table if not exists public.system_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  severity text default 'Info',
  module text,
  title text not null,
  message text,
  record_ref text,
  assigned_to text,
  status text default 'Open',
  resolved_at timestamptz,
  resolved_by text
);

create table if not exists public.approval_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  module text not null,
  record_ref text,
  approval_type text not null,
  requested_by text,
  assigned_to text,
  status text default 'Pending',
  approved_at timestamptz,
  approved_by text,
  notes text
);

alter table public.approval_queue
  add column if not exists decided_by text,
  add column if not exists decided_at timestamptz;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  event_at timestamptz default now(),
  event_type text not null,
  module text,
  record_ref text,
  user_name text,
  summary text,
  old_value jsonb,
  new_value jsonb,
  source text default 'app'
);

create table if not exists public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  module text,
  record_ref text,
  file_name text,
  file_url text,
  file_type text,
  file_size numeric default 0,
  uploaded_by text,
  notes text
);

create table if not exists public.numbering_sequences (
  id uuid primary key default gen_random_uuid(),
  sequence_key text unique not null,
  prefix text not null,
  next_number integer not null default 1001,
  padding integer not null default 0,
  notes text,
  updated_at timestamptz default now()
);

insert into public.numbering_sequences (sequence_key, prefix, next_number, padding, notes)
values
  ('purchase_order', 'PO-', 1001, 0, 'Purchase orders'),
  ('goods_receipt', 'GR-', 6001, 0, 'Goods receipts'),
  ('work_order', 'WO-', 1001, 0, 'Work orders'),
  ('work_order_invoice', 'WO-', 10001, 0, 'Work order invoices'),
  ('parts_invoice', 'P', 10001, 0, 'Parts sales invoices'),
  ('misc_invoice', 'M', 10001, 0, 'Other sales invoices'),
  ('check_run', 'CHK-', 1001, 0, 'Check runs'),
  ('equipment_request', 'ER-', 1001, 0, 'Equipment requests')
on conflict (sequence_key) do update set
  prefix = excluded.prefix,
  next_number = public.numbering_sequences.next_number,
  padding = excluded.padding,
  notes = excluded.notes,
  updated_at = now();

create table if not exists public.backup_exports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  backup_type text default 'Manual',
  created_by text,
  file_name text,
  row_count numeric default 0,
  status text default 'Recorded',
  notes text
);

create table if not exists public.import_reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  module text,
  file_name text,
  imported_by text,
  total_rows numeric default 0,
  accepted_rows numeric default 0,
  rejected_rows numeric default 0,
  status text default 'Review',
  notes text
);

create table if not exists public.master_data_issues (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  module text,
  record_ref text,
  issue text,
  severity text default 'Review',
  status text default 'Open',
  assigned_to text,
  resolved_at timestamptz,
  resolved_by text
);

create table if not exists public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  period_name text unique,
  start_date date,
  end_date date,
  closed_through_date date,
  status text default 'Open',
  closed_by text,
  closed_at timestamptz,
  reopened_by text,
  reopened_at timestamptz,
  notes text
);

alter table public.accounting_periods add column if not exists start_date date;
alter table public.accounting_periods add column if not exists end_date date;
alter table public.accounting_periods add column if not exists closed_through_date date;
alter table public.accounting_periods add column if not exists reopened_by text;
alter table public.accounting_periods add column if not exists reopened_at timestamptz;
alter table public.numbering_sequences add column if not exists updated_at timestamptz default now();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.system_notifications to anon, authenticated;
grant select, insert, update, delete on table public.approval_queue to anon, authenticated;
grant select, insert, update, delete on table public.audit_log to anon, authenticated;
grant select, insert, update, delete on table public.document_attachments to anon, authenticated;
grant select, insert, update, delete on table public.numbering_sequences to anon, authenticated;
grant select, insert, update, delete on table public.backup_exports to anon, authenticated;
grant select, insert, update, delete on table public.import_reviews to anon, authenticated;
grant select, insert, update, delete on table public.master_data_issues to anon, authenticated;
grant select, insert, update, delete on table public.accounting_periods to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
