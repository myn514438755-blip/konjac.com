import assert from 'node:assert/strict';
import {
  EDGEONE_FILE_LIMIT,
  assertPageFileSize,
  classifyPath,
  isApprovedCosPath
} from './build-edgeone-cos-manifest.mjs';

assert.equal(classifyPath('index.html'), 'pages');
assert.equal(classifyPath('assets/ai/konjac-hero-genome.png'), 'pages');
assert.equal(classifyPath('data/genes.json'), 'cos');
assert.equal(classifyPath('downloads/test.fa'), 'cos');
assert.equal(classifyPath('.env'), 'excluded');
assert.equal(classifyPath('blastdb/konjac_cds.nsq'), 'excluded');
assert.equal(classifyPath('tools/conda/bin/tool.exe'), 'excluded');

assert.equal(isApprovedCosPath('data/genes.json'), true);
assert.equal(
  isApprovedCosPath('data/processed/sequences/cds/cds-0001.fa'),
  true
);
assert.equal(
  isApprovedCosPath('data/processed/annotations/overlay/chunks/anno-0001.json'),
  true
);
assert.equal(
  isApprovedCosPath('data/processed/jbrowse-app/assemblies/reference.bgz'),
  true
);
assert.equal(isApprovedCosPath('data/raw/source.tar.gz'), false);
assert.equal(isApprovedCosPath('data/reference/private.fastq.gz'), false);

assert.throws(() =>
  assertPageFileSize('large.bin', EDGEONE_FILE_LIMIT + 1)
);
assert.doesNotThrow(() =>
  assertPageFileSize('small.bin', EDGEONE_FILE_LIMIT)
);

console.log('EdgeOne/COS manifest tests passed');
