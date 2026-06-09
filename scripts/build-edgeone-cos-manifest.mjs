import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EDGEONE_FILE_LIMIT = 25 * 1024 * 1024;

const PAGE_FILES = [
  'index.html',
  'app.js',
  'styles.css',
  'search-worker.js',
  'runtime-config.js',
  'assets',
  'scripts/gene-display-core.js',
  'scripts/function-scorer-core.js',
  'scripts/runtime-url-core.js'
];

const COS_FILES = [
  'data/genes.json',
  'data/build_summary.json',
  'data/processed/species_catalog.json',
  'data/processed/sequences',
  'data/processed/annotations/overlay',
  'data/processed/jbrowse/seqid_map.json',
  'data/processed/jbrowse/seqid_map_summary.json',
  'data/processed/jbrowse-app',
  'downloads'
];

const REQUIRED_COS_PATHS = [
  'data/genes.json',
  'data/build_summary.json',
  'data/processed/sequences/sequence_index.json',
  'data/processed/annotations/overlay/annotation_overlay_index.json',
  'data/processed/jbrowse/seqid_map.json',
  'data/processed/jbrowse-app/index.html',
  'data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz',
  'data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz.fai',
  'data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz.gzi',
  'downloads/Amorphophallus_konjac.clean.cds',
  'downloads/Amorphophallus_konjac.clean.pep',
  'downloads/Amorphophallus_konjac.clean.gff'
];

const EXCLUDED_PREFIXES = [
  '.env',
  '.git',
  '.gitdata',
  '.vercel',
  'blastdb/',
  'blast_results/',
  'data/raw/',
  'data/reference/',
  'data/rnaseq/',
  'envs/',
  'node_modules/',
  'supabase/.temp/',
  'tools/',
  'vercel-deploy-package/'
];

function normalizePath(value) {
  return String(value || '').replaceAll('\\', '/').replace(/^\.?\//, '');
}

export function classifyPath(relativePath) {
  const cleanPath = normalizePath(relativePath);
  if (
    EXCLUDED_PREFIXES.some((prefix) =>
      prefix.endsWith('/')
        ? cleanPath.startsWith(prefix)
        : cleanPath === prefix || cleanPath.startsWith(`${prefix}.`)
    )
  ) {
    return 'excluded';
  }
  if (cleanPath.startsWith('data/') || cleanPath.startsWith('downloads/')) {
    return 'cos';
  }
  return 'pages';
}

export function isApprovedCosPath(relativePath) {
  const cleanPath = normalizePath(relativePath);
  if (classifyPath(cleanPath) !== 'cos') return false;
  return COS_FILES.some((entry) =>
    cleanPath === entry || cleanPath.startsWith(`${entry}/`)
  );
}

export function assertPageFileSize(relativePath, size) {
  if (size > EDGEONE_FILE_LIMIT) {
    throw new Error(
      `EdgeOne file exceeds 25 MiB: ${relativePath} (${size} bytes)`
    );
  }
}

function shouldSkip(relativePath) {
  const cleanPath = normalizePath(relativePath);
  return (
    cleanPath.includes('/test_data/') ||
    cleanPath.endsWith('.map') ||
    cleanPath.endsWith('/.DS_Store') ||
    cleanPath.endsWith('/Thumbs.db')
  );
}

async function listFiles(workspace, entries) {
  const files = [];

  async function visit(relativePath) {
    const cleanPath = normalizePath(relativePath);
    const absolutePath = path.resolve(workspace, cleanPath);
    const relativeCheck = path.relative(workspace, absolutePath);
    if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
      throw new Error(`Path escapes workspace: ${cleanPath}`);
    }

    const stat = await fs.promises.stat(absolutePath);
    if (stat.isDirectory()) {
      const children = await fs.promises.readdir(absolutePath);
      children.sort((a, b) => a.localeCompare(b));
      for (const child of children) {
        await visit(path.posix.join(cleanPath, child));
      }
      return;
    }

    if (!stat.isFile() || shouldSkip(cleanPath)) return;
    files.push({ path: cleanPath, size: stat.size });
  }

  for (const entry of entries) {
    await visit(entry);
  }
  return files;
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function addHashes(workspace, files) {
  const output = [];
  for (const file of files) {
    output.push({
      ...file,
      sha256: await sha256File(path.resolve(workspace, file.path))
    });
  }
  return output;
}

function summarize(files) {
  return {
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0)
  };
}

export async function buildManifests(workspace = process.cwd()) {
  for (const requiredPath of REQUIRED_COS_PATHS) {
    const absolutePath = path.resolve(workspace, requiredPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Required COS object is missing: ${requiredPath}`);
    }
  }

  const pageFiles = await listFiles(workspace, PAGE_FILES);
  for (const file of pageFiles) {
    assertPageFileSize(file.path, file.size);
  }

  const cosFiles = (await listFiles(workspace, COS_FILES)).filter((file) =>
    isApprovedCosPath(file.path)
  );

  const [pagesWithHashes, cosWithHashes] = await Promise.all([
    addHashes(workspace, pageFiles),
    addHashes(workspace, cosFiles)
  ]);

  const generatedAt = new Date().toISOString();
  return {
    pages: {
      generatedAt,
      target: 'Tencent EdgeOne Pages',
      limitBytes: EDGEONE_FILE_LIMIT,
      ...summarize(pagesWithHashes),
      files: pagesWithHashes
    },
    cos: {
      generatedAt,
      target: 'Tencent COS',
      ...summarize(cosWithHashes),
      files: cosWithHashes
    }
  };
}

async function main() {
  const workspace = process.cwd();
  const manifests = await buildManifests(workspace);
  const deployDirectory = path.join(workspace, 'deploy');
  await fs.promises.mkdir(deployDirectory, { recursive: true });
  await Promise.all([
    fs.promises.writeFile(
      path.join(deployDirectory, 'edgeone-pages-manifest.json'),
      `${JSON.stringify(manifests.pages, null, 2)}\n`
    ),
    fs.promises.writeFile(
      path.join(deployDirectory, 'cos-upload-manifest.json'),
      `${JSON.stringify(manifests.cos, null, 2)}\n`
    )
  ]);
  console.log(
    `EdgeOne: ${manifests.pages.fileCount} files, ${manifests.pages.totalBytes} bytes`
  );
  console.log(
    `COS: ${manifests.cos.fileCount} files, ${manifests.cos.totalBytes} bytes`
  );
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
