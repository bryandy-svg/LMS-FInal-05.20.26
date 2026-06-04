alter table public.equipment_requests
  add column if not exists asset_items jsonb,
  add column if not exists po_attachment text,
  add column if not exists po_attachment_name text,
  add column if not exists po_attachment_type text,
  add column if not exists po_attachment_size numeric default 0;

grant select, insert, update on table public.equipment_requests to authenticated;
