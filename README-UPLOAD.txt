LMS Imports - PROD system-only upload

Upload the CONTENTS of this folder to the PROD GitHub repository.

Do not upload the folder as a folder inside GitHub. The repository root should show:
- package.json
- vercel.json
- scripts/
- supabase-app/
- api/

This upload is app/system code only. It does not include Supabase data or SQL reset scripts.

Required Vercel environment variables for the PROD Vercel project:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

This version includes Vercel routing fallback so the app opens from the main Vercel URL.
