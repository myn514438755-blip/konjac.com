import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const GFF_PATH = path.join(root, 'data', 'processed', 'annotations', 'gff', 'gff_index.json');
const ZEN_PATH = path.join(root, 'data', 'processed', 'annotations', 'zen', 'annotation_index.json');
const OUTPUT_DIR = path.join(root, 'data', 'processed', 'annotations', 'overlay');
const CHUNK_DIR = path.join(OUTPUT_DIR, 'chunks');
const INDEX_PATH = path.join(OUTPUT_DIR, 'annotation_overlay_index.json');

const CHUNK_SIZE = 1000;

function ensureDir(dir) {
  return fsp.mkdir(dir, { recursive: true });
}

function simplifyGff(gff) {
  if (!gff) return null;
  return {
    gene_id: gff.id,
    seqid: gff.seqid,
    start: gff.start,
    end: gff.end,
    strand: gff.strand,
    cds_count: gff.cds_count || 0,
    cds_total_length: gff.cds_total_length || 0,
    cds_blocks: Array.isArray(gff.cds_blocks)
      ? gff.cds_blocks.map(block => ({
          seqid: block.seqid,
          start: block.start,
          end: block.end,
          strand: block.strand,
          phase: block.phase,
          length: block.length
        }))
      : []
  };
}

function toList(values) {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  const out = [];
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text || text === 'NA') continue;
    if (seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function simplifyZen(zen) {
  if (!zen) return null;
  const main = Array.isArray(zen.main_annotations) ? zen.main_annotations[0] || {} : {};
  return {
    gene_id: zen.gene_id,
    functional_description: main.functional_annotation || main.description || '',
    ko_id: toList(zen.summary?.ko_ids)[0] || main.ko_id || '',
    ec_number: toList(zen.summary?.ec_numbers)[0] || main.ec_number || '',
    plantTFDB_family: toList(zen.summary?.plantTFDB_families)[0] || main.plantTFDB_family || '',
    plantTFDB_description: toList(zen.summary?.plantTFDB_descriptions)[0] || main.plantTFDB_description || '',
    target_species: toList(zen.summary?.target_species),
    target_family: toList(zen.summary?.target_families),
    e_value: toList(zen.summary?.e_values)[0] || main.e_value || '',
    bitscore: toList(zen.summary?.bitscores)[0] || main.bitscore || '',
    go_terms: (zen.go || []).map(item => ({
      go_id: item.go_id || '',
      go_term: item.go_term || '',
      go_domain: item.go_domain || ''
    })),
    go_slim_terms: (zen.goslim || []).map(item => ({
      goslim_id: item.goslim_id || '',
      goslim_term: item.goslim_term || '',
      goslim_domain: item.goslim_domain || ''
    })),
    interpro_domains: (zen.interpro || []).map(item => ({
      interpro_id: item.interpro_id || '',
      interpro_description: item.interpro_description || ''
    })),
    pfam_domains: (zen.pfam || []).map(item => ({
      pfam_id: item.pfam_id || '',
      pfam_description: item.pfam_description || ''
    }))
  };
}

function mergeOverlay(gff, zen) {
  return {
    gene_id: gff?.gene_id || zen?.gene_id || '',
    seqid: gff?.seqid || '',
    start: gff?.start ?? null,
    end: gff?.end ?? null,
    strand: gff?.strand || '',
    cds_count: gff?.cds_count || 0,
    cds_total_length: gff?.cds_total_length || 0,
    cds_blocks: gff?.cds_blocks || [],
    functional_description: zen?.functional_description || '',
    ko_id: zen?.ko_id || '',
    ec_number: zen?.ec_number || '',
    plantTFDB_family: zen?.plantTFDB_family || '',
    plantTFDB_description: zen?.plantTFDB_description || '',
    target_species: zen?.target_species || [],
    target_family: zen?.target_family || [],
    e_value: zen?.e_value || '',
    bitscore: zen?.bitscore || '',
    go_terms: zen?.go_terms || [],
    go_slim_terms: zen?.go_slim_terms || [],
    interpro_domains: zen?.interpro_domains || [],
    pfam_domains: zen?.pfam_domains || []
  };
}

function sample(array, size) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}

async function main() {
  if (!fs.existsSync(GFF_PATH)) throw new Error(`Missing input file: ${GFF_PATH}`);
  if (!fs.existsSync(ZEN_PATH)) throw new Error(`Missing input file: ${ZEN_PATH}`);

  await ensureDir(OUTPUT_DIR);
  await ensureDir(CHUNK_DIR);

  const gff = JSON.parse(await fsp.readFile(GFF_PATH, 'utf8'));
  const zen = JSON.parse(await fsp.readFile(ZEN_PATH, 'utf8'));

  const gffGenes = gff.genes || {};
  const zenGenes = zen.genes || {};
  const geneIds = Array.from(new Set([...Object.keys(gffGenes), ...Object.keys(zenGenes)])).sort();

  const overlap = [];
  const gffMissing = [];
  const zenMissing = [];

  const index = {
    schema: 'konjac.annotation_overlay_index.v1',
    built_at: new Date().toISOString(),
    source_files: {
      gff: 'data/processed/annotations/gff/gff_index.json',
      zen: 'data/processed/annotations/zen/annotation_index.json'
    },
    chunk_size: CHUNK_SIZE,
    total_genes: geneIds.length,
    chunk_count: 0,
    chunks: [],
    genes: {},
    stats: {
      overlay_gene_count: geneIds.length,
      gff_gene_count: Object.keys(gffGenes).length,
      zen_gene_count: Object.keys(zenGenes).length,
      both_present: 0,
      missing_gff: 0,
      missing_zen: 0
    }
  };

  let chunkNo = 1;
  let currentChunk = [];
  let currentChunkGenes = [];
  const chunkFiles = [];

  const flushChunk = async () => {
    if (!currentChunk.length) return;
    const chunkId = `anno-${String(chunkNo).padStart(4, '0')}`;
    const fileName = `${chunkId}.json`;
    const filePath = path.join(CHUNK_DIR, fileName);
    const payload = {
      schema: 'konjac.annotation_overlay_chunk.v1',
      chunk_id: chunkId,
      built_at: index.built_at,
      gene_count: currentChunk.length,
      genes: currentChunk
    };
    await fsp.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
    chunkFiles.push({
      id: chunkId,
      file: `chunks/${fileName}`,
      count: currentChunk.length,
      first_gene: currentChunkGenes[0],
      last_gene: currentChunkGenes[currentChunkGenes.length - 1]
    });
    chunkNo += 1;
    currentChunk = [];
    currentChunkGenes = [];
  };

  for (const geneId of geneIds) {
    const gffEntry = simplifyGff(gffGenes[geneId]);
    const zenEntry = simplifyZen(zenGenes[geneId]);
    if (gffEntry && zenEntry) {
      overlap.push(geneId);
      index.stats.both_present += 1;
    } else if (!gffEntry) {
      gffMissing.push(geneId);
      index.stats.missing_gff += 1;
    } else if (!zenEntry) {
      zenMissing.push(geneId);
      index.stats.missing_zen += 1;
    }

    const overlay = mergeOverlay(gffEntry, zenEntry);
    currentChunk.push(overlay);
    currentChunkGenes.push(geneId);
    index.genes[geneId] = {
      chunk: `anno-${String(chunkNo).padStart(4, '0')}.json`,
      file: `chunks/anno-${String(chunkNo).padStart(4, '0')}.json`
    };

    if (currentChunk.length >= CHUNK_SIZE) {
      await flushChunk();
    }
  }

  await flushChunk();

  index.chunk_count = chunkFiles.length;
  index.chunks = chunkFiles;

  const indexPath = INDEX_PATH;
  await fsp.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');

  const chunkSizes = [];
  for (const chunk of chunkFiles) {
    const stat = await fsp.stat(path.join(CHUNK_DIR, path.basename(chunk.file)));
    chunkSizes.push(stat.size);
  }

  const sampleIds = sample(overlap, Math.min(10, overlap.length));
  const validation = [];
  for (const geneId of sampleIds) {
    const mapping = index.genes[geneId];
    const chunkPath = path.join(OUTPUT_DIR, mapping.file);
    const chunk = JSON.parse(await fsp.readFile(chunkPath, 'utf8'));
    const record = chunk.genes.find(item => item.gene_id === geneId);
    validation.push({
      geneId,
      chunk: mapping.chunk,
      found: Boolean(record),
      seqid: record?.seqid || '',
      hasFunctional: Boolean(record?.functional_description)
    });
  }

  const stats = await fsp.stat(indexPath);
  console.log(`overlay genes: ${geneIds.length}`);
  console.log(`overlay chunks: ${chunkFiles.length}`);
  console.log(`overlay index size: ${stats.size} bytes`);
  console.log(`overlay chunk total size: ${chunkSizes.reduce((a, b) => a + b, 0)} bytes`);
  console.log(`overlay max chunk size: ${Math.max(...chunkSizes)} bytes`);
  console.log(`gff+zen overlap: ${index.stats.both_present}`);
  console.log(`missing gff: ${index.stats.missing_gff}`);
  console.log(`missing zen: ${index.stats.missing_zen}`);
  console.log(`sample validation: ${JSON.stringify(validation, null, 2)}`);
  console.log(`overlay output: ${path.relative(root, indexPath)}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
