import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('./data/processed/jbrowse-app/index.html', 'utf8');

assert.match(html, /isLocalJbrowseHost/);
assert.match(html, /Online JBrowse reference data is not hosted/);
assert.match(html, /static\/js\/main\.d3da3f70\.js/);

console.log('jbrowse online shell tests passed');
