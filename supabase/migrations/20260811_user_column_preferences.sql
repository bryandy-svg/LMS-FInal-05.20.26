alter table public.app_profiles
  add column if not exists column_preferences jsonb not null default '{}'::jsonb;
