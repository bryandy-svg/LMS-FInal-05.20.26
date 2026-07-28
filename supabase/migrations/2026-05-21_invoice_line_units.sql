alter table invoice_lines
  add column if not exists unit text;
