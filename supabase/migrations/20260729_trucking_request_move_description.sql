alter table public.trucking_requests
  add column if not exists move_description text;

update public.trucking_requests
set move_description = notes
where nullif(trim(coalesce(move_description, '')), '') is null
  and nullif(trim(coalesce(notes, '')), '') is not null;

grant select, insert, update on public.trucking_requests to anon, authenticated;
