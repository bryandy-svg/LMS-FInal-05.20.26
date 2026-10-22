alter table public.trucking_moves add column if not exists helper_driver_name text;
alter table public.trucking_moves add column if not exists helper_driver_email text;
alter table public.trucking_request_lines add column if not exists container_no text;
comment on column public.trucking_moves.helper_driver_email is 'Optional dispatch helper. Ticket ownership remains with driver_email; helper labor uses the main ticket times.';
