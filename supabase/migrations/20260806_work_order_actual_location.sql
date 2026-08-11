alter table public.work_orders
  add column if not exists jobsite_location text,
  add column if not exists actual_location text;

comment on column public.work_orders.jobsite_location is
  'Jobsite used for customer charging and repair reporting.';

comment on column public.work_orders.actual_location is
  'Physical equipment location; saving a work order synchronizes this value to Fleet and Equipment.';

notify pgrst, 'reload schema';
