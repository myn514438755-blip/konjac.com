# EdgeOne Pages + Tencent COS Migration Design

## Objective

Move the public Konjac Gene Explorer frontend from Vercel to Tencent EdgeOne
Pages so it is reachable more reliably from mainland China, while preserving
the existing static application, Supabase BLAST queue, and local development
workflow.

## Constraints

- EdgeOne Pages has a 25 MiB per-file limit.
- `data/genes.json` is about 63 MiB.
- `downloads/Amorphophallus_konjac.clean.cds` is about 50 MiB.
- The JBrowse reference assembly is about 1.7 GiB and requires HTTP Range
  requests.
- The frontend must never contain Tencent COS secret credentials or the
  Supabase service-role key.
- Local development at `http://127.0.0.1:8002` must continue to work without
  COS.
- Existing Vercel deployment remains available as an overseas mirror and
  rollback target.

## Architecture

### EdgeOne Pages

EdgeOne Pages serves only the application shell and small static assets:

- `index.html`
- `app.js`
- `styles.css`
- `search-worker.js`
- `assets/`
- browser-side helper scripts under `scripts/`
- runtime configuration

The Pages deployment must not contain any file larger than 25 MiB.

### Tencent COS

COS serves the complete public `data/` and `downloads/` URL trees. Keeping the
same directory structure minimizes application changes and keeps JBrowse
configuration paths stable.

The COS bucket contains, at minimum:

- `data/genes.json`
- `data/build_summary.json`
- `data/processed/sequences/`
- `data/processed/annotations/overlay/`
- `data/processed/jbrowse/`
- `data/processed/jbrowse-app/`
- `downloads/`

Raw source archives, local research results, BLAST databases, credentials, and
developer environments are not uploaded.

### Runtime URL Configuration

`runtime-config.js` defines public base URLs:

```js
window.KONJAC_RUNTIME_CONFIG = {
  dataBaseUrl: "",
  downloadsBaseUrl: "",
  jbrowseBaseUrl: ""
};
```

Empty values preserve local relative URLs. The production EdgeOne deployment
uses a generated configuration whose values point to the COS public domain.

`scripts/runtime-url-core.js` owns URL joining and exposes:

- `dataUrl(path)`
- `downloadUrl(path)`
- `jbrowseUrl(path)`

`app.js` and `index.html` use these helpers instead of hardcoded
`./data/...` and `./downloads/...` references.

## COS Access Policy

The website data is public scientific data, so the selected COS prefix may use
public-read access. Write access remains private.

CORS must allow:

- the final EdgeOne Pages domain
- `http://127.0.0.1:8002`
- `http://localhost:8002`

Allowed methods:

- `GET`
- `HEAD`

Allowed request headers include:

- `Range`
- `Content-Type`

Exposed response headers include:

- `Accept-Ranges`
- `Content-Length`
- `Content-Range`
- `ETag`

JBrowse assembly and indexed GFF objects must return byte ranges correctly.

## Deployment Packaging

A deterministic manifest script classifies files into:

- EdgeOne Pages files
- COS files
- excluded local-only files

It fails when:

- a Pages file exceeds 25 MiB
- a required COS object is missing
- a path escapes the workspace
- a secret or local environment file is selected

The script writes manifests only. It does not recursively delete or move
existing data.

## User-Facing Behavior

- Home, search, scoring, topics, browse, bulk, downloads, and help remain
  public.
- Gene details load overlay and sequence chunks from COS on demand.
- JBrowse loads its app, reference assembly, and annotation track from COS.
- BLAST job submission continues to use Supabase and the local worker.
- When COS is unavailable, the UI shows a concise data-load error rather than
  silently failing.

## Security

- COS SecretId and SecretKey are used only by the upload tool or Tencent
  console.
- `SUPABASE_SERVICE_ROLE_KEY` remains local to the BLAST worker.
- The public Supabase publishable/anon key may remain in frontend
  configuration.
- Production configuration contains public origins only.

## Verification

1. Run unit tests for URL joining and manifest classification.
2. Verify the Pages manifest contains no file above 25 MiB.
3. Verify COS responds to `HEAD` and byte-range requests.
4. Test `#/`, `#search?q=CSLA`, `#score`, gene details, sequence display,
   downloads, `#blast`, and JBrowse.
5. Test from a mainland network without VPN.
6. Keep the Vercel URL unchanged until the EdgeOne deployment passes all
   checks.

## Rollback

Rollback requires only changing the public link back to Vercel. No source data
is deleted, and local relative-path behavior remains available throughout the
migration.
