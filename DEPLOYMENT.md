# Konjac Gene Explorer deployment

This project is a static frontend plus a Supabase BLAST queue.

## Recommended mainland deployment

Use Tencent EdgeOne Pages for the frontend shell and Tencent COS for large
public data.

Detailed instructions:

```text
docs/deployment/edgeone-cos.md
```

Summary:

1. Run `node scripts/build-edgeone-cos-manifest.mjs`.
2. Upload every object from `deploy/cos-upload-manifest.json` to COS.
3. Configure COS CORS with `GET`, `HEAD`, and `Range` support.
4. In EdgeOne Pages, connect the GitHub repository.
5. Set build command to `node scripts/build-edgeone-pages-package.mjs`.
6. Set output directory to `edgeone-dist`.
7. Set public environment variable `KONJAC_COS_ORIGIN=https://YOUR-COS-DOMAIN`.

The generated `edgeone-dist/` package is only about 5.7 MB. Large files such
as `data/genes.json`, CDS FASTA, and the JBrowse reference assembly stay on
COS.

## Overseas mirror on Vercel

Keep the current Vercel deployment as an overseas mirror and rollback target:

```text
https://konjac-gene-explorer.vercel.app
```

If you redeploy Vercel from the full repository, use the same small-package
idea or keep the existing `.vercelignore` rules. Vercel is not the preferred
mainland entry because it may require VPN access.

## Supabase setup

Supabase provides authentication and the BLAST task queue. It does not host the
large static genome data in the EdgeOne/COS deployment.

1. Open Supabase Auth settings and enable Email/Password if login is needed.
2. Add the production frontend URL to the Auth URL settings.
3. For a fresh Supabase project, run the SQL migrations from `supabase/migrations/`.
4. Deploy the Edge Function:

```powershell
supabase functions deploy blast
```

The `blast` function requires a logged-in user for submit requests. Status
requests use the saved `job_id` and public task token.

## Local BLAST worker

The worker runs on your Windows computer. Keep the service role key only in
your local environment.

Use either the new `sb_secret_...` Secret API Key or the legacy `service_role`
JWT. Do not use the publishable key for the worker.

Build the local databases first:

```powershell
Set-Location "<project-root>"
.\scripts\build-blast-db.ps1 -IncludeGenome
```

Start the worker:

```powershell
Set-Location "<project-root>"
$env:SUPABASE_URL="https://plvylqvdlavriupvphxj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="paste-service-role-key-here"
.\scripts\run-supabase-blast-worker.ps1
```

When the worker is offline, submitted BLAST jobs stay in `queued`. When it is
running, it claims queued jobs, executes local BLAST+, and writes hits back to
Supabase.

## Local regression checks

```powershell
Set-Location "<project-root>"
npx http-server . -p 8002 -c-1 --cors
```

Open `http://127.0.0.1:8002/#/` and verify search, gene detail, CDS/protein,
overlay, JBrowse, scoring, and BLAST.
