-- Store the Customer Master selection on Equipment Requests and carry the
-- requestor email into PDI work orders.
alter table public.equipment_requests
  add column if not exists customer_name text;

alter table public.work_orders
  add column if not exists requestor_email text;

create index if not exists equipment_requests_customer_name_idx
  on public.equipment_requests (customer_name);
