# Supabase BLAST queue

This project uses Supabase as the online BLAST queue and status API. The website stays static; BLAST computation runs in a local worker.

- `supabase/migrations/20260503190000_create_blast_queue.sql` creates `blast_jobs` and `blast_hits`.
- `supabase/functions/blast/index.ts` receives browser requests for submit/status.
- `scripts/run-supabase-blast-worker.ps1` runs BLAST+ outside Supabase and writes results back.

Submit requests require a Supabase Auth user token. Status requests use `job_id` plus the public job token, so users can refresh their last job without exposing the service role key.

Supabase Edge Functions should not run the BLAST binary directly. Keep BLAST+ on a local machine or server worker, with `SUPABASE_SERVICE_ROLE_KEY` stored only in that worker environment. Never commit the service role key.

Worker environment:

```powershell
Set-Location "D:\桌面图标\wwww. konjac"
$env:SUPABASE_URL="https://plvylqvdlavriupvphxj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
.\scripts\run-supabase-blast-worker.ps1
```

Frontend deployment notes are in `DEPLOYMENT.md`.

The current hosted Supabase project was migrated through the Supabase MCP. For a fresh project, run the SQL files in `supabase/migrations/` in filename order.
