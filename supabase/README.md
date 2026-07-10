# LMS Imports Supabase Setup

This folder starts the conversion from the local `inventory-system.html` prototype to a live Supabase-backed system.

## 1. Create the Supabase project

1. Go to Supabase and create a new project.
2. Open **SQL Editor**.
3. Paste and run `supabase/schema.sql`.
4. Open **Storage** and confirm these buckets exist:
   - `product-photos`
   - `asset-photos`

## 2. Add the admin user

1. Go to **Authentication > Users**.
2. Add a user with your real email address.
3. Set the password you want to use.
4. Copy the user UUID.
5. In SQL Editor, run this, replacing the UUID and email:

```sql
insert into app_profiles (id, username, full_name, role, modules)
values (
  'PASTE-AUTH-USER-UUID-HERE',
  'Bryan.dy',
  'Bryan.dy',
  'Administrator',
  array['all']
)
on conflict (id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  role = excluded.role,
  modules = excluded.modules;
```

Supabase login uses email/password, while the profile keeps `Bryan.dy` as the system username.

## 3. Connect the web app

1. Open **Project Settings > API**.
2. Copy the Project URL and anon/public key.
3. Paste them into:

```text
supabase-app/supabase-config.js
```

## 4. Run locally

Because the app uses browser modules, open it through a small local server:

```powershell
cd supabase-app
python -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## 5. Deploy live

Recommended path:

1. Push this folder to GitHub.
2. Create a Vercel project.
3. Set the project root to `supabase-app`.
4. Deploy.

For production, keep Row Level Security enabled. The current first-pass policy allows any authenticated user to use the app tables. The next security pass should restrict access by `app_profiles.modules`.
