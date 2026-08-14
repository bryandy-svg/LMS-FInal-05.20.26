-- Run once in Supabase SQL Editor before using the PO-to-customer/work-order workflow.
-- Existing purchase orders remain Inventory Stock unless they already reference a work order.

alter table public.purchase_orders
  add column if not exists purchase_purpose text,
  add column if not exists linked_customer text,
  add column if not exists linked_sales_order_no text;

update public.purchase_orders
set purchase_purpose = case
  when coalesce(trim(ap_support_wo_no), '') <> '' then 'Work Order'
  else 'Inventory Stock'
end
where purchase_purpose is null or trim(purchase_purpose) = '';

alter table public.purchase_orders
  alter column purchase_purpose set default 'Inventory Stock',
  alter column purchase_purpose set not null;

alter table public.purchase_orders
  drop constraint if exists purchase_orders_purchase_purpose_check;

alter table public.purchase_orders
  add constraint purchase_orders_purchase_purpose_check
  check (purchase_purpose in ('Inventory Stock', 'Customer Order', 'Work Order'));

alter table public.sales_orders
  add column if not exists source_po_no text;

create index if not exists purchase_orders_linked_customer_idx
  on public.purchase_orders (linked_customer)
  where linked_customer is not null;

create index if not exists purchase_orders_linked_sales_order_idx
  on public.purchase_orders (linked_sales_order_no)
  where linked_sales_order_no is not null;

create index if not exists sales_orders_source_po_idx
  on public.sales_orders (source_po_no)
  where source_po_no is not null;

grant select, insert, update on table public.purchase_orders to anon, authenticated;
grant select, insert, update on table public.sales_orders to anon, authenticated;

notify pgrst, 'reload schema';
