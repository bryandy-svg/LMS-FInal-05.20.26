-- Add searchable Plate # to customer-owned equipment.
-- Safe to run more than once.

alter table public.outside_customer_fleet
  add column if not exists plate text;

create index if not exists outside_customer_fleet_plate_idx
  on public.outside_customer_fleet (lower(plate));

grant select, insert, update on public.outside_customer_fleet to authenticated;
