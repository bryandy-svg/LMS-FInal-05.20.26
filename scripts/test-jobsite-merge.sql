-- Run after jobsite-merge.sql INSIDE a transaction, then ROLLBACK.
-- Explicit fixture IDs avoid advancing live document sequences.
insert into public.asset_locations(name,gps,notes) values('__CODEX_MERGE_SOURCE_0914','test gps','test metadata');
insert into public.fuel_jobsites(name) values('__CODEX_MERGE_SOURCE_0914');
insert into public.trucking_moves(id,ticket_no,jobsite,origin,destination,customer)
values(-914260001,'__CODEX_MERGE_TEST_0914','__CODEX_MERGE_SOURCE_0914','__CODEX_MERGE_SOURCE_0914','Other location','Test customer');
insert into public.general_ledger(entry_date,posting_date,account,debit,credit,jobsite,reference)
values('2026-09-14','2026-09-14','Parts Inventory',123.45,0,'__CODEX_MERGE_SOURCE_0914','__CODEX_MERGE_TEST_0914');
set local role authenticated;
select set_config('request.jwt.claim.sub','de197a8c-7681-4dd3-85e4-5becd4db8685',true);
do $$ declare preview jsonb; merged jsonb;
begin
  preview := public.merge_jobsite('__CODEX_MERGE_SOURCE_0914','__CODEX_MERGE_TARGET_0914',false);
  if (preview->>'records')::int <> 4 or exists(select 1 from public.jobsite_merges where old_key='__codex_merge_source_0914') then raise exception 'Preview modified data or wrong counts'; end if;
  merged := public.merge_jobsite('__CODEX_MERGE_SOURCE_0914','__CODEX_MERGE_TARGET_0914',true);
  if (merged->>'records')::int <> 4 then raise exception 'Wrong merge count'; end if;
  if exists(select 1 from public.asset_locations where name='__CODEX_MERGE_SOURCE_0914') then raise exception 'Old master survived'; end if;
  if not exists(select 1 from public.asset_locations where name='__CODEX_MERGE_TARGET_0914' and gps='test gps') then raise exception 'Master metadata lost'; end if;
  if not exists(select 1 from public.trucking_moves where id=-914260001 and jobsite='__CODEX_MERGE_TARGET_0914' and origin='__CODEX_MERGE_TARGET_0914' and destination='Other location') then raise exception 'Trucking fields incorrect'; end if;
  if not exists(select 1 from public.general_ledger where reference='__CODEX_MERGE_TEST_0914' and jobsite='__CODEX_MERGE_TARGET_0914' and debit=123.45 and credit=0 and posting_date='2026-09-14') then raise exception 'Financial data changed'; end if;
  if not exists(select 1 from public.audit_log where record_ref='__CODEX_MERGE_SOURCE_0914' and action='Merge' and before_data->'trucking_moves'->0->>'jobsite'='__CODEX_MERGE_SOURCE_0914') then raise exception 'Missing original audit snapshot'; end if;
  update public.trucking_moves set jobsite='__CODEX_MERGE_SOURCE_0914' where id=-914260001;
  if exists(select 1 from public.trucking_moves where id=-914260001 and jobsite<>'__CODEX_MERGE_TARGET_0914') then raise exception 'Stale name was recreated'; end if;
  perform public.merge_jobsite('__CODEX_MERGE_TARGET_0914','__CODEX_MERGE_FINAL_0914',true);
  update public.trucking_moves set jobsite='__CODEX_MERGE_SOURCE_0914' where id=-914260001;
  if exists(select 1 from public.trucking_moves where id=-914260001 and jobsite<>'__CODEX_MERGE_FINAL_0914') then raise exception 'Chained merge failed'; end if;
  if public.replace_jobsite_asset_items('[{"location":"OLD","asset_id":"x"},{"location":"Other"}]'::jsonb,'old','New') <> '[{"location":"New","asset_id":"x"},{"location":"Other"}]'::jsonb then raise exception 'Nested equipment location not preserved'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
  begin
    perform public.merge_jobsite('__CODEX_MERGE_FINAL_0914','Unauthorized',true);
    raise exception 'Non-owner was allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'PASS: preview, exact matches, master metadata, audit, financial invariance, stale writes, chained merges, nested fields and owner authorization' as test_result;

