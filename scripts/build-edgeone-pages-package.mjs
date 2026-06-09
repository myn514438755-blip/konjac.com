import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function normalizeCosOrigin(value) {
  const input = String(value || '').trim().replace(/\/+$/g, '');
  if (!input) {
    throw new Error('KONJAC_COS_ORIGIN is required for an EdgeOne build');
  }
  const url = new URL(input);
  if (url.protocol !== 'https:') {
    throw new Error('KONJAC_COS_ORIGIN must use HTTPS');
  }
  return url.toString().replace(/\/+$/g, '');
}

export function buildRuntimeConfig(cosOrigin) {
  const origin = normalizeCosOrigin(cosOrigin);
  return [
    'window.KONJAC_RUNTIME_CONFIG = {',
    `  dataBaseUrl: '${origin}/data',`,
    `  downloadsBaseUrl: '${origin}/downloads',`,
    `  jbrowseBaseUrl: '${origin}/data/processed/jbrowse-app'`,
    '};',
    ''
  ].join('\n');
}

async function copyManifestFiles(workspace, outputDirectory, files) {
  for (const file of files) {
    const source = path.resolve(workspace, file.path);
    const destination = path.resolve(outputDirectory, file.path);
    const relativeCheck = path.relative(outputDirectory, destination);
    if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
      throw new Error(`Output path escapes package: ${file.path}`);
    }
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.copyFile(source, destination);
  }
}

export async function buildEdgeOnePackage({
  workspace = process.cwd(),
  cosOrigin = process.env.KONJAC_COS_ORIGIN
} = {}) {
  const manifestPath = path.resolve(
    workspace,
    'deploy/edgeone-pages-manifest.json'
  );
  const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
  const outputDirectory = path.resolve(workspace, 'edgeone-dist');

  await fs.promises.mkdir(outputDirectory, { recursive: true });
  await copyManifestFiles(workspace, outputDirectory, manifest.files);
  await fs.promises.writeFile(
    path.join(outputDirectory, 'runtime-config.js'),
    buildRuntimeConfig(cosOrigin)
  );
  await fs.promises.writeFile(
    path.join(outputDirectory, 'deployment-manifest.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        cosOrigin: normalizeCosOrigin(cosOrigin),
        sourceManifestGeneratedAt: manifest.generatedAt,
        fileCount: manifest.fileCount
      },
      null,
      2
    )}\n`
  );

  return { outputDirectory, fileCount: manifest.fileCount };
}

async function main() {
  const result = await buildEdgeOnePackage();
  console.log(
    `EdgeOne package ready: ${result.outputDirectory} (${result.fileCount} files)`
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
