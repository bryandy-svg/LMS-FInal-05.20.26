alter table invoices
  add column if not exists customer_po text,
  add column if not exists payment_mode text not null default 'PO';

alter table invoice_lines
  add column if not exists product_id uuid references products(id),
  add column if not exists sku text,
  add column if not exists product_name text;
