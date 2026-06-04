LMS Imports - PROD system-only upload

Upload this folder to the PROD GitHub repository only.

This folder contains app/system files only:
- package.json
- vercel.json
- scripts/
- supabase-app/
- api/

This folder does not include Supabase data, sample data, accounting entries, purchasing entries, inventory balances, or SQL reset scripts.

Required Vercel environment variables for the PROD Vercel project:
- SUPABASE_URL: PROD Supabase project URL
- SUPABASE_ANON_KEY: PROD Supabase publishable/anon key
- SUPABASE_SERVICE_ROLE_KEY: PROD Supabase service role key for creating company users

The app generates supabase-config.js during Vercel build from this Vercel project's environment variables. That keeps PROD connected to PROD Supabase.
