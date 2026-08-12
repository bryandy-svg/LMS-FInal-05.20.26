-- Allow Work Orders to synchronize the physical location of outside-customer equipment.
-- Safe to run more than once.

alter table public.outside_customer_fleet
  add column if not exists location text;

create index if not exists outside_customer_fleet_location_idx
  on public.outside_customer_fleet (lower(location));

grant select, insert, update on public.outside_customer_fleet to authenticated;

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'outside_customer_fleet'
  and column_name = 'location';
