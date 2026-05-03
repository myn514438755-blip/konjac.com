import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const INPUT_GFF = path.join(root, 'data', 'raw', 'plantgarden', 'Amorphophallus_konjac.clean.gff.gz');
const ASSEMBLY_REPORT = path.join(root, 'data', 'raw', 'plantgarden', 'GCA_022559845.1_ASM2255984v1_assembly_report.txt');
const FAI_PATH = path.join(root, 'data', 'processed', 'jbrowse', 'assemblies', 'GCA_022559845.1_ASM2255984v1_genomic.fna.gz.fai');
const JBROWSE_CONFIGS = [
  path.join(root, 'data', 'processed', 'jbrowse', 'config.json'),
  path.join(root, 'data', 'processed', 'jbrowse-app', 'config.json')
];

const OUTPUT_DIR = path.join(root, 'data', 'processed', 'jbrowse', 'tracks', 'gff');
const PLAIN_OUT = path.join(OUTPUT_DIR, 'Amorphophallus_konjac.clean.remapped.gff3');
const GZ_OUT = `${PLAIN_OUT}.gz`;
const CSI_OUT = `${GZ_OUT}.csi`;
const SEQID_MAP_PATH = path.join(root, 'data', 'processed', 'jbrowse', 'seqid_map.json');
const SEQID_SUMMARY_PATH = path.join(root, 'data', 'processed', 'jbrowse', 'seqid_map_summary.json');

function ensureDir(dir) {
  return fsp.mkdir(dir, { recursive: true });
}

function parseFai(pathname) {
  const text = fs.readFileSync(pathname, 'utf8').trim();
  const seqids = [];
  const set = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const seqid = line.split('\t')[0].trim();
    if (!seqid) continue;
    seqids.push(seqid);
    set.add(seqid);
  }
  return { seqids, set };
}

function parseAssemblyReport(pathname, faiSet) {
  const text = fs.readFileSync(pathname, 'utf8');
  const rows = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length < 10) continue;
    const [sequenceName, sequenceRole, assignedMolecule, locationType, genbankAccn, relationship, refseqAccn, assemblyUnit, sequenceLength, ucscStyleName] = cols;
    rows.push({
      sequence_name: sequenceName,
      sequence_role: sequenceRole,
      assigned_molecule: assignedMolecule,
      location_type: locationType,
      genbank_accn: genbankAccn,
      relationship,
      refseq_accn: refseqAccn,
      assembly_unit: assemblyUnit,
      sequence_length: Number.parseInt(sequenceLength, 10) || null,
      ucsc_style_name: ucscStyleName
    });
  }
  return rows;
}

function chooseTarget(row, faiSet) {
  const refseq = row.refseq_accn && row.refseq_accn !== 'na' ? row.refseq_accn : '';
  const genbank = row.genbank_accn && row.genbank_accn !== 'na' ? row.genbank_accn : '';
  if (refseq && faiSet.has(refseq)) {
    return { target_seqid: refseq, source: 'RefSeq-Accn', status: 'mapped' };
  }
  if (genbank && faiSet.has(genbank)) {
    return { target_seqid: genbank, source: 'GenBank-Accn', status: 'mapped' };
  }
  return { target_seqid: '', source: '', status: 'unmapped' };
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
    const value = chunk.slice(eq + 1).trim();
    if (!key) continue;
    attrs[key] = value;
  }
  return attrs;
}

function quoteWslPath(winPath) {
  const normalized = path.resolve(winPath).replace(/\\/g, '/');
  const drive = normalized[0].toLowerCase();
  return `/mnt/${drive}${normalized.slice(2)}`;
}

function wslQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function runWsl(command, description) {
  const result = spawnSync('wsl.exe', ['-e', 'bash', '-lc', command], {
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 1024 * 1024 * 20
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || result.stdout || '').trim();
    throw new Error(`${description} failed${stderr ? `: ${stderr}` : ''}`);
  }
  return result.stdout;
}

async function updateConfig(filePath) {
  const config = JSON.parse(await fsp.readFile(filePath, 'utf8'));
  const track = config.tracks?.find((item) => item?.adapter?.type === 'Gff3TabixAdapter');
  if (!track) {
    throw new Error(`No GFF track found in ${filePath}`);
  }
  track.name = 'PlantGARDEN clean GFF (remapped)';
  track.adapter.gffGzLocation.uri = 'tracks/gff/Amorphophallus_konjac.clean.remapped.gff3.gz';
  track.adapter.index.location.uri = 'tracks/gff/Amorphophallus_konjac.clean.remapped.gff3.gz.csi';
  track.adapter.index.indexType = 'CSI';
  await fsp.writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

async function main() {
  if (!fs.existsSync(INPUT_GFF)) throw new Error(`Missing input file: ${INPUT_GFF}`);
  if (!fs.existsSync(ASSEMBLY_REPORT)) throw new Error(`Missing input file: ${ASSEMBLY_REPORT}`);
  if (!fs.existsSync(FAI_PATH)) throw new Error(`Missing input file: ${FAI_PATH}`);

  await ensureDir(OUTPUT_DIR);

  const { seqids: faiSeqids, set: faiSet } = parseFai(FAI_PATH);
  const reportRows = parseAssemblyReport(ASSEMBLY_REPORT, faiSet);

  const seqidMap = {};
  const unmappedRows = [];
  const mappedByOriginal = new Map();
  for (const row of reportRows) {
    const choice = chooseTarget(row, faiSet);
    if (choice.status === 'mapped') {
      const entry = {
        original_seqid: row.sequence_name,
        target_seqid: choice.target_seqid,
        mapping_source: choice.source,
        sequence_role: row.sequence_role,
        genbank_accn: row.genbank_accn,
        refseq_accn: row.refseq_accn,
        sequence_length: row.sequence_length,
        assembly_unit: row.assembly_unit,
        ucsc_style_name: row.ucsc_style_name
      };
      seqidMap[row.sequence_name] = entry;
      mappedByOriginal.set(row.sequence_name, entry);
    } else {
      unmappedRows.push(row);
      seqidMap[row.sequence_name] = {
        original_seqid: row.sequence_name,
        target_seqid: '',
        mapping_source: '',
        sequence_role: row.sequence_role,
        genbank_accn: row.genbank_accn,
        refseq_accn: row.refseq_accn,
        sequence_length: row.sequence_length,
        assembly_unit: row.assembly_unit,
        ucsc_style_name: row.ucsc_style_name,
        unmapped: true
      };
    }
  }

  const indexToWrite = fs.createWriteStream(PLAIN_OUT, { encoding: 'utf8' });
  const writeFinished = new Promise((resolve, reject) => {
    indexToWrite.on('finish', resolve);
    indexToWrite.on('error', reject);
  });
  const gffStream = fs.createReadStream(INPUT_GFF);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({ input: gffStream.pipe(gunzip), crlfDelay: Infinity });

  let totalFeatures = 0;
  let mappedFeatures = 0;
  let unmappedFeatures = 0;
  let commentLines = 0;
  const uniqueOriginalSeqids = new Set();
  const uniqueMappedSeqids = new Set();
  const firstTwentyMappedSeqids = [];
  const firstTwentyOriginalSeqids = [];

  const writeLine = (line) => {
    indexToWrite.write(`${line}\n`);
  };

  try {
    for await (const line of rl) {
      if (!line) {
        continue;
      }
      if (line.startsWith('#')) {
        commentLines += 1;
        writeLine(line);
        continue;
      }
      const cols = line.split('\t');
      if (cols.length < 9) continue;
      totalFeatures += 1;
      const originalSeqid = cols[0];
      uniqueOriginalSeqids.add(originalSeqid);
      if (firstTwentyOriginalSeqids.length < 20 && !firstTwentyOriginalSeqids.includes(originalSeqid)) {
        firstTwentyOriginalSeqids.push(originalSeqid);
      }
      const mapping = seqidMap[originalSeqid];
      if (!mapping || mapping.unmapped || !mapping.target_seqid) {
        unmappedFeatures += 1;
        continue;
      }
      cols[0] = mapping.target_seqid;
      const remappedSeqid = cols[0];
      uniqueMappedSeqids.add(remappedSeqid);
      if (firstTwentyMappedSeqids.length < 20 && !firstTwentyMappedSeqids.includes(remappedSeqid)) {
        firstTwentyMappedSeqids.push(remappedSeqid);
      }
      mappedFeatures += 1;
      writeLine(cols.join('\t'));
    }
  } finally {
    rl.close();
    gffStream.destroy();
    gunzip.close?.();
    indexToWrite.end();
  }
  await writeFinished;

  const plainWsl = quoteWslPath(PLAIN_OUT);
  const gzWsl = quoteWslPath(GZ_OUT);
  const csiWsl = quoteWslPath(CSI_OUT);
  runWsl(`jbrowse sort-gff ${wslQuote(plainWsl)} | bgzip -f -c > ${wslQuote(gzWsl)}`, 'Sort and bgzip remapped GFF');
  runWsl(`tabix -C -f -p gff ${wslQuote(gzWsl)}`, 'Create CSI index');

  const summary = {
    schema: 'konjac.jbrowse_seqid_map_summary.v1',
    built_at: new Date().toISOString(),
    source_files: {
      assembly_report: 'data/raw/plantgarden/GCA_022559845.1_ASM2255984v1_assembly_report.txt',
      raw_gff: 'data/raw/plantgarden/Amorphophallus_konjac.clean.gff.gz',
      fai: 'data/processed/jbrowse/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.gz.fai'
    },
    fasta_seqid_count: faiSeqids.length,
    fasta_seqid_head: faiSeqids.slice(0, 20),
    gff_total_features: totalFeatures,
    gff_mapped_features: mappedFeatures,
    gff_unmapped_features: unmappedFeatures,
    gff_comment_lines: commentLines,
    unique_original_seqids: uniqueOriginalSeqids.size,
    unique_mapped_seqids: uniqueMappedSeqids.size,
    mapped_rows_in_report: Object.values(seqidMap).filter((item) => !item.unmapped).length,
    unmapped_rows_in_report: unmappedRows.length,
    ctg_28_mapping: seqidMap.CTG_28 || null,
    hic_asm_0_mapping: seqidMap.HIC_ASM_0 || null,
    remapped_gff_head_seqids: firstTwentyMappedSeqids,
    remapped_gff_path: 'data/processed/jbrowse/tracks/gff/Amorphophallus_konjac.clean.remapped.gff3.gz',
    remapped_gff_index: 'data/processed/jbrowse/tracks/gff/Amorphophallus_konjac.clean.remapped.gff3.gz.csi'
  };

  await fsp.writeFile(SEQID_MAP_PATH, `${JSON.stringify({ schema: 'konjac.jbrowse_seqid_map.v1', built_at: summary.built_at, entries: seqidMap }, null, 2)}\n`, 'utf8');
  await fsp.writeFile(SEQID_SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  for (const configPath of JBROWSE_CONFIGS) {
    await updateConfig(configPath);
  }

  const gzStat = await fsp.stat(GZ_OUT);
  const csiStat = await fsp.stat(CSI_OUT);
  const plainStat = await fsp.stat(PLAIN_OUT);

  console.log(`FASTA seqids (first 20): ${summary.fasta_seqid_head.join(', ')}`);
  console.log(`GFF seqids (first 20 remapped): ${summary.remapped_gff_head_seqids.join(', ')}`);
  console.log(`Total GFF features: ${summary.gff_total_features}`);
  console.log(`Mapped GFF features: ${summary.gff_mapped_features}`);
  console.log(`Unmapped GFF features: ${summary.gff_unmapped_features}`);
  console.log(`CTG_28 mapping: ${JSON.stringify(summary.ctg_28_mapping)}`);
  console.log(`HIC_ASM_0 mapping: ${JSON.stringify(summary.hic_asm_0_mapping)}`);
  console.log(`Remapped GFF: ${path.relative(root, PLAIN_OUT)} (${plainStat.size} bytes)`);
  console.log(`Remapped GFF.gz: ${path.relative(root, GZ_OUT)} (${gzStat.size} bytes)`);
  console.log(`Remapped GFF.csi: ${path.relative(root, CSI_OUT)} (${csiStat.size} bytes)`);
  console.log(`seqid map: ${path.relative(root, SEQID_MAP_PATH)}`);
  console.log(`seqid summary: ${path.relative(root, SEQID_SUMMARY_PATH)}`);
  console.log(`JBrowse configs updated: ${JBROWSE_CONFIGS.map(p => path.relative(root, p)).join(', ')}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
