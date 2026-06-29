-- Adds bin-level inventory location tracking for receipts, movements, and as-of inventory.
-- Run once in Supabase SQL Editor if your database was created before these columns existed.

alter table stock_movements
  add column if not exists from_bin_shelf text,
  add column if not exists to_bin_shelf text;

alter table goods_receipts
  add column if not exists receipt_warehouse text,
  add column if not exists receipt_bin_shelf text;
