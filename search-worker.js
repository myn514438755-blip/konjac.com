'use strict';

const TOPICS = [
  { id: 'kgm', keywords: ['glucomannan', 'mannan', 'mannosyltransferase', 'cellulose synthase-like', 'glycosyltransferase', 'cell wall'] },
  { id: 'csl', keywords: ['cellulose synthase-like', 'csla', 'csld', 'cslh', 'csl'] },
  { id: 'glyco', keywords: ['glycosyltransferase', 'glycosyl transferase', 'glucosyltransferase', 'mannosyltransferase'] },
  { id: 'tf', keywords: ['planttfdb', 'transcription factor', 'wrky', 'myb', 'bhlh', 'nac', 'erf', 'bzip'] },
  { id: 'stress', keywords: ['disease resistance', 'resistance protein', 'nbs-lrr', 'defense', 'stress', 'heat shock', 'peroxidase'] },
  { id: 'kinase', keywords: ['kinase', 'receptor-like', 'protein kinase', 'serine/threonine', 'tyrosine kinase'] },
  { id: 'transporter', keywords: ['transporter', 'abc transporter', 'aquaporin', 'sugar transporter', 'amino acid transporter'] },
  { id: 'cellwall', keywords: ['cell wall', 'expansin', 'pectin', 'cellulose', 'xylan', 'lignin', 'xyloglucan'] }
];

const SYNONYMS = {
  kgm: ['konjac glucomannan', 'glucomannan', 'mannan', 'mannosyltransferase', 'glycosyltransferase', 'cellulose synthase-like', 'cell wall'],
  csla: ['cellulose synthase-like', 'mannan synthase', 'mannosyltransferase', 'glucomannan', 'glycosyltransferase'],
  csl: ['cellulose synthase-like', 'csla', 'csld', 'cslh'],
  tf: ['transcription factor', 'planttfdb'],
  ko: ['kegg', 'ko:'],
  go: ['go:']
};

let genes = [];

function normalize(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return Object.values(value).join(' ');
  return String(value);
}

function listFrom(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return normalize(value).split(/[;,|]/).map(s => s.trim()).filter(Boolean);
}

function getFieldText(gene, mode = 'all') {
  const fieldMap = {
    all: [
      gene.gene_id, gene.gene_symbol, gene.species, gene.chromosome, gene.start, gene.end, gene.strand,
      gene.transcript_id, gene.protein_id, gene.functional_annotation, gene.swissprot, gene.eggnog,
      gene.orthogroup, gene.module, gene.expression_summary, gene.notes, gene.kusakidb_accession,
      gene.ko_id, gene.ec_number, gene.plantTFDB_family, gene.plantTFDB_description, gene.target_species,
      gene.target_family, gene.sequence_identity, gene.e_value, gene.bitscore, gene.genome_browser_locus,
      ...(gene.aliases || []), ...(gene.go_terms || []), ...(gene.go_slim_terms || []),
      ...(gene.kegg_terms || []), ...(gene.interpro_domains || []), ...(gene.pfam_domains || [])
    ],
    gene: [gene.gene_id, gene.gene_symbol, gene.transcript_id, gene.protein_id, gene.kusakidb_accession, ...(gene.aliases || [])],
    function: [gene.functional_annotation, gene.swissprot, gene.notes],
    go: [...(gene.go_terms || []), ...(gene.go_slim_terms || [])],
    kegg: [gene.ko_id, gene.ec_number, ...(gene.kegg_terms || [])],
    domain: [...(gene.interpro_domains || []), ...(gene.pfam_domains || [])],
    tf: [gene.plantTFDB_family, gene.plantTFDB_description, gene.functional_annotation],
    homology: [gene.eggnog, gene.orthogroup, gene.target_species, gene.target_family, gene.sequence_identity, gene.e_value, gene.bitscore, gene.notes],
    location: [gene.chromosome, gene.start, gene.end, gene.strand, gene.genome_browser_locus]
  };
  return normalize(fieldMap[mode] || fieldMap.all).toLowerCase();
}

function buildQueryGroups(query) {
  const tokens = String(query || '').toLowerCase().split(/\s+/).map(s => s.trim()).filter(Boolean);
  return {
    tokens,
    groups: tokens.map(token => {
      const exp = SYNONYMS[token] || [];
      return [...new Set([token, ...exp.map(s => s.toLowerCase())])].filter(Boolean);
    })
  };
}

function expandedTerms(tokens, groups) {
  const tokenSet = new Set(tokens);
  return [...new Set(groups.flat().filter(t => !tokenSet.has(t)))];
}

function matchesGroups(text, groups) {
  if (!groups.length) return true;
  return groups.every(group => group.some(term => text.includes(term)));
}

function hasAnnotation(gene, type) {
  if (!type) return true;
  if (type === 'go') return listFrom(gene.go_terms).length > 0 || listFrom(gene.go_slim_terms).length > 0;
  if (type === 'kegg') return listFrom(gene.kegg_terms).length > 0 || Boolean(gene.ko_id || gene.ec_number);
  if (type === 'interpro') return listFrom(gene.interpro_domains).length > 0;
  if (type === 'pfam') return listFrom(gene.pfam_domains).length > 0;
  if (type === 'tf') return Boolean(gene.plantTFDB_family);
  if (type === 'homolog') return Boolean(gene.target_species || gene.eggnog || gene.orthogroup);
  if (type === 'hic') return normalize(gene.chromosome).startsWith('HIC_ASM');
  if (type === 'ctg') return normalize(gene.chromosome).startsWith('CTG');
  return true;
}

function sortRows(rows, mode, groups, fieldMode, rawQuery) {
  const copy = rows.slice();
  if (mode === 'gene_id') return copy.sort((a, b) => normalize(a.gene_id).localeCompare(normalize(b.gene_id), undefined, { numeric: true }));
  if (mode === 'location') return copy.sort((a, b) => normalize(a.chromosome).localeCompare(normalize(b.chromosome), undefined, { numeric: true }) || Number(a.start || 0) - Number(b.start || 0));
  if (mode === 'protein_desc') return copy.sort((a, b) => Number(b.protein_length || 0) - Number(a.protein_length || 0));
  if (mode === 'identity_desc') return copy.sort((a, b) => Number(b.sequence_identity || 0) - Number(a.sequence_identity || 0));
  if (mode === 'bitscore_desc') return copy.sort((a, b) => Number(b.bitscore || 0) - Number(a.bitscore || 0));
  return copy.sort((a, b) => scoreGene(b, groups, fieldMode, rawQuery) - scoreGene(a, groups, fieldMode, rawQuery) || normalize(a.gene_id).localeCompare(normalize(b.gene_id), undefined, { numeric: true }));
}

function scoreGene(gene, groups, fieldMode, rawQuery) {
  const raw = String(rawQuery || '').trim().toLowerCase();
  let score = 0;
  const id = normalize(gene.gene_id).toLowerCase();
  const symbol = normalize(gene.gene_symbol).toLowerCase();
  const full = getFieldText(gene, fieldMode);
  if (id === raw) score += 10000;
  if (raw && id.startsWith(raw)) score += 2000;
  if (raw && id.includes(raw)) score += 1200;
  if (raw && symbol.includes(raw)) score += 500;
  if (raw && full.includes(raw)) score += 100;
  groups.flat().forEach(term => {
    if (id.includes(term)) score += 80;
    if (symbol.includes(term)) score += 40;
    if (full.includes(term)) score += 12;
  });
  return score;
}

function runSearch(message) {
  const startedAt = performance.now();
  const query = String(message.query || '').trim();
  const fieldMode = message.fieldMode || 'all';
  const speciesFilter = message.speciesFilter || '';
  const annotationFilter = message.annotationFilter || '';
  const sortMode = message.sortMode || 'relevance';
  const activeTopicId = message.activeTopicId || '';
  const { tokens, groups } = buildQueryGroups(query);

  const topic = TOPICS.find(t => t.id === activeTopicId);
  let rows = genes.filter(gene => {
    const fieldText = getFieldText(gene, fieldMode);
    if (!matchesGroups(fieldText, groups)) return false;
    if (speciesFilter && normalize(gene.species) !== speciesFilter) return false;
    if (!hasAnnotation(gene, annotationFilter)) return false;
    if (topic && !topic.keywords.some(k => normalize(gene._search || fieldText).includes(k.toLowerCase()))) return false;
    return true;
  });

  rows = sortRows(rows, sortMode, groups, fieldMode, query);

  postMessage({
    type: 'search-result',
    requestId: message.requestId,
    ids: rows.map(gene => gene.gene_id),
    tokens,
    groups,
    elapsedMs: performance.now() - startedAt
  });
}

self.addEventListener('message', (event) => {
  const message = event.data || {};
  if (message.type === 'init') {
    genes = Array.isArray(message.genes) ? message.genes : [];
    postMessage({ type: 'init-ready' });
    return;
  }
  if (message.type === 'search') {
    if (!genes.length) {
      postMessage({ type: 'error', requestId: message.requestId, message: 'Search worker is not initialized' });
      return;
    }
    try {
      runSearch(message);
    } catch (error) {
      postMessage({ type: 'error', requestId: message.requestId, message: error?.message || 'Search worker failed' });
    }
  }
});
