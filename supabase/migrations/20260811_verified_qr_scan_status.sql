alter table public.assets
  add column if not exists qr_scanned_at timestamptz;

comment on column public.assets.qr_scanned_at is
  'Set only when the asset is opened through its QR-code public scan URL. Fuel runs and ordinary location updates must not update this field.';
