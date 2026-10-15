-- Existing history is retained; new records and edits to customer/jobsite must be complete.
create or replace function public.require_work_order_customer_jobsite()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if not coalesce(new.bill_to_customer ~ '[^[:space:]]', false)
     or not coalesce(new.jobsite_location ~ '[^[:space:]]', false) then
    raise exception using errcode = '23514', message = 'Customer and Jobsite are required. Complete both before saving the work order.';
  end if;
  return new;
end;
$$;
create trigger work_orders_required_customer_jobsite
before insert or update of bill_to_customer, jobsite_location on public.work_orders
for each row execute function public.require_work_order_customer_jobsite();
