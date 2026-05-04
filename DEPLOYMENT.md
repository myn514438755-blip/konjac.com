# Konjac Gene Explorer deployment

This project is a static frontend plus a Supabase BLAST queue.

## Frontend on Vercel

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Use these project settings:
   - Framework Preset: Other
   - Build Command: empty
   - Output Directory: `.`
   - Install Command: empty
4. Deploy the project.
5. Open the deployed URL and test:
   - `#/`
   - `#search?q=csl`
   - `#blast`
   - `data/processed/jbrowse-app/index.html`

The site uses hash routes, so no SPA rewrite is required.

## Supabase setup

1. Open Supabase Auth settings and enable Email/Password.
2. Add the Vercel production URL to the Auth URL settings.
3. The current Supabase project has already been migrated through the Supabase MCP. For a fresh Supabase project, run these SQL files in order from the Supabase SQL editor:
   - `supabase/migrations/20260503190000_create_blast_queue.sql`
   - `supabase/migrations/20260504102000_set_blast_updated_at_search_path.sql`

Do not run `supabase db push` against the already migrated project unless you first align the Supabase CLI migration history, because the MCP-generated remote migration versions differ from the local filenames.

4. Deploy the Edge Function:

```powershell
supabase functions deploy blast
```

The `blast` function requires a logged-in user for submit requests. Status requests use the saved `job_id` and public task token.

## Local BLAST worker

The worker runs on your Windows computer. Keep the service role key only in your local environment.
Use either the new `sb_secret_...` Secret API Key or the legacy `service_role` JWT. Do not use the publishable key for the worker. The worker sets a non-browser User-Agent so Supabase accepts `sb_secret_...` from this local background process.

```powershell
Set-Location "D:\桌面图标\wwww. konjac"
$env:SUPABASE_URL="https://plvylqvdlavriupvphxj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="paste-service-role-key-here"
.\scripts\run-supabase-blast-worker.ps1
```

When the worker is offline, submitted BLAST jobs stay in `queued`. When it is running, it claims queued jobs, executes local BLAST+, and writes hits back to Supabase.

## Local regression checks

```powershell
Set-Location "D:\桌面图标\wwww. konjac"
npx http-server . -p 8002 -c-1 --cors
```

Open `http://127.0.0.1:8002/#/` and verify search, gene detail, CDS/protein, overlay, JBrowse, and BLAST.
