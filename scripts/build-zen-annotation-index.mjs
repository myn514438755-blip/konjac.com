import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const INPUT = path.join(root, 'data', 'raw', 'plantgarden', 'Amorphophallus_konjac_t78372.G001_zen_v2.0.tar.gz');
const OUTPUT_DIR = path.join(root, 'data', 'processed', 'annotations', 'zen');
const INDEX_PATH = path.join(OUTPUT_DIR, 'annotation_index.json');
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'zen_summary.json');

const TARGET_FILES = [
  'zen_annotation_v2.0.tsv',
  'zen_go_v2.0.tsv',
  'zen_goslim_v2.0.tsv',
  'zen_interpro_v2.0.tsv',
  'zen_pfam_v2.0.tsv'
];

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

function splitLines(text) {
  return text.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/).filter(Boolean);
}

function parseTsv(text) {
  const lines = splitLines(text);
  if (!lines.length) return { header: [], rows: [] };
  const header = lines[0].split('\t');
  const rows = lines.slice(1).map(line => {
    const cols = line.split('\t');
    const row = {};
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = decodeValue(cols[i] ?? '');
    }
    return row;
  });
  return { header, rows };
}

function parseOctal(buf) {
  const text = buf.toString('utf8').replace(/\0.*$/, '').trim();
  if (!text) return 0;
  return Number.parseInt(text, 8) || 0;
}

function parseTarBuffer(buffer) {
  const entries = [];
  let offset = 0;
  while (offset + 512 <= buffer.length) {
    const block = buffer.subarray(offset, offset + 512);
    if (block.every(byte => byte === 0)) break;
    const name = block.subarray(0, 100).toString('utf8').replace(/\0.*$/, '').trim();
    const prefix = block.subarray(345, 500).toString('utf8').replace(/\0.*$/, '').trim();
    const fullName = prefix ? `${prefix}/${name}` : name;
    const size = parseOctal(block.subarray(124, 136));
    const typeflag = block.subarray(156, 157).toString('utf8') || '0';
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    const content = buffer.subarray(dataStart, dataEnd);
    entries.push({ name: fullName, size, typeflag, content });
    const padded = Math.ceil(size / 512) * 512;
    offset = dataStart + padded;
  }
  return entries;
}

function extractTarMembers(buffer, wantedBasenames) {
  const entries = parseTarBuffer(buffer);
  const out = new Map();
  for (const entry of entries) {
    const base = path.basename(entry.name);
    if (!wantedBasenames.has(base)) continue;
    if (entry.typeflag === '5') continue;
    out.set(base, entry.content.toString('utf8'));
  }
  return { entries, files: out };
}

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function ensureGene(map, geneId) {
  if (!map.has(geneId)) {
    map.set(geneId, {
      gene_id: geneId,
      source_ids: {
        queryid_pep: [],
        queryid_cds: []
      },
      main_annotations: [],
      go: [],
      goslim: [],
      interpro: [],
      pfam: [],
      summary: {
        functional_annotations: [],
        descriptions: [],
        ko_ids: [],
        ec_numbers: [],
        plantTFDB_families: [],
        plantTFDB_descriptions: [],
        target_species: [],
        target_families: [],
        e_values: [],
        bitscores: []
      }
    });
  }
  return map.get(geneId);
}

function addUnique(array, value) {
  if (!value) return;
  if (!array.includes(value)) array.push(value);
}

function addUniqueObject(array, key, value) {
  if (!key) return;
  if (!array.some(item => item && item._key === key)) {
    array.push({ _key: key, ...value });
  }
}

function stripInternalKeys(list) {
  return list.map(item => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...item };
    delete copy._key;
    return copy;
  });
}

function canonicalGeneId(row) {
  return pick(row.queryid_cds, row.queryid_pep);
}

function parseZenAnnotationRows(rows, genes, stats) {
  for (const row of rows) {
    const geneId = canonicalGeneId(row);
    if (!geneId) continue;
    const gene = ensureGene(genes, geneId);
    const pepId = pick(row.queryid_pep);
    const cdsId = pick(row.queryid_cds);
    if (pepId && !gene.source_ids.queryid_pep.includes(pepId)) gene.source_ids.queryid_pep.push(pepId);
    if (cdsId && !gene.source_ids.queryid_cds.includes(cdsId)) gene.source_ids.queryid_cds.push(cdsId);

    const main = {
      queryid_pep: pepId,
      queryid_cds: cdsId,
      kusakidb_accession: pick(row.kusakidb_accession),
      kusakidb_version: pick(row.kusakidb_version),
      chromosome_number: pick(row.chromosome_number),
      genome_gene_start: pick(row.genome_gene_start),
      genome_gene_end: pick(row.genome_gene_end),
      genome_frame_position: pick(row.genome_frame_position),
      evidence_existence: pick(row.evidence_existence),
      databases_intersection: pick(row.databases_intersection),
      orthodb_version: pick(row.orthodb_version),
      orthodb_description: pick(row.orthodb_description),
      orthodb_gene_id: pick(row.orthodb_gene_id),
      orthodb_unique_id: pick(row.orthodb_unique_id),
      source_db: pick(row.source_db),
      source_description: pick(row.source_description),
      source_accession: pick(row.source_accession),
      xref_uni2ref: pick(row.xref_uni2ref),
      ec_number: pick(row.ec_number),
      kegg_entry: pick(row.kegg_entry),
      ko_id: pick(row.ko_id),
      flawed_stop_codons: pick(row.flawed_stop_codons),
      plantTFDB_family: pick(row.plantTFDB_family),
      plantTFDB_description: pick(row.plantTFDB_description),
      species_target: pick(row.species_target),
      family_target: pick(row.family_target),
      phylum_target: pick(row.phylum_target),
      superkingdom_target: pick(row.superkingdom_target),
      sequence_identity: pick(row.sequence_identity),
      length: pick(row.length),
      mis: pick(row.mis),
      gaps: pick(row.gaps),
      startquery: pick(row.startquery),
      endquery: pick(row.endquery),
      starttarget: pick(row.starttarget),
      endtarget: pick(row.endtarget),
      e_value: pick(row.e_value),
      bitscore: pick(row.bitscore),
      source_go_interpro_pfam: pick(row.source_go_interpro_pfam),
      functional_annotation: pick(row.orthodb_description, row.source_description, row.source_db, row.kegg_entry, row.ko_id),
      description: pick(row.source_description, row.orthodb_description, row.source_db)
    };
    const key = JSON.stringify(main);
    addUniqueObject(gene.main_annotations, key, main);

    addUnique(gene.summary.functional_annotations, main.functional_annotation);
    addUnique(gene.summary.descriptions, main.description);
    addUnique(gene.summary.ko_ids, main.ko_id);
    addUnique(gene.summary.ec_numbers, main.ec_number);
    addUnique(gene.summary.plantTFDB_families, main.plantTFDB_family);
    addUnique(gene.summary.plantTFDB_descriptions, main.plantTFDB_description);
    addUnique(gene.summary.target_species, main.species_target);
    addUnique(gene.summary.target_families, main.family_target);
    addUnique(gene.summary.e_values, main.e_value);
    addUnique(gene.summary.bitscores, main.bitscore);

    stats.rows += 1;
    stats.geneIds.add(geneId);
    if (main.ko_id) stats.koGenes.add(geneId);
    if (main.ec_number) stats.ecGenes.add(geneId);
    if (main.plantTFDB_family || main.plantTFDB_description) stats.plantGenes.add(geneId);
  }
}

function parseSimpleAnnotationRows(rows, genes, bucketName, keyFields, statsCounter) {
  for (const row of rows) {
    const geneId = canonicalGeneId(row);
    if (!geneId) continue;
    const gene = ensureGene(genes, geneId);
    const key = keyFields.map(field => pick(row[field])).join('||');
    const record = {};
    for (const field of keyFields) {
      record[field] = pick(row[field]);
    }
    if (bucketName === 'go') {
      record.go_id = pick(row.go_id);
      record.go_term = pick(row.go_term);
      record.go_domain = pick(row.go_domain);
    } else if (bucketName === 'goslim') {
      record.goslim_id = pick(row.goslim_id);
      record.goslim_term = pick(row.goslim_term);
      record.goslim_domain = pick(row.goslim_domain);
    } else if (bucketName === 'interpro') {
      record.interpro_id = pick(row.interpro_id);
      record.interpro_description = pick(row.interpro_description);
    } else if (bucketName === 'pfam') {
      record.pfam_id = pick(row.pfam_id);
      record.pfam_description = pick(row.pfam_description);
    }
    addUniqueObject(gene[bucketName], key, record);
    statsCounter.rows += 1;
    statsCounter.geneIds.add(geneId);
  }
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Missing input file: ${INPUT}`);
  }

  await ensureDir(OUTPUT_DIR);

  const compressed = await fsp.readFile(INPUT);
  const tarBuffer = zlib.gunzipSync(compressed);
  const wanted = new Set(TARGET_FILES);
  const { entries, files } = extractTarMembers(tarBuffer, wanted);
  const missing = TARGET_FILES.filter(name => !files.has(name));
  if (missing.length) {
    throw new Error(`Missing expected tar members: ${missing.join(', ')}`);
  }

  const annotationText = files.get('zen_annotation_v2.0.tsv');
  const goText = files.get('zen_go_v2.0.tsv');
  const goslimText = files.get('zen_goslim_v2.0.tsv');
  const interproText = files.get('zen_interpro_v2.0.tsv');
  const pfamText = files.get('zen_pfam_v2.0.tsv');

  const annotationTable = parseTsv(annotationText);
  const goTable = parseTsv(goText);
  const goslimTable = parseTsv(goslimText);
  const interproTable = parseTsv(interproText);
  const pfamTable = parseTsv(pfamText);

  const genes = new Map();
  const stats = {
    annotation: { rows: 0, geneIds: new Set(), koGenes: new Set(), ecGenes: new Set(), plantGenes: new Set() },
    go: { rows: 0, geneIds: new Set() },
    goslim: { rows: 0, geneIds: new Set() },
    interpro: { rows: 0, geneIds: new Set() },
    pfam: { rows: 0, geneIds: new Set() },
    queryidPep: 0,
    queryidCds: 0,
    sameIds: 0,
    diffIds: 0,
    blankPep: 0,
    blankCds: 0
  };

  for (const row of annotationTable.rows) {
    const pep = pick(row.queryid_pep);
    const cds = pick(row.queryid_cds);
    if (pep) stats.queryidPep += 1;
    if (cds) stats.queryidCds += 1;
    if (!pep) stats.blankPep += 1;
    if (!cds) stats.blankCds += 1;
    if (pep && cds) {
      if (pep === cds) stats.sameIds += 1;
      else stats.diffIds += 1;
    }
  }

  parseZenAnnotationRows(annotationTable.rows, genes, stats.annotation);
  parseSimpleAnnotationRows(goTable.rows, genes, 'go', ['go_id', 'go_term', 'go_domain'], stats.go);
  parseSimpleAnnotationRows(goslimTable.rows, genes, 'goslim', ['goslim_id', 'goslim_term', 'goslim_domain'], stats.goslim);
  parseSimpleAnnotationRows(interproTable.rows, genes, 'interpro', ['interpro_id', 'interpro_description'], stats.interpro);
  parseSimpleAnnotationRows(pfamTable.rows, genes, 'pfam', ['pfam_id', 'pfam_description'], stats.pfam);

  const geneObjects = {};
  for (const [geneId, gene] of genes.entries()) {
    geneObjects[geneId] = {
      gene_id: gene.gene_id,
      source_ids: gene.source_ids,
      main_annotations: gene.main_annotations.map(item => ({ ...item })),
      go: stripInternalKeys(gene.go),
      goslim: stripInternalKeys(gene.goslim),
      interpro: stripInternalKeys(gene.interpro),
      pfam: stripInternalKeys(gene.pfam),
      summary: gene.summary
    };
  }

  const summary = {
    schema: 'konjac.annotation_summary.v1',
    built_at: new Date().toISOString(),
    source_file: 'data/raw/plantgarden/Amorphophallus_konjac_t78372.G001_zen_v2.0.tar.gz',
    source_members: TARGET_FILES.slice(),
    main_annotation_gene_count: stats.annotation.geneIds.size,
    go_annotation_gene_count: stats.go.geneIds.size,
    goslim_annotation_gene_count: stats.goslim.geneIds.size,
    interpro_annotation_gene_count: stats.interpro.geneIds.size,
    pfam_annotation_gene_count: stats.pfam.geneIds.size,
    plantTFDB_annotation_gene_count: stats.annotation.plantGenes.size,
    ko_gene_count: stats.annotation.koGenes.size,
    ec_gene_count: stats.annotation.ecGenes.size,
    queryid_pep_row_count: stats.queryidPep,
    queryid_cds_row_count: stats.queryidCds,
    same_queryid_count: stats.sameIds,
    different_queryid_count: stats.diffIds,
    blank_queryid_pep_count: stats.blankPep,
    blank_queryid_cds_count: stats.blankCds,
    gene_id_count: Object.keys(geneObjects).length,
    row_counts: {
      annotation: annotationTable.rows.length,
      go: goTable.rows.length,
      goslim: goslimTable.rows.length,
      interpro: interproTable.rows.length,
      pfam: pfamTable.rows.length
    }
  };

  const index = {
    schema: 'konjac.annotation_index.v1',
    built_at: summary.built_at,
    source_file: summary.source_file,
    source_members: summary.source_members,
    genes: geneObjects
  };

  await fsp.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
  await fsp.writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');

  const statsFile = await fsp.stat(INDEX_PATH);
  console.log(`ZEN source members: ${entries.length}`);
  console.log(`ZEN gene IDs: ${summary.gene_id_count}`);
  console.log(`ZEN annotation genes: ${summary.main_annotation_gene_count}`);
  console.log(`ZEN GO genes: ${summary.go_annotation_gene_count}`);
  console.log(`ZEN GO slim genes: ${summary.goslim_annotation_gene_count}`);
  console.log(`ZEN InterPro genes: ${summary.interpro_annotation_gene_count}`);
  console.log(`ZEN Pfam genes: ${summary.pfam_annotation_gene_count}`);
  console.log(`ZEN PlantTFDB genes: ${summary.plantTFDB_annotation_gene_count}`);
  console.log(`ZEN KO genes: ${summary.ko_gene_count}`);
  console.log(`ZEN EC genes: ${summary.ec_gene_count}`);
  console.log(`ZEN index size: ${statsFile.size} bytes`);
  console.log(`ZEN output: ${path.relative(root, INDEX_PATH)}`);
  console.log(`ZEN summary: ${path.relative(root, SUMMARY_PATH)}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
