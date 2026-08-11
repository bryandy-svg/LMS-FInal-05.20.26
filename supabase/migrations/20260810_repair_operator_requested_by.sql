-- Adds repair operator and requestor tracking to work orders and repair quotes.
-- Requested By is enforced by the application for new and edited transactions.

alter table public.work_orders
  add column if not exists operator text,
  add column if not exists requested_by text;

alter table public.equipment_repair_quotes
  add column if not exists operator text,
  add column if not exists requested_by text;

notify pgrst, 'reload schema';

-- Verification: all four rows should be returned.
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('work_orders', 'equipment_repair_quotes')
  and column_name in ('operator', 'requested_by')
order by table_name, column_name;
