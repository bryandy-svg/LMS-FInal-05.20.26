alter table public.check_runs add column if not exists posting_date date;
comment on column public.check_runs.posting_date is 'Accounting posting date. Legacy rows with null use payment_date. Payment date remains the printed check date.';
notify pgrst, 'reload schema';
