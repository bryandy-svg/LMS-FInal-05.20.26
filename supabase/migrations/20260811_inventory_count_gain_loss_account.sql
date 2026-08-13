insert into public.chart_of_accounts (
  old_account,
  old_account_code,
  account_code,
  account,
  report_group,
  type,
  normal_balance,
  notes
)
values (
  'Inventory Count Gain/Loss',
  '80000302',
  '80000302',
  'Inventory Count Gain/Loss',
  'Income Statement',
  'Expense',
  'Debit',
  'Offset account for approved physical inventory count and stock-correction gains or losses.'
)
on conflict (account) do update
set report_group = excluded.report_group,
    type = excluded.type,
    normal_balance = excluded.normal_balance,
    notes = excluded.notes;

update public.general_ledger
set account = 'Inventory Count Gain/Loss'
where account = 'Inventory Loss - Obsolete Part'
  and source = 'Stock Correction';
