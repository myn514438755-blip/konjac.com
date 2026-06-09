import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 8012;
const server = spawn(process.execPath, ['scripts/dev-static-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`server did not start; output: ${output}`));
    }, 5000);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`);
        if (response.ok) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        }
      } catch (error) {}
    }, 100);
  });
}

try {
  await waitForServer();

  const home = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Konjac Gene Explorer/);

  const genes = await fetch(`http://127.0.0.1:${port}/data/genes.json`, {
    method: 'HEAD'
  });
  assert.equal(genes.status, 200);
  assert.equal(genes.headers.get('content-length'), '63035084');

  const range = await fetch(
    `http://127.0.0.1:${port}/data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz`,
    { headers: { Range: 'bytes=0-99' } }
  );
  assert.equal(range.status, 206);
  assert.equal(range.headers.get('accept-ranges'), 'bytes');
  assert.match(range.headers.get('content-range') || '', /^bytes 0-99\//);

  console.log('static server smoke tests passed');
} finally {
  server.kill();
}
