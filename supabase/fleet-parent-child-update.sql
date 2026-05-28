-- Add parent/child equipment relationship fields.
-- Run this once in Supabase SQL Editor before saving parent assets from the app.

alter table assets
  add column if not exists parent_asset_id uuid references assets(id) on delete set null,
  add column if not exists parent_asset_tag text,
  add column if not exists relationship_type text,
  add column if not exists compatible_with text;
