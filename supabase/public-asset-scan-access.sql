-- Allows QR scans to update fleet location, GPS, timestamp, photo URL, and repair request status without logging in.
-- Run this in Supabase SQL Editor after schema.sql.

grant select, update on assets to anon;
grant select on asset_locations to anon;

drop policy if exists "public qr scan asset read" on assets;
create policy "public qr scan asset read"
on assets for select
to anon
using (true);

drop policy if exists "public qr scan asset update" on assets;
create policy "public qr scan asset update"
on assets for update
to anon
using (true)
with check (true);

grant select, insert, update on storage.objects to anon;

drop policy if exists "public asset scan photo access" on storage.objects;
create policy "public asset scan photo access"
on storage.objects for all
to anon
using (bucket_id = 'asset-photos')
with check (bucket_id = 'asset-photos');
