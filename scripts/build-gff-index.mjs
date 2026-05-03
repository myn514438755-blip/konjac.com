import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const INPUT = path.join(root, 'data', 'raw', 'plantgarden', 'Amorphophallus_konjac.clean.gff.gz');
const OUTPUT_DIR = path.join(root, 'data', 'processed', 'annotations', 'gff');
const INDEX_PATH = path.join(OUTPUT_DIR, 'gff_index.json');
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'gff_summary.json');

function ensureDir(dir) {
  return fsp.mkdir(dir, { recursive: true });
}

function decodeValue(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseAttributes(raw) {
  const attrs = {};
  const text = raw?.trim();
  if (!text) return attrs;
  for (const part of text.split(';')) {
    const chunk = part.trim();
    if (!chunk) continue;
    const eq = chunk.indexOf('=');
    if (eq === -1) continue;
    const key = chunk.slice(0, eq).trim();
    const value = decodeValue(chunk.slice(eq + 1).trim());
    if (!key) continue;
    if (value.includes(',')) {
      attrs[key] = value.split(',').map(v => v.trim()).filter(Boolean);
    } else {
      attrs[key] = value;
    }
  }
  return attrs;
}

function parseIntOrNull(value) {
  if (value === undefined || value === null || value === '' || value === '.') return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function lengthOfBlock(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, end - start + 1);
}

function createNode(feature) {
  return {
    id: feature.id,
    feature_type: feature.type,
    seqid: feature.seqid,
    source: feature.source,
    start: feature.start,
    end: feature.end,
    score: feature.score,
    strand: feature.strand,
    phase: feature.phase,
    attributes: feature.attributes,
    parent_ids: [],
    child_ids: [],
    parent: null,
    children: {
      transcripts: [],
      cds_blocks: []
    },
    cds_count: 0,
    cds_total_length: 0,
    cds_blocks: []
  };
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Missing input file: ${INPUT}`);
  }

  await ensureDir(OUTPUT_DIR);

  const featureCounts = {};
  const nodes = new Map();
  const cdsByParent = new Map();
  const transcriptIds = new Set();
  const geneIds = new Set();
  let lineCount = 0;
  let cdsFeatureCount = 0;
  let exonFeatureCount = 0;
  let unresolvedCdsCount = 0;

  const stream = fs.createReadStream(INPUT);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({
    input: stream.pipe(gunzip),
    crlfDelay: Infinity
  });

  const ensureNode = (feature) => {
    let node = nodes.get(feature.id);
    if (!node) {
      node = createNode(feature);
      nodes.set(feature.id, node);
    } else {
      node.feature_type = feature.type || node.feature_type;
      node.seqid = feature.seqid || node.seqid;
      node.source = feature.source || node.source;
      node.start = feature.start ?? node.start;
      node.end = feature.end ?? node.end;
      node.score = feature.score ?? node.score;
      node.strand = feature.strand || node.strand;
      node.phase = feature.phase ?? node.phase;
      node.attributes = { ...node.attributes, ...feature.attributes };
    }
    return node;
  };

  try {
    for await (const line of rl) {
      if (!line || line.startsWith('#')) continue;
      lineCount += 1;
      const cols = line.split('\t');
      if (cols.length < 9) continue;
      const [seqid, source, type, startRaw, endRaw, scoreRaw, strand, phaseRaw, attributesRaw] = cols;
      featureCounts[type] = (featureCounts[type] || 0) + 1;
      const start = parseIntOrNull(startRaw);
      const end = parseIntOrNull(endRaw);
      const score = scoreRaw === '.' ? null : scoreRaw;
      const phase = phaseRaw === '.' ? null : phaseRaw;
      const attributes = parseAttributes(attributesRaw);
      const id = attributes.ID || null;
      const parents = attributes.Parent
        ? (Array.isArray(attributes.Parent) ? attributes.Parent : [attributes.Parent]).filter(Boolean)
        : [];

      if (id) {
        const node = ensureNode({
          id,
          type,
          seqid,
          source,
          start,
          end,
          score,
          strand,
          phase,
          attributes
        });
        if (type === 'mRNA' || type === 'transcript') transcriptIds.add(id);
        if (type === 'gene') geneIds.add(id);
        if (parents.length) {
          node.parent_ids = [...new Set([...node.parent_ids, ...parents])];
          node.parent = node.parent ?? parents[0];
          for (const parentId of parents) {
            const parentNode = nodes.get(parentId);
            if (parentNode) {
              if (!parentNode.child_ids.includes(id)) parentNode.child_ids.push(id);
            }
          }
        }
      }

      if (type === 'CDS') {
        cdsFeatureCount += 1;
        const block = {
          seqid,
          start,
          end,
          strand,
          phase,
          length: lengthOfBlock(start, end)
        };
        for (const parentId of parents) {
          if (!cdsByParent.has(parentId)) cdsByParent.set(parentId, []);
          cdsByParent.get(parentId).push(block);
        }
        if (!parents.length) unresolvedCdsCount += 1;
      } else if (type === 'exon') {
        exonFeatureCount += 1;
      }
    }
  } finally {
    rl.close();
    stream.destroy();
    gunzip.close?.();
  }

  const hasGeneFeatures = (featureCounts.gene || 0) > 0;
  const mainType = hasGeneFeatures ? 'gene' : 'mRNA';
  const mainRecords = {};

  if (hasGeneFeatures) {
    for (const node of nodes.values()) {
      if (node.feature_type !== 'gene') continue;
      const childTranscriptIds = node.child_ids.filter(id => {
        const child = nodes.get(id);
        return child && (child.feature_type === 'mRNA' || child.feature_type === 'transcript');
      });
      const cdsBlocks = [];
      for (const transcriptId of childTranscriptIds) {
        const blocks = cdsByParent.get(transcriptId) || [];
        cdsBlocks.push(...blocks);
      }
      cdsBlocks.sort((a, b) => a.start - b.start || a.end - b.end);
      mainRecords[node.id] = {
        id: node.id,
        feature_type: 'gene',
        seqid: node.seqid,
        source: node.source,
        start: node.start,
        end: node.end,
        strand: node.strand,
        score: node.score,
        phase: node.phase,
        parent: node.parent,
        parent_ids: node.parent_ids,
        children: {
          transcripts: childTranscriptIds,
          cds_blocks: cdsBlocks
        },
        cds_count: cdsBlocks.length,
        cds_total_length: cdsBlocks.reduce((sum, block) => sum + (block.length || 0), 0),
        cds_blocks: cdsBlocks,
        attributes: node.attributes
      };
    }
  } else {
    for (const id of transcriptIds) {
      const node = nodes.get(id);
      if (!node) continue;
      const cdsBlocks = (cdsByParent.get(id) || []).slice().sort((a, b) => a.start - b.start || a.end - b.end);
      node.children.cds_blocks = cdsBlocks;
      node.cds_blocks = cdsBlocks;
      node.cds_count = cdsBlocks.length;
      node.cds_total_length = cdsBlocks.reduce((sum, block) => sum + (block.length || 0), 0);
      mainRecords[id] = {
        id: node.id,
        feature_type: node.feature_type,
        seqid: node.seqid,
        source: node.source,
        start: node.start,
        end: node.end,
        strand: node.strand,
        score: node.score,
        phase: node.phase,
        parent: node.parent,
        parent_ids: node.parent_ids,
        children: {
          transcripts: [],
          cds_blocks: cdsBlocks
        },
        cds_count: node.cds_count,
        cds_total_length: node.cds_total_length,
        cds_blocks: cdsBlocks,
        attributes: node.attributes
      };
    }
  }

  const summary = {
    schema: 'konjac.gff_summary.v1',
    built_at: new Date().toISOString(),
    source_file: 'data/raw/plantgarden/Amorphophallus_konjac.clean.gff.gz',
    main_record_type: mainType,
    main_record_count: Object.keys(mainRecords).length,
    gene_feature_count: featureCounts.gene || 0,
    transcript_feature_count: transcriptIds.size,
    cds_feature_count: cdsFeatureCount,
    exon_feature_count: exonFeatureCount,
    unresolved_cds_count: unresolvedCdsCount,
    feature_counts: Object.fromEntries(Object.entries(featureCounts).sort((a, b) => b[1] - a[1])),
    notes: [
      hasGeneFeatures
        ? 'Gene features were present; main records are gene-centric.'
        : 'No gene features were present; main records are transcript-centric mRNA records.'
    ]
  };

  const index = {
    schema: 'konjac.gff_index.v1',
    built_at: summary.built_at,
    source_file: summary.source_file,
    main_record_type: mainType,
    feature_counts: summary.feature_counts,
    main_record_count: summary.main_record_count,
    genes: mainRecords
  };

  await fsp.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
  await fsp.writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');

  const stats = await fsp.stat(INDEX_PATH);
  console.log(`GFF main records: ${summary.main_record_count}`);
  console.log(`GFF feature counts: ${JSON.stringify(summary.feature_counts)}`);
  console.log(`GFF index size: ${stats.size} bytes`);
  console.log(`GFF unresolved CDS: ${unresolvedCdsCount}`);
  console.log(`GFF output: ${path.relative(root, INDEX_PATH)}`);
  console.log(`GFF summary: ${path.relative(root, SUMMARY_PATH)}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
