alter table public.trucking_requests
  add column if not exists project_jobsite text,
  add column if not exists contact_no text,
  add column if not exists delivery_period text,
  add column if not exists origin text,
  add column if not exists destination text,
  add column if not exists service_needed text;

update public.trucking_requests
set project_jobsite = coalesce(nullif(project_jobsite, ''), nullif(jobsite, ''), nullif(project, ''))
where nullif(project_jobsite, '') is null;

alter table public.trucking_requests
  drop constraint if exists trucking_requests_delivery_period_check;

alter table public.trucking_requests
  add constraint trucking_requests_delivery_period_check
  check (delivery_period is null or delivery_period in ('AM', 'PM'));

insert into public.trucking_rates(service, rate, rate_type, additional, category, status)
values
  ('Equipment Move', 0, '', '', 'Service', 'Active'),
  ('Container/Trailer Move', 0, '', '', 'Service', 'Active'),
  ('High Deck Trailer', 0, '', '', 'Service', 'Active'),
  ('Water Service', 0, '', '', 'Service', 'Active'),
  ('Roll Off Service', 0, '', '', 'Service', 'Active'),
  ('Pump Service', 0, '', '', 'Service', 'Active')
on conflict (service) do nothing;

grant select, insert, update on table public.trucking_requests to anon, authenticated;
