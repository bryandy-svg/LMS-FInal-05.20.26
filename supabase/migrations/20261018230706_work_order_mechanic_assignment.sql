alter table public.work_orders add column if not exists assigned_mechanic text;

create or replace function public.transfer_work_order_mechanic(p_wo_id uuid, p_mechanic text)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  w public.work_orders%rowtype;
  selected_name text;
  previous_name text;
  opening_name text;
  actor text;
begin
  select coalesce(nullif(full_name,''),username,'Manager') into actor from public.app_profiles
  where id = auth.uid() and (role ~* 'admin|owner|mechanic\s*manager' or modules && array['all']);
  if actor is null then raise exception 'Administrator or Mechanic Manager access is required.'; end if;
  select name into selected_name from public.mechanics where lower(trim(name))=lower(trim(p_mechanic))
    and coalesce(status,'Active') !~* 'inactive|disabled' limit 1;
  if selected_name is null then raise exception 'Select an active registered mechanic.'; end if;
  select * into w from public.work_orders where id=p_wo_id for update;
  if not found then raise exception 'Work order not found.'; end if;
  if nullif(w.invoice_no,'') is not null or coalesce(w.status,'') ~* 'closed|complete|invoiced|void|cancel' then
    raise exception 'Only an open work order can be reassigned.';
  end if;
  opening_name := trim(substring(coalesce(w.notes,'') from 'Opened by mechanic:[ \t]*([^\r\n]+)'));
  if nullif(opening_name,'') is null then
    select assigned_mechanic into opening_name from public.work_order_issues where wo_id=w.id and nullif(trim(assigned_mechanic),'') is not null order by issue_date,id limit 1;
  end if;
  previous_name := coalesce(nullif(trim(w.assigned_mechanic),''),nullif(opening_name,''));
  if w.assigned_mechanic is distinct from selected_name then
    update public.work_orders set assigned_mechanic=selected_name,
      notes=concat_ws(E'\n',nullif(w.notes,''),
        case when coalesce(w.notes,'') !~* 'Opened by mechanic:' and opening_name is not null then 'Opened by mechanic: '||opening_name end,
        '['||to_char(now() at time zone 'Pacific/Guam','YYYY-MM-DD HH24:MI')||'] Mechanic assignment: '||coalesce(previous_name,'Unassigned')||' -> '||selected_name||' by '||actor)
      where id=w.id returning * into w;
    update public.work_order_issues set assigned_mechanic=selected_name where wo_id=w.id
      and coalesce(status,'') !~* 'closed|complete|void|cancel'
      and (nullif(trim(assigned_mechanic),'') is null or lower(trim(assigned_mechanic))=lower(previous_name));
  end if;
  return jsonb_build_object('work_order',to_jsonb(w),'issues',coalesce((select jsonb_agg(to_jsonb(i)) from public.work_order_issues i where i.wo_id=w.id),'[]'::jsonb));
end $$;
revoke all on function public.transfer_work_order_mechanic(uuid,text) from public, anon;
grant execute on function public.transfer_work_order_mechanic(uuid,text) to authenticated;
