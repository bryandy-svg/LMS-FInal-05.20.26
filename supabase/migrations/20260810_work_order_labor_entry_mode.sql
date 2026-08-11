-- Distinguishes actual clock events from manually entered or corrected labor.
alter table public.work_order_labor
  add column if not exists entry_mode text not null default 'Clock';

notify pgrst, 'reload schema';

select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'work_order_labor'
  and column_name = 'entry_mode';
