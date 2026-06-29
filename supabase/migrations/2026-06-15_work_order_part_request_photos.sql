alter table public.work_order_parts
  add column if not exists request_photo_url text;

grant select, insert, update on table public.work_order_parts to anon, authenticated;
