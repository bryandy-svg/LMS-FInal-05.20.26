create or replace function public.cancel_unused_move_requests(p_requests text[],p_reason text)
returns integer language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer;
begin
 if p_requests is null or cardinality(p_requests) not between 1 and 100 or nullif(trim(p_reason),'') is null then raise exception 'Select 1–100 requests and enter a cancellation reason'; end if;
 perform 1 from trucking_requests where request_no=any(p_requests) for update;
 if (select count(*) from trucking_requests where request_no=any(p_requests)) <> (select count(distinct x) from unnest(p_requests) x) then raise exception 'A selected request is unavailable. Refresh and retry.'; end if;
 if exists(select 1 from trucking_requests where request_no=any(p_requests) and lower(status) not in ('requested','pending','unscheduled')) or exists(select 1 from trucking_moves where request_no=any(p_requests)) or exists(select 1 from trucking_request_lines where request_no=any(p_requests) and (nullif(ticket_no,'') is not null or lower(status) in ('dispatched','scheduled','completed','finalized'))) then raise exception 'A selected request already has dispatch activity. No requests were cancelled. Refresh and select only unused requests.'; end if;
 update trucking_requests set status='Cancelled',cancellation_reason=trim(p_reason),cancelled_at=now() where request_no=any(p_requests);
 get diagnostics n=row_count;
 update trucking_request_lines set status='Cancelled' where request_no=any(p_requests);
 return n;
end $$;
revoke all on function public.cancel_unused_move_requests(text[],text) from public,anon;
grant execute on function public.cancel_unused_move_requests(text[],text) to authenticated;
