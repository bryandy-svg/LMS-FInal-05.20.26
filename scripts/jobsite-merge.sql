-- Atomic, owner-authorized jobsite consolidation. No financial values change.
create table if not exists public.jobsite_merges (
  old_key text primary key,
  old_name text not null,
  canonical_name text not null,
  merged_by uuid not null,
  merged_at timestamptz not null default now(),
  check (old_key <> lower(btrim(canonical_name)))
);
alter table public.jobsite_merges enable row level security;
grant select on public.jobsite_merges to anon, authenticated;
grant insert, update on public.jobsite_merges to authenticated;
drop policy if exists jobsite_merge_read on public.jobsite_merges;
create policy jobsite_merge_read on public.jobsite_merges for select to anon, authenticated using (true);
drop policy if exists jobsite_merge_owner on public.jobsite_merges;
create policy jobsite_merge_owner on public.jobsite_merges for all to authenticated
using (auth.uid() = 'de197a8c-7681-4dd3-85e4-5becd4db8685'::uuid)
with check (auth.uid() = 'de197a8c-7681-4dd3-85e4-5becd4db8685'::uuid);

create or replace function public.replace_jobsite_asset_items(items jsonb, source_key text, destination_name text)
returns jsonb language sql immutable security invoker set search_path=pg_catalog as $$
  select case when jsonb_typeof(items)='array' then
    (select coalesce(jsonb_agg(case when jsonb_typeof(value)='object' and lower(btrim(value->>'location'))=source_key
      then jsonb_set(value,'{location}',to_jsonb(destination_name)) else value end order by ord),'[]'::jsonb)
    from jsonb_array_elements(items) with ordinality a(value,ord)) else items end;
$$;
revoke all on function public.replace_jobsite_asset_items(jsonb,text,text) from public;
grant execute on function public.replace_jobsite_asset_items(jsonb,text,text) to authenticated,anon;

create or replace function public.canonicalize_merged_jobsite() returns trigger
language plpgsql security invoker set search_path = pg_catalog, public as $$
declare payload jsonb := to_jsonb(new); field text; replacement text; alias_row record;
begin
  foreach field in array tg_argv loop
    select canonical_name into replacement from public.jobsite_merges
      where old_key = lower(btrim(payload->>field));
    if found then payload := jsonb_set(payload, array[field], to_jsonb(replacement)); end if;
  end loop;
  if tg_table_name='equipment_requests' and jsonb_typeof(payload->'asset_items')='array' then
    for alias_row in select old_key,canonical_name from public.jobsite_merges loop
      payload := jsonb_set(payload,'{asset_items}',public.replace_jobsite_asset_items(payload->'asset_items',alias_row.old_key,alias_row.canonical_name));
    end loop;
  end if;
  new := jsonb_populate_record(new, payload);
  return new;
end $$;
revoke all on function public.canonicalize_merged_jobsite() from public;

-- Only structured location/jobsite columns; never rewrite notes or audit history.
create or replace function public.jobsite_merge_columns()
returns table(table_name text, column_name text)
language sql stable security invoker set search_path = pg_catalog, public as $$
  select c.table_name::text, c.column_name::text
  from information_schema.columns c
  join information_schema.tables t using (table_catalog, table_schema, table_name)
  where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    and c.data_type in ('text', 'character varying')
    and (c.table_name,c.column_name) in (values
      ('assets','location'),('check_runs','jobsite'),('equipment_repair_quotes','jobsite_location'),
      ('equipment_repair_quotes','actual_location'),('equipment_requests','location'),('fuel_logs','jobsite'),
      ('general_ledger','jobsite'),('property_maintenance_properties','jobsite'),
      ('purchase_orders','jobsite_project'),('purchase_orders','ap_support_jobsite'),('sales_orders','jobsite_location'),
      ('trucking_moves','project'),('trucking_moves','jobsite'),('trucking_moves','origin'),('trucking_moves','destination'),
      ('trucking_quotation_lines','origin'),('trucking_quotation_lines','destination'),('trucking_quotations','project_jobsite'),
      ('trucking_request_lines','origin'),('trucking_request_lines','destination'),('trucking_requests','project'),
      ('trucking_requests','jobsite'),('trucking_requests','project_jobsite'),('trucking_requests','origin'),
      ('trucking_requests','destination'),('work_orders','jobsite_location'),('work_orders','actual_location'))
  order by c.table_name,c.column_name;
$$;
revoke all on function public.jobsite_merge_columns() from public;
grant execute on function public.jobsite_merge_columns() to authenticated;

do $$ declare item record;
begin
  for item in select table_name,string_agg(quote_literal(column_name), ',') as args
    from public.jobsite_merge_columns() group by table_name order by table_name loop
    execute format('drop trigger if exists canonicalize_merged_jobsite on public.%I',item.table_name);
    execute format('create trigger canonicalize_merged_jobsite before insert or update on public.%I for each row execute function public.canonicalize_merged_jobsite(%s)',item.table_name,item.args);
  end loop;
end $$;

drop trigger if exists canonicalize_merged_jobsite on public.asset_locations;
create trigger canonicalize_merged_jobsite before insert or update on public.asset_locations
  for each row execute function public.canonicalize_merged_jobsite('name');
drop trigger if exists canonicalize_merged_jobsite on public.fuel_jobsites;
create trigger canonicalize_merged_jobsite before insert or update on public.fuel_jobsites
  for each row execute function public.canonicalize_merged_jobsite('name');

create or replace function public.merge_jobsite(p_old_name text, p_new_name text, p_confirm boolean default false)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public set lock_timeout='5s' set statement_timeout='30s' as $$
#variable_conflict use_variable
declare
  old_key text := lower(btrim(p_old_name)); new_name text := btrim(p_new_name);
  item record; count_rows bigint; updated_rows bigint; total_rows bigint := 0; result jsonb := '{}'::jsonb;
  snapshots jsonb := '{}'::jsonb; before_rows jsonb; predicate text; assignments text;
begin
  if auth.uid() is distinct from 'de197a8c-7681-4dd3-85e4-5becd4db8685'::uuid then
    raise exception 'Only the system owner can merge jobsites.' using errcode='42501';
  end if;
  if old_key is null or old_key = '' or new_name is null or new_name = '' or length(new_name)>250
    or old_key = lower(new_name) then raise exception 'Choose two different, non-empty jobsite names.'; end if;
  if exists(select 1 from public.jobsite_merges m where m.old_key in (old_key,lower(new_name))) then
    raise exception 'One of these names was already merged. Refresh and select the retained jobsite.';
  end if;
  if p_confirm then
    -- Serialize merges and keep concurrent edits from reintroducing an old name.
    lock table public.jobsite_merges in share row exclusive mode;
    lock table public.asset_locations, public.fuel_jobsites in share row exclusive mode;
    for item in select distinct table_name from public.jobsite_merge_columns() order by table_name loop
      execute format('lock table public.%I in share row exclusive mode',item.table_name);
    end loop;
    if exists(select 1 from public.jobsite_merges m where m.old_key in (old_key,lower(new_name))) then
      raise exception 'This jobsite changed during confirmation. Refresh and try again.';
    end if;
  end if;
  for item in select table_name,array_agg(column_name order by column_name) as fields
    from public.jobsite_merge_columns() group by table_name order by table_name loop
    select string_agg(format('lower(btrim(%I)) = $1',f),' or '),
      string_agg(format('%I = case when lower(btrim(%I)) = $1 then $2 else %I end',f,f,f),', ')
      into predicate,assignments from unnest(item.fields) f;
    if item.table_name='equipment_requests' then
      predicate := '(' || predicate || ') or public.replace_jobsite_asset_items(asset_items,$1,$2) is distinct from asset_items';
      assignments := assignments || ', asset_items=public.replace_jobsite_asset_items(asset_items,$1,$2)';
    end if;
    execute format('select count(*), coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t where %s',item.table_name,predicate)
      into count_rows,before_rows using old_key,new_name;
    if count_rows > 0 then
      result := result || jsonb_build_object(item.table_name,count_rows);
      total_rows := total_rows + count_rows;
      if p_confirm then
        snapshots := snapshots || jsonb_build_object(item.table_name,before_rows);
        execute format('update public.%I set %s where %s',item.table_name,assignments,predicate) using old_key,new_name;
        get diagnostics updated_rows = row_count;
        if updated_rows <> count_rows then raise exception 'Not all records could be updated in %. Nothing was merged.',item.table_name; end if;
      end if;
    end if;
  end loop;
  for item in select unnest(array['asset_locations','fuel_jobsites']) as table_name loop
    execute format('select count(*),coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t where lower(btrim(name))=$1',item.table_name)
      into count_rows,before_rows using old_key;
    if count_rows > 0 then
      total_rows := total_rows + count_rows;
      result := result || jsonb_build_object(item.table_name,count_rows);
      if p_confirm then
        snapshots := snapshots || jsonb_build_object(item.table_name,before_rows);
        -- Retain source master metadata when the destination has no master yet.
        execute format('update public.%I set name=$1 where ctid=(select ctid from public.%I where lower(btrim(name))=$2 limit 1) and not exists(select 1 from public.%I where lower(btrim(name))=lower($1))',item.table_name,item.table_name,item.table_name) using new_name,old_key;
        execute format('delete from public.%I where lower(btrim(name))=$1',item.table_name) using old_key;
      end if;
    end if;
  end loop;
  if total_rows = 0 then raise exception 'No linked records remain for that source jobsite. Refresh the report.'; end if;
  if p_confirm then
    insert into public.asset_locations(name) select new_name where not exists(select 1 from public.asset_locations where lower(btrim(name))=lower(new_name));
    update public.jobsite_merges set canonical_name = new_name where lower(btrim(canonical_name)) = old_key;
    insert into public.jobsite_merges(old_key,old_name,canonical_name,merged_by)
      values(old_key,btrim(p_old_name),new_name,auth.uid());
    insert into public.audit_log(event_type,table_name,action,module,record_ref,summary,before_data,after_data,reason)
      values('Jobsite Merge','jobsite_merges','Merge','Trucking',p_old_name,
      p_old_name || ' merged into ' || new_name,snapshots,
      jsonb_build_object('retained_jobsite',new_name,'affected',result,'merged_by',auth.uid()),
      'Owner-confirmed system-wide jobsite consolidation; no financial amounts changed');
  end if;
  return jsonb_build_object('old_name',p_old_name,'new_name',new_name,'records',total_rows,'tables',result,'merged',p_confirm);
end $$;
revoke all on function public.merge_jobsite(text,text,boolean) from public,anon;
grant execute on function public.merge_jobsite(text,text,boolean) to authenticated;
notify pgrst, 'reload schema';

