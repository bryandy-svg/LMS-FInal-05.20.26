alter table purchase_orders add column if not exists landed_cost_enabled boolean not null default false;
alter table purchase_orders add column if not exists landed_cost_method text not null default 'By Value';
alter table purchase_orders add column if not exists duty_amount numeric not null default 0;
alter table purchase_orders add column if not exists other_landed_cost_amount numeric not null default 0;

alter table purchase_order_lines add column if not exists allocated_landed_cost numeric not null default 0;
alter table purchase_order_lines add column if not exists landed_unit_cost numeric not null default 0;
