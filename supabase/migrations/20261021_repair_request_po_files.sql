create table if not exists public.repair_request_po_files (
 id uuid primary key default gen_random_uuid(), asset_id uuid not null references public.assets(id),
 po_no text not null, po_attachment text not null, po_attachment_name text not null,
 po_attachment_type text not null, po_attachment_size integer not null,
 created_at timestamptz not null default now(),
 constraint repair_po_safe_file check (
   po_attachment_type in ('application/pdf','image/jpeg','image/png','image/webp')
   and po_attachment like ('data:' || po_attachment_type || ';base64,%')
   and length(po_attachment) <= 8500000 and po_attachment_size between 1 and 6291456)
);
create index if not exists repair_request_po_asset_idx on public.repair_request_po_files(asset_id,created_at desc);
alter table public.repair_request_po_files enable row level security;
revoke all on public.repair_request_po_files from anon,authenticated;
grant insert on public.repair_request_po_files to anon,authenticated;
grant select on public.repair_request_po_files to authenticated;
create policy "QR requester can attach PO" on public.repair_request_po_files for insert to anon,authenticated
 with check (exists(select 1 from public.assets a where a.id=asset_id and a.status='Equipment Repair Request' and a.repair_po_no=po_no));
create policy "Repair staff can read PO" on public.repair_request_po_files for select to authenticated
 using (exists(select 1 from public.app_profiles p where p.id=(select auth.uid()) and (p.role ~* 'admin|owner|manager|accounting|controller' or p.modules && array['all','assets','repairs','equipmentrepairqueue'])));
create or replace function public.submit_repair_request_with_po(p_asset_id uuid,p_changes jsonb,p_po jsonb)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v public.assets%rowtype;
begin
 if p_changes->>'status' is distinct from 'Equipment Repair Request' or coalesce(trim(p_changes->>'repair_po_no'),'')='' then raise exception 'Repair request and PO number are required'; end if;
 if exists(select 1 from jsonb_object_keys(p_changes) k where k not in ('status','repair_po_no','requested_by','assigned_operator','approved_by','location','last_update_date','notes','photo_url','scanned_date','gps_location','qr_scanned_at','qr_printed_tagged')) then raise exception 'Unsupported repair fields'; end if;
 select * into v from public.assets where id=p_asset_id for update;
 if not found then raise exception 'Equipment not found or access denied'; end if;
 v:=jsonb_populate_record(v,p_changes);
 update public.assets set status=v.status,repair_po_no=v.repair_po_no,requested_by=v.requested_by,assigned_operator=v.assigned_operator,approved_by=v.approved_by,location=v.location,last_update_date=v.last_update_date,notes=v.notes,photo_url=v.photo_url,scanned_date=v.scanned_date,gps_location=v.gps_location,qr_scanned_at=v.qr_scanned_at,qr_printed_tagged=v.qr_printed_tagged where id=p_asset_id;
 insert into public.repair_request_po_files(asset_id,po_no,po_attachment,po_attachment_name,po_attachment_type,po_attachment_size)
 values(p_asset_id,v.repair_po_no,p_po->>'po_attachment',p_po->>'po_attachment_name',p_po->>'po_attachment_type',(p_po->>'po_attachment_size')::integer);
end $$;
revoke all on function public.submit_repair_request_with_po(uuid,jsonb,jsonb) from public;
grant execute on function public.submit_repair_request_with_po(uuid,jsonb,jsonb) to anon,authenticated;
