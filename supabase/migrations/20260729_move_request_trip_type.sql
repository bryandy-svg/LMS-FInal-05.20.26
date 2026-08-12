alter table public.trucking_requests
  add column if not exists trip_type text not null default 'One-Way';

alter table public.trucking_moves
  add column if not exists trip_type text not null default 'One-Way';

update public.trucking_requests
set trip_type = 'One-Way'
where trip_type is null or trip_type not in ('One-Way', 'Round Trip');

update public.trucking_moves
set trip_type = 'One-Way'
where trip_type is null or trip_type not in ('One-Way', 'Round Trip');

alter table public.trucking_requests
  drop constraint if exists trucking_requests_trip_type_check;

alter table public.trucking_requests
  add constraint trucking_requests_trip_type_check
  check (trip_type in ('One-Way', 'Round Trip'));

alter table public.trucking_moves
  drop constraint if exists trucking_moves_trip_type_check;

alter table public.trucking_moves
  add constraint trucking_moves_trip_type_check
  check (trip_type in ('One-Way', 'Round Trip'));

grant select, insert, update on public.trucking_requests to anon, authenticated;
grant select, insert, update on public.trucking_moves to anon, authenticated;
