alter table app_profiles
  add column if not exists email text;

create unique index if not exists app_profiles_email_key
  on app_profiles (lower(email))
  where email is not null;
