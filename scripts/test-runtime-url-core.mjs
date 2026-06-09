import assert from 'node:assert/strict';

await import('./runtime-url-core.js');

const api = globalThis.KonjacRuntimeUrls;

assert.ok(api, 'runtime URL API should be exposed');
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
  dataBaseUrl: 'https://cos.example.com/data/',
  downloadsBaseUrl: 'https://cos.example.com/downloads',
  jbrowseBaseUrl: 'https://cos.example.com/data/processed/jbrowse-app/'
});

assert.equal(
  production.dataUrl('/processed/sequences/sequence_index.json'),
  'https://cos.example.com/data/processed/sequences/sequence_index.json'
);
assert.equal(
  production.downloadUrl('/Amorphophallus_konjac.clean.cds'),
  'https://cos.example.com/downloads/Amorphophallus_konjac.clean.cds'
);
assert.equal(
  production.jbrowseUrl('/index.html?loc=CM040117.1%3A1..100'),
  'https://cos.example.com/data/processed/jbrowse-app/index.html?loc=CM040117.1%3A1..100'
);

console.log('runtime URL core tests passed');
