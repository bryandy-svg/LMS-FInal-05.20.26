alter table public.trucking_requests add column if not exists dispatch_defaults jsonb;
comment on column public.trucking_requests.dispatch_defaults is 'Editable driver and actual equipment suggestions copied from prior dispatch; does not assign or dispatch the request.';
notify pgrst, 'reload schema';
