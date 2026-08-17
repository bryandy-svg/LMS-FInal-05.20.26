begin;

alter table sales_orders
  add column if not exists order_type text not null default 'Stock Order',
  add column if not exists special_order_status text not null default 'Unfulfilled',
  add column if not exists deposit_invoice_no text,
  add column if not exists deposit_amount numeric not null default 0,
  add column if not exists deposit_posted_at timestamptz,
  add column if not exists delivered_at timestamptz;

update sales_orders
set
  order_type = case
    when lower(coalesce(status, '')) = 'backordered' then 'Backorder'
    else coalesce(nullif(order_type, ''), 'Stock Order')
  end,
  special_order_status = case
    when lower(coalesce(status, '')) in ('fulfilled', 'issued', 'delivered', 'posted', 'paid') then 'Delivered'
    when lower(coalesce(status, '')) = 'backordered' then 'Awaiting Stock'
    else coalesce(nullif(special_order_status, ''), 'Unfulfilled')
  end;

insert into chart_of_accounts (account_code, account, report_group, type, normal_balance, notes)
values
  ('10000001', 'FHB Checking', 'FHB Checking', 'Asset', 'Debit', 'Cash and card receipts for sales orders.'),
  ('10400001', 'Accounts Receivable (A/R)', 'Accounts Receivable (A/R)', 'Asset', 'Debit', 'Customer receivables, including PO-backed deposits.'),
  ('20040001', 'Customer Deposit', 'Customer Deposit', 'Liability', 'Credit', 'Customer deposits held until goods are delivered.')
on conflict (account) do update set
  report_group = excluded.report_group,
  type = excluded.type,
  normal_balance = excluded.normal_balance;

commit;
