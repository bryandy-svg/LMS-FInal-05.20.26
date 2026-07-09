-- Clears only Fleet & Equipment asset master rows.
-- Keeps products, vendors, customers, users, invoices, accounting, and existing work order history.

update work_orders
set asset_id = null
where asset_id is not null;

update rentals
set item_id = null
where item_type = 'Asset';

update equipment_requests
set asset_id = null
where asset_id is not null;

delete from assets;
