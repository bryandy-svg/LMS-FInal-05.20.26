create or replace function public.request_portal_submit(p_owner uuid,p_submission uuid,p_kind text,p_record jsonb,p_lines jsonb default '[]',p_po jsonb default null)
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
   assigned_operator=coalesce(nullif(p_record->>'operator',''),a.assigned_operator),location=coalesce(nullif(p_record->>'location',''),a.location),
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
