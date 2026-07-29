alter table public.trucking_rates
  add column if not exists parent_service text;

alter table public.trucking_requests
  add column if not exists service_option text;

update public.trucking_rates
set parent_service = 'Water Service'
where lower(coalesce(category, '')) = 'fuel/water'
  and nullif(parent_service, '') is null;

grant select, insert, update on table public.trucking_rates to authenticated;
grant select on table public.trucking_rates to anon;
grant select, insert, update on table public.trucking_requests to anon, authenticated;
