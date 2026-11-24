create policy repair_po_outside_insert on public.repair_request_po_files for insert to authenticated with check (
asset_id is null and exists(select 1 from public.outside_customer_fleet a where a.id=outside_asset_id and a.status='Equipment Repair Request' and a.repair_po_no=po_no));
