alter table public.trucking_rates
  add column if not exists subcategory text,
  add column if not exists size_capacity text,
  add column if not exists reference_label text,
  add column if not exists requires_equipment boolean not null default false;

alter table public.trucking_requests
  add column if not exists service_subcategory text,
  add column if not exists service_size text,
  add column if not exists service_reference text,
  add column if not exists tipping_fee text;

update public.trucking_rates
set
  parent_service = 'Water Service',
  size_capacity = service
where lower(coalesce(category, '')) = 'fuel/water';

update public.trucking_rates
set
  parent_service = 'Equipment Move',
  requires_equipment = true
where lower(service) = 'equipment move';

update public.trucking_rates
set
  parent_service = 'Roll Off Service',
  subcategory = case
    when lower(service) like '%flat rack%' then 'Flat Rack'
    else 'Roll Off Bin'
  end,
  reference_label = 'Bin / Container number'
where lower(service) in ('rolloff bin service', 'rolloff flat rack service');

insert into public.trucking_rates
  (service, parent_service, subcategory, size_capacity, reference_label, requires_equipment, rate, rate_type, additional, category, status)
values
  ('Container/Trailer Move | Sidelifter | 20 ft', 'Container/Trailer Move', 'Sidelifter', '20 ft', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Sidelifter | 40 ft', 'Container/Trailer Move', 'Sidelifter', '40 ft', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Sidelifter | 45 ft', 'Container/Trailer Move', 'Sidelifter', '45 ft', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Sidelifter | Double Wide', 'Container/Trailer Move', 'Sidelifter', 'Double Wide', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Chassis Move | 20 ft', 'Container/Trailer Move', 'Chassis Move', '20 ft', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Chassis Move | 40 ft', 'Container/Trailer Move', 'Chassis Move', '40 ft', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Chassis Move | 45 ft', 'Container/Trailer Move', 'Chassis Move', '45 ft', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active'),
  ('Container/Trailer Move | Chassis Move | Double Wide', 'Container/Trailer Move', 'Chassis Move', 'Double Wide', 'Container / Trailer number', false, 0, 'Flat Rate', '', 'Service', 'Active')
on conflict (service) do update set
  parent_service = excluded.parent_service,
  subcategory = excluded.subcategory,
  size_capacity = excluded.size_capacity,
  reference_label = excluded.reference_label,
  requires_equipment = excluded.requires_equipment,
  updated_at = now();

insert into public.trucking_rates
  (service, parent_service, subcategory, size_capacity, reference_label, requires_equipment, rate, rate_type, additional, category, status)
values
  ('Roll Off Service | Roll Off Bin | 10 CY', 'Roll Off Service', 'Roll Off Bin', '10 CY', 'Bin / Container number', false, 0, 'Flat Rate', 'Select a tipping fee on the move request', 'Service', 'Active'),
  ('Roll Off Service | Roll Off Bin | 20 CY', 'Roll Off Service', 'Roll Off Bin', '20 CY', 'Bin / Container number', false, 0, 'Flat Rate', 'Select a tipping fee on the move request', 'Service', 'Active'),
  ('Roll Off Service | Roll Off Bin | 30 CY', 'Roll Off Service', 'Roll Off Bin', '30 CY', 'Bin / Container number', false, 0, 'Flat Rate', 'Select a tipping fee on the move request', 'Service', 'Active'),
  ('Roll Off Service | Roll Off Bin | 40 CY', 'Roll Off Service', 'Roll Off Bin', '40 CY', 'Bin / Container number', false, 0, 'Flat Rate', 'Select a tipping fee on the move request', 'Service', 'Active')
on conflict (service) do update set
  parent_service = excluded.parent_service,
  subcategory = excluded.subcategory,
  size_capacity = excluded.size_capacity,
  reference_label = excluded.reference_label,
  requires_equipment = excluded.requires_equipment,
  updated_at = now();

grant select, insert, update on table public.trucking_rates to authenticated;
grant select on table public.trucking_rates to anon;
grant select, insert, update on table public.trucking_requests to anon, authenticated;
