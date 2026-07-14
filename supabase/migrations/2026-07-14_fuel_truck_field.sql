alter table public.fuel_logs
  add column if not exists fuel_truck text;

comment on column public.fuel_logs.fuel_truck is
  'Fuel truck used by the driver for the refill report.';

grant select, insert, update, delete on table public.fuel_logs to authenticated;
grant select, insert, update on table public.fuel_logs to anon;

notify pgrst, 'reload schema';
