LMS Imports - PROD system-only upload

Upload the CONTENTS of this folder to the PROD GitHub repository.

The GitHub repository root must show these files/folders directly:
- package.json
- vercel.json
- build-vercel.cjs
- supabase-app/
- api/

This upload is app/system code only. It does not include Supabase data or SQL reset scripts.

Required Vercel environment variables for the PROD Vercel project:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

This package uses a root-level build-vercel.cjs file so Vercel will not look for scripts/build-vercel.cjs.
