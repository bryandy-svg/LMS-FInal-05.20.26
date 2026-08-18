-- Prevent any new or edited work order from reusing an existing work order #.
-- Existing duplicate audit rows are preserved; this trigger blocks future
-- duplicates without deleting or renumbering historical records.

create or replace function public.prevent_duplicate_work_order_number()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  normalized_wo_no text := upper(btrim(coalesce(new.wo_no, '')));
begin
  if normalized_wo_no = '' then
    raise exception using
      errcode = '23502',
      message = 'Work order number is required.';
  end if;

  -- Serialize creators requesting the same number, so two users saving at the
  -- same instant cannot both pass the duplicate check.
  perform pg_advisory_xact_lock(hashtextextended('work_order:' || normalized_wo_no, 0));

  if exists (
    select 1
      from public.work_orders wo
     where upper(btrim(coalesce(wo.wo_no, ''))) = normalized_wo_no
       and wo.id is distinct from new.id
  ) then
    raise exception using
      errcode = '23505',
      message = format('Work order %s already exists. Use the next available work order number.', new.wo_no),
      constraint = 'work_orders_wo_no_unique_control';
  end if;

  new.wo_no := btrim(new.wo_no);
  return new;
end;
$$;

drop trigger if exists work_orders_prevent_duplicate_number on public.work_orders;
create trigger work_orders_prevent_duplicate_number
before insert or update of wo_no on public.work_orders
for each row execute function public.prevent_duplicate_work_order_number();

-- Read-only audit helper. Rows returned here are pre-existing duplicates that
-- should be reviewed individually; this migration never deletes audit data.
create or replace view public.work_order_number_duplicates as
select
  upper(btrim(wo_no)) as normalized_wo_no,
  count(*) as duplicate_count,
  array_agg(id order by created_at nulls last, id) as work_order_ids,
  array_agg(coalesce(status, '') order by created_at nulls last, id) as statuses
from public.work_orders
where nullif(btrim(coalesce(wo_no, '')), '') is not null
group by upper(btrim(wo_no))
having count(*) > 1;

