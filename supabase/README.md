# Supabase BLAST queue

This project uses Supabase as the online BLAST queue and status API. The website stays static; BLAST computation runs in a local worker.

- `supabase/migrations/20260503190000_create_blast_queue.sql` creates `blast_jobs` and `blast_hits`.
- `supabase/migrations/20260504112000_add_genome_blast_database.sql` and `20260504112100_allow_genome_blast_jobs.sql` add optional `blastn` against `konjac_genome`.
- `supabase/functions/blast/index.ts` receives browser requests for submit/status.
- `scripts/run-supabase-blast-worker.ps1` runs BLAST+ outside Supabase and writes results back.

Submit requests require a Supabase Auth user token. Status requests use `job_id` plus the public job token, so users can refresh their last job without exposing the service role key.

Supabase Edge Functions should not run the BLAST binary directly. Keep BLAST+ on a local machine or server worker, with `SUPABASE_SERVICE_ROLE_KEY` stored only in that worker environment. Never commit the service role key. The worker accepts either the new `sb_secret_...` Secret API Key or the legacy `service_role` JWT. For `sb_secret_...`, the worker sends a non-browser User-Agent because Supabase blocks secret keys from browser-like clients.

Worker environment:

```powershell
Set-Location "<project-root>"
$env:SUPABASE_URL="https://plvylqvdlavriupvphxj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
.\scripts\run-supabase-blast-worker.ps1
```

Frontend deployment notes are in `DEPLOYMENT.md`.

The current hosted Supabase project was migrated through the Supabase MCP. For a fresh project, run the SQL files in `supabase/migrations/` in filename order. The enum migration and the check-constraint migration are intentionally split so Postgres can commit the new `konjac_genome` enum value before the constraint uses it.
