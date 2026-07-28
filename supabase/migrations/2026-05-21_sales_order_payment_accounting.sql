alter table sales_orders
  add column if not exists payment_mode text not null default 'PO';

insert into chart_of_accounts (account_code, account, report_group, type, normal_balance, notes)
values ('23050001', 'Parts in Transit', 'Balance Sheet', 'Liability', 'Credit', 'Temporary liability for customer sales orders waiting on backordered parts.')
on conflict (account) do update set
  account_code = excluded.account_code,
  report_group = excluded.report_group,
  type = excluded.type,
  normal_balance = excluded.normal_balance,
  notes = excluded.notes;
