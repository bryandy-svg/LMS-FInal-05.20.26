alter table public.trucking_requests add column if not exists series_id uuid;
create unique index if not exists trucking_request_series_date on public.trucking_requests(series_id,needed_date) where series_id is not null;
create or replace function public.create_trucking_request_series(p_series uuid,p_record jsonb,p_lines jsonb,p_dates date[],p_owner uuid default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare d date; n bigint; ref text; rec jsonb; result jsonb; results jsonb:='[]'; cols text; vals text; line jsonb;
begin
 if p_series is null or p_dates is null or cardinality(p_dates) not between 1 and 100 or array_position(p_dates,null) is not null then raise exception 'Choose between 1 and 100 delivery dates'; end if;
 if p_owner is not null and current_user <> 'service_role' then raise exception 'Portal submission requires server access'; end if;
 if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 50 then raise exception 'Add between 1 and 50 request items'; end if;
 if p_record is null or jsonb_typeof(p_record) <> 'object' then raise exception 'Request details are required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('request-portal-submit',0));
 for d in select distinct unnest(p_dates) order by 1 loop
  result:=null;
  if p_owner is null then select to_jsonb(r) into result from trucking_requests r where series_id=p_series and needed_date=d; end if;
  if result is null then
   rec:=p_record-'id'-'created_at'-'updated_at'-'request_no'||jsonb_build_object('series_id',p_series,'needed_date',d,'request_date',(now() at time zone 'Pacific/Guam')::date,'status','Requested');
   if p_owner is not null then
    result:=request_portal_submit(p_owner,md5(p_series::text||d::text)::uuid,'trucking',rec,p_lines,null);
   else
    select coalesce(max(substring(request_no from '^LMS-([0-9]+)$')::bigint),0)+1 into n from trucking_requests;
    ref:='LMS-'||lpad(n::text,5,'0');
    rec:=rec||jsonb_build_object('request_no',ref);
    select string_agg(format('%I',k),','),string_agg(format('r.%I',k),',') into cols,vals from jsonb_object_keys(rec) k;
    execute format('insert into public.trucking_requests (%s) select %s from jsonb_populate_record(null::public.trucking_requests,$1) r returning to_jsonb(trucking_requests.*)',cols,vals) into result using rec;
    for line in select value from jsonb_array_elements(p_lines) loop
     insert into trucking_request_lines(request_no,line_no,asset_source,asset_tag,equipment_label,service,origin,destination,notes,container_no,status)
     values(ref,(line->>'line_no')::integer,line->>'asset_source',line->>'asset_tag',line->>'equipment_label',line->>'service',line->>'origin',line->>'destination',line->>'notes',line->>'container_no','Requested');
    end loop;
   end if;
  end if;
  results:=results||jsonb_build_array(result);
 end loop;
 return results;
end $$;
revoke all on function public.create_trucking_request_series(uuid,jsonb,jsonb,date[],uuid) from public,anon;
grant execute on function public.create_trucking_request_series(uuid,jsonb,jsonb,date[],uuid) to authenticated,service_role;
