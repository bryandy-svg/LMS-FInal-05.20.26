alter table goods_receipts
  add column if not exists vendor_invoice_no text,
  add column if not exists vendor_invoice_date date,
  add column if not exists vendor_invoice_amount numeric default 0;
