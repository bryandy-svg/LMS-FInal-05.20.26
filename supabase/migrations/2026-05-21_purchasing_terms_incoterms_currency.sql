create table if not exists incoterms (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  notes text
);

create table if not exists standard_po_notes (
  id uuid primary key default gen_random_uuid(),
  title text unique not null,
  body text not null
);

alter table purchase_orders add column if not exists jobsite_project text not null default 'General';
alter table purchase_orders add column if not exists payment_terms text;
alter table purchase_orders add column if not exists incoterm text;
alter table purchase_orders add column if not exists foreign_order boolean not null default false;
alter table purchase_orders add column if not exists foreign_country text;
alter table purchase_orders add column if not exists currency_code text not null default 'USD';
alter table purchase_orders add column if not exists exchange_rate numeric not null default 1;
alter table purchase_orders add column if not exists freight_amount numeric not null default 0;
alter table purchase_orders add column if not exists landed_cost_enabled boolean not null default false;
alter table purchase_orders add column if not exists landed_cost_method text not null default 'By Value';
alter table purchase_orders add column if not exists duty_amount numeric not null default 0;
alter table purchase_orders add column if not exists other_landed_cost_amount numeric not null default 0;

alter table purchase_order_lines add column if not exists unit text;
alter table purchase_order_lines add column if not exists foreign_unit_cost numeric not null default 0;
alter table purchase_order_lines add column if not exists allocated_landed_cost numeric not null default 0;
alter table purchase_order_lines add column if not exists landed_unit_cost numeric not null default 0;

insert into master_terms(name, days) values
  ('Due on receipt',0),
  ('Net 15',15),
  ('Net 30',30),
  ('Net 45',45),
  ('Net 60',60),
  ('Net 90',90),
  ('50% payment upon order',0)
on conflict (name) do update set days = excluded.days;

insert into incoterms(name, notes) values
  ('FOB','Free on Board'),
  ('CIF','Cost, Insurance, and Freight'),
  ('DDP','Delivered Duty Paid'),
  ('EXW','Ex Works')
on conflict (name) do update set notes = excluded.notes;

insert into standard_po_notes(title, body) values
  ('Standard receiving note','Vendor must include PO number, packing slip, and invoice reference with every shipment.'),
  ('Freight note','Freight charges must be shown separately from parts or material cost.'),
  ('Warranty note','All parts are subject to manufacturer warranty and return approval.')
on conflict (title) do update set body = excluded.body;

alter table incoterms enable row level security;
alter table standard_po_notes enable row level security;

drop policy if exists "authenticated full access" on incoterms;
create policy "authenticated full access" on incoterms for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on standard_po_notes;
create policy "authenticated full access" on standard_po_notes for all to authenticated using (true) with check (true);
