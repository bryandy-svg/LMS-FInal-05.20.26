insert into public.trucking_rates (
  service,
  parent_service,
  subcategory,
  size_capacity,
  rate,
  rate_type,
  additional,
  category,
  status,
  requires_equipment
)
select
  'Waste Water Pump - ' || option_name,
  'Waste Water Pump Services',
  null,
  option_name,
  0,
  'Flat Rate',
  'Waste Water Pump Services option',
  'Service',
  'Active',
  false
from unnest(array[
  'Portable Toilets',
  'Portable Sink',
  '300 Gal Tank',
  '350 Gal Tank',
  '400 Gal Tank',
  '450 Gal Tank',
  '500 Gal Tank',
  '550 Gal Tank',
  '600 Gal Tank',
  '650 Gal Tank',
  '700 Gal Tank',
  '750 Gal Tank',
  '800 Gal Tank',
  '850 Gal Tank',
  '900 Gal Tank',
  '950 Gal Tank',
  '1000 Gal Tank'
]) as options(option_name)
on conflict (service) do update set
  parent_service = excluded.parent_service,
  size_capacity = excluded.size_capacity,
  category = excluded.category,
  status = excluded.status;
