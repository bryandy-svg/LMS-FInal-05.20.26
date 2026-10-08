alter table public.invoices
  add column if not exists signature_data_url text,
  add column if not exists signature_printed_name text,
  add column if not exists signature_signed_date text,
  add column if not exists internal_signature_data_url text,
  add column if not exists internal_signature_name text,
  add column if not exists internal_signature_remarks text;
