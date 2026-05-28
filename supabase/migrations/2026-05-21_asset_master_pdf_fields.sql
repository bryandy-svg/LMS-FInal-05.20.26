alter table assets
  add column if not exists general_type text,
  add column if not exists old_qr_code text,
  add column if not exists last_update_date date,
  add column if not exists qr_printed_tagged text;
