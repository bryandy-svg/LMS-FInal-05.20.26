-- Optional outside fleet specifications; existing links are preserved.
alter table public.outside_customer_fleet
  add column if not exists name text,
  add column if not exists type text,
  add column if not exists general_type text,
  add column if not exists year text,
  add column if not exists color text,
  add column if not exists size text,
  add column if not exists engine_number text,
  add column if not exists engine_make text,
  add column if not exists engine_model text,
  add column if not exists fuel_power text,
  add column if not exists assigned_operator text,
  add column if not exists parent_asset_tag text,
  add column if not exists relationship_type text,
  add column if not exists compatible_with text,
  add column if not exists insurance_policy text,
  add column if not exists photo_url text,
  add column if not exists odometer numeric,
  add column if not exists odometer_unit text default 'mi',
  add column if not exists engine_hours numeric,
  add column if not exists purchase_cost numeric,
  add column if not exists purchase_date date,
  add column if not exists registration_expiry date,
  add column if not exists return_date date;
alter table public.outside_customer_fleet add constraint outside_fleet_readings_nonnegative check ((odometer is null or odometer >= 0) and (engine_hours is null or engine_hours >= 0) and (purchase_cost is null or purchase_cost >= 0));
notify pgrst, 'reload schema';
