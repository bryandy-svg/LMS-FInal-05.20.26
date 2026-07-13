alter table public.trucking_requests
  add column if not exists notes text,
  add column if not exists status text default 'Requested';

update public.trucking_requests
set status = 'Requested'
where nullif(status, '') is null;

grant select, insert, update on table public.trucking_requests to anon, authenticated;
grant select, insert, update on table public.trucking_request_lines to anon, authenticated;
