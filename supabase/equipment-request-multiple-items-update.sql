alter table public.equipment_requests
  add column if not exists asset_items jsonb;

grant select, insert, update on table public.equipment_requests to authenticated;
