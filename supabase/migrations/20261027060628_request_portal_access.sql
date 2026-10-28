-- Request portal identities are separate from company Auth users. No direct client access.
create table public.request_portal_accounts (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 username text not null unique, full_name text not null, password_hash text not null,
 created_at timestamptz not null default now(),
 check(email=lower(email)), check(username=lower(username))
);
create table public.request_portal_sessions (
 token_hash text primary key, owner_id uuid not null, email text not null, full_name text not null,
 mode text not null check(mode in ('guest','account','company')), expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create table public.request_portal_links (
 owner_id uuid not null, submission_id uuid not null, kind text not null,
 request_no text not null, record_id text not null, snapshot jsonb not null,
 created_at timestamptz not null default now(), primary key(owner_id,submission_id)
);
create index request_portal_links_record on public.request_portal_links(kind,request_no);
create table public.request_portal_limits (key text primary key, attempts integer not null, reset_at timestamptz not null);
alter table public.request_portal_accounts enable row level security;
alter table public.request_portal_sessions enable row level security;
alter table public.request_portal_links enable row level security;
alter table public.request_portal_limits enable row level security;
revoke all on public.request_portal_accounts,public.request_portal_sessions,public.request_portal_links,public.request_portal_limits from public,anon,authenticated;
grant all on public.request_portal_accounts,public.request_portal_sessions,public.request_portal_links,public.request_portal_limits to service_role;
create function public.request_portal_rate_limit(p_key text,p_max integer,p_seconds integer) returns boolean
language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;
begin
 insert into request_portal_limits(key,attempts,reset_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set attempts=case when request_portal_limits.reset_at<now() then 1 else request_portal_limits.attempts+1 end,
 reset_at=case when request_portal_limits.reset_at<now() then now()+make_interval(secs=>p_seconds) else request_portal_limits.reset_at end returning attempts into n;
 return n<=p_max;
end $$;
create function public.request_portal_submit(p_owner uuid,p_submission uuid,p_kind text,p_record jsonb,p_lines jsonb default '[]',p_po jsonb default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing request_portal_links%rowtype; target text; ref text; result jsonb; cols text; vals text; n bigint; line jsonb; a assets%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended('request-portal-submit',0));
 select * into existing from request_portal_links where owner_id=p_owner and submission_id=p_submission;
 if found then return existing.snapshot; end if;
 if p_kind='trucking' then
  target:='trucking_requests';
  select coalesce(max(substring(request_no from '^LMS-([0-9]+)$')::bigint),0)+1 into n from trucking_requests;
  ref:='LMS-'||lpad(n::text,5,'0');
 elsif p_kind='equipment' then
  target:='equipment_requests';
  select greatest(coalesce(max(substring(request_no from '^ER-([0-9]+)$')::bigint),1000)+1,coalesce((select next_number from app_sequences where key='equipment_request'),1001)) into n from equipment_requests;
  ref:='ER-'||n;
  update app_sequences set next_number=n+1 where key='equipment_request';
 elsif p_kind='property' then
  target:='property_maintenance_requests'; ref:='PMR-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISS')||'-'||substr(p_submission::text,1,8);
 elsif p_kind='repair' then
  ref:='REP-'||substr(p_submission::text,1,8);
  select * into a from assets where id=(p_record->>'asset_id')::uuid for update;
  if not found then raise exception 'Equipment not found'; end if;
  update assets set status='Equipment Repair Request',requested_by=p_record->>'requested_by',repair_po_no=p_record->>'po_no',
   notes=concat_ws(E'\n',a.notes,'Repair requested: '||(p_record->>'issue')||' | Requestor email: '||(p_record->>'email')||' | Priority: '||(p_record->>'priority')||' | '||coalesce(p_record->>'notes','')),
   last_update_date=(now() at time zone 'Pacific/Guam')::date where id=a.id;
  if p_po is not null then
   insert into repair_request_po_files(asset_id,po_no,po_attachment,po_attachment_name,po_attachment_type,po_attachment_size)
   values(a.id,p_record->>'po_no',p_po->>'po_attachment',p_po->>'po_attachment_name',p_po->>'po_attachment_type',(p_po->>'po_attachment_size')::integer);
  end if;
  result:=p_record||jsonb_build_object('id',a.id,'request_no',ref,'status','Requested');
 else raise exception 'Unsupported request type'; end if;
 if target is not null then
  p_record:=p_record-'id'-'created_at'-'updated_at'||jsonb_build_object('request_no',ref,'request_date',(now() at time zone 'Pacific/Guam')::date,'status','Requested');
  select string_agg(format('%I',k),','), string_agg(format('r.%I',k),',') into cols,vals from jsonb_object_keys(p_record) k;
  execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) r returning to_jsonb(%I.*)',target,cols,vals,target,target) into result using p_record;
  if p_kind='trucking' then
   for line in select value from jsonb_array_elements(p_lines) loop
    insert into trucking_request_lines(request_no,line_no,asset_source,asset_tag,equipment_label,service,origin,destination,notes,container_no,status)
    values(ref,(line->>'line_no')::integer,line->>'asset_source',line->>'asset_tag',line->>'equipment_label',line->>'service',line->>'origin',line->>'destination',line->>'notes',line->>'container_no','Requested');
   end loop;
  end if;
 end if;
 insert into request_portal_links(owner_id,submission_id,kind,request_no,record_id,snapshot)
 values(p_owner,p_submission,p_kind,ref,result->>'id',result-'po_attachment'-'requested_signature');
 return result-'po_attachment'-'requested_signature';
end $$;
revoke all on function public.request_portal_rate_limit(text,integer,integer),public.request_portal_submit(uuid,uuid,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.request_portal_rate_limit(text,integer,integer),public.request_portal_submit(uuid,uuid,text,jsonb,jsonb,jsonb) to service_role;
create function public.request_portal_find_staff(p_field text,p_value text) returns setof jsonb
language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object('id',id,'email',email,'username',username,'full_name',full_name,'modules',modules)
 from app_profiles where case when p_field='email' then lower(email)=lower(p_value) when p_field='username' then lower(username)=lower(p_value) else false end limit 1;
$$;
revoke all on function public.request_portal_find_staff(text,text) from public,anon,authenticated;
grant execute on function public.request_portal_find_staff(text,text) to service_role;
create function public.request_portal_add_access(p_user uuid) returns void
language sql security invoker set search_path=public,pg_temp as $$
 update app_profiles set modules=array(select distinct x from unnest(coalesce(modules,array[]::text[])||array['requestportal','equipmentrequests','truckingrequests','equipmentrepairqueue','propertyrequests']) x) where id=p_user;
$$;
revoke all on function public.request_portal_add_access(uuid) from public,anon,authenticated;
grant execute on function public.request_portal_add_access(uuid) to service_role;
