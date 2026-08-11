alter table work_order_parts
  add column if not exists markup_percent numeric,
  add column if not exists selling_price numeric;

update work_order_parts as part
set
  selling_price = coalesce(part.selling_price, product.selling_price, part.unit_cost),
  markup_percent = coalesce(
    part.markup_percent,
    product.markup_percent,
    case
      when coalesce(part.unit_cost, 0) > 0
        then round(((coalesce(product.selling_price, part.unit_cost) / part.unit_cost) - 1) * 100, 4)
      else null
    end
  )
from products as product
where (part.product_id = product.id or (part.product_id is null and part.sku = product.sku))
  and (part.selling_price is null or part.markup_percent is null);

update work_order_parts
set selling_price = unit_cost
where selling_price is null;
