alter table public.trucking_requests add column if not exists container_move_count integer not null default 1 check (container_move_count >= 1);
alter table public.trucking_requests add column if not exists tipping_fee_multiplier integer not null default 1 check (tipping_fee_multiplier >= 1);
alter table public.trucking_moves add column if not exists tipping_fee_multiplier integer not null default 1 check (tipping_fee_multiplier >= 1);
notify pgrst, 'reload schema';
