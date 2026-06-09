import assert from 'node:assert/strict';
import { buildRuntimeConfig } from './build-edgeone-pages-package.mjs';

assert.throws(
  () => buildRuntimeConfig(''),
  /KONJAC_COS_ORIGIN/
);

assert.equal(
  buildRuntimeConfig('https://example-123.cos.ap-guangzhou.myqcloud.com/'),
  [
    'window.KONJAC_RUNTIME_CONFIG = {',
    "  dataBaseUrl: 'https://example-123.cos.ap-guangzhou.myqcloud.com/data',",
    "  downloadsBaseUrl: 'https://example-123.cos.ap-guangzhou.myqcloud.com/downloads',",
    "  jbrowseBaseUrl: 'https://example-123.cos.ap-guangzhou.myqcloud.com/data/processed/jbrowse-app'",
    '};',
    ''
  ].join('\n')
);

console.log('EdgeOne Pages package tests passed');
