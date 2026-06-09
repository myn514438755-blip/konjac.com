import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync('app.js', 'utf8');
const htmlSource = fs.readFileSync('index.html', 'utf8');

assert.equal(
  /fetch\(\s*['"]\.\/data\//.test(appSource),
  false,
  'app.js should not fetch hardcoded local data URLs'
);
assert.equal(
  /fetch\(\s*['"]\.\/downloads\//.test(appSource),
  false,
  'app.js should not fetch hardcoded local download URLs'
);
assert.equal(
  /href=["']\.\/data\/processed\/jbrowse-app/.test(htmlSource),
  false,
  'index.html should not hardcode the JBrowse origin'
);
assert.match(appSource, /runtimeUrls\.dataUrl/);
assert.match(appSource, /runtimeUrls\.downloadUrl/);
assert.match(appSource, /runtimeUrls\.jbrowseUrl/);
assert.match(htmlSource, /runtime-config\.js/);
assert.match(htmlSource, /runtime-url-core\.js/);

console.log('runtime URL wiring tests passed');
