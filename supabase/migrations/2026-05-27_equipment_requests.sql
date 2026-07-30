alter table assets add column if not exists requested_by text;
alter table assets add column if not exists approved_by text;

create table if not exists equipment_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text unique not null,
  request_date date not null default current_date,
  asset_id uuid references assets(id) on delete set null,
  asset_tag text,
  asset_name text,
  requested_by text not null,
  requested_signature text,
  po_no text,
  from_date date not null,
  to_date date not null,
  approved_by text,
  status text not null default 'Requested',
  notes text,
  created_at timestamptz not null default now(),
  constraint equipment_requests_date_check check (to_date >= from_date)
);

insert into app_sequences(key, prefix, next_number)
values ('equipment_request', 'ER-', 1001)
on conflict (key) do nothing;

alter table equipment_requests enable row level security;
drop policy if exists "authenticated full access" on equipment_requests;
create policy "authenticated full access" on equipment_requests for all to authenticated using (true) with check (true);
