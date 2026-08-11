-- Adds size to Fleet & Equipment assets.
alter table assets
  add column if not exists size text;
