create or replace function public.guard_mechanic_clock_role()
returns trigger language plpgsql security invoker set search_path='' as $$
declare other_primary text; assistant boolean;
begin
 assistant := coalesce(new.issue,'') ~* '^helper labor\y' or coalesce(new.work_done,'') ~* 'helper (hours only|for hours only)';
 if tg_op='UPDATE' and old.clock_out is null and new.clock_out is not null and not assistant and nullif(trim(new.work_done),'') is null then
   raise exception 'Primary mechanic must enter a work report before clocking out.';
 end if;
 if new.clock_in is null or new.clock_out is not null then return new; end if;
 if tg_op='UPDATE' and new.wo_id is not distinct from old.wo_id and new.mechanic is not distinct from old.mechanic
    and new.issue is not distinct from old.issue and new.work_done is not distinct from old.work_done and old.clock_out is null then return new; end if;
 perform 1 from public.work_orders where id=new.wo_id for update;
 if assistant then return new; end if;
 select mechanic into other_primary from public.work_order_labor
 where wo_id=new.wo_id and id is distinct from new.id and clock_in is not null and clock_out is null
 and not (coalesce(issue,'') ~* '^helper labor\y' or coalesce(work_done,'') ~* 'helper (hours only|for hours only)')
 limit 1;
 if other_primary is not null then raise exception 'A primary mechanic (%) is already clocked in. Choose Assistant.',other_primary; end if;
 return new;
end $$;

drop trigger if exists guard_mechanic_clock_role on public.work_order_labor;
create trigger guard_mechanic_clock_role before insert or update on public.work_order_labor for each row execute function public.guard_mechanic_clock_role();

