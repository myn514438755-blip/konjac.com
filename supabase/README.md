# Supabase BLAST queue

This project uses Supabase as the online BLAST queue and status API.

- `supabase/migrations/20260503190000_create_blast_queue.sql` creates `blast_jobs` and `blast_hits`.
- `supabase/functions/blast/index.ts` receives browser requests for submit/status.
- `scripts/run-supabase-blast-worker.ps1` runs BLAST+ outside Supabase and writes results back.

Supabase Edge Functions should not run the BLAST binary directly. Keep BLAST+ on a local machine or server worker, with `SUPABASE_SERVICE_ROLE_KEY` stored only in that worker environment.

Worker environment:

```powershell
$env:SUPABASE_URL="https://plvylqvdlavriupvphxj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
.\scripts\run-supabase-blast-worker.ps1
```
