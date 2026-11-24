alter table public.assets add column if not exists repair_requested_date date;
alter table public.outside_customer_fleet add column if not exists repair_requested_date date;
create or replace function public.stamp_repair_requested_date() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='Equipment Repair Request' and (
  (tg_op='INSERT') or new.status is distinct from old.status
  or (new.notes is distinct from old.notes and coalesce(new.notes,'') like coalesce(old.notes,'')||'%' and substring(coalesce(new.notes,'') from length(coalesce(old.notes,''))+1) ilike '%Repair requested%')
 ) then new.repair_requested_date:=(now() at time zone 'Pacific/Guam')::date; end if;
 return new;
end $$;
create trigger stamp_repair_requested_date before insert or update on public.assets for each row execute function public.stamp_repair_requested_date();
create trigger stamp_repair_requested_date before insert or update on public.outside_customer_fleet for each row execute function public.stamp_repair_requested_date();
update public.assets a set repair_requested_date=x.d from
(select record_id,max((created_at at time zone 'Pacific/Guam')::date) d from public.request_portal_links where kind='repair' and coalesce(snapshot->>'asset_source','assets')='assets' group by record_id) x
where a.id::text=x.record_id and a.repair_requested_date is null;
update public.outside_customer_fleet a set repair_requested_date=x.d from
(select record_id,max((created_at at time zone 'Pacific/Guam')::date) d from public.request_portal_links where kind='repair' and snapshot->>'asset_source'='outside' group by record_id) x
where a.id::text=x.record_id and a.repair_requested_date is null;
