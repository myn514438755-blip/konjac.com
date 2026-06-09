# EdgeOne Pages + Tencent COS Deployment

This deployment is for mainland China access.

- EdgeOne Pages hosts the small static website shell.
- Tencent COS hosts public `data/` and `downloads/` files.
- Supabase remains the BLAST queue backend.
- Vercel remains the overseas mirror and rollback target.

## 1. Build Manifests

From the project root:

```powershell
Set-Location "D:\桌面图标\wwww. konjac"
node scripts/build-edgeone-cos-manifest.mjs
```

Expected summary:

```text
EdgeOne: 11 files, about 5.7 MB
COS: 628 files, about 2.2 GB
```

Generated files:

- `deploy/edgeone-pages-manifest.json`
- `deploy/cos-upload-manifest.json`

The manifest script does not delete, move, or rewrite source data.

## 2. Create Tencent COS Bucket

Create a COS bucket in a region that works well for your target visitors.
Use public read access only for the website data objects. Write access must
remain private.

Recommended CORS settings:

```text
Allowed origins:
https://YOUR-EDGEONE-PAGES-DOMAIN
http://127.0.0.1:8002
http://localhost:8002

Allowed methods:
GET
HEAD

Allowed request headers:
Range
Content-Type

Exposed response headers:
Accept-Ranges
Content-Length
Content-Range
ETag
```

JBrowse requires byte-range requests. If Range support is missing, the genome
browser can open but the reference sequence and indexed GFF will fail.

Never put Tencent `SecretId`, Tencent `SecretKey`, or Supabase
`SUPABASE_SERVICE_ROLE_KEY` in frontend files.

## 3. Upload COS Objects

Upload every path listed in:

```text
deploy/cos-upload-manifest.json
```

Preserve the object keys exactly. For example:

```text
data/genes.json
data/processed/jbrowse-app/index.html
data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz
downloads/Amorphophallus_konjac.clean.cds
```

After uploading, verify the public COS domain:

```powershell
curl.exe -I "https://YOUR-COS-DOMAIN/data/genes.json"
curl.exe -I -H "Range: bytes=0-99" "https://YOUR-COS-DOMAIN/data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz"
```

The second command should return HTTP `206` and include:

```text
Accept-Ranges: bytes
Content-Range: bytes 0-99/...
```

## 4. Configure EdgeOne Pages

Connect EdgeOne Pages to:

```text
https://github.com/myn514438755-blip/konjac.com.git
```

Use:

```text
Branch: main
Framework preset: Other / Static
Build command: node scripts/build-edgeone-pages-package.mjs
Output directory: edgeone-dist
```

Add this public environment variable:

```text
KONJAC_COS_ORIGIN=https://YOUR-COS-DOMAIN
```

`KONJAC_COS_ORIGIN` is a public static-data origin, not a secret.

The repository includes `edgeone.json` with the same build command and output
directory, so the console can also read settings from that file if supported.

## 5. What EdgeOne Publishes

The build command creates `edgeone-dist/` during deployment. It contains only:

- `index.html`
- `app.js`
- `styles.css`
- `search-worker.js`
- `runtime-config.js`
- `assets/`
- required browser helper scripts

Large data stays on COS. Local research outputs, BLAST databases, raw archives,
and credentials are not published.

## 6. Production Verification

After EdgeOne reports deployment success, test these pages without VPN:

```text
https://YOUR-EDGEONE-PAGES-DOMAIN/#/
https://YOUR-EDGEONE-PAGES-DOMAIN/#search?q=CSLA
https://YOUR-EDGEONE-PAGES-DOMAIN/#score
https://YOUR-EDGEONE-PAGES-DOMAIN/#blast
https://YOUR-EDGEONE-PAGES-DOMAIN/data/processed/jbrowse-app/index.html
```

Also verify:

- home statistics load
- search returns genes
- gene detail opens
- CDS and protein load from COS
- enhanced annotation overlay loads from COS
- downloads use the COS domain
- BLAST can submit or show the expected Supabase message
- JBrowse can navigate to `JAHNEJ010001739.1:48000..52000`

## 7. Rollback

Keep the current Vercel deployment online:

```text
https://konjac-gene-explorer.vercel.app
```

If EdgeOne or COS has a problem, share the Vercel URL while fixing COS CORS,
Range support, or object paths.
