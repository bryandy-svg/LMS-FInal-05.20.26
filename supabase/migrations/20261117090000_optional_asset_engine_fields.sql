alter table public.assets
  add column if not exists engine_number text,
  add column if not exists engine_make text,
  add column if not exists engine_model text;
