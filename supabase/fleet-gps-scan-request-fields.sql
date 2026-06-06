-- Adds fleet scan fields used by QR/mobile scan updates and repair requests.
-- Run once in Supabase SQL Editor if your assets table was created before these columns existed.

alter table assets
  add column if not exists gps_location text,
  add column if not exists requested_by text,
  add column if not exists approved_by text,
  add column if not exists repair_po_no text;
