LMS Imports - PROD system-only upload

Upload the CONTENTS of this folder to the PROD GitHub repository.

The GitHub repository root should show:
- package.json
- vercel.json
- build-vercel.cjs
- scripts/
- supabase-app/
- api/

This package includes both build paths and will not fail the build if Supabase environment variables are missing. If variables are missing, the app will deploy but cannot connect until they are added in Vercel.

Required Vercel environment variables for PROD:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
