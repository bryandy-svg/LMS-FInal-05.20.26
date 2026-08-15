alter table public.trucking_moves
  add column if not exists requested_equipment_label text,
  add column if not exists dispatched_at timestamptz,
  add column if not exists driver_signed_at timestamptz,
  add column if not exists customer_signed_at timestamptz,
  add column if not exists finalized_at timestamptz,
  add column if not exists accepted_at timestamptz;

grant select, insert, update on public.trucking_moves to anon, authenticated;
