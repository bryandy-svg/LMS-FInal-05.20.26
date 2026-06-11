-- Adds payment mode to sales orders for Cash, PO, credit card, ACH, wire, and other collection flows.
alter table sales_orders
  add column if not exists payment_mode text not null default 'PO';
