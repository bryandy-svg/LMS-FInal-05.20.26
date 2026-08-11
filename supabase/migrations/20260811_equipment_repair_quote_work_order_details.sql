-- Work-order-style detail fields for Equipment Repair Quotes.
-- Run once in Supabase SQL Editor before deploying the matching application build.

alter table public.equipment_repair_quotes
  add column if not exists opening_mechanic text,
  add column if not exists work_type text not null default 'Repair',
  add column if not exists jobsite_location text,
  add column if not exists actual_location text,
  add column if not exists vendor_shop text,
  add column if not exists odometer numeric not null default 0,
  add column if not exists engine_hours numeric not null default 0,
  add column if not exists issue_details jsonb not null default '[]'::jsonb;

update public.equipment_repair_quotes
set issue_details = jsonb_build_array(
  jsonb_build_object(
    'issue_date', quote_date,
    'issue', scope_of_work,
    'status', 'Open',
    'assigned_mechanic', coalesce(opening_mechanic, ''),
    'work_notes', scope_of_work
  )
)
where coalesce(jsonb_array_length(issue_details), 0) = 0
  and nullif(trim(scope_of_work), '') is not null;

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'equipment_repair_quotes'
  and column_name in (
    'opening_mechanic', 'work_type', 'jobsite_location', 'actual_location',
    'vendor_shop', 'odometer', 'engine_hours', 'issue_details'
  )
order by column_name;
