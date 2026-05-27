alter table rentals
  add column if not exists customer_po text,
  add column if not exists manager_override boolean not null default false,
  add column if not exists override_by text,
  add column if not exists override_reason text;
