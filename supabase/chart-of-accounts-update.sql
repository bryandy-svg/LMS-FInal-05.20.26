-- Restore LMS chart of accounts, keep the old code mapping, and expose it to the app.
-- Run this in Supabase SQL Editor when Chart of Accounts is empty or after rebuilding the database.

alter table chart_of_accounts add column if not exists old_account text;
alter table chart_of_accounts add column if not exists old_account_code text;
alter table chart_of_accounts add column if not exists account_code text;
alter table chart_of_accounts add column if not exists report_group text;

alter table sales_orders add column if not exists payment_mode text not null default 'PO';

delete from chart_of_accounts;

with raw(old_account, old_account_code, account, account_code, report_group, type, normal_balance) as (
  values
  ('FHB Checking','10000001','FHB Checking','10000001','Balance Sheet','Asset','Debit'),
  ('Credit Card Receivable','10040001','Credit Card Receivable','10040001','Balance Sheet','Asset','Debit'),
  ('Accounts Receivable (A/R)','10400001','Accounts Receivable (A/R)','10400001','Balance Sheet','Asset','Debit'),
  ('New Sany','12008001','Heavy Equipment Asset','12000000','Balance Sheet','Asset','Debit'),
  ('New Rubblemaster','12012001','Heavy Equipment Asset','12000000','Balance Sheet','Asset','Debit'),
  ('New Other Equipment','12014001','Heavy Equipment Asset','12000000','Balance Sheet','Asset','Debit'),
  ('Acc Dep','12050001','Acc Dep','12050001','Balance Sheet','Asset','Credit'),
  ('Fixed Asset - Equipment','12060001','Other Fixed Asset','12060001','Balance Sheet','Asset','Debit'),
  ('Furniture & Fixture','12061001','Furniture & Fixture','12061001','Balance Sheet','Asset','Debit'),
  ('Parts Inventory - Service Oil','12100001','Parts Inventory','12100001','Balance Sheet','Asset','Debit'),
  ('Parts Inventory - Taylor','12101001','Parts Inventory','12100001','Balance Sheet','Asset','Debit'),
  ('Parts Inventory - Napa','12102001','Parts Inventory','12100001','Balance Sheet','Asset','Debit'),
  ('Parts Inventory - Hustler','12103001','Parts Inventory','12100001','Balance Sheet','Asset','Debit'),
  ('Parts Inventory - Other','12104001','Parts Inventory','12100001','Balance Sheet','Asset','Debit'),
  ('Intercompany - LMS Main','13000001','Intercompany - LMS Main','13000001','Balance Sheet','Asset','Debit'),
  ('Intercompany - PFM','13010001','Intercompany - PFM','13010001','Balance Sheet','Asset','Debit'),
  ('Intercompany - GWM','13020001','Intercompany - GWM','13020001','Balance Sheet','Asset','Debit'),
  ('Intercompany - Salas Holdings','13026000','Intercompany - Salas Holdings','13026000','Balance Sheet','Asset','Debit'),
  ('Intercompany - Proferre','13027001','Intercompany - Proferre','13027001','Balance Sheet','Asset','Debit'),
  ('Intercompany - The Pit','13028001','Intercompany - The Pit','13028001','Balance Sheet','Asset','Debit'),
  ('Accounts Payable (A/P)','20000001','Accounts Payable (A/P)','20000001','Balance Sheet','Liability','Credit'),
  ('Credit Card Payable - LMS Impo','20020001','Credit Card Payable - LMS Impo','20020001','Balance Sheet','Liability','Credit'),
  ('Customer Deposit','20040001','Customer Deposit','20040001','Balance Sheet','Liability','Credit'),
  ('Commission','22000001','Commission','22000001','Balance Sheet','Liability','Credit'),
  ('Parts Accrual','23000001','Parts Accrual','23000001','Balance Sheet','Liability','Credit'),
  ('Parts in Transit','23050001','Parts in Transit','23050001','Balance Sheet','Liability','Credit'),
  ('Retained Earnings','29000001','Retained Earnings','29000001','Balance Sheet','Equity','Credit'),
  ('Counter Taylor Sales','32000301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Shop Taylor Sales','32001301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Internal Taylor Sales','32003301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Counter Napa Sales','32010301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Shop Napa Sales','32011301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Internal Napa Sales','32013301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Counter Hustler Sales','32020301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Shop Hustler Sales','32021301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Counter Other Parts Sales','32030301','Parts Sales','32000301','Income Statement','Revenue','Credit'),
  ('Shop Other Parts Sales','32031301','Other Sales','32031301','Income Statement','Revenue','Credit'),
  ('Internal Other Parts Sales','32033301','Other Sales','32031301','Income Statement','Revenue','Credit'),
  ('LMS Service','34010401','LMS Service - Sales','34010401','Income Statement','Revenue','Credit'),
  ('DELIVERY CHARGE','34050401','DELIVERY CHARGE','34050401','Income Statement','Revenue','Credit'),
  ('DIAGNOSTIC FEE','34070401','DIAGNOSTIC FEE','34070401','Income Statement','Revenue','Credit'),
  ('DIAGNOSTIC FEE NAVAL BASE GUAM','34080401','DIAGNOSTIC FEE NAVAL BASE GUAM','34080401','Income Statement','Revenue','Credit'),
  ('Sales - Equipment Rental','35000501','Sales - Equipment Rental','35000501','Income Statement','Revenue','Credit'),
  ('COGS - Used Sale Other','41022201','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Counter Taylor Sales','42000301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Shop Taylor Sales','42001301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Internal Taylor Sales','42003301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Counter Napa Sales','42010301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Shop Napa Sales','42011301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Internal Napa Sales','42013301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Counter Hustler Sales','42020301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Shop Hustler Sales','42021301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Counter Other Parts Sales','42030301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Shop Other Parts Sales','42031301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - Internal Other Parts Sa','42033301','COGS - Parts','41022201','Income Statement','Expense','Debit'),
  ('COGS - LMS Service','44010401','COGS - LMS Service','44010401','Income Statement','Expense','Debit'),
  ('QUOTE GAIN/LOSS','49100301','QUOTE GAIN/LOSS','49100301','Income Statement','Revenue','Credit'),
  ('QUOTE GAIN/LOSS','49100401','QUOTE GAIN/LOSS','49100301','Income Statement','Revenue','Credit'),
  ('QUOTE GAIN/LOSS OTHER','49500401','QUOTE GAIN/LOSS','49100301','Income Statement','Revenue','Credit'),
  ('Depreciation Expense','5000101','Depreciation Expense','5000101','Income Statement','Expense','Debit'),
  ('Depreciation Expense','5000201','Depreciation Expense','5000101','Income Statement','Expense','Debit'),
  ('Depreciation Expense','5000301','Depreciation Expense','5000101','Income Statement','Expense','Debit'),
  ('Depreciation Expense','5000401','Depreciation Expense','5000101','Income Statement','Expense','Debit'),
  ('Dues & subscription','50010301','Dues & subscription','50010301','Income Statement','Expense','Debit'),
  ('Job Supplies','51000401','Job Supplies','51000401','Income Statement','Expense','Debit'),
  ('Operation Supplies','51040401','Job Supplies','51000401','Income Statement','Expense','Debit'),
  ('Personnel Expenses','51080401','Indirect Labor','51080401','Income Statement','Expense','Debit'),
  ('RESTOCKING FEE','51090301','Miscellaneous Expense','90000001','Income Statement','Expense','Debit'),
  ('Repairs & Maintenance','51150501','Repairs & Maintenance','51150501','Income Statement','Expense','Debit'),
  ('Training Expense','51200401','Training Expense','51200401','Income Statement','Expense','Debit'),
  ('Freight','53010301','Freight','53010301','Income Statement','Expense','Debit'),
  ('Finance Charges','53030101','Freight','53010301','Income Statement','Expense','Debit'),
  ('Communications','55000301','Communications','55000301','Income Statement','Expense','Debit'),
  ('Bank Charges and Fees','57000301','Bank Charges and Fees','57000301','Income Statement','Expense','Debit'),
  ('Misc Income','60000301','Misc Income','60000301','Income Statement','Revenue','Credit'),
  ('Inventory Loss - Obsolete Part','80000301','Inventory Loss - Obsolete Part','80000301','Income Statement','Expense','Debit')
),
grouped as (
  select
    account,
    min(account_code) as account_code,
    string_agg(distinct nullif(old_account, account), ', ' order by nullif(old_account, account)) filter (where nullif(old_account, account) is not null) as old_account,
    string_agg(distinct nullif(old_account_code, account_code), ', ' order by nullif(old_account_code, account_code)) filter (where nullif(old_account_code, account_code) is not null) as old_account_code,
    min(report_group) as report_group,
    min(type) as type,
    min(normal_balance) as normal_balance
  from raw
  group by account
)
insert into chart_of_accounts (account_code, old_account, old_account_code, account, report_group, type, normal_balance, notes)
select
  account_code,
  old_account,
  old_account_code,
  account,
  report_group,
  type,
  normal_balance,
  case when old_account is not null or old_account_code is not null
    then concat('Old mapping: ', coalesce(old_account, ''), case when old_account is not null and old_account_code is not null then ' | ' else '' end, coalesce(old_account_code, ''))
    else null
  end
from grouped
on conflict (account) do update set
  account_code = excluded.account_code,
  old_account = excluded.old_account,
  old_account_code = excluded.old_account_code,
  report_group = excluded.report_group,
  type = excluded.type,
  normal_balance = excluded.normal_balance,
  notes = excluded.notes;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table chart_of_accounts to authenticated;
grant select, insert, update, delete on table general_ledger to authenticated;
