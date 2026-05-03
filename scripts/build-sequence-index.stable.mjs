import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const CHUNK_SIZE = 1000;
const OUTPUT_ROOT = path.join(root, 'data', 'processed', 'sequences');
const RAW = {
  cds: path.join(root, 'data', 'raw', 'plantgarden', 'Amorphophallus_konjac.clean.cds.gz'),
  protein: path.join(root, 'data', 'raw', 'plantgarden', 'Amorphophallus_konjac.clean.pep.gz')
};

const CONFIG = {
  cds: {
    input: RAW.cds,
    chunkDir: path.join(OUTPUT_ROOT, 'cds'),
    chunkPrefix: 'cds',
    indexKey: 'cds',
    sourceKey: 'cds'
  },
  protein: {
    input: RAW.protein,
    chunkDir: path.join(OUTPUT_ROOT, 'protein'),
    chunkPrefix: 'pep',
    indexKey: 'protein',
    sourceKey: 'protein'
  }
};

function ensureDir(dir) {
  return fsp.mkdir(dir, { recursive: true });
}

function pad(n) {
  return String(n).padStart(4, '0');
}

function wrapSequence(seq, width = 80) {
  const chunks = [];
  for (let i = 0; i < seq.length; i += width) {
    chunks.push(seq.slice(i, i + width));
  }
  return chunks.join('\n');
}

function normalizeHeader(headerLine) {
  const header = headerLine.replace(/^>/, '').trim();
  const geneId = header.split(/\s+/)[0] || '';
  return { header, geneId };
}

async function parseAndChunk(type, index) {
  const cfg = CONFIG[type];
  if (!fs.existsSync(cfg.input)) {
    throw new Error(`Missing input file: ${cfg.input}`);
  }

  await ensureDir(cfg.chunkDir);

  const stream = fs.createReadStream(cfg.input);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({
    input: stream.pipe(gunzip),
    crlfDelay: Infinity
  });

  let currentHeader = '';
  let currentGeneId = '';
  let currentSeqParts = [];
  let currentChunkRecords = [];
  let chunkNo = 1;
  let recordCount = 0;
  const chunkMeta = [];
  const duplicateIds = new Set();

  const currentChunkId = () => `${cfg.chunkPrefix}-${pad(chunkNo)}`;
  const currentChunkFile = () => `${cfg.chunkPrefix}-${pad(chunkNo)}.fa`;

  const flushChunk = async () => {
    if (!currentChunkRecords.length) return;
    const fileName = currentChunkFile();
    const filePath = path.join(cfg.chunkDir, fileName);
    const text = currentChunkRecords
      .map(record => `>${record.header}\n${wrapSequence(record.sequence)}\n`)
      .join('');
    await fsp.writeFile(filePath, text, 'utf8');
    chunkMeta.push({
      id: currentChunkId(),
      file: `${type}/${fileName}`,
      count: currentChunkRecords.length,
      first_gene: currentChunkRecords[0].geneId,
      last_gene: currentChunkRecords[currentChunkRecords.length - 1].geneId
    });
    chunkNo += 1;
    currentChunkRecords = [];
  };

  const saveRecord = async () => {
    if (!currentGeneId) return;
    const sequence = currentSeqParts.join('').replace(/\s+/g, '');
    const chunkId = currentChunkId();
    const chunkFile = currentChunkFile();

    if (!index.genes[currentGeneId]) {
      index.genes[currentGeneId] = {};
    }
    if (index.genes[currentGeneId][cfg.indexKey]) {
      duplicateIds.add(currentGeneId);
    }

    index.genes[currentGeneId][cfg.indexKey] = {
      chunk: chunkId,
      file: `${type}/${chunkFile}`,
      length: sequence.length,
      header: currentHeader
    };

    currentChunkRecords.push({
      geneId: currentGeneId,
      header: currentHeader,
      sequence
    });
    recordCount += 1;

    if (currentChunkRecords.length >= CHUNK_SIZE) {
      await flushChunk();
    }
  };

  try {
    for await (const line of rl) {
      if (line.startsWith('>')) {
        await saveRecord();
        const parsed = normalizeHeader(line);
        currentHeader = parsed.header;
        currentGeneId = parsed.geneId;
        currentSeqParts = [];
      } else if (currentHeader) {
        currentSeqParts.push(line.trim());
      }
    }
    await saveRecord();
    await flushChunk();
  } finally {
    rl.close();
    stream.destroy();
    gunzip.close?.();
  }

  return {
    recordCount,
    chunkCount: chunkMeta.length,
    chunkMeta,
    duplicateIds: [...duplicateIds]
  };
}

function countPresence(index) {
  let cdsOnly = 0;
  let proteinOnly = 0;
  let both = 0;
  let cdsMissing = 0;
  let proteinMissing = 0;
  for (const gene of Object.values(index.genes)) {
    const hasCds = Boolean(gene.cds);
    const hasProtein = Boolean(gene.protein);
    if (hasCds) cdsMissing += 0;
    if (hasProtein) proteinMissing += 0;
    if (hasCds && hasProtein) {
      both += 1;
    } else if (hasCds) {
      cdsOnly += 1;
      proteinMissing += 1;
    } else if (hasProtein) {
      proteinOnly += 1;
      cdsMissing += 1;
    }
  }
  return { both, cdsOnly, proteinOnly, cdsMissing, proteinMissing };
}

function sample(array, size) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}

async function verifySamples(index, sampleIds) {
  const results = [];
  for (const geneId of sampleIds) {
    const gene = index.genes[geneId];
    const entry = { geneId, cds: false, protein: false };
    for (const type of ['cds', 'protein']) {
      const info = gene?.[type];
      if (!info) continue;
      const filePath = path.join(OUTPUT_ROOT, info.file);
      const content = await fsp.readFile(filePath, 'utf8');
      const pattern = new RegExp(`^>${geneId}(?:\\s|$)`, 'm');
      entry[type] = pattern.test(content);
    }
    results.push(entry);
  }
  return results;
}

async function main() {
  await ensureDir(OUTPUT_ROOT);
  await ensureDir(path.join(OUTPUT_ROOT, 'cds'));
  await ensureDir(path.join(OUTPUT_ROOT, 'protein'));

  const index = {
    schema: 'konjac.sequence_index.v1',
    built_at: new Date().toISOString(),
    source_files: {
      cds: 'data/raw/plantgarden/Amorphophallus_konjac.clean.cds.gz',
      protein: 'data/raw/plantgarden/Amorphophallus_konjac.clean.pep.gz'
    },
    chunk_size: CHUNK_SIZE,
    chunks: {
      cds: [],
      protein: []
    },
    genes: {}
  };

  const cdsStats = await parseAndChunk('cds', index);
  const proteinStats = await parseAndChunk('protein', index);
  const presence = countPresence(index);

  index.chunks.cds = cdsStats.chunkMeta;
  index.chunks.protein = proteinStats.chunkMeta;
  index.stats = {
    cds_count: cdsStats.recordCount,
    protein_count: proteinStats.recordCount,
    cds_chunk_count: cdsStats.chunkCount,
    protein_chunk_count: proteinStats.chunkCount,
    both_present: presence.both,
    cds_only: presence.cdsOnly,
    protein_only: presence.proteinOnly
  };

  const indexPath = path.join(OUTPUT_ROOT, 'sequence_index.json');
  await fsp.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');

  const geneIds = Object.keys(index.genes);
  const sampleIds = sample(geneIds, Math.min(10, geneIds.length));
  const validation = await verifySamples(index, sampleIds);
  const formatIssues = validation.some(row => !row.cds && !row.protein) ? 'possible' : 'none';

  const stats = await fsp.stat(indexPath);
  console.log(`CDS sequences: ${cdsStats.recordCount}`);
  console.log(`Protein sequences: ${proteinStats.recordCount}`);
  console.log(`CDS chunks: ${cdsStats.chunkCount}`);
  console.log(`Protein chunks: ${proteinStats.chunkCount}`);
  console.log(`sequence_index.json size: ${stats.size} bytes`);
  console.log(`Genes with both CDS and protein: ${presence.both}`);
  console.log(`Genes with CDS only: ${presence.cdsOnly}`);
  console.log(`Genes with protein only: ${presence.proteinOnly}`);
  console.log('Sample validation:');
  for (const row of validation) {
    console.log(`  ${row.geneId} -> CDS=${row.cds ? 'OK' : 'MISSING'}, protein=${row.protein ? 'OK' : 'MISSING'}`);
  }
  console.log(`Gene ID format inconsistency: ${formatIssues}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
