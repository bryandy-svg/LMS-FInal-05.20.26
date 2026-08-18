alter table public.general_ledger
  add column if not exists work_order_no text,
  add column if not exists jobsite text,
  add column if not exists equipment text;

create index if not exists general_ledger_work_order_no_idx
  on public.general_ledger (work_order_no);
