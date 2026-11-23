create or replace function public.admin_reset_request_portal_password(p_id uuid,p_hash text,p_actor uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.app_profiles where id=p_actor and role='Administrator') then raise exception 'Administrator required'; end if;
 if p_hash !~ '^[a-f0-9]{32}:[a-f0-9]{128}$' then raise exception 'Invalid password encoding'; end if;
 update public.request_portal_accounts set password_hash=p_hash where id=p_id;
 if not found then raise exception 'Account no longer exists'; end if;
 delete from public.request_portal_sessions where owner_id=p_id and mode='account';
end $$;
revoke all on function public.admin_reset_request_portal_password(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.admin_reset_request_portal_password(uuid,text,uuid) to service_role;
