create or replace function public.search_trucking_request_ids(search_text text)
returns table(request_no text)
language sql stable security invoker set search_path = public
as $$
  select r.request_no from public.trucking_requests r
  where length(trim(search_text)) > 0 and (
    exists (select 1 from jsonb_each_text(to_jsonb(r)) v where strpos(lower(coalesce(v.value,'')),lower(trim(search_text)))>0)
    or strpos(concat_ws(' ',to_char(r.request_date,'MM/DD/YYYY'),to_char(r.needed_date,'MM/DD/YYYY')),trim(search_text))>0
    or exists (select 1 from public.trucking_request_lines l cross join lateral jsonb_each_text(to_jsonb(l)) v where l.request_no=r.request_no and strpos(lower(coalesce(v.value,'')),lower(trim(search_text)))>0)
    or exists (select 1 from public.trucking_moves m cross join lateral jsonb_each_text(to_jsonb(m)-'driver_signature'-'customer_signature') v where m.request_no=r.request_no and strpos(lower(coalesce(v.value,'')),lower(trim(search_text)))>0)
  ) order by r.request_no limit 501;
$$;
revoke all on function public.search_trucking_request_ids(text) from public, anon;
grant execute on function public.search_trucking_request_ids(text) to authenticated;

