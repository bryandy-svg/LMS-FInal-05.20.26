create or replace function public.request_portal_add_access(p_user uuid) returns void
language sql security invoker set search_path=public,pg_temp as $$
 update app_profiles set modules=array(select distinct x from unnest(coalesce(modules,array[]::text[])||array['requestportal']) x) where id=p_user;
$$;
revoke all on function public.request_portal_add_access(uuid) from public,anon,authenticated;
grant execute on function public.request_portal_add_access(uuid) to service_role;
