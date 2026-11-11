alter table public.trucking_moves add column if not exists container_move_count integer not null default 1 check (container_move_count >= 1);
comment on column public.trucking_moves.container_move_count is 'Container moves consolidated into this ticket. Multiplies service charges only, never driver/helper hours or tipping fees.';
notify pgrst, 'reload schema';
