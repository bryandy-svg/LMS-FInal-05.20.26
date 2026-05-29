alter table assets add column if not exists parent_asset_id uuid references assets(id) on delete set null;
alter table assets add column if not exists parent_asset_tag text;
alter table assets add column if not exists relationship_type text;
alter table assets add column if not exists compatible_with text;
alter table assets add column if not exists old_qr_code text;
alter table assets add column if not exists last_update_date date;
alter table assets add column if not exists qr_printed_tagged text;
alter table assets add column if not exists requested_by text;
alter table assets add column if not exists approved_by text;
