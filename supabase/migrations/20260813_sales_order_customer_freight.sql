alter table public.sales_orders
add column if not exists freight_amount numeric not null default 0;

comment on column public.sales_orders.freight_amount is
'Freight amount billed to the customer on the sales order.';
