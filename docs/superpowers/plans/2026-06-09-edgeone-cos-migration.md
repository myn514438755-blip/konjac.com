# EdgeOne Pages + Tencent COS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the static Konjac Gene Explorer UI on Tencent EdgeOne Pages and serve its large public datasets from Tencent COS without breaking local development, JBrowse, downloads, or Supabase BLAST.

**Architecture:** A small browser-side URL resolver switches between local relative paths and production COS origins. A manifest builder separates the EdgeOne application shell from COS data, verifies EdgeOne's 25 MiB limit, and produces upload/deployment inventories without deleting existing files.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js tests and manifest scripts, Tencent EdgeOne Pages, Tencent COS, JBrowse 2, Supabase.

---

## File Map

- Create `scripts/runtime-url-core.js`: pure browser/Node URL resolution logic.
- Create `scripts/test-runtime-url-core.mjs`: URL resolver unit tests.
- Create `runtime-config.js`: safe local defaults committed to the repository.
- Create `runtime-config.edgeone.example.js`: production COS configuration template.
- Modify `index.html`: load runtime configuration and use a runtime JBrowse link.
- Modify `app.js`: resolve all data, download, sequence, overlay, and JBrowse URLs.
- Create `scripts/build-edgeone-cos-manifest.mjs`: classify and validate deployment files.
- Create `scripts/test-edgeone-cos-manifest.mjs`: manifest rules and size-limit tests.
- Create `scripts/build-edgeone-pages-package.mjs`: build the small EdgeOne output package from the Pages manifest.
- Create `scripts/test-edgeone-pages-package.mjs`: production runtime-config package tests.
- Create `edgeone.json`: EdgeOne build command and output directory settings.
- Create `deploy/edgeone-pages-manifest.json`: generated frontend inventory.
- Create `deploy/cos-upload-manifest.json`: generated COS inventory.
- Create `docs/deployment/edgeone-cos.md`: Tencent console and verification instructions.
- Modify `.gitignore`: ignore local production runtime configuration and upload logs.
- Modify `DEPLOYMENT.md`: identify EdgeOne as the mainland frontend and Vercel as mirror.

### Task 1: Runtime URL Resolver

**Files:**
- Create: `scripts/runtime-url-core.js`
- Create: `scripts/test-runtime-url-core.mjs`

- [ ] **Step 1: Write the failing URL resolver tests**

```js
import assert from 'node:assert/strict';
import '../scripts/runtime-url-core.js';

const api = globalThis.KonjacRuntimeUrls;

assert.equal(api.joinUrl('', 'data/genes.json'), './data/genes.json');
assert.equal(
  api.joinUrl('https://static.example.com/konjac/', '/data/genes.json'),
  'https://static.example.com/konjac/data/genes.json'
);

const local = api.createResolvers({});
assert.equal(local.dataUrl('genes.json'), './data/genes.json');
assert.equal(local.downloadUrl('file.fa'), './downloads/file.fa');
assert.equal(
  local.jbrowseUrl('index.html'),
  './data/processed/jbrowse-app/index.html'
);

const production = api.createResolvers({
  dataBaseUrl: 'https://cos.example.com/data',
  downloadsBaseUrl: 'https://cos.example.com/downloads',
  jbrowseBaseUrl: 'https://cos.example.com/data/processed/jbrowse-app'
});
assert.equal(
  production.dataUrl('processed/sequences/sequence_index.json'),
  'https://cos.example.com/data/processed/sequences/sequence_index.json'
);
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node scripts/test-runtime-url-core.mjs
```

Expected: failure because `scripts/runtime-url-core.js` does not exist.

- [ ] **Step 3: Implement the resolver**

```js
(function initRuntimeUrls(root) {
  function trimSlashes(value) {
    return String(value || '').replace(/^\/+|\/+$/g, '');
  }

  function joinUrl(baseUrl, path, localRoot = '.') {
    const cleanPath = trimSlashes(path);
    if (!baseUrl) return `${localRoot}/${cleanPath}`;
    return `${String(baseUrl).replace(/\/+$/g, '')}/${cleanPath}`;
  }

  function createResolvers(config = {}) {
    return {
      dataUrl: (path) => joinUrl(config.dataBaseUrl, path, './data'),
      downloadUrl: (path) =>
        joinUrl(config.downloadsBaseUrl, path, './downloads'),
      jbrowseUrl: (path) =>
        joinUrl(
          config.jbrowseBaseUrl,
          path,
          './data/processed/jbrowse-app'
        )
    };
  }

  root.KonjacRuntimeUrls = { joinUrl, createResolvers };
})(typeof window === 'undefined' ? globalThis : window);
```

- [ ] **Step 4: Run the resolver tests**

Run:

```powershell
node scripts/test-runtime-url-core.mjs
```

Expected: all assertions pass and exit code is `0`.

- [ ] **Step 5: Commit the resolver**

```powershell
git --git-dir=.gitdata --work-tree=. add scripts/runtime-url-core.js scripts/test-runtime-url-core.mjs
git --git-dir=.gitdata --work-tree=. commit -m "Add runtime asset URL resolver"
```

### Task 2: Runtime Configuration and Application Wiring

**Files:**
- Create: `runtime-config.js`
- Create: `runtime-config.edgeone.example.js`
- Modify: `index.html:8-26`
- Modify: `index.html:340-342`
- Modify: `app.js:1-16`
- Modify: `app.js:736`
- Modify: `app.js:2111`
- Modify: `app.js:2257`
- Modify: `app.js:2380`
- Modify: `app.js:2656-2658`

- [ ] **Step 1: Add safe local and production example configurations**

```js
// runtime-config.js
window.KONJAC_RUNTIME_CONFIG = window.KONJAC_RUNTIME_CONFIG || {
  dataBaseUrl: '',
  downloadsBaseUrl: '',
  jbrowseBaseUrl: ''
};
```

```js
// runtime-config.edgeone.example.js
window.KONJAC_RUNTIME_CONFIG = {
  dataBaseUrl: 'https://YOUR-COS-DOMAIN/data',
  downloadsBaseUrl: 'https://YOUR-COS-DOMAIN/downloads',
  jbrowseBaseUrl:
    'https://YOUR-COS-DOMAIN/data/processed/jbrowse-app'
};
```

- [ ] **Step 2: Load configuration before application code**

Add before `app.js`:

```html
<script src="./runtime-config.js"></script>
<script src="./scripts/runtime-url-core.js"></script>
```

Change the navigation JBrowse link to:

```html
<a href="#jbrowse" id="navJbrowseLink">基因组浏览器</a>
```

- [ ] **Step 3: Replace top-level hardcoded application URLs**

At the beginning of `app.js`:

```js
const runtimeUrls = window.KonjacRuntimeUrls.createResolvers(
  window.KONJAC_RUNTIME_CONFIG || {}
);
const DATA_URL = runtimeUrls.dataUrl('genes.json');
const SUMMARY_URL = runtimeUrls.dataUrl('build_summary.json');
const OVERLAY_INDEX_URL = runtimeUrls.dataUrl(
  'processed/annotations/overlay/annotation_overlay_index.json'
);
const JBROWSE_SEQID_MAP_URL = runtimeUrls.dataUrl(
  'processed/jbrowse/seqid_map.json'
);
const SEQUENCE_INDEX_URL = runtimeUrls.dataUrl(
  'processed/sequences/sequence_index.json'
);
const SEQUENCE_FILES = {
  cds: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.cds'),
  protein: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.pep')
};
```

- [ ] **Step 4: Resolve dynamic sequence chunk paths**

When reading a chunk path from `sequence_index.json`, normalize it to a path
under `data/` and call:

```js
const chunkUrl = runtimeUrls.dataUrl(
  String(chunkPath).replace(/^\.?\/?data\//, '')
);
```

Use `SEQUENCE_INDEX_URL` for the index fetch.

- [ ] **Step 5: Resolve JBrowse and download links**

Use:

```js
const jbrowseHomeUrl = runtimeUrls.jbrowseUrl('index.html');
const downloadUrls = {
  cds: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.cds'),
  protein: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.pep'),
  gff: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.gff')
};
```

Set `navJbrowseLink.href = jbrowseHomeUrl` during initialization and use
`runtimeUrls.jbrowseUrl(...)` for coordinate links.

- [ ] **Step 6: Add a wiring regression test**

Create `scripts/test-runtime-url-wiring.mjs` that asserts `app.js` contains no
fetch call beginning with a literal `./data/` or `./downloads/`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app.js', 'utf8');
assert.equal(/fetch\(\s*['"]\.\/data\//.test(source), false);
assert.equal(/fetch\(\s*['"]\.\/downloads\//.test(source), false);
assert.match(source, /runtimeUrls\.dataUrl/);
assert.match(source, /runtimeUrls\.downloadUrl/);
assert.match(source, /runtimeUrls\.jbrowseUrl/);
```

- [ ] **Step 7: Run browser-side tests**

Run:

```powershell
node scripts/test-runtime-url-core.mjs
node scripts/test-runtime-url-wiring.mjs
node scripts/test-gene-display.mjs
node scripts/test-function-scorer.mjs
```

Expected: all commands exit with code `0`.

- [ ] **Step 8: Commit runtime wiring**

```powershell
git --git-dir=.gitdata --work-tree=. add runtime-config.js runtime-config.edgeone.example.js index.html app.js scripts/test-runtime-url-wiring.mjs
git --git-dir=.gitdata --work-tree=. commit -m "Route public datasets through runtime origins"
```

### Task 3: EdgeOne and COS Manifest Builder

**Files:**
- Create: `scripts/build-edgeone-cos-manifest.mjs`
- Create: `scripts/test-edgeone-cos-manifest.mjs`
- Create: `deploy/edgeone-pages-manifest.json`
- Create: `deploy/cos-upload-manifest.json`

- [ ] **Step 1: Write manifest classification tests**

```js
import assert from 'node:assert/strict';
import {
  classifyPath,
  assertPageFileSize
} from './build-edgeone-cos-manifest.mjs';

assert.equal(classifyPath('index.html'), 'pages');
assert.equal(classifyPath('assets/ai/konjac-hero-genome.png'), 'pages');
assert.equal(classifyPath('data/genes.json'), 'cos');
assert.equal(classifyPath('downloads/test.fa'), 'cos');
assert.equal(classifyPath('.env'), 'excluded');
assert.equal(classifyPath('blastdb/konjac_cds.nsq'), 'excluded');
assert.throws(() => assertPageFileSize('large.bin', 25 * 1024 * 1024 + 1));
assert.doesNotThrow(() =>
  assertPageFileSize('small.bin', 25 * 1024 * 1024)
);
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node scripts/test-edgeone-cos-manifest.mjs
```

Expected: failure because the manifest module does not exist.

- [ ] **Step 3: Implement path classification**

The module exports:

```js
export const EDGEONE_FILE_LIMIT = 25 * 1024 * 1024;

export function classifyPath(relativePath) {
  const path = relativePath.replaceAll('\\', '/');
  if (
    path === '.env' ||
    path.startsWith('.env.') ||
    path.startsWith('.git') ||
    path.startsWith('blastdb/') ||
    path.startsWith('blast_results/') ||
    path.startsWith('tools/') ||
    path.startsWith('envs/') ||
    path.startsWith('data/raw/')
  ) return 'excluded';
  if (path.startsWith('data/') || path.startsWith('downloads/')) return 'cos';
  return 'pages';
}

export function assertPageFileSize(path, size) {
  if (size > EDGEONE_FILE_LIMIT) {
    throw new Error(`EdgeOne file exceeds 25 MiB: ${path} (${size} bytes)`);
  }
}
```

The command-line entry walks only approved website roots, computes SHA-256,
and writes arrays containing `path`, `size`, and `sha256`.

- [ ] **Step 4: Protect required objects**

The builder must fail unless these files exist:

```js
const requiredCosPaths = [
  'data/genes.json',
  'data/build_summary.json',
  'data/processed/sequences/sequence_index.json',
  'data/processed/annotations/overlay/annotation_overlay_index.json',
  'data/processed/jbrowse-app/index.html',
  'data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz',
  'data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz.fai',
  'data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz.gzi',
  'downloads/Amorphophallus_konjac.clean.cds',
  'downloads/Amorphophallus_konjac.clean.pep',
  'downloads/Amorphophallus_konjac.clean.gff'
];
```

- [ ] **Step 5: Run tests and generate manifests**

Run:

```powershell
node scripts/test-edgeone-cos-manifest.mjs
node scripts/build-edgeone-cos-manifest.mjs
```

Expected:

- unit tests pass
- no EdgeOne file exceeds 25 MiB
- both JSON manifests are written
- required COS objects are present

- [ ] **Step 6: Commit manifest tooling**

```powershell
git --git-dir=.gitdata --work-tree=. add scripts/build-edgeone-cos-manifest.mjs scripts/test-edgeone-cos-manifest.mjs deploy/edgeone-pages-manifest.json deploy/cos-upload-manifest.json
git --git-dir=.gitdata --work-tree=. commit -m "Add EdgeOne and COS deployment manifests"
```

### Task 4: Deployment Documentation and Ignore Rules

**Files:**
- Create: `docs/deployment/edgeone-cos.md`
- Modify: `.gitignore`
- Modify: `DEPLOYMENT.md`

- [ ] **Step 1: Document COS bucket setup**

The document must give these exact console settings:

```text
Bucket access: public-read for website data; private-write
Allowed origins: final EdgeOne domain, http://127.0.0.1:8002,
http://localhost:8002
Allowed methods: GET, HEAD
Allowed headers: Range, Content-Type
Exposed headers: Accept-Ranges, Content-Length, Content-Range, ETag
```

It must explain that COS SecretId and SecretKey never belong in
`runtime-config.js`.

- [ ] **Step 2: Document object upload and verification**

Include these verification commands:

```powershell
curl.exe -I "https://YOUR-COS-DOMAIN/data/genes.json"
curl.exe -I -H "Range: bytes=0-99" "https://YOUR-COS-DOMAIN/data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz"
```

Expected JBrowse response: HTTP `206`, `Accept-Ranges: bytes`, and a valid
`Content-Range`.

- [ ] **Step 3: Document EdgeOne Git deployment**

Use repository:

```text
https://github.com/myn514438755-blip/konjac.com.git
```

Configuration:

```text
Branch: main
Framework preset: Other / Static
Root directory: repository root
Build command: node scripts/build-edgeone-pages-package.mjs
Output directory: edgeone-dist
```

Set the public environment variable
`KONJAC_COS_ORIGIN=https://ACTUAL-COS-PUBLIC-DOMAIN`. The build command
generates `edgeone-dist/runtime-config.js` from that value.

- [ ] **Step 4: Update ignore rules**

Add:

```gitignore
# Local Tencent deployment credentials and logs
.env.cos
deploy/*.log
runtime-config.edgeone.local.js
```

- [ ] **Step 5: Update the main deployment guide**

State:

- EdgeOne Pages is the mainland frontend.
- COS is the large static-data origin.
- Vercel is retained as an overseas mirror.
- Supabase remains the BLAST queue and authentication provider.

- [ ] **Step 6: Commit documentation**

```powershell
git --git-dir=.gitdata --work-tree=. add docs/deployment/edgeone-cos.md .gitignore DEPLOYMENT.md
git --git-dir=.gitdata --work-tree=. commit -m "Document EdgeOne and COS deployment"
```

### Task 5: Local Regression Verification

**Files:**
- Test: `index.html`
- Test: `app.js`
- Test: `search-worker.js`

- [ ] **Step 1: Start the static server**

Run:

```powershell
npx http-server . -p 8002 -c-1 --cors
```

Expected: server listens on `http://127.0.0.1:8002`.

- [ ] **Step 2: Verify public routes**

Open and verify:

```text
http://127.0.0.1:8002/#/
http://127.0.0.1:8002/#search?q=CSLA
http://127.0.0.1:8002/#score
http://127.0.0.1:8002/#blast
```

Expected: no console errors and no unexpected jump to page top.

- [ ] **Step 3: Verify gene detail and lazy data**

Open a known gene detail and verify:

- overlay annotation loads
- CDS loads
- protein loads
- sequence download works
- JBrowse coordinate link is generated

- [ ] **Step 4: Verify local JBrowse**

Open:

```text
http://127.0.0.1:8002/data/processed/jbrowse-app/index.html
```

Navigate to:

```text
JAHNEJ010001739.1:48000..52000
```

Expected: reference sequence and remapped GFF structure display.

- [ ] **Step 5: Run the complete test set**

Run:

```powershell
node scripts/test-runtime-url-core.mjs
node scripts/test-runtime-url-wiring.mjs
node scripts/test-edgeone-cos-manifest.mjs
node scripts/test-gene-display.mjs
node scripts/test-function-scorer.mjs
```

Expected: all tests pass.

### Task 6: COS Upload and EdgeOne Production Deployment

**Files:**
- Use: `deploy/cos-upload-manifest.json`
- Use: `runtime-config.edgeone.example.js`
- Use: `docs/deployment/edgeone-cos.md`

- [ ] **Step 1: Create the COS bucket and CORS rules**

Create the bucket in a mainland-adjacent region selected by the user, enable
public read for the website-data prefix, and apply the CORS settings from Task
4.

- [ ] **Step 2: Upload manifest-listed COS objects**

Upload every object in `deploy/cos-upload-manifest.json` while preserving its
relative key. Confirm the uploaded object count and total bytes match the
manifest.

- [ ] **Step 3: Verify COS headers**

Run the `HEAD` and `Range` commands from Task 4. Do not deploy EdgeOne until
both normal JSON fetches and JBrowse byte ranges succeed.

- [ ] **Step 4: Configure the production public origins**

Create the EdgeOne production version of `runtime-config.js`:

```js
window.KONJAC_RUNTIME_CONFIG = {
  dataBaseUrl: 'https://ACTUAL-COS-PUBLIC-DOMAIN/data',
  downloadsBaseUrl: 'https://ACTUAL-COS-PUBLIC-DOMAIN/downloads',
  jbrowseBaseUrl:
    'https://ACTUAL-COS-PUBLIC-DOMAIN/data/processed/jbrowse-app'
};
```

- [ ] **Step 5: Connect EdgeOne Pages to GitHub**

Authorize GitHub, select `myn514438755-blip/konjac.com`, select `main`, and use
the static settings from Task 4.

- [ ] **Step 6: Verify the EdgeOne production site**

Verify:

- home statistics
- `#search?q=CSLA`
- exact Gene ID navigation
- scoring
- CDS and protein display
- overlay annotation
- downloads
- BLAST page
- JBrowse reference and remapped GFF

- [ ] **Step 7: Verify from mainland China without VPN**

Test the EdgeOne production domain on desktop and mobile networks. Record
failed object URLs and response codes if any request still depends on a
blocked origin.

- [ ] **Step 8: Publish without removing Vercel**

Use the EdgeOne URL as the primary mainland link. Keep
`https://konjac-gene-explorer.vercel.app` unchanged as an overseas mirror and
rollback target.
