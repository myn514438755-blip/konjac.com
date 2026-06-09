const runtimeUrls = window.KonjacRuntimeUrls.createResolvers(
  window.KONJAC_RUNTIME_CONFIG || {}
);
const DATA_URL = runtimeUrls.dataUrl('genes.json');
const SUMMARY_URL = runtimeUrls.dataUrl('build_summary.json');
const OVERLAY_INDEX_URL = runtimeUrls.dataUrl(
  'processed/annotations/overlay/annotation_overlay_index.json'
);
const JBROWSE_SEQID_MAP_URL = runtimeUrls.dataUrl(
  'processed/jbrowse/seqid_map.json'
);
const SEQUENCE_INDEX_URL = runtimeUrls.dataUrl(
  'processed/sequences/sequence_index.json'
);
const SEARCH_STATE_KEY = 'konjac_gene_search_state_v1';
const DATA_BYTES_HINT = 63035084;
const SUPABASE_URL = 'https://plvylqvdlavriupvphxj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdnlscXZkbGF2cml1cHZwaHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3OTgwMTMsImV4cCI6MjA5MzM3NDAxM30.hvrueYBgtzA9x5ISenK6fI6ofRO9OJ3maelA-D_CjVY';
const BLAST_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/blast`;
const BLAST_JOB_STORAGE_KEY = 'konjac_blast_last_job_v1';
const SUPABASE_AUTH_STORAGE_KEY = 'konjac_supabase_auth_v1';

const VIEW_IDS = ['homeView', 'searchView', 'scoreView', 'geneView', 'topicsView', 'kgmView', 'browseView', 'bulkView', 'downloadsView', 'blastView', 'sourcesView', 'helpView'];
const SEQUENCE_FILES = {
  cds: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.cds'),
  protein: runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.pep')
};

const TOPICS = [
  { id: 'kgm', title: 'KGM / Konjac glucomannan', description: 'Search genes related to glucomannan and cell wall pathways.', keywords: ['glucomannan', 'mannan', 'mannosyltransferase', 'cellulose synthase-like', 'glycosyltransferase', 'cell wall'], example: 'KGM' },
  { id: 'csl', title: 'CSL / Cellulose synthase-like', description: 'Search cellulose synthase-like family members.', keywords: ['cellulose synthase-like', 'csla', 'csld', 'cslh', 'csl'], example: 'CSLA' },
  { id: 'glyco', title: 'Glycosyltransferase', description: 'Search glycosyltransferase-related genes.', keywords: ['glycosyltransferase', 'glycosyl transferase', 'glucosyltransferase', 'mannosyltransferase'], example: 'glycosyltransferase' },
  { id: 'tf', title: 'Transcription factors', description: 'Browse PlantTFDB annotations and families such as WRKY, MYB and bHLH.', keywords: ['planttfdb', 'transcription factor', 'wrky', 'myb', 'bhlh', 'nac', 'erf', 'bzip'], example: 'WRKY' },
  { id: 'stress', title: 'Stress / disease resistance', description: 'Search defense-related genes and heat shock terms.', keywords: ['disease resistance', 'resistance protein', 'nbs-lrr', 'defense', 'stress', 'heat shock', 'peroxidase'], example: 'disease resistance' },
  { id: 'kinase', title: 'Kinase / receptor', description: 'Search kinase and receptor-like protein families.', keywords: ['kinase', 'receptor-like', 'protein kinase', 'serine/threonine', 'tyrosine kinase'], example: 'protein kinase' },
  { id: 'transporter', title: 'Transporter', description: 'Search transporter, ABC transporter and aquaporin genes.', keywords: ['transporter', 'abc transporter', 'aquaporin', 'sugar transporter', 'amino acid transporter'], example: 'transporter' },
  { id: 'cellwall', title: 'Cell wall', description: 'Search cell wall genes such as expansin, pectin and lignin.', keywords: ['cell wall', 'expansin', 'pectin', 'cellulose', 'xylan', 'lignin', 'xyloglucan'], example: 'cell wall' }
];

const SPECIES_OPTIONS = [
  {
    value: 'amorphophallus konjac',
    label: '花魔芋 / A. konjac',
    codes: ['ak', 'akon', 'konjac'],
    catalog: true,
    status: '已接入完整基因注释',
    source: 'PlantGARDEN gene models, CDS, protein, ZEN annotations'
  },
  {
    value: 'amorphophallus albus',
    label: '白魔芋 / A. albus',
    codes: ['aa', 'albus', 'white'],
    catalog: false,
    status: '待导入基因集',
    source: 'NCBI BioProject PRJNA1208222；本地目前仅有 RNA-seq / AkECH 筛查线索'
  },
  {
    value: 'amorphophallus bulbifer',
    label: '珠芽魔芋 / A. bulbifer',
    codes: ['ab', 'bulbifer'],
    catalog: false,
    status: '待导入基因集',
    source: '目前仅有 RNA-seq / AkECH 筛查线索'
  },
  {
    value: 'amorphophallus muelleri',
    label: '疣柄魔芋 / A. muelleri',
    codes: ['am', 'muelleri'],
    catalog: false,
    status: '待导入基因集',
    source: '目前仅有候选运行清单'
  }
];

const SYNONYMS = {
  kgm: ['konjac glucomannan', 'glucomannan', 'mannan', 'mannosyltransferase', 'glycosyltransferase', 'cellulose synthase-like', 'cell wall'],
  csla: ['cellulose synthase-like', 'mannan synthase', 'mannosyltransferase', 'glucomannan', 'glycosyltransferase'],
  csl: ['cellulose synthase-like', 'csla', 'csld', 'cslh'],
  tf: ['transcription factor', 'planttfdb'],
  ko: ['kegg', 'ko:'],
  go: ['go:']
};

const DOWNLOAD_META = {
  'genes.json': { label: '搜索数据 JSON', description: '静态站点主用的基因查询数据集。' },
  'Amorphophallus_konjac.clean.gff': { label: 'GFF 注释', description: '基因模型、坐标和转录本结构。' },
  'Amorphophallus_konjac.clean.cds': { label: 'CDS 序列', description: '编码序列，可用于本地分析和导出。' },
  'Amorphophallus_konjac.clean.pep': { label: '蛋白序列', description: '蛋白序列，可用于注释和结构域分析。' },
  'zen_annotation_v2.0.tsv': { label: 'ZEN 注释', description: '同源、KO/EC 和物种来源注释。' },
  'zen_go_v2.0.tsv': { label: 'ZEN GO', description: 'GO 注释结果。' },
  'zen_goslim_v2.0.tsv': { label: 'ZEN GO slim', description: 'GO slim 分类结果。' },
  'zen_interpro_v2.0.tsv': { label: 'ZEN InterPro', description: 'InterPro 结构域注释结果。' },
  'zen_pfam_v2.0.tsv': { label: 'ZEN Pfam', description: 'Pfam 结构域注释结果。' },
  'species_catalog.json': { label: '物种接入清单', description: '记录花魔芋与待导入魔芋物种的数据状态、搜索前缀和后续所需文件。' }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
let routeNonce = 0;

const state = {
  summary: {},
  genes: [],
  geneById: new Map(),
  genesLoaded: false,
  genesLoadPromise: null,
  searchWorker: null,
  searchWorkerReady: false,
  searchWorkerInitPromise: null,
  searchWorkerPending: new Map(),
  searchRequestId: 0,
  filtered: [],
  currentPage: 1,
  submittedQuery: '',
  activeTopicId: '',
  lastTokens: [],
  lastGroups: [],
  lastSearchDuration: 0,
  currentSequence: null,
  jbrowseSeqidMap: null,
  jbrowseSeqidMapPromise: null,
  sequenceIndex: null,
  sequenceIndexPromise: null,
  sequenceChunkCache: new Map(),
  sequenceChunkPromise: new Map(),
  overlayIndex: null,
  overlayIndexPromise: null,
  overlayChunkCache: new Map(),
  overlayChunkPromise: new Map(),
  blastPollTimer: null,
  lastBlastResult: null,
  bulkRows: [],
  kgmRows: [],
  scoreRows: [],
  scoreMode: '',
  authSession: null
};

function qs(id) { return $(id.startsWith('#') ? id : `#${id}`); }

function setVisibleViews(activeIds = []) {
  const active = new Set(activeIds);
  VIEW_IDS.forEach((id) => {
    const el = qs(id);
    if (el) el.hidden = !active.has(id);
  });
  document.body.dataset.view = activeIds[0] || 'home';
}

function showView(view, options = {}) {
  const { resetScroll = true } = options;
  setVisibleViews([`${view}View`]);
  if (resetScroll) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function renderFallback(value, fallback = '暂无注释') {
  const text = displayValue(value, '');
  return text ? escapeHtml(text) : `<span class="muted">${escapeHtml(fallback)}</span>`;
}

function geneLocation(gene) {
  const parts = [gene.chromosome, gene.start, gene.end].filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  if (parts.length >= 3) return `${parts[0]}:${parts[1]}-${parts[2]}`;
  if (gene.genome_browser_locus) return String(gene.genome_browser_locus);
  return gene.gene_id || 'NA';
}

function renderSearchStatus({ query = '', count = null, elapsedMs = null, filters = [] } = {}) {
  const box = qs('searchStatus');
  if (!box) return;
  const hasContent = Boolean(query || (count !== null && count !== undefined) || (filters && filters.length));
  if (!hasContent) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  const parts = [];
  if (query) parts.push(`关键词：${escapeHtml(query)}`);
  if (count !== null && count !== undefined) parts.push(`结果数：${formatNumber(count)}`);
  if (elapsedMs !== null && elapsedMs !== undefined) parts.push(`耗时：${escapeHtml(formatDuration(elapsedMs))}`);
  if (filters && filters.length) parts.push(`筛选：${filters.map(escapeHtml).join('；')}`);
  box.innerHTML = parts.map(part => `<span class="filter-pill">${part}</span>`).join('');
}

function speciesLabel(value = '') {
  const normalized = normalize(value);
  const match = SPECIES_OPTIONS.find(item => item.value === normalized);
  return match?.label || value || '全部物种';
}

function speciesStatus(value = '') {
  const normalized = normalize(value);
  const match = SPECIES_OPTIONS.find(item => item.value === normalized);
  return match?.status || '全部物种';
}

function speciesDataNote(value = '') {
  const normalized = normalize(value);
  const match = SPECIES_OPTIONS.find(item => item.value === normalized);
  if (!match || match.catalog) return '';
  return `${match.label}：${match.status}。${match.source}，尚未整理成可搜索的完整基因模型、CDS、蛋白和注释表。`;
}

function populateSpeciesFilters() {
  const html = [
    '<option value="">全部物种</option>',
    ...SPECIES_OPTIONS.map(item => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)} · ${escapeHtml(item.status)}</option>`)
  ].join('');
  ['homeSpeciesFilter', 'speciesFilter'].forEach((id) => {
    const select = qs(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = html;
    if (current && SPECIES_OPTIONS.some(item => item.value === current)) select.value = current;
  });
}

function setSpeciesFilterValue(value = '') {
  const normalized = normalize(value);
  ['homeSpeciesFilter', 'speciesFilter'].forEach((id) => {
    const select = qs(id);
    if (select) select.value = normalized;
  });
}

function syncSpeciesFilters(sourceId) {
  const source = qs(sourceId);
  if (!source) return;
  setSpeciesFilterValue(source.value || '');
}

function extractSpeciesScopedQuery(value = '') {
  const raw = String(value || '').trim();
  const match = /^([A-Za-z]{2,12})(?::|\s+|-|_)(.+)$/.exec(raw);
  if (!match) {
    const prefix = SPECIES_OPTIONS
      .flatMap(species => species.codes.map(code => ({ species, code })))
      .sort((a, b) => b.code.length - a.code.length)
      .find(({ code }) => raw.toLowerCase().startsWith(code) && /^evm\.|^gene|^transcript|^protein/i.test(raw.slice(code.length)));
    if (!prefix) return { query: raw, speciesFilter: '' };
    return { query: raw.slice(prefix.code.length).trim(), speciesFilter: prefix.species.value };
  }
  const code = match[1].toLowerCase();
  const species = SPECIES_OPTIONS.find(item => item.codes.includes(code));
  if (!species) return { query: raw, speciesFilter: '' };
  return { query: match[2].trim(), speciesFilter: species.value };
}

function showLoadingError(error) {
  const message = error?.message ? String(error.message) : '数据加载失败';
  setLoadingState(message, null, true, true);
  showToast(message);
}

function normalize(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' ');
  if (typeof value === 'object') return Object.values(value).join(' ');
  return String(value);
}

function displayValue(value, fallback = '暂无') {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.length ? value.join('; ') : fallback;
  return String(value);
}

function escapeHtml(value) {
  return normalize(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString() : displayValue(value);
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n)) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = n;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx ? 1 : 0)} ${units[idx]}`;
}

function formatDuration(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value)) return '-';
  if (value < 1000) return `${Math.max(0, Math.round(value))} ms`;
  const seconds = value / 1000;
  return `${seconds.toFixed(seconds < 10 ? 2 : 1)} s`;
}

function listFrom(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return normalize(value).split(/[;,|]/).map(s => s.trim()).filter(Boolean);
}

function fileTypeLabel(name = '') {
  const lower = String(name).toLowerCase();
  if (lower.endsWith('.gff') || lower.endsWith('.gff3')) return 'GFF';
  if (lower.endsWith('.cds')) return 'CDS FASTA';
  if (lower.endsWith('.pep') || lower.endsWith('.faa') || lower.endsWith('.fa')) return 'Protein FASTA';
  if (lower.endsWith('.tsv')) return 'TSV';
  if (lower.endsWith('.json')) return 'JSON';
  if (lower.endsWith('.txt')) return 'Text';
  return 'File';
}

function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = String(text);
  ta.readOnly = true;
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);
  const ok = document.execCommand('copy');
  ta.remove();
  return ok;
}

async function copyText(text, message = '已复制') {
  const value = String(text || '').trim();
  if (!value) {
    showToast('没有可复制的内容');
    return false;
  }
  try {
    if (window.isSecureContext && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(value);
      showToast(message);
      return true;
    }
  } catch (error) {}
  try {
    if (fallbackCopyText(value)) {
      showToast(message);
      return true;
    }
  } catch (error) {}
  showToast('复制失败');
  return false;
}

function showToast(message) {
  const toast = qs('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 1600);
}

function setLoadingState(text, percent = null, show = true, error = false) {
  const box = qs('loadStatus');
  const textEl = qs('loadStatusText');
  const pctEl = qs('loadStatusPercent');
  const barEl = qs('loadStatusBar');
  if (!box || !textEl || !pctEl || !barEl) return;
  box.hidden = !show;
  box.classList.toggle('error', Boolean(error));
  textEl.textContent = text || '';
  if (percent === null) {
    pctEl.textContent = '';
    barEl.style.width = '100%';
  } else {
    const value = Math.max(0, Math.min(100, Number(percent) || 0));
    pctEl.textContent = `${Math.round(value)}%`;
    barEl.style.width = `${value}%`;
  }
}

function renderTagList(values, limit = 12, fallback = '暂无注释') {
  const list = listFrom(values);
  if (!list.length) return `<span class="muted">${escapeHtml(fallback)}</span>`;
  const visible = list.slice(0, limit).map(v => `<button class="tag tag-button" data-search="${escapeHtml(v)}" title="Search ${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('');
  const more = list.length > limit ? `<span class="tag">+${list.length - limit}</span>` : '';
  return `<div class="tag-list">${visible}${more}</div>`;
}

function renderOverflowList(items, renderItem, limit = 10, fallback = '暂无注释') {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return `<span class="muted">${escapeHtml(fallback)}</span>`;
  const visible = list.slice(0, limit).map(renderItem).join('');
  const extra = list.length > limit
    ? `<details class="expand-list"><summary>展开更多（${list.length - limit}）</summary><div class="tag-list">${list.slice(limit).map(renderItem).join('')}</div></details>`
    : '';
  return `<div class="tag-list">${visible}</div>${extra}`;
}

function renderOverlayTag(id, title = '') {
  const text = displayValue(id, '');
  if (!text) return '';
  const tip = title ? ` title="${escapeHtml(title)}"` : '';
  return `<span class="tag"${tip}>${escapeHtml(text)}</span>`;
}

function renderOverlayKeyValueList(values, renderItem, limit = 10, fallback = '暂无注释') {
  return renderOverflowList(values, renderItem, limit, fallback);
}

function renderDetailCard(title, rows, full = false) {
  return `
    <article class="card${full ? ' full' : ''}">
      <h3>${escapeHtml(title)}</h3>
      <dl class="detail-dl">
        ${rows.map(([label, content]) => `
          <dt>${escapeHtml(label)}</dt>
          <dd>${content || '<span class="muted">暂无注释</span>'}</dd>
        `).join('')}
      </dl>
    </article>
  `;
}

function overlayBlockText(value, fallback = '暂无注释') {
  const text = displayValue(value, '');
  return text ? escapeHtml(text) : `<span class="muted">${escapeHtml(fallback)}</span>`;
}

function renderCdsBlocksOverlay(blocks) {
  const list = Array.isArray(blocks) ? blocks.filter(Boolean) : [];
  if (!list.length) return `<span class="muted">暂无注释</span>`;
  const visible = list.slice(0, 5).map((block, idx) => {
    const seqid = displayValue(block.seqid, '');
    const start = displayValue(block.start, '');
    const end = displayValue(block.end, '');
    const length = displayValue(block.length, '');
    const phase = displayValue(block.phase, '.');
    return `<li><code>${escapeHtml(seqid)}:${escapeHtml(start)}-${escapeHtml(end)}</code> <span class="muted">len ${escapeHtml(length)} / phase ${escapeHtml(phase)}</span></li>`;
  }).join('');
  const extra = list.length > 5
    ? `<details class="expand-list"><summary>展开更多（${list.length - 5}）</summary><ul class="compact-list">${list.slice(5).map((block) => {
        const seqid = displayValue(block.seqid, '');
        const start = displayValue(block.start, '');
        const end = displayValue(block.end, '');
        const length = displayValue(block.length, '');
        const phase = displayValue(block.phase, '.');
        return `<li><code>${escapeHtml(seqid)}:${escapeHtml(start)}-${escapeHtml(end)}</code> <span class="muted">len ${escapeHtml(length)} / phase ${escapeHtml(phase)}</span></li>`;
      }).join('')}</ul></details>`
    : '';
  return `<ul class="compact-list">${visible}</ul>${extra}`;
}

function renderOverlayObjectList(items, keyField, labelField, limit = 10, fallback = '暂无注释') {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return `<span class="muted">${escapeHtml(fallback)}</span>`;
  const renderItem = (item) => {
    const key = displayValue(item?.[keyField], '');
    const label = displayValue(item?.[labelField], '');
    const text = key && label ? `${key} · ${label}` : (key || label);
    return text ? renderOverlayTag(text, label || key) : '';
  };
  return renderOverflowList(list, renderItem, limit, fallback);
}

function renderOverlayStrings(values, limit = 10, fallback = '暂无注释') {
  const list = Array.isArray(values) ? values.filter(Boolean).map(v => String(v).trim()).filter(Boolean) : [];
  if (!list.length) return `<span class="muted">${escapeHtml(fallback)}</span>`;
  const visible = list.slice(0, limit).map(v => renderOverlayTag(v)).join('');
  const extra = list.length > limit
    ? `<details class="expand-list"><summary>展开更多（${list.length - limit}）</summary><div class="tag-list">${list.slice(limit).map(v => renderOverlayTag(v)).join('')}</div></details>`
    : '';
  return `<div class="tag-list">${visible}</div>${extra}`;
}

function renderOverlayPanel(overlay) {
  if (!overlay) {
    return `
      <article class="card full">
        <h3>增强注释</h3>
        <p class="muted">增强注释暂不可用</p>
      </article>
    `;
  }

  return `
    <div class="detail-grid">
      ${renderDetailCard('基因结构', [
        ['染色体 / scaffold', overlayBlockText(overlay.seqid)],
        ['start', overlayBlockText(overlay.start)],
        ['end', overlayBlockText(overlay.end)],
        ['strand', overlayBlockText(overlay.strand)],
        ['CDS 数量', overlayBlockText(overlay.cds_count)],
        ['CDS 总长度', overlayBlockText(overlay.cds_total_length)],
        ['CDS blocks', renderCdsBlocksOverlay(overlay.cds_blocks)]
      ])}
      ${renderDetailCard('功能注释', [
        ['functional_description', overlayBlockText(overlay.functional_description)],
        ['KO', overlayBlockText(overlay.ko_id)],
        ['EC', overlayBlockText(overlay.ec_number)],
        ['target_species', renderOverlayStrings(overlay.target_species, 10)],
        ['target_family', renderOverlayStrings(overlay.target_family, 10)],
        ['e_value', overlayBlockText(overlay.e_value)],
        ['bitscore', overlayBlockText(overlay.bitscore)]
      ])}
      ${renderDetailCard('转录因子', [
        ['PlantTFDB family', overlayBlockText(overlay.plantTFDB_family)],
        ['PlantTFDB description', overlayBlockText(overlay.plantTFDB_description)]
      ])}
      ${renderDetailCard('GO 注释', [
        ['GO terms', renderOverlayObjectList(overlay.go_terms, 'go_id', 'go_term', 10)],
        ['GO slim terms', renderOverlayObjectList(overlay.go_slim_terms, 'goslim_id', 'goslim_term', 10)]
      ])}
      ${renderDetailCard('InterPro / Pfam', [
        ['InterPro domains', renderOverlayObjectList(overlay.interpro_domains, 'interpro_id', 'interpro_description', 10)],
        ['Pfam domains', renderOverlayObjectList(overlay.pfam_domains, 'pfam_id', 'pfam_description', 10)]
      ])}
    </div>
  `;
}

function updateStats() {
  const s = state.summary || {};
  qs('statGenes').textContent = formatNumber(s.total_genes ?? state.genes.length ?? '-');
  qs('statGo').textContent = formatNumber(s.go_annotated_genes ?? '-');
  qs('statKegg').textContent = formatNumber(s.kegg_annotated_genes ?? '-');
  qs('statInterpro').textContent = formatNumber(s.interpro_annotated_genes ?? '-');
  qs('statTf').textContent = formatNumber(s.plantTFDB_genes ?? '-');
  qs('statUpdated').textContent = s.website_last_updated || '2026-04-29';
}

async function loadSummary() {
  if (Object.keys(state.summary).length) return state.summary;
  try {
    const res = await fetch(SUMMARY_URL);
    if (res.ok) state.summary = await res.json();
  } catch (error) {
    console.warn('summary load failed', error);
  }
  return state.summary;
}

async function fetchJsonWithProgress(url, label, bytesHint = 0) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label} failed: HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || bytesHint || 0;
  if (!res.body || typeof TextDecoder === 'undefined') return res.json();
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength || value.length || 0;
    if (total) setLoadingState(`${label} ${formatBytes(received)} / ${formatBytes(total)}`, Math.min(98, received / total * 100));
  }
  const decoder = new TextDecoder('utf-8');
  let text = '';
  chunks.forEach(chunk => { text += decoder.decode(chunk, { stream: true }); });
  text += decoder.decode();
  return JSON.parse(text);
}

async function loadGenes() {
  if (state.genesLoaded) return state.genes;
  if (state.genesLoadPromise) return state.genesLoadPromise;
  state.genesLoadPromise = (async () => {
    setLoadingState('正在加载基因数据...', null, true, false);
    const data = await fetchJsonWithProgress(DATA_URL, 'genes.json', DATA_BYTES_HINT);
    state.genes = Array.isArray(data) ? data : [];
    state.geneById = new Map();
    state.genes.forEach(gene => {
      gene._search = normalize([
        gene.gene_id, gene.gene_symbol, gene.species, gene.chromosome, gene.start, gene.end, gene.strand,
        gene.transcript_id, gene.protein_id, gene.functional_annotation, gene.swissprot, gene.eggnog,
        gene.orthogroup, gene.module, gene.expression_summary, gene.notes, gene.kusakidb_accession,
        gene.ko_id, gene.ec_number, gene.plantTFDB_family, gene.plantTFDB_description, gene.target_species,
        gene.target_family, gene.sequence_identity, gene.e_value, gene.bitscore, gene.genome_browser_locus,
        ...(gene.aliases || []), ...(gene.go_terms || []), ...(gene.go_slim_terms || []),
        ...(gene.kegg_terms || []), ...(gene.interpro_domains || []), ...(gene.pfam_domains || [])
      ]).toLowerCase();
      state.geneById.set(gene.gene_id, gene);
    });
    state.genesLoaded = true;
    state.genesLoadPromise = null;
    return state.genes;
  })().catch(err => {
    state.genesLoadPromise = null;
    throw err;
  });
  return state.genesLoadPromise;
}

function terminateSearchWorker() {
  if (state.searchWorker) {
    try { state.searchWorker.terminate(); } catch (error) {}
  }
  state.searchWorker = null;
  state.searchWorkerReady = false;
  state.searchWorkerInitPromise = null;
  state.searchWorkerPending.forEach(({ reject }) => reject(new Error('Search worker unavailable')));
  state.searchWorkerPending.clear();
}

function handleSearchWorkerMessage(event) {
  const data = event?.data || {};
  if (data.type === 'init-ready') {
    state.searchWorkerReady = true;
    if (state.searchWorkerInitResolve) state.searchWorkerInitResolve(true);
    state.searchWorkerInitResolve = null;
    state.searchWorkerInitReject = null;
    state.searchWorkerInitPromise = Promise.resolve(true);
    return;
  }
  if (data.type === 'search-result') {
    const pending = state.searchWorkerPending.get(data.requestId);
    if (pending) {
      pending.resolve(data);
      state.searchWorkerPending.delete(data.requestId);
    }
    return;
  }
  if (data.type === 'error') {
    const pending = state.searchWorkerPending.get(data.requestId);
    if (pending) {
      pending.reject(new Error(data.message || 'Search worker failed'));
      state.searchWorkerPending.delete(data.requestId);
    }
  }
}

function handleSearchWorkerError(error) {
  const message = error?.message || 'Search worker failed';
  const pending = Array.from(state.searchWorkerPending.values());
  state.searchWorkerPending.clear();
  state.searchWorkerReady = false;
  state.searchWorkerInitPromise = null;
  if (state.searchWorkerInitReject) state.searchWorkerInitReject(new Error(message));
  state.searchWorkerInitResolve = null;
  state.searchWorkerInitReject = null;
  pending.forEach(({ reject }) => reject(new Error(message)));
  terminateSearchWorker();
}

function ensureSearchWorker() {
  if (state.searchWorkerReady) return Promise.resolve(true);
  if (state.searchWorkerInitPromise) return state.searchWorkerInitPromise;
  if (typeof Worker === 'undefined') return Promise.resolve(false);
  try {
    if (!state.searchWorker) {
      state.searchWorker = new Worker('./search-worker.js');
      state.searchWorker.onmessage = handleSearchWorkerMessage;
      state.searchWorker.onerror = handleSearchWorkerError;
    }
  } catch (error) {
    handleSearchWorkerError(error);
    return Promise.resolve(false);
  }
  state.searchWorkerInitPromise = new Promise((resolve, reject) => {
    state.searchWorkerInitResolve = resolve;
    state.searchWorkerInitReject = reject;
  });
  try {
    state.searchWorker.postMessage({
      type: 'init',
      genes: state.genes
    });
  } catch (error) {
    handleSearchWorkerError(error);
    return Promise.resolve(false);
  }
  return state.searchWorkerInitPromise.catch(() => false);
}

function searchInWorker(query) {
  if (!state.searchWorker || !state.searchWorkerReady) return Promise.resolve(null);
  const requestId = ++state.searchRequestId;
  const scoped = extractSpeciesScopedQuery(query);
  const fieldMode = qs('fieldFilter')?.value || 'all';
  const speciesFilter = scoped.speciesFilter || qs('speciesFilter')?.value || '';
  const annotationFilter = qs('annotationFilter')?.value || '';
  const sortMode = qs('sortMode')?.value || 'relevance';
  return new Promise((resolve, reject) => {
    state.searchWorkerPending.set(requestId, { resolve, reject });
    try {
      state.searchWorker.postMessage({
        type: 'search',
        requestId,
        query: scoped.query,
        fieldMode,
        speciesFilter,
        annotationFilter,
        sortMode,
        activeTopicId: state.activeTopicId
      });
    } catch (error) {
      state.searchWorkerPending.delete(requestId);
      reject(error);
    }
  });
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

function getCachedFieldText(gene, mode) {
  if (mode === 'all') return gene._search || getFieldText(gene, 'all');
  gene._fieldText ||= {};
  gene._fieldText[mode] ||= getFieldText(gene, mode);
  return gene._fieldText[mode];
}
function renderHomeModules() {
  const items = [
    { title: '基因查询', href: '#search', desc: '输入 Gene ID、GO、KEGG、Pfam 或转录因子家族进行查询。' },
    { title: '功能候选评分', href: '#score', desc: '输入基因或功能关键词，按注释证据给出候选基因评分和命中依据。' },
    { title: '魔芋研究专题', href: '#topics', desc: '进入 KGM、CSLA、转录因子、抗病和细胞壁专题入口。' },
    { title: 'KGM 专题', href: '#kgm', desc: '查看葡甘聚糖、细胞壁和糖基转移相关候选基因。' },
    { title: '注释分类浏览', href: '#browse', desc: '按 GO、InterPro、Pfam 和同源物种快速浏览。' },
    { title: '批量工具', href: '#bulk', desc: '批量查询 Gene ID，导出注释表，并下载 CDS 或蛋白序列。' },
    { title: '基因组浏览器', href: runtimeUrls.jbrowseUrl('index.html'), desc: '查看基因组坐标、基因结构和 GFF 注释轨道。' },
    { title: 'BLAST 序列比对', href: '#blast', desc: '提交核酸或蛋白序列，查看与花魔芋 CDS、蛋白和基因组数据库的相似性结果。' },
    { title: '数据下载', href: '#downloads', desc: '下载整合表、GFF、CDS、protein FASTA 和 ZEN 文件。' },
    { title: '数据来源与引用', href: '#sources', desc: '查看数据来源、引用格式、许可说明和维护信息。' },
    { title: '使用帮助', href: '#help', desc: '查看搜索、基因详情、基因组浏览器和 BLAST 的使用方法。' }
  ];
  qs('homeModules').innerHTML = items.map(item => `
    <a class="module-card" href="${escapeHtml(item.href)}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.desc)}</span>
    </a>
  `).join('');
}

function renderQuickSearches() {
  const terms = [
    ['KGM', 'KGM'], ['CSLA', 'CSLA'], ['WRKY', 'WRKY'], ['MYB', 'MYB'],
    ['PF00069', 'PF00069'], ['GO:0003677', 'GO:0003677'], ['glucomannan', 'glucomannan']
  ];
  qs('quickSearches').innerHTML = terms.map(([label, q]) => `<button class="tag tag-button" data-search="${escapeHtml(q)}">${escapeHtml(label)}</button>`).join('');
  qs('homeQuickSearches').innerHTML = terms.map(([label, q]) => `<button class="tag tag-button" data-home-search="${escapeHtml(q)}">${escapeHtml(label)}</button>`).join('');
}

function renderTopicCards() {
  const counts = state.summary.topic_counts || {};
  qs('topicCards').innerHTML = TOPICS.map(topic => {
    const count = Number(counts[topic.id]);
    return `
      <article class="topic-card">
        <div>
          <h3>${escapeHtml(topic.title)}</h3>
          <p>${escapeHtml(topic.description)}</p>
        </div>
        <div class="topic-meta">
          <strong>${Number.isFinite(count) ? count.toLocaleString() : '0'}</strong>
          <span>候选基因</span>
        </div>
        <div class="topic-actions">
          ${topic.id === 'kgm' ? '<a class="button small" href="#kgm">打开专题页</a>' : ''}
          <button class="button ghost small" data-topic-search="${topic.id}">Filter this topic</button>
          <button class="button secondary small" data-search="${escapeHtml(topic.example)}">Example search</button>
        </div>
      </article>
    `;
  }).join('');
}

function scoreKgmCandidate(gene) {
  const text = [
    gene.gene_id,
    gene.gene_symbol,
    gene.functional_annotation,
    gene.plantTFDB_family,
    ...(gene.go_terms || []),
    ...(gene.go_slim_terms || []),
    ...(gene.interpro_domains || []),
    ...(gene.pfam_domains || []),
    ...(gene.kegg_terms || []),
    gene.ko_id,
    gene.ec_number
  ].filter(Boolean).join(' ').toLowerCase();
  const rules = [
    ['glucomannan', 12],
    ['mannan', 10],
    ['cellulose synthase-like', 10],
    ['csla', 10],
    ['csl', 6],
    ['glycosyltransferase', 8],
    ['glycosyl transferase', 8],
    ['mannosyltransferase', 10],
    ['cell wall', 5],
    ['polysaccharide', 5],
    ['sugar', 3],
    ['transferase', 2]
  ];
  return rules.reduce((score, [term, weight]) => score + (text.includes(term) ? weight : 0), 0);
}

function buildKgmRows() {
  return state.genes
    .map(gene => ({ gene, score: scoreKgmCandidate(gene) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.gene.gene_id).localeCompare(String(b.gene.gene_id)))
    .map(({ gene, score }) => ({
      gene_id: gene.gene_id,
      score,
      location: geneLocation(gene),
      annotation: displayValue(gene.functional_annotation, ''),
      tf: displayValue(gene.plantTFDB_family, ''),
      ko: displayValue(gene.ko_id, ''),
      ec: displayValue(gene.ec_number, ''),
      pfam: listFrom(gene.pfam_domains).slice(0, 6).join('; '),
      go: listFrom(gene.go_terms).slice(0, 6).join('; ')
    }));
}

function renderKgmTopicContent() {
  const host = qs('kgmContent');
  if (!host) return;
  if (!state.genesLoaded) {
    host.innerHTML = `
      <article class="card full">
        <h3>正在加载候选基因</h3>
        <p class="muted">正在读取基因注释数据...</p>
        <div class="loader-line"></div>
      </article>
    `;
    void loadGenes().then(renderKgmTopicContent).catch(error => {
      host.innerHTML = `<article class="card full"><h3>加载失败</h3><p class="download-warning">${escapeHtml(error.message || '无法加载基因数据')}</p></article>`;
    });
    return;
  }
  const rows = buildKgmRows();
  state.kgmRows = rows;
  const topRows = rows.slice(0, 80);
  const tfCount = rows.filter(row => row.tf).length;
  const pfamCount = rows.filter(row => row.pfam).length;
  const koCount = rows.filter(row => row.ko || row.ec).length;
  host.innerHTML = `
    <article class="card full">
      <h3>专题概览</h3>
      <div class="hero-stats compact-stats">
        <div><strong>${formatNumber(rows.length)}</strong><span>候选基因</span></div>
        <div><strong>${formatNumber(pfamCount)}</strong><span>含 Pfam</span></div>
        <div><strong>${formatNumber(koCount)}</strong><span>含 KO/EC</span></div>
        <div><strong>${formatNumber(tfCount)}</strong><span>转录因子</span></div>
      </div>
      <p class="help-note">候选列表由关键词和注释证据自动筛选，用于快速聚焦 KGM、细胞壁和多糖合成相关基因，不等同于实验验证。</p>
      <div class="bulk-actions">
        <button class="button ghost small" type="button" data-search="glucomannan">搜索 glucomannan</button>
        <button class="button ghost small" type="button" data-search="CSLA">搜索 CSLA</button>
        <button class="button ghost small" type="button" data-search="glycosyltransferase">搜索 glycosyltransferase</button>
        <button class="button small" type="button" id="kgmDownloadCsv">下载候选基因 CSV</button>
      </div>
    </article>
    <article class="card full">
      <h3>候选基因列表</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Gene ID</th><th>Score</th><th>Location</th><th>Annotation</th><th>TF</th><th>KO/EC</th><th>Pfam</th></tr>
          </thead>
          <tbody>
            ${topRows.map(row => `
              <tr>
                <td data-label="Gene ID"><a class="gene-link" href="#gene/${encodeURIComponent(row.gene_id)}">${escapeHtml(row.gene_id)}</a></td>
                <td data-label="Score">${formatNumber(row.score)}</td>
                <td data-label="Location"><code>${escapeHtml(row.location)}</code></td>
                <td data-label="Annotation">${escapeHtml(row.annotation || '暂无注释')}</td>
                <td data-label="TF">${escapeHtml(row.tf || '-')}</td>
                <td data-label="KO/EC">${escapeHtml([row.ko, row.ec].filter(Boolean).join(' / ') || '-')}</td>
                <td data-label="Pfam">${escapeHtml(row.pfam || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="help-note">表格默认显示前 80 个高分候选；完整候选列表可下载 CSV。</p>
    </article>
  `;
}

function downloadKgmCsv() {
  const rows = state.kgmRows.length ? state.kgmRows : buildKgmRows();
  if (!rows.length) { showToast('暂无 KGM 候选基因'); return; }
  const fields = ['gene_id', 'score', 'location', 'annotation', 'tf', 'ko', 'ec', 'pfam', 'go'];
  const esc = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    fields.join(','),
    ...rows.map(row => fields.map(field => esc(row[field])).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'konjac_kgm_candidate_genes.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('KGM 候选基因 CSV 已开始下载');
}

function renderBrowsePanels() {
  const top = state.summary.top_terms || {};
  const panels = [
    ['GO slim', top.go_slim_terms || []],
    ['GO', top.go_terms || []],
    ['KEGG / KO / EC', top.kegg_terms || []],
    ['InterPro', top.interpro_domains || []],
    ['Pfam', top.pfam_domains || []],
    ['PlantTFDB', top.plantTFDB_family || []],
    ['Homolog species', top.target_species || []],
    ['Chromosome', top.chromosome || []]
  ];
  qs('browsePanels').innerHTML = panels.map(([title, items]) => `
    <article class="browse-card">
      <h3>${escapeHtml(title)}</h3>
      <div class="browse-list">
        ${items.slice(0, 12).map(item => {
          const term = typeof item === 'string' ? item : item.term;
          const count = typeof item === 'string' ? '' : item.count;
          return `<button class="browse-term" data-search="${escapeHtml(term)}"><span>${escapeHtml(term)}</span><em>${count === '' ? '' : formatNumber(count)}</em></button>`;
        }).join('')}
      </div>
    </article>
  `).join('');
}

function renderDownloadCards() {
  const version = state.summary.version || 'v1.2.1';
  const updated = state.summary.website_last_updated || '2026-04-29';
  const files = [
    ...(state.summary.downloads || []).map(item => ({
      name: item.name,
      path: resolvePublicAssetPath(item.path),
      bytes: item.bytes,
      available: true
    })),
    {
      name: 'species_catalog.json',
      path: runtimeUrls.dataUrl('processed/species_catalog.json'),
      bytes: null,
      available: true
    }
  ];
  qs('downloadCards').innerHTML = files.map(file => {
    const meta = DOWNLOAD_META[file.name] || { label: file.name, description: '下载文件' };
    const unavailable = !file.path;
    return `
      <article class="download-card${unavailable ? ' unavailable' : ''}">
        <h3>${escapeHtml(meta.label)}</h3>
        <p>${escapeHtml(meta.description)}</p>
        <dl>
          <dt>文件名</dt><dd><code>${escapeHtml(file.name)}</code></dd>
          <dt>文件类型</dt><dd>${escapeHtml(fileTypeLabel(file.name))}</dd>
          <dt>说明</dt><dd>${escapeHtml(meta.description)}</dd>
          <dt>版本</dt><dd>${escapeHtml(version)}</dd>
          <dt>更新时间</dt><dd>${escapeHtml(updated)}</dd>
          <dt>大小</dt><dd>${file.bytes ? formatBytes(file.bytes) : '暂未统计'}</dd>
        </dl>
        ${unavailable ? '<p class="download-warning">下载链接不可用</p>' : ''}
        <a class="button ghost small" href="${escapeHtml(file.path || '#')}" ${unavailable ? 'aria-disabled="true" tabindex="-1"' : ''} download>${unavailable ? '不可用' : '下载文件'}</a>
      </article>
    `;
  }).join('');
}

function renderSpeciesCatalogRows() {
  return SPECIES_OPTIONS.map(species => `
    <tr>
      <td data-label="物种">${escapeHtml(species.label)}</td>
      <td data-label="搜索前缀"><code>${escapeHtml(species.codes.map(code => code.toUpperCase()).join(' / '))}</code></td>
      <td data-label="状态"><span class="status-pill">${escapeHtml(species.status)}</span></td>
      <td data-label="数据来源">${escapeHtml(species.source)}</td>
    </tr>
  `).join('');
}

function renderSourceContent() {
  const host = qs('sourcesContent');
  if (!host) return;
  host.innerHTML = `
    <article class="card">
      <h3>当前数据集</h3>
      <dl>
        <dt>物种</dt><dd>Amorphophallus konjac</dd>
        <dt>基因组</dt><dd>PlantGARDEN t78372.G001 / NCBI assembly GCA_022559845.1</dd>
        <dt>基因模型</dt><dd>PlantGARDEN clean.gff</dd>
        <dt>CDS / 蛋白</dt><dd>clean.cds / clean.pep</dd>
        <dt>功能注释</dt><dd>ZEN annotation v2.0, GO, GO slim, KEGG/KO/EC, InterPro, Pfam, PlantTFDB</dd>
        <dt>基因组浏览器</dt><dd>JBrowse static app with remapped PlantGARDEN clean GFF</dd>
        <dt>网站版本</dt><dd>${escapeHtml(state.summary.version || 'v1.2.1')} static build</dd>
        <dt>更新时间</dt><dd>${escapeHtml(state.summary.website_last_updated || '2026-04-29')}</dd>
      </dl>
    </article>
    <article class="card">
      <h3>引用与许可</h3>
      <dl>
        <dt>PlantGARDEN</dt><dd>Amorphophallus konjac genome and gene annotation resources</dd>
        <dt>NCBI assembly</dt><dd>GCA_022559845.1</dd>
        <dt>ZEN annotation</dt><dd>ZEN v2.0 annotation package</dd>
        <dt>外部注释库</dt><dd>GO, GO slim, KEGG/KO/EC, InterPro, Pfam, PlantTFDB</dd>
        <dt>引用建议</dt><dd>Konjac Gene Explorer, data release ${escapeHtml(state.summary.website_last_updated || '2026-04-29')}</dd>
        <dt>许可说明</dt><dd>请同时遵循原始数据源和外部注释数据库的使用条款。</dd>
      </dl>
    </article>
    <article class="card full">
      <h3>物种数据接入状态</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>物种</th><th>搜索前缀</th><th>状态</th><th>数据来源</th></tr>
          </thead>
          <tbody>${renderSpeciesCatalogRows()}</tbody>
        </table>
      </div>
      <p class="help-note">不选择物种时搜索当前已接入的全部基因记录；使用 <code>AK:GeneID</code> 或 <code>AKGeneID</code> 可指定花魔芋。其他物种需要导入完整基因模型、CDS、蛋白和注释后才会出现基因详情结果。</p>
    </article>
    <article class="card full">
      <h3>使用说明</h3>
      <ul class="check-list">
        <li>候选基因来自功能注释和相似性证据，不等同于实验验证。</li>
        <li>基因组浏览器轨道使用已重映射的 PlantGARDEN clean GFF，可从详情页按坐标跳转。</li>
        <li>使用本站结果发表或展示时，建议同时引用原始基因组、注释和外部数据库来源。</li>
      </ul>
    </article>
  `;
}

function renderHelpContent() {
  const host = qs('helpContent');
  if (!host) return;
  host.innerHTML = `
    <article class="card">
      <h3>搜索示例</h3>
      <ul>
        <li><code>evm.model.HIC_ASM_10.860_Akon</code></li>
        <li><code>AK:evm.model.HIC_ASM_10.860_Akon</code> 或 <code>AKevm.model.HIC_ASM_10.860_Akon</code> 指定花魔芋</li>
        <li><code>PF00069</code> / <code>IPR000719</code></li>
        <li><code>GO:0003677</code> / <code>DNA binding</code></li>
        <li><code>KGM</code> / <code>CSLA</code> / <code>WRKY</code></li>
      </ul>
    </article>
    <article class="card">
      <h3>使用教程</h3>
      <ol class="help-steps">
        <li>首页输入精确 Gene ID 会直接进入详情页。</li>
        <li>输入关键词、GO、KEGG、Pfam 或转录因子家族会进入搜索结果页。</li>
        <li>搜索栏旁的物种选择可限制搜索范围；不选择时搜索当前已接入的全部基因记录。</li>
        <li>在结果中点击 Gene ID 或“查看详情”进入基因详情。</li>
        <li>在详情页查看功能注释、序列、JBrowse 坐标和下载链接。</li>
      </ol>
      <p class="help-note">基因组浏览器用于查看基因组坐标、基因结构和 GFF 注释轨道。</p>
    </article>
    <article class="card">
      <h3>基因组浏览器</h3>
      <p>基因详情页提供“在基因组浏览器中查看”入口，可跳转到对应坐标并显示基因结构。</p>
      <p class="help-note">如果浏览器轨道加载较慢，请等待参考序列和 GFF 轨道完成加载后再缩放或移动视图。</p>
    </article>
    <article class="card">
      <h3>BLAST</h3>
      <p>BLAST 支持核酸和蛋白序列查询，可选择 CDS、蛋白或基因组数据库作为搜索集。</p>
      <a class="button ghost small" href="#blast">打开 BLAST</a>
    </article>
    <article class="card full">
      <h3>数据解释</h3>
      <ul class="check-list">
        <li>功能注释来自自动注释和外部数据库映射，建议结合实验验证解读。</li>
        <li>BLAST 任务提交后可能需要等待计算节点处理，刷新任务可查看最新状态。</li>
        <li>表达图谱和多物种比较将在获得完整表达矩阵或其他物种基因集后加入。</li>
      </ul>
    </article>
  `;
}

function renderBulkContent() {
  const host = qs('bulkContent');
  if (!host) return;
  host.innerHTML = `
    <article class="card full">
      <h3>输入 Gene ID</h3>
      <textarea id="bulkGeneIds" class="bulk-textarea" rows="8" spellcheck="false" placeholder="每行一个 Gene ID，例如&#10;evm.model.CTG_28.2_Akon&#10;evm.model.HIC_ASM_6.713_Akon"></textarea>
      <div class="bulk-actions">
        <button class="button" type="button" id="bulkLookup">批量查询</button>
        <button class="button ghost" type="button" id="bulkExample">填入示例</button>
        <button class="button ghost" type="button" id="bulkDownloadCsv" disabled>下载注释 CSV</button>
        <button class="button ghost" type="button" id="bulkDownloadCds" disabled>下载 CDS FASTA</button>
        <button class="button ghost" type="button" id="bulkDownloadProtein" disabled>下载 protein FASTA</button>
      </div>
      <p id="bulkStatus" class="help-note">支持换行、空格、逗号或分号分隔；最多建议一次查询 500 个 Gene ID。</p>
    </article>
    <article class="card full" id="bulkResultsCard" hidden>
      <h3>批量结果</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Gene ID</th><th>Location</th><th>Annotation</th><th>TF</th><th>KO</th><th>EC</th><th>GO</th><th>Pfam</th></tr>
          </thead>
          <tbody id="bulkResultsBody"></tbody>
        </table>
      </div>
    </article>
  `;
}

function parseBulkGeneIds(value = '') {
  const seen = new Set();
  return String(value || '')
    .split(/[\s,;，；]+/)
    .map(id => id.trim())
    .filter(Boolean)
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function bulkRowFromGene(id) {
  const gene = state.geneById.get(id);
  if (!gene) return { id, found: false };
  return {
    id,
    found: true,
    gene_id: gene.gene_id,
    location: geneLocation(gene),
    annotation: displayValue(gene.functional_annotation, ''),
    tf: displayValue(gene.plantTFDB_family, ''),
    ko: displayValue(gene.ko_id, ''),
    ec: displayValue(gene.ec_number, ''),
    go: listFrom(gene.go_terms).join('; '),
    pfam: listFrom(gene.pfam_domains).join('; '),
    interpro: listFrom(gene.interpro_domains).join('; ')
  };
}

function setBulkButtonsEnabled(enabled) {
  ['bulkDownloadCsv', 'bulkDownloadCds', 'bulkDownloadProtein'].forEach((id) => {
    const button = qs(id);
    if (button) button.disabled = !enabled;
  });
}

function renderBulkRows(rows) {
  const body = qs('bulkResultsBody');
  const card = qs('bulkResultsCard');
  if (!body || !card) return;
  body.innerHTML = rows.map(row => `
    <tr class="${row.found ? '' : 'is-missing'}">
      <td data-label="Gene ID">${row.found ? `<a class="gene-link" href="#gene/${encodeURIComponent(row.gene_id)}">${escapeHtml(row.gene_id)}</a>` : `<code>${escapeHtml(row.id)}</code>`}</td>
      <td data-label="Location">${row.found ? `<code>${escapeHtml(row.location)}</code>` : '<span class="muted">未找到</span>'}</td>
      <td data-label="Annotation">${row.found ? escapeHtml(row.annotation || '暂无注释') : '<span class="muted">-</span>'}</td>
      <td data-label="TF">${row.found ? escapeHtml(row.tf || '-') : '-'}</td>
      <td data-label="KO">${row.found ? escapeHtml(row.ko || '-') : '-'}</td>
      <td data-label="EC">${row.found ? escapeHtml(row.ec || '-') : '-'}</td>
      <td data-label="GO">${row.found ? escapeHtml(row.go || '-') : '-'}</td>
      <td data-label="Pfam">${row.found ? escapeHtml(row.pfam || '-') : '-'}</td>
    </tr>
  `).join('');
  card.hidden = false;
}

async function runBulkLookup() {
  await loadGenes();
  const ids = parseBulkGeneIds(qs('bulkGeneIds')?.value || '').slice(0, 500);
  const status = qs('bulkStatus');
  if (!ids.length) {
    state.bulkRows = [];
    setBulkButtonsEnabled(false);
    if (status) status.textContent = '请先输入 Gene ID。';
    return;
  }
  const rows = ids.map(bulkRowFromGene);
  state.bulkRows = rows;
  renderBulkRows(rows);
  const found = rows.filter(row => row.found).length;
  setBulkButtonsEnabled(found > 0);
  if (status) status.textContent = `已查询 ${formatNumber(rows.length)} 个 Gene ID；找到 ${formatNumber(found)} 个，未找到 ${formatNumber(rows.length - found)} 个。`;
}

function downloadBulkCsv() {
  const rows = state.bulkRows.filter(row => row.found);
  if (!rows.length) { showToast('暂无可导出的批量结果'); return; }
  const fields = ['gene_id', 'location', 'annotation', 'tf', 'ko', 'ec', 'go', 'pfam', 'interpro'];
  const esc = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    fields.join(','),
    ...rows.map(row => fields.map(field => esc(row[field])).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'konjac_bulk_annotations.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('批量注释 CSV 已开始下载');
}

async function downloadBulkFasta(type) {
  const rows = state.bulkRows.filter(row => row.found);
  if (!rows.length) { showToast('暂无可下载的序列'); return; }
  const records = [];
  const status = qs('bulkStatus');
  if (status) status.textContent = `正在准备 ${sequenceLabel(type)} FASTA...`;
  for (const row of rows.slice(0, 500)) {
    try {
      const seqInfo = await getGeneSequence(row.gene_id, type);
      const header = seqInfo.header.startsWith('>') ? seqInfo.header : `>${seqInfo.header}`;
      records.push(`${header}\n${wrapSequence(seqInfo.seq)}`);
    } catch {
      // Missing sequence for a found gene is skipped in the batch FASTA export.
    }
  }
  if (!records.length) {
    if (status) status.textContent = `没有可下载的 ${sequenceLabel(type)} 序列。`;
    showToast('没有可下载的序列');
    return;
  }
  const blob = new Blob([`${records.join('\n')}\n`], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `konjac_bulk_${type === 'protein' ? 'protein' : 'cds'}.fa`;
  link.click();
  URL.revokeObjectURL(url);
  if (status) status.textContent = `已准备 ${formatNumber(records.length)} 条 ${sequenceLabel(type)} 序列。`;
  showToast('FASTA 已开始下载');
}

function getFunctionScorer() {
  return window.KonjacFunctionScorer || null;
}

function getGeneDisplay() {
  return window.KonjacGeneDisplay || {
    getGeneSymbolLabel: (gene) => normalize(gene?.gene_symbol),
    getGeneDisplayName: (gene) => displayValue(gene?.functional_annotation, '暂无名称注释')
  };
}

function renderScoreContent() {
  const host = qs('scoreContent');
  if (!host) return;
  const themes = getFunctionScorer()?.THEMES || [];
  host.innerHTML = `
    <article class="card full score-card">
      <div class="score-form">
        <label class="score-input-label">
          <span>Gene ID 或功能关键词</span>
          <textarea id="scoreQuery" class="score-textarea" rows="5" spellcheck="false" placeholder="例如：evm.model.HIC_ASM_10.860_Akon&#10;或：glucomannan biosynthesis、PF00069 kinase、WRKY transcription factor"></textarea>
        </label>
        <div class="score-controls">
          <label>分析模式
            <select id="scoreModeSelect">
              <option value="auto">自动判断</option>
              <option value="gene">输入是 Gene ID</option>
              <option value="function">输入是功能关键词</option>
            </select>
          </label>
          <label>候选数量
            <select id="scoreLimit">
              <option value="20">20</option>
              <option value="50" selected>50</option>
              <option value="100">100</option>
            </select>
          </label>
          <label class="check-option"><input id="scoreRequireGo" type="checkbox"> 必须有 GO</label>
          <label class="check-option"><input id="scoreRequireDomain" type="checkbox"> 必须有 Pfam/InterPro</label>
          <label class="check-option"><input id="scoreOnlyTf" type="checkbox"> 只看转录因子</label>
        </div>
        <div class="score-actions">
          <button class="button primary" type="button" id="scoreRun">开始评分</button>
          <button class="button ghost" type="button" id="scoreExampleGene">Gene 示例</button>
          <button class="button ghost" type="button" id="scoreExampleFunction">功能示例</button>
          <button class="button secondary" type="button" id="scoreDownloadCsv" disabled>下载评分 CSV</button>
        </div>
        <p id="scoreStatus" class="help-note">评分只使用现有注释证据，不调用外部 API；100 分表示多类注释证据强支持，不表示真实概率或实验结论。</p>
      </div>
    </article>
    <article class="card full score-card">
      <h3>当前规则集</h3>
      <div class="score-theme-list">
        ${themes.map(theme => `<span class="score-theme-pill" title="${escapeHtml(theme.description)}">${escapeHtml(theme.title)}</span>`).join('')}
      </div>
    </article>
    <article class="card full score-card" id="scoreResultsCard" hidden>
      <div id="scoreResults"></div>
    </article>
  `;
}

function scoreOptionsFromControls() {
  return {
    limit: Number(qs('scoreLimit')?.value || 50),
    requireGo: Boolean(qs('scoreRequireGo')?.checked),
    requireDomain: Boolean(qs('scoreRequireDomain')?.checked),
    onlyTf: Boolean(qs('scoreOnlyTf')?.checked)
  };
}

function scoreEvidenceHtml(evidence = []) {
  if (!evidence.length) return '<span class="muted">无直接命中证据</span>';
  return `
    <ul class="score-evidence-list">
      ${evidence.slice(0, 4).map(item => `
        <li>
          <strong>${escapeHtml(item.field)}</strong>
          <span>${escapeHtml(item.terms.join(', '))}</span>
          <small>${escapeHtml(item.value)}</small>
        </li>
      `).join('')}
    </ul>
  `;
}

function renderScoreBars(rows) {
  return `
    <div class="score-bar-list">
      ${rows.map(row => `
        <div class="score-bar-row">
          <div>
            <strong>${escapeHtml(row.title)}</strong>
            <span>${escapeHtml(row.description || '')}</span>
          </div>
          <div class="score-bar" aria-label="${escapeHtml(row.title)} score ${row.score}">
            <span style="width:${Math.max(0, Math.min(100, Number(row.score) || 0))}%"></span>
          </div>
          <b>${formatNumber(row.score)}</b>
        </div>
      `).join('')}
    </div>
  `;
}

function renderGeneScoreResult(gene, themeRows) {
  const top = themeRows[0] || {};
  state.scoreMode = 'gene';
  state.scoreRows = themeRows.map(row => ({
    gene_id: gene.gene_id,
    mode: 'gene',
    theme: row.title,
    score: row.score,
    evidence: row.evidence.map(item => `${item.field}: ${item.terms.join('|')}`).join('; ')
  }));
  return `
    <div class="score-summary">
      <div>
        <span class="status-pill">Gene ID 分析</span>
        <h3><a class="gene-link" href="#gene/${encodeURIComponent(gene.gene_id)}">${escapeHtml(gene.gene_id)}</a></h3>
        <p>${escapeHtml(displayValue(gene.functional_annotation, '暂无功能注释'))}</p>
      </div>
      <div class="score-big">
        <strong>${formatNumber(top.score || 0)}</strong>
        <span>${escapeHtml(top.title || '无明显主题')}</span>
      </div>
    </div>
    <div class="compact-stats score-stats">
      <div><strong>${escapeHtml(geneLocation(gene))}</strong><span>位置</span></div>
      <div><strong>${escapeHtml(displayValue(gene.plantTFDB_family, '-'))}</strong><span>转录因子</span></div>
      <div><strong>${formatNumber(listFrom(gene.go_terms).length)}</strong><span>GO</span></div>
      <div><strong>${formatNumber(listFrom(gene.pfam_domains).length + listFrom(gene.interpro_domains).length)}</strong><span>Domain</span></div>
    </div>
    ${renderScoreBars(themeRows.slice(0, 8))}
    <h4>主要证据</h4>
    ${scoreEvidenceHtml(top.evidence || [])}
  `;
}

function renderFunctionScoreResult(rows, query) {
  state.scoreMode = 'function';
  state.scoreRows = rows.map((row, index) => ({
    rank: index + 1,
    gene_id: row.gene.gene_id,
    mode: 'function',
    query,
    score: row.score,
    theme: row.topTheme?.title || '',
    location: geneLocation(row.gene),
    annotation: displayValue(row.gene.functional_annotation, ''),
    evidence: row.evidence.map(item => `${item.field}: ${item.terms.join('|')}`).join('; ')
  }));
  if (!rows.length) {
    return '<p class="empty-help">没有找到足够证据支持的候选基因。可以放宽筛选条件，或换用 GO、Pfam、KO、功能关键词。</p>';
  }
  return `
    <div class="score-summary">
      <div>
        <span class="status-pill">功能关键词评分</span>
        <h3>${escapeHtml(query)}</h3>
        <p>按注释字段命中、证据类型和主题相关性排序。宽泛关键词会产生较多候选，请优先看证据列。</p>
      </div>
      <div class="score-big">
        <strong>${formatNumber(rows.length)}</strong>
        <span>候选基因</span>
      </div>
    </div>
    <div class="table-wrap score-table-wrap">
      <table class="score-table">
        <thead>
          <tr><th>#</th><th>Gene ID</th><th>分数</th><th>主题</th><th>位置</th><th>功能摘要</th><th>证据</th></tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td data-label="#">${index + 1}</td>
              <td data-label="Gene ID"><a class="gene-link" href="#gene/${encodeURIComponent(row.gene.gene_id)}">${escapeHtml(row.gene.gene_id)}</a></td>
              <td data-label="分数"><strong>${formatNumber(row.score)}</strong></td>
              <td data-label="主题">${escapeHtml(row.topTheme?.title || '-')}</td>
              <td data-label="位置"><code>${escapeHtml(geneLocation(row.gene))}</code></td>
              <td data-label="功能摘要">${escapeHtml(displayValue(row.gene.functional_annotation, '暂无注释'))}</td>
              <td data-label="证据">${scoreEvidenceHtml(row.evidence)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function runScoreAnalysis() {
  const scorer = getFunctionScorer();
  const status = qs('scoreStatus');
  const resultsCard = qs('scoreResultsCard');
  const results = qs('scoreResults');
  const downloadButton = qs('scoreDownloadCsv');
  const query = String(qs('scoreQuery')?.value || '').trim();
  const selectedMode = qs('scoreModeSelect')?.value || 'auto';
  if (!scorer) {
    if (status) status.textContent = '评分规则模块未加载，请刷新页面。';
    return;
  }
  if (!query) {
    if (status) status.textContent = '请输入 Gene ID 或功能关键词。';
    return;
  }
  if (status) status.textContent = '正在加载基因注释数据...';
  await loadGenes();
  const exact = state.geneById.get(query) || state.genes.find(gene => normalize(gene.gene_id).toLowerCase() === query.toLowerCase());
  const mode = selectedMode === 'auto' ? (exact ? 'gene' : 'function') : selectedMode;
  let html = '';
  if (mode === 'gene') {
    if (!exact) {
      state.scoreRows = [];
      html = '<p class="empty-help">未找到这个 Gene ID。请检查拼写，或切换为“功能关键词”模式。</p>';
      if (status) status.textContent = 'Gene ID 未命中。';
    } else {
      const themeRows = scorer.scoreGeneThemes(exact);
      html = renderGeneScoreResult(exact, themeRows);
      if (status) status.textContent = `已完成 ${exact.gene_id} 的功能主题评分。`;
    }
  } else {
    const rows = scorer.rankGenesForFunction(state.genes, query, scoreOptionsFromControls());
    html = renderFunctionScoreResult(rows, query);
    if (status) status.textContent = `已完成评分：返回 ${formatNumber(rows.length)} 个候选基因。`;
  }
  if (results) results.innerHTML = html;
  if (resultsCard) resultsCard.hidden = false;
  if (downloadButton) downloadButton.disabled = !state.scoreRows.length;
}

function downloadScoreCsv() {
  if (!state.scoreRows.length) { showToast('暂无可导出的评分结果'); return; }
  const fields = state.scoreMode === 'gene'
    ? ['gene_id', 'mode', 'theme', 'score', 'evidence']
    : ['rank', 'gene_id', 'mode', 'query', 'score', 'theme', 'location', 'annotation', 'evidence'];
  const esc = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [fields.join(','), ...state.scoreRows.map(row => fields.map(field => esc(row[field])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `konjac_function_score_${state.scoreMode || 'results'}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('评分 CSV 已开始下载');
}

function renderBlastContent() {
  const host = qs('blastContent');
  if (!host) return;
  host.innerHTML = `
    <article class="card full blast-card blast-online-card">
      <div class="blast-card-head">
        <div>
          <h3>在线 BLAST 队列</h3>
          <p class="help-note">选择程序、数据库和参数后提交；任务完成后可在下方查看命中结果。</p>
        </div>
        <span class="status-pill">登录提交</span>
      </div>
      <div id="blastAuthPanel" class="blast-auth-panel"></div>
      <div class="blast-program-tabs" aria-label="BLAST 程序快捷选择">
        <button class="blast-program-tab active" type="button" data-blast-program-tab="blastn">blastn</button>
        <button class="blast-program-tab" type="button" data-blast-program-tab="blastp">blastp</button>
        <button class="blast-program-tab" type="button" data-blast-program-tab="blastx">blastx</button>
        <button class="blast-program-tab" type="button" data-blast-program-tab="tblastn">tblastn</button>
        <button class="blast-program-tab" type="button" data-blast-program-tab="tblastx">tblastx</button>
      </div>
      <form id="blastOnlineForm" class="blast-form blast-ncbi-form">
        <section class="blast-form-section">
          <h4>选择 BLAST 程序</h4>
          <label>
            <span>程序 / 数据库</span>
            <select id="blastProgram">
              <option value="konjac_cds" data-program="blastn">花魔芋 CDS · blastn</option>
              <option value="konjac_genome" data-program="blastn">花魔芋 genome · blastn</option>
              <option value="konjac_pep" data-program="blastp">花魔芋 protein · blastp</option>
              <option value="konjac_pep" data-program="blastx">花魔芋 protein · blastx</option>
              <option value="konjac_cds" data-program="tblastn">花魔芋 CDS · tblastn</option>
              <option value="konjac_genome" data-program="tblastn">花魔芋 genome · tblastn</option>
              <option value="konjac_cds" data-program="tblastx">花魔芋 CDS · tblastx</option>
              <option value="konjac_genome" data-program="tblastx">花魔芋 genome · tblastx</option>
            </select>
          </label>
        </section>
        <section class="blast-form-section blast-query-section">
          <h4>输入查询序列</h4>
          <label class="blast-sequence-field">
            <span>FASTA 或纯序列</span>
            <textarea id="blastSequence" rows="8" spellcheck="false" placeholder=">query&#10;ATGG..."></textarea>
          </label>
          <div class="blast-examples">
            <button class="mini-link" type="button" data-blast-example="cds">填入 CDS 示例</button>
            <button class="mini-link" type="button" data-blast-example="protein">填入 protein 示例</button>
          </div>
          <div class="blast-inline-grid">
            <label class="blast-upload-field">
              <span>上传 FASTA 文件</span>
              <input id="blastFileInput" type="file" accept=".fa,.fasta,.faa,.fna,.txt">
            </label>
            <label>
              <span>任务标题</span>
              <input id="blastJobTitle" type="text" maxlength="120" placeholder="可选">
            </label>
            <label>
              <span>查询起点</span>
              <input id="blastQueryFrom" type="number" min="1" placeholder="可选">
            </label>
            <label>
              <span>查询终点</span>
              <input id="blastQueryTo" type="number" min="1" placeholder="可选">
            </label>
          </div>
        </section>
        <section class="blast-form-section">
          <h4>选择搜索数据库</h4>
          <div class="blast-inline-grid">
            <label>
              <span>数据库</span>
              <select id="blastDatabaseMirror" disabled>
                <option>花魔芋数据库随程序自动选择</option>
              </select>
            </label>
            <label>
              <span>物种</span>
              <input type="text" value="Amorphophallus konjac" disabled>
            </label>
            <label>
              <span>遗传密码表</span>
              <select id="blastGeneticCode">
                <option value="1" selected>Standard (1)</option>
                <option value="2">Vertebrate mitochondrial (2)</option>
                <option value="5">Invertebrate mitochondrial (5)</option>
                <option value="11">Bacterial / plastid (11)</option>
              </select>
            </label>
            <label>
              <span>最大命中数</span>
              <input id="blastMaxTargets" type="number" min="1" max="50" value="50">
            </label>
          </div>
        </section>
        <section class="blast-form-section">
          <h4>算法参数</h4>
          <div class="blast-inline-grid">
            <label>
              <span>E-value</span>
              <select id="blastEvalue">
                <option value="10">10</option>
                <option value="1">1</option>
                <option value="1e-3">1e-3</option>
                <option value="1e-5" selected>1e-5</option>
                <option value="1e-10">1e-10</option>
              </select>
            </label>
            <label>
              <span>任务</span>
              <select id="blastTask"></select>
            </label>
            <label>
              <span>Word size</span>
              <input id="blastWordSize" type="number" min="2" max="64" value="">
            </label>
            <label>
              <span>Matrix</span>
              <select id="blastMatrix">
                <option value="BLOSUM62" selected>BLOSUM62</option>
                <option value="BLOSUM45">BLOSUM45</option>
                <option value="BLOSUM80">BLOSUM80</option>
                <option value="PAM30">PAM30</option>
                <option value="PAM70">PAM70</option>
              </select>
            </label>
            <label>
              <span>低复杂度过滤</span>
              <select id="blastFilter">
                <option value="true" selected>开启</option>
                <option value="false">关闭</option>
              </select>
            </label>
          </div>
        </section>
        <div class="blast-actions">
          <button class="button" type="submit">BLAST</button>
          <button class="button ghost" id="blastCheckLast" type="button">刷新上次任务</button>
          <span id="blastDatabaseHint" class="status-pill">数据库：konjac_cds</span>
        </div>
      </form>
      <div id="blastOnlineStatus" class="blast-online-status"></div>
    </article>
    <article class="card blast-card">
      <h3>支持的 BLAST 程序</h3>
      <p>当前支持 <code>blastn</code>、<code>blastp</code>、<code>blastx</code>、<code>tblastn</code> 和 <code>tblastx</code>。</p>
      <p class="help-note">核酸查询可用于 blastn、blastx、tblastx；蛋白查询可用于 blastp、tblastn。</p>
    </article>
    <article class="card blast-card">
      <h3>搜索数据库</h3>
      <dl class="detail-dl">
        <dt>CDS</dt><dd>花魔芋编码序列数据库</dd>
        <dt>Protein</dt><dd>花魔芋蛋白序列数据库</dd>
        <dt>Genome</dt><dd>花魔芋基因组序列数据库</dd>
      </dl>
    </article>
    <article class="card blast-card">
      <h3>结果跳转</h3>
      <p>命中 CDS 或蛋白条目时，Subject 可进入对应基因详情页。</p>
      <p class="help-note">命中基因组区域时，结果会跳转到基因组浏览器查看附近坐标。</p>
    </article>
    <article class="card full blast-card">
      <h3>结果字段</h3>
      <p>结果表展示 Subject、Identity、Length、E-value 和 Bitscore，用于快速判断相似性和命中可靠性。</p>
    </article>
  `;
  bindBlastOnlineForm();
  bindBlastAuthPanel();
  void hydrateBlastAuthPanel();
  void restoreLastBlastJob();
}

function getBlastSelection() {
  const select = qs('blastProgram');
  const option = select?.selectedOptions?.[0];
  const database = option?.value || select?.value || 'konjac_cds';
  const program = option?.dataset?.program || (database === 'konjac_pep' ? 'blastp' : 'blastn');
  return { program, database };
}

function selectBlastProgram(programName = 'blastn') {
  const select = qs('blastProgram');
  if (!select) return;
  const options = Array.from(select.options);
  const index = options.findIndex(option => option.dataset.program === programName);
  if (index >= 0) select.selectedIndex = index;
  updateBlastDatabaseHint();
}

function updateBlastDatabaseHint() {
  const { program, database } = getBlastSelection();
  const hint = qs('blastDatabaseHint');
  if (hint) hint.textContent = `数据库：${database}`;
  $$('.blast-program-tab').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-blast-program-tab') === program);
  });
  const maxTargets = qs('blastMaxTargets');
  if (maxTargets) {
    maxTargets.max = database === 'konjac_genome' ? '25' : '50';
    if (Number(maxTargets.value || 50) > Number(maxTargets.max)) maxTargets.value = maxTargets.max;
  }
  const task = qs('blastTask');
  if (task) {
    const current = task.value;
    let taskOptions = [['megablast', 'megablast'], ['blastn', 'blastn'], ['blastn-short', 'blastn-short'], ['dc-megablast', 'discontiguous megablast']];
    if (program === 'blastp') taskOptions = [['blastp', 'blastp'], ['blastp-short', 'blastp-short']];
    if (program === 'blastx') taskOptions = [['blastx', 'blastx'], ['blastx-fast', 'blastx-fast']];
    if (program === 'tblastn') taskOptions = [['tblastn', 'tblastn'], ['tblastn-fast', 'tblastn-fast']];
    if (program === 'tblastx') taskOptions = [['tblastx', 'tblastx']];
    task.innerHTML = taskOptions.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    task.value = taskOptions.some(([value]) => value === current) ? current : taskOptions[0][0];
  }
  const matrix = qs('blastMatrix');
  if (matrix) matrix.disabled = !['blastp', 'blastx', 'tblastn', 'tblastx'].includes(program);
  const geneticCode = qs('blastGeneticCode');
  if (geneticCode) geneticCode.disabled = !['blastx', 'tblastn', 'tblastx'].includes(program);
  const wordSize = qs('blastWordSize');
  if (wordSize && !wordSize.value) {
    wordSize.placeholder = ['blastp', 'blastx', 'tblastn', 'tblastx'].includes(program)
      ? '默认 3'
      : database === 'konjac_genome' ? '默认 28' : '默认 11';
  }
  const sequence = qs('blastSequence');
  if (sequence) {
    sequence.placeholder = ['blastp', 'tblastn'].includes(program)
      ? '>protein_query\nMSE...（蛋白序列，建议 <= 20,000 aa）'
      : database === 'konjac_genome'
        ? '>nucleotide_query\nATGG...（genome blastn 建议 <= 10,000 bp）'
        : '>nucleotide_query\nATGG...（核酸序列，建议 <= 20,000 bp）';
  }
}

function readAuthSession() {
  if (state.authSession) return state.authSession;
  try {
    const raw = localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);
    state.authSession = raw ? JSON.parse(raw) : null;
    return state.authSession;
  } catch (error) {
    return null;
  }
}

function saveAuthSession(session) {
  state.authSession = session || null;
  try {
    if (session) localStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  } catch (error) {
    // The in-memory session still works for the current page.
  }
}

function normalizeAuthSession(data) {
  if (!data?.access_token) return null;
  const expiresIn = Number(data.expires_in) || 3600;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || '',
    expires_at: Date.now() + Math.max(60, expiresIn - 60) * 1000,
    user: data.user || null
  };
}

async function supabaseAuthRequest(path, body = null, accessToken = '') {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const options = { method: 'POST', headers };
  if (body !== null) options.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.message || data.error || `登录服务 HTTP ${res.status}`);
  }
  return data;
}

function friendlyAuthError(error) {
  const message = error?.message ? String(error.message) : '';
  if (/invalid login credentials/i.test(message)) return '邮箱或密码不正确。如果还没有账号，请先输入邮箱和密码后点击注册。';
  if (/signup|signups.*disabled|not allowed/i.test(message)) return '当前登录服务暂未允许新用户注册，请联系网站维护者开通账号。';
  if (/password/i.test(message) && /six|6|weak|short/i.test(message)) return '密码太短，请使用至少 6 位密码。';
  if (/email/i.test(message) && /invalid/i.test(message)) return '邮箱格式不正确。';
  return message || '登录服务请求失败，请稍后重试。';
}

async function ensureAuthSession() {
  const session = readAuthSession();
  if (!session?.access_token) return null;
  if (!session.expires_at || Date.now() < Number(session.expires_at)) return session;
  if (!session.refresh_token) {
    saveAuthSession(null);
    return null;
  }
  try {
    const data = await supabaseAuthRequest('token?grant_type=refresh_token', {
      refresh_token: session.refresh_token
    });
    const refreshed = normalizeAuthSession(data);
    saveAuthSession(refreshed);
    return refreshed;
  } catch (error) {
    saveAuthSession(null);
    return null;
  }
}

function bindBlastAuthPanel() {
  const host = qs('blastAuthPanel');
  if (!host || host.dataset.bound === 'true') return;
  host.dataset.bound = 'true';
  host.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-auth-action]') : null;
    const action = target?.dataset.authAction;
    if (!action) return;
    if (action === 'logout') {
      void logoutBlastUser();
    } else if (action === 'login' || action === 'signup') {
      void submitBlastAuth(action);
    }
  });
  host.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.matches('input')) return;
    event.preventDefault();
    void submitBlastAuth('login');
  });
}

async function hydrateBlastAuthPanel(message = '') {
  const host = qs('blastAuthPanel');
  if (!host) return;
  const session = await ensureAuthSession();
  const messageHtml = message ? `<p class="blast-auth-message">${escapeHtml(message)}</p>` : '';
  if (session?.access_token) {
    const email = session.user?.email || '已登录用户';
    host.innerHTML = `
      <div class="blast-auth-box signed-in">
        <div>
          <strong>已登录</strong>
          <span>${escapeHtml(email)}</span>
          <small>只有提交 BLAST 需要登录；任务完成后可继续刷新查看结果。</small>
        </div>
        <div class="blast-auth-actions">
          <button class="button ghost small" type="button" data-auth-action="logout">退出登录</button>
        </div>
      </div>
      ${messageHtml}
    `;
    return;
  }
  host.innerHTML = `
    <div class="blast-auth-box">
      <div>
        <strong>登录后提交 BLAST</strong>
        <small>先输入真实邮箱和至少 6 位密码。没有账号就点注册；搜索、详情、JBrowse 和下载页面保持公开。</small>
      </div>
      <label>
        <span>邮箱</span>
        <input id="blastAuthEmail" type="email" autocomplete="email" placeholder="you@example.com">
      </label>
      <label>
        <span>密码</span>
        <input id="blastAuthPassword" type="password" autocomplete="current-password" placeholder="至少 6 位">
      </label>
      <div class="blast-auth-actions">
        <button class="button small" type="button" data-auth-action="login">登录</button>
        <button class="button ghost small" type="button" data-auth-action="signup">注册</button>
      </div>
    </div>
    ${messageHtml}
  `;
}

async function submitBlastAuth(action) {
  const email = qs('blastAuthEmail')?.value?.trim();
  const password = qs('blastAuthPassword')?.value || '';
  if (!email || !password) {
    await hydrateBlastAuthPanel('请输入真实邮箱和至少 6 位密码，然后再登录或注册。');
    return;
  }
  try {
    await hydrateBlastAuthPanel(action === 'signup' ? '正在注册账号...' : '正在登录...');
    const path = action === 'signup' ? 'signup' : 'token?grant_type=password';
    const data = await supabaseAuthRequest(path, { email, password });
    const session = normalizeAuthSession(data);
    if (session) {
      saveAuthSession(session);
      await hydrateBlastAuthPanel(action === 'signup' ? '注册并登录成功。' : '登录成功，可以提交 BLAST。');
    } else {
      await hydrateBlastAuthPanel('注册成功。若 Supabase 开启了邮箱确认，请先查收邮件确认账号后再登录。');
    }
  } catch (error) {
    await hydrateBlastAuthPanel(friendlyAuthError(error));
  }
}

async function logoutBlastUser() {
  const session = readAuthSession();
  try {
    if (session?.access_token) await supabaseAuthRequest('logout', null, session.access_token);
  } catch (error) {
    // A stale token can fail logout remotely; clearing local state is still correct.
  }
  saveAuthSession(null);
  await hydrateBlastAuthPanel('已退出登录。');
}

function bindBlastOnlineForm() {
  const form = qs('blastOnlineForm');
  const program = qs('blastProgram');
  const checkLast = qs('blastCheckLast');
  if (!form) return;
  program?.addEventListener('change', updateBlastDatabaseHint);
  $$('.blast-program-tab').forEach((button) => {
    button.addEventListener('click', () => {
      selectBlastProgram(button.getAttribute('data-blast-program-tab') || 'blastn');
    });
  });
  $$('[data-blast-example]').forEach((button) => {
    button.addEventListener('click', () => fillBlastExample(button.getAttribute('data-blast-example') || 'cds'));
  });
  qs('blastFileInput')?.addEventListener('change', readBlastUploadFile);
  form.addEventListener('submit', submitOnlineBlast);
  checkLast?.addEventListener('click', () => {
    const record = readLastBlastJob();
    if (record) {
      void fetchBlastJob(record, true);
    } else {
      renderBlastOnlineStatus('<p class="help-note">当前浏览器没有保存上次 BLAST 任务。</p>');
    }
  });
  updateBlastDatabaseHint();
}

function fillBlastExample(type = 'cds') {
  const select = qs('blastProgram');
  const textarea = qs('blastSequence');
  if (!textarea) return;
  if (type === 'protein') {
    if (select) selectBlastProgram('blastp');
    textarea.value = '>example_protein\nMAVVEKNSVLKQDFLQKLEKQGIDPKQAVAA';
  } else {
    if (select && getBlastSelection().program === 'blastp') selectBlastProgram('blastn');
    textarea.value = '>example_cds\nATGGCTGTGGTGGAGAAGAATTCTGTTCTCAAGCAAGACTTCCTCCAGAAGCTTGAGAAG';
  }
  updateBlastDatabaseHint();
}

async function readBlastUploadFile(event) {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  const file = input?.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    renderBlastOnlineStatus('<p class="download-warning">上传 FASTA 文件请控制在 2 MB 以内。</p>');
    input.value = '';
    return;
  }
  const text = await file.text();
  const textarea = qs('blastSequence');
  if (textarea) textarea.value = text;
}

function readLastBlastJob() {
  try {
    const raw = localStorage.getItem(BLAST_JOB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveLastBlastJob(record) {
  try {
    localStorage.setItem(BLAST_JOB_STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    // Local storage can be disabled; the active page still shows the job.
  }
}

async function restoreLastBlastJob() {
  const record = readLastBlastJob();
  if (!record?.job_id || !record?.token) return;
  renderBlastOnlineStatus('<p class="help-note">正在恢复上次 BLAST 任务...</p>');
  await fetchBlastJob(record, false);
}

function validateBlastSequenceInput(value, program, database = '') {
  const input = String(value || '').trim();
  if (!input) throw new Error('请输入 FASTA 或纯序列。');
  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const sequenceLines = lines[0]?.startsWith('>') ? lines.slice(1) : lines;
  const sequence = sequenceLines.join('').replace(/\s+/g, '').toUpperCase();
  if (!sequence) throw new Error('查询序列为空。');
  const maxLength = database === 'konjac_genome' ? 10000 : 20000;
  if (sequence.length > maxLength) throw new Error(`查询序列不能超过 ${formatNumber(maxLength)} bp/aa。`);
  const validNucleotide = /^[ACGTRYSWKMBDHVN.-]+$/i;
  const validProtein = /^[ABCDEFGHIKLMNPQRSTVWXYZ*.-]+$/i;
  if (['blastn', 'blastx', 'tblastx'].includes(program) && !validNucleotide.test(sequence)) {
    throw new Error(`${program} 只接受核酸序列字符。`);
  }
  if (['blastp', 'tblastn'].includes(program) && !validProtein.test(sequence)) {
    throw new Error(`${program} 只接受蛋白序列字符。`);
  }
  return sequence.length;
}

function renderBlastOnlineStatus(html) {
  const host = qs('blastOnlineStatus');
  if (host) host.innerHTML = html;
}

async function submitOnlineBlast(event) {
  event.preventDefault();
  const { program, database } = getBlastSelection();
  const sequence = qs('blastSequence')?.value || '';
  const maxTargetLimit = database === 'konjac_genome' ? 25 : 50;
  const maxTargetSeqs = Math.max(1, Math.min(maxTargetLimit, Number(qs('blastMaxTargets')?.value || maxTargetLimit)));
  const evalue = qs('blastEvalue')?.value || '1e-5';
  const task = qs('blastTask')?.value || '';
  const wordSize = Number(qs('blastWordSize')?.value || 0) || null;
  const matrix = qs('blastMatrix')?.value || '';
  const filterLowComplexity = (qs('blastFilter')?.value || 'true') === 'true';
  const geneticCode = Number(qs('blastGeneticCode')?.value || 1) || 1;
  const queryFrom = Number(qs('blastQueryFrom')?.value || 0) || null;
  const queryTo = Number(qs('blastQueryTo')?.value || 0) || null;
  const jobTitle = String(qs('blastJobTitle')?.value || '').trim();
  try {
    const queryLength = validateBlastSequenceInput(sequence, program, database);
    const session = await ensureAuthSession();
    if (!session?.access_token) {
      await hydrateBlastAuthPanel('请先登录后再提交 BLAST。');
      renderBlastOnlineStatus('<p class="download-warning">BLAST 提交需要先登录；其他页面仍可直接浏览。</p>');
      return;
    }
    renderBlastOnlineStatus(`<p class="help-note">正在提交 ${escapeHtml(program)} / ${escapeHtml(database)} 查询，长度 ${formatNumber(queryLength)}...</p>`);
    const res = await fetch(BLAST_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: 'submit',
        program,
        database,
        sequence,
        max_target_seqs: maxTargetSeqs,
        evalue,
        task,
        word_size: wordSize,
        matrix,
        filter_low_complexity: filterLowComplexity,
        genetic_code: geneticCode,
        query_from: queryFrom,
        query_to: queryTo,
        job_title: jobTitle
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `提交失败：HTTP ${res.status}`);
    const record = { job_id: data.job.id, token: data.token };
    saveLastBlastJob(record);
    renderBlastJobResult({ job: data.job, hits: [] });
    startBlastPolling(record);
  } catch (error) {
    renderBlastOnlineStatus(`<p class="download-warning">${escapeHtml(error.message || 'BLAST 提交失败。')}</p>`);
  }
}

async function fetchBlastJob(record, showLoading = true) {
  if (!record?.job_id || !record?.token) return;
  try {
    if (showLoading) renderBlastOnlineStatus('<p class="help-note">正在刷新 BLAST 任务状态...</p>');
    const session = await ensureAuthSession();
    const res = await fetch(BLAST_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'status',
        job_id: record.job_id,
        token: record.token
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `查询失败：HTTP ${res.status}`);
    renderBlastJobResult(data);
    if (['queued', 'running'].includes(data.job?.status)) startBlastPolling(record);
    else stopBlastPolling();
  } catch (error) {
    stopBlastPolling();
    renderBlastOnlineStatus(`<p class="download-warning">${escapeHtml(error.message || 'BLAST 状态查询失败。')}</p>`);
  }
}

function startBlastPolling(record) {
  stopBlastPolling();
  state.blastPollTimer = window.setInterval(() => {
    void fetchBlastJob(record, false);
  }, 5000);
}

function stopBlastPolling() {
  if (state.blastPollTimer) {
    window.clearInterval(state.blastPollTimer);
    state.blastPollTimer = null;
  }
}

function renderBlastSubjectLink(hit, database = '') {
  const subjectId = hit?.sseqid;
  const id = String(subjectId || '').trim();
  if (!id) return '<span class="muted">-</span>';
  if (database === 'konjac_genome') {
    const start = Number(hit?.sstart);
    const end = Number(hit?.send);
    if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end > 0) {
      const from = Math.max(1, Math.min(start, end) - 2000);
      const to = Math.max(start, end) + 2000;
      const loc = `${id}:${from}..${to}`;
      const href = runtimeUrls.jbrowseUrl(
        `index.html?config=./config.json&loc=${encodeURIComponent(loc)}`
      );
      return `<a class="gene-link blast-subject-link" href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(id)}:${formatNumber(Math.min(start, end))}-${formatNumber(Math.max(start, end))}</a>`;
    }
  }
  return `<a class="gene-link blast-subject-link" href="#gene/${encodeURIComponent(id)}">${escapeHtml(id)}</a>`;
}

function renderBlastJobResult(data) {
  const job = data.job || {};
  const hits = Array.isArray(data.hits) ? data.hits : [];
  state.lastBlastResult = { job, hits };
  const status = job.status || 'queued';
  const created = job.created_at ? new Date(job.created_at).toLocaleString() : 'unknown';
  const finished = job.finished_at ? new Date(job.finished_at).toLocaleString() : '';
  const coord = (start, end) => {
    const a = Number(start);
    const b = Number(end);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return '-';
    return `${formatNumber(a)}-${formatNumber(b)}`;
  };
  const rows = hits.map(hit => `
    <tr>
      <td data-label="#">${escapeHtml(hit.rank)}</td>
      <td data-label="Subject">${renderBlastSubjectLink(hit, job.database)}</td>
      <td data-label="Identity">${escapeHtml(hit.pident)}</td>
      <td data-label="Length">${escapeHtml(hit.alignment_length)}</td>
      <td data-label="Query">${escapeHtml(coord(hit.qstart, hit.qend))}</td>
      <td data-label="Subject pos">${escapeHtml(coord(hit.sstart, hit.send))}</td>
      <td data-label="E-value">${escapeHtml(hit.evalue)}</td>
      <td data-label="Bitscore">${escapeHtml(hit.bitscore)}</td>
    </tr>
  `).join('');
  renderBlastOnlineStatus(`
    <div class="blast-job-box">
      <div class="blast-job-meta">
        <span class="status-pill ${status === 'succeeded' ? 'ok' : status === 'failed' ? 'warning' : ''}">状态：${escapeHtml(status)}</span>
        <span class="status-pill">任务：${escapeHtml(job.id || '')}</span>
        <span class="status-pill">${escapeHtml(job.program || '')} · ${escapeHtml(job.database || '')}</span>
        <span class="status-pill">长度：${formatNumber(job.query_length || 0)}</span>
        ${job.evalue ? `<span class="status-pill">E-value：${escapeHtml(job.evalue)}</span>` : ''}
        ${job.task ? `<span class="status-pill">Task：${escapeHtml(job.task)}</span>` : ''}
        ${job.word_size ? `<span class="status-pill">Word：${escapeHtml(job.word_size)}</span>` : ''}
        ${job.matrix ? `<span class="status-pill">Matrix：${escapeHtml(job.matrix)}</span>` : ''}
        ${job.genetic_code ? `<span class="status-pill">Genetic code：${escapeHtml(job.genetic_code)}</span>` : ''}
        ${job.query_from && job.query_to ? `<span class="status-pill">Query：${formatNumber(job.query_from)}-${formatNumber(job.query_to)}</span>` : ''}
        <span class="status-pill">Filter：${job.filter_low_complexity === false ? 'off' : 'on'}</span>
        <span class="status-pill">提交：${escapeHtml(created)}</span>
        ${finished ? `<span class="status-pill">完成：${escapeHtml(finished)}</span>` : ''}
      </div>
      ${job.job_title ? `<p class="help-note">Job title：${escapeHtml(job.job_title)}</p>` : ''}
      ${job.error_message ? `<p class="download-warning">${escapeHtml(job.error_message)}</p>` : ''}
      ${hits.length ? `
        <div class="blast-result-actions">
          <button class="button ghost small" type="button" data-action="download-blast-tsv">下载结果 TSV</button>
        </div>
        <div class="table-wrap blast-result-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Subject</th><th>Identity</th><th>Length</th><th>Query</th><th>Subject pos</th><th>E-value</th><th>Bitscore</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      ` : `<p class="help-note">${status === 'queued' || status === 'running' ? '等待后台计算服务写入结果。' : '暂无命中结果。'}</p>`}
    </div>
  `);
}

function downloadBlastTsv() {
  const result = state.lastBlastResult;
  const hits = Array.isArray(result?.hits) ? result.hits : [];
  const job = result?.job || {};
  if (!hits.length) {
    showToast('暂无可下载的 BLAST 结果');
    return;
  }
  const fields = ['rank', 'qseqid', 'sseqid', 'pident', 'alignment_length', 'mismatch', 'gapopen', 'qstart', 'qend', 'sstart', 'send', 'evalue', 'bitscore'];
  const lines = [
    fields.join('\t'),
    ...hits.map(hit => fields.map(field => String(hit?.[field] ?? '')).join('\t'))
  ];
  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const jobId = String(job.id || 'blast').slice(0, 12);
  link.href = url;
  link.download = `konjac_${job.program || 'blast'}_${jobId}.tsv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('BLAST TSV 已开始下载');
}

function parseFastaToMap(text) {
  const map = new Map();
  let currentId = '';
  let currentHeader = '';
  let parts = [];
  const save = () => {
    if (!currentId) return;
    map.set(currentId, {
      id: currentId,
      header: currentHeader || currentId,
      seq: parts.join('').replace(/\s+/g, '')
    });
  };
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith('>')) {
      save();
      currentHeader = line.slice(1).trim();
      currentId = currentHeader.split(/\s+/)[0];
      parts = [];
    } else {
      parts.push(line.trim());
    }
  }
  save();
  return map;
}

function normalizeSequencePath(file) {
  const value = String(file || '').replace(/\\/g, '/').replace(/^\.?\//, '');
  if (!value) return '';
  if (value.startsWith('data/processed/')) return value;
  if (value.startsWith('sequences/')) return `data/processed/${value}`;
  return `data/processed/sequences/${value}`;
}

function normalizeOverlayPath(file) {
  const value = String(file || '').replace(/\\/g, '/').replace(/^\.?\//, '');
  if (!value) return '';
  if (value.startsWith('data/processed/')) return value;
  if (value.startsWith('chunks/')) return `data/processed/annotations/overlay/${value}`;
  return `data/processed/annotations/overlay/${value}`;
}

function normalizeJbrowseSeqidMapPath(file) {
  const value = String(file || '').replace(/\\/g, '/').replace(/^\.?\//, '');
  if (!value) return '';
  if (value.startsWith('data/processed/')) return value;
  return `data/processed/jbrowse/${value}`;
}

function stripDataPrefix(file) {
  return String(file || '')
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^data\//, '');
}

function resolvePublicAssetPath(file) {
  const value = String(file || '').replace(/\\/g, '/').replace(/^\.?\//, '');
  if (!value) return '';
  if (value.startsWith('downloads/')) {
    return runtimeUrls.downloadUrl(value.slice('downloads/'.length));
  }
  if (value.startsWith('data/')) {
    return runtimeUrls.dataUrl(value.slice('data/'.length));
  }
  return runtimeUrls.downloadUrl(value);
}

async function loadSequenceIndex() {
  if (state.sequenceIndex) return state.sequenceIndex;
  if (state.sequenceIndexPromise) return state.sequenceIndexPromise;
  state.sequenceIndexPromise = (async () => {
    const res = await fetch(SEQUENCE_INDEX_URL);
    if (!res.ok) {
      const error = new Error('序列索引未找到');
      error.code = 'SEQUENCE_INDEX_NOT_FOUND';
      throw error;
    }
    const index = await res.json();
    state.sequenceIndex = index;
    return index;
  })().finally(() => {
    state.sequenceIndexPromise = null;
  });
  return state.sequenceIndexPromise;
}

async function loadSequenceChunk(filePath, label) {
  const normalized = normalizeSequencePath(filePath);
  if (!normalized) throw new Error('序列分片文件未找到');
  if (state.sequenceChunkCache.has(normalized)) return state.sequenceChunkCache.get(normalized);
  if (state.sequenceChunkPromise.has(normalized)) return state.sequenceChunkPromise.get(normalized);

  const promise = (async () => {
    const res = await fetch(runtimeUrls.dataUrl(stripDataPrefix(normalized)));
    if (!res.ok) {
      const error = new Error('序列分片文件未找到');
      error.code = 'SEQUENCE_CHUNK_NOT_FOUND';
      error.file = normalized;
      throw error;
    }
    const text = await res.text();
    const map = parseFastaToMap(text);
    state.sequenceChunkCache.set(normalized, map);
    return map;
  })().finally(() => {
    state.sequenceChunkPromise.delete(normalized);
  });

  state.sequenceChunkPromise.set(normalized, promise);
  return promise;
}

async function loadOverlayIndex() {
  if (state.overlayIndex) return state.overlayIndex;
  if (state.overlayIndexPromise) return state.overlayIndexPromise;
  state.overlayIndexPromise = (async () => {
    const res = await fetch(OVERLAY_INDEX_URL);
    if (!res.ok) {
      const error = new Error('增强注释暂不可用');
      error.code = 'OVERLAY_INDEX_NOT_FOUND';
      throw error;
    }
    const index = await res.json();
    state.overlayIndex = index;
    return index;
  })().finally(() => {
    state.overlayIndexPromise = null;
  });
  return state.overlayIndexPromise;
}

async function loadOverlayChunk(filePath) {
  const normalized = normalizeOverlayPath(filePath);
  if (!normalized) throw new Error('增强注释暂不可用');
  if (state.overlayChunkCache.has(normalized)) return state.overlayChunkCache.get(normalized);
  if (state.overlayChunkPromise.has(normalized)) return state.overlayChunkPromise.get(normalized);

  const promise = (async () => {
    const res = await fetch(runtimeUrls.dataUrl(stripDataPrefix(normalized)));
    if (!res.ok) {
      const error = new Error('增强注释暂不可用');
      error.code = 'OVERLAY_CHUNK_NOT_FOUND';
      error.file = normalized;
      throw error;
    }
    const json = await res.json();
    state.overlayChunkCache.set(normalized, json);
    return json;
  })().finally(() => {
    state.overlayChunkPromise.delete(normalized);
  });

  state.overlayChunkPromise.set(normalized, promise);
  return promise;
}

async function loadJbrowseSeqidMap() {
  if (state.jbrowseSeqidMap) return state.jbrowseSeqidMap;
  if (state.jbrowseSeqidMapPromise) return state.jbrowseSeqidMapPromise;
  state.jbrowseSeqidMapPromise = (async () => {
    const res = await fetch(JBROWSE_SEQID_MAP_URL);
    if (!res.ok) {
      const error = new Error('暂无浏览器坐标');
      error.code = 'JBROWSE_SEQID_MAP_NOT_FOUND';
      throw error;
    }
    const map = await res.json();
    state.jbrowseSeqidMap = map;
    return map;
  })().finally(() => {
    state.jbrowseSeqidMapPromise = null;
  });
  return state.jbrowseSeqidMapPromise;
}

function resolveGenomeBrowserLocation(gene, map) {
  const locus = String(gene?.genome_browser_locus || '').trim();
  const locusSeqid = locus.includes(':') ? locus.split(':', 1)[0] : '';
  const originalSeqid = String(gene?.chromosome || locusSeqid || '').trim();
  const start = Number.isFinite(Number(gene?.start)) ? Number(gene.start) : Number(locus.match(/:(\d+)/)?.[1]);
  const end = Number.isFinite(Number(gene?.end)) ? Number(gene.end) : Number(locus.match(/-(\d+)/)?.[1]);
  if (!originalSeqid || !Number.isFinite(start) || !Number.isFinite(end)) return null;

  const entry = map?.entries?.[originalSeqid];
  const targetSeqid = entry?.target_seqid;
  if (!targetSeqid) return null;

  const from = Math.max(1, Math.min(start, end) - 2000);
  const to = Math.max(from, Math.max(start, end) + 2000);
  return {
    originalSeqid,
    targetSeqid,
    from,
    to,
    href: runtimeUrls.jbrowseUrl(
      `index.html?config=./config.json&assembly=${encodeURIComponent('GCA_022559845.1_ASM2255984v1')}&loc=${encodeURIComponent(`${targetSeqid}:${from}..${to}`)}&tracks=Amorphophallus_konjac.clean.gff3&tracklist=false`
    )
  };
}

function renderGenomeBrowserStatus(message) {
  return `<span class="muted">${escapeHtml(message)}</span>`;
}

async function hydrateGenomeBrowserButton(gene) {
  const host = qs('geneBrowserLink');
  if (!host) return;
  try {
    const map = await loadJbrowseSeqidMap();
    const location = resolveGenomeBrowserLocation(gene, map);
    if (!location) {
      host.innerHTML = renderGenomeBrowserStatus('暂无浏览器坐标');
      return;
    }
    host.innerHTML = `
      <a class="button ghost small" href="${escapeHtml(location.href)}">
        在基因组浏览器中查看
      </a>
    `;
  } catch {
    host.innerHTML = renderGenomeBrowserStatus('暂无浏览器坐标');
  }
}

async function getOverlayGene(geneId, index = null) {
  const overlayIndex = index || await loadOverlayIndex();
  const entry = overlayIndex?.genes?.[geneId];
  if (!entry) return null;
  const chunk = await loadOverlayChunk(entry.file);
  const gene = Array.isArray(chunk?.genes) ? chunk.genes.find(item => item?.gene_id === geneId) : null;
  if (!gene) return null;
  return { entry, gene };
}

async function getGeneSequence(geneId, type, index = null) {
  const seqIndex = index || await loadSequenceIndex();
  const gene = seqIndex?.genes?.[geneId];
  const entry = gene?.[type];
  if (!entry) {
    const error = new Error('暂无该序列');
    error.code = 'SEQUENCE_NOT_AVAILABLE';
    throw error;
  }
  const chunkMap = await loadSequenceChunk(entry.file, sequenceLabel(type));
  const record = chunkMap.get(geneId);
  if (!record) {
    const error = new Error('暂无该序列');
    error.code = 'SEQUENCE_NOT_FOUND';
    throw error;
  }
  return {
    geneId,
    type,
    header: entry.header || record.header || geneId,
    seq: record.seq,
    chunk: entry.chunk,
    file: normalizeSequencePath(entry.file)
  };
}

function wrapSequence(seq, width = 80) {
  const chunks = [];
  for (let i = 0; i < seq.length; i += width) chunks.push(seq.slice(i, i + width));
  return chunks.join('\n');
}

function sequenceLabel(type) {
  return type === 'protein' ? 'Protein' : 'CDS';
}

async function renderSequenceViewer(geneId, type) {
  const viewer = qs('sequenceViewer');
  if (!viewer) return;
  const label = sequenceLabel(type);
  state.currentSequence = null;
  viewer.innerHTML = `<p class="muted">正在加载序列索引...</p><div class="loader-line"></div>`;
  try {
    const index = await loadSequenceIndex();
    viewer.innerHTML = `<p class="muted">正在加载 ${label} 序列...</p><div class="loader-line"></div>`;
    const seqInfo = await getGeneSequence(geneId, type, index);
    if (!seqInfo || !seqInfo.seq) {
      viewer.innerHTML = `<p class="muted">暂无该序列：<code>${escapeHtml(geneId)}</code>。</p><p class="muted">可以尝试另一种序列类型。</p>`;
      return;
    }
    state.currentSequence = {
      geneId,
      type,
      header: seqInfo.header,
      seq: seqInfo.seq,
      chunk: seqInfo.chunk,
      file: seqInfo.file
    };
    const header = seqInfo.header.startsWith('>') ? seqInfo.header : `>${seqInfo.header}`;
    const sequenceText = `${header}\n${wrapSequence(seqInfo.seq)}`;
    viewer.innerHTML = `
      <div class="sequence-toolbar">
        <strong>${label} 序列</strong>
        <span class="muted">长度：${formatNumber(seqInfo.seq.length)} ${type === 'protein' ? 'aa' : 'bp'}</span>
        <div class="sequence-actions">
          <button class="mini-link" data-action="copy-sequence">复制序列</button>
          <button class="mini-link" data-action="download-sequence">下载当前序列 FASTA</button>
          <button class="mini-link" data-action="close-sequence">关闭序列显示</button>
        </div>
      </div>
      <pre class="sequence-box" id="sequenceText">${escapeHtml(sequenceText)}</pre>
    `;
  } catch (error) {
    state.currentSequence = null;
    const message = error?.code === 'SEQUENCE_INDEX_NOT_FOUND'
      ? '序列索引未找到'
      : error?.code === 'SEQUENCE_CHUNK_NOT_FOUND'
        ? '序列分片文件未找到'
        : error?.code === 'SEQUENCE_NOT_AVAILABLE' || error?.code === 'SEQUENCE_NOT_FOUND'
          ? '暂无该序列'
          : `序列加载失败：${error?.message || '未知错误'}`;
    viewer.innerHTML = `<p class="muted">${escapeHtml(message)}</p>`;
  }
}

function clearSequenceViewer() {
  const viewer = qs('sequenceViewer');
  state.currentSequence = null;
  if (viewer) viewer.innerHTML = '<p class="muted">尚未选择序列</p>';
}

function downloadCurrentSequence() {
  if (!state.currentSequence) {
    showToast('请先查看序列');
    return;
  }
  const { geneId, type, header, seq } = state.currentSequence;
  const text = `${header.startsWith('>') ? header : `>${header}`}\n${wrapSequence(seq)}\n`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${geneId}.${type === 'protein' ? 'faa' : 'fna'}`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('FASTA 已开始下载');
}

function findRelatedGenes(gene) {
  const results = [];
  const pfams = new Set(listFrom(gene.pfam_domains).slice(0, 4));
  const interpros = new Set(listFrom(gene.interpro_domains).slice(0, 4));
  const tf = gene.plantTFDB_family;
  const ko = gene.ko_id;
  const ec = gene.ec_number;
  for (const other of state.genes) {
    if (other.gene_id === gene.gene_id) continue;
    let score = 0;
    if (tf && other.plantTFDB_family === tf) score += 8;
    if (ko && other.ko_id === ko) score += 8;
    if (ec && other.ec_number === ec) score += 5;
    for (const p of listFrom(other.pfam_domains)) if (pfams.has(p)) score += 3;
    for (const p of listFrom(other.interpro_domains)) if (interpros.has(p)) score += 2;
    if (score > 0) results.push({ gene: other, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.gene);
}

function renderRelatedGenes(gene) {
  const related = findRelatedGenes(gene);
  if (!related.length) return '<span class="muted">暂无相关基因</span>';
  return `<div class="related-list">${related.map(g => `
    <button class="related-item" data-view="${escapeHtml(g.gene_id)}">
      <strong>${escapeHtml(g.gene_id)}</strong>
      <span>${escapeHtml(displayValue(g.functional_annotation)).slice(0, 120)}</span>
    </button>
  `).join('')}</div>`;
}

function renderGeneDetail(gene, overlayState = 'loading') {
  qs('detailTitle').textContent = `${gene.gene_id}${gene.gene_symbol ? ' / ' + gene.gene_symbol : ''}`;
  const location = geneLocation(gene);
  const overlayMessage = overlayState === 'ready'
    ? '正在加载增强注释...'
    : overlayState === 'unavailable'
      ? '增强注释暂不可用'
      : '正在加载增强注释...';
  qs('detailContent').innerHTML = `
    <div class="detail-grid">
      ${renderDetailCard('基本信息', [
        ['Gene ID', `<code>${escapeHtml(gene.gene_id)}</code> <button class="mini-link" data-action="copy-gene-id" data-gene-id="${escapeHtml(gene.gene_id)}" data-copy="${escapeHtml(gene.gene_id)}" data-copy-message="已复制 Gene ID">复制 Gene ID</button>`],
        ['基因符号', renderFallback(gene.gene_symbol)],
        ['别名', renderTagList(gene.aliases, 12)],
        ['物种', renderFallback(gene.species)],
        ['转录本 / 蛋白', `${renderFallback(gene.transcript_id)} / ${renderFallback(gene.protein_id)}`]
      ])}
      ${renderDetailCard('基因位置', [
        ['染色体 / contig', renderFallback(gene.chromosome)],
        ['Coordinates', `<code>${escapeHtml(location)}</code> <button class="mini-link" data-copy="${escapeHtml(location)}" data-copy-message="已复制坐标">复制坐标</button>`],
        ['链向', renderFallback(gene.strand)],
        ['CDS 长度', `${formatNumber(gene.cds_length)} bp`],
        ['蛋白长度', `${formatNumber(gene.protein_length)} aa`],
        ['CDS / 外显子数', `${formatNumber(gene.cds_count)} / ${formatNumber(gene.exon_count)}`],
        ['浏览器定位', renderFallback(gene.genome_browser_locus)],
        ['基因组浏览器', '<div id="geneBrowserLink" class="browser-link-slot"><span class="muted">正在加载浏览器坐标...</span></div>']
      ])}
      ${renderDetailCard('功能摘要', [
        ['注释', renderFallback(gene.functional_annotation)],
        ['SwissProt / RefSeq', renderFallback(gene.swissprot)],
        ['EggNOG / Orthogroup', `${renderFallback(gene.eggnog)} / ${renderFallback(gene.orthogroup)}`],
        ['来源', renderFallback(gene.source)],
        ['数据状态', renderFallback(gene.data_status)],
        ['备注', renderFallback(gene.notes)],
        ['更新时间', renderFallback(gene.last_updated)]
      ])}
      ${renderDetailCard('GO 注释', [
        ['GO terms', renderTagList(gene.go_terms, 40)],
        ['GO slim', renderTagList(gene.go_slim_terms, 40)]
      ])}
      ${renderDetailCard('KEGG / KO / EC', [
        ['Pathways', renderTagList([...(gene.kegg_terms || []), gene.ko_id, gene.ec_number].filter(Boolean), 30)]
      ])}
      ${renderDetailCard('InterPro / Pfam', [
        ['InterPro', renderTagList(gene.interpro_domains, 40)],
        ['Pfam', renderTagList(gene.pfam_domains, 40)]
      ])}
      ${renderDetailCard('转录因子', [
        ['PlantTFDB 家族', renderFallback(gene.plantTFDB_family)],
        ['描述', renderFallback(gene.plantTFDB_description)]
      ])}
      <article class="card full" id="overlayAnnotationCard">
        <h3>增强注释</h3>
        <p class="muted" id="overlayAnnotationStatus">${escapeHtml(overlayMessage)}</p>
        <div id="overlayAnnotationArea" hidden></div>
      </article>
      ${renderDetailCard('同源命中', [
        ['目标物种', renderFallback(gene.target_species)],
        ['目标家族', renderFallback(gene.target_family)],
        ['Identity', gene.sequence_identity ? `${escapeHtml(displayValue(gene.sequence_identity))}%` : '<span class="muted">暂无注释</span>'],
        ['E-value', renderFallback(gene.e_value)],
        ['Bitscore', renderFallback(gene.bitscore)],
        ['Related genes', renderRelatedGenes(gene)]
      ], true)}
      ${renderDetailCard('序列与下载', [
        ['序列查看', `
          <div class="sequence-actions">
            <button class="button ghost small" data-action="show-sequence" data-sequence-type="cds" data-gene-id="${escapeHtml(gene.gene_id)}">查看 CDS</button>
            <button class="button ghost small" data-action="show-sequence" data-sequence-type="protein" data-gene-id="${escapeHtml(gene.gene_id)}">查看 protein</button>
          </div>
          <div id="sequenceViewer" class="sequence-viewer">
            <p class="muted">尚未选择序列</p>
          </div>
          ${downloadLinks()}
        `]
      ], true)}
    </div>
  `;
  hydrateGenomeBrowserButton(gene);
}

function renderGeneNotFound(id) {
  qs('detailTitle').textContent = '未找到基因';
  qs('detailContent').innerHTML = `
    <div class="detail-grid">
      <article class="card full">
        <h3>未找到基因</h3>
        <p class="muted">${escapeHtml(id)} 不存在于当前数据集中。</p>
        <button class="button primary small" id="geneNotFoundBack">返回搜索页</button>
      </article>
    </div>
  `;
  qs('geneNotFoundBack')?.addEventListener('click', () => goToHash('search'));
}

function downloadLinks() {
  const cdsUrl = runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.cds');
  const proteinUrl = runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.pep');
  const gffUrl = runtimeUrls.downloadUrl('Amorphophallus_konjac.clean.gff');
  return `
    <p class="muted">下方提供序列文件与注释下载。</p>
    <p class="download-inline">
      <a href="${escapeHtml(cdsUrl)}" download>下载 CDS</a>
      <a href="${escapeHtml(proteinUrl)}" download>下载 protein</a>
      <a href="${escapeHtml(gffUrl)}" download>下载 GFF</a>
    </p>
  `;
}

function renderResults(rows) {
  const tbody = qs('resultsTable')?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  qs('emptyHelp').hidden = true;
  const pageSize = Number(qs('pageSize')?.value || 100);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  state.currentPage = Math.min(Math.max(state.currentPage, 1), totalPages);
  const start = (state.currentPage - 1) * pageSize;
  const shown = rows.slice(start, start + pageSize);

  if (!rows.length) {
    qs('resultsPanel').hidden = false;
    tbody.innerHTML = '<tr><td colspan="6" data-label="Empty"><span class="muted">暂无结果</span></td></tr>';
    qs('resultCount').textContent = '0 条结果';
    qs('pageInfo').textContent = '0 / 0';
    renderEmptyHelp();
    renderFilterSummary(0, 0);
    renderSearchStatus({ query: state.submittedQuery.trim(), count: 0, elapsedMs: state.lastSearchDuration, filters: buildSearchChips(0, 0) });
    updatePaginationControls();
    return;
  }

  const fragment = document.createDocumentFragment();
  shown.forEach((gene) => {
    const tr = document.createElement('tr');
    const geneDisplay = getGeneDisplay();
    const symbolLabel = geneDisplay.getGeneSymbolLabel(gene);
    const displayName = geneDisplay.getGeneDisplayName(gene);
    tr.innerHTML = `
      <td data-label="Gene ID">
        <a class="gene-link" href="${buildHash('gene', gene.gene_id)}">${highlightText(gene.gene_id)}</a>
        <div class="row-actions">
          <button class="mini-link" data-action="copy-gene-id" data-gene-id="${escapeHtml(gene.gene_id)}" data-copy="${escapeHtml(gene.gene_id)}" data-copy-message="已复制 Gene ID">复制 ID</button>
          <button class="mini-link" data-search="${escapeHtml(gene.gene_id)}">搜索</button>
        </div>
      </td>
      <td data-label="Gene name">
        ${symbolLabel ? `<strong class="result-gene-symbol">${highlightText(symbolLabel)}</strong>` : ''}
        <span class="result-gene-name">${highlightText(displayName, 120)}</span>
        ${renderTagList(gene.aliases, 3)}
      </td>
      <td data-label="Location">${highlightText(geneLocation(gene))}<br><span class="muted">${escapeHtml(displayValue(gene.species))}</span></td>
      <td data-label="Function">${highlightText(gene.functional_annotation, 220)}</td>
      <td data-label="Evidence"><div class="evidence-list">${evidenceBadges(gene)}</div></td>
      <td data-label="Action"><a class="button ghost small" href="${buildHash('gene', gene.gene_id)}" data-view="${escapeHtml(gene.gene_id)}">查看详情</a></td>
    `;
    fragment.appendChild(tr);
  });
  tbody.appendChild(fragment);
  qs('resultsPanel').hidden = false;
  qs('resultCount').textContent = `${rows.length.toLocaleString()} 条结果`;
  qs('pageInfo').textContent = `${state.currentPage} / ${totalPages}`;
  renderFilterSummary(rows.length, totalPages);
  updatePaginationControls();
  renderSearchStatus({ query: state.submittedQuery.trim(), count: rows.length, elapsedMs: state.lastSearchDuration, filters: buildSearchChips(rows.length, totalPages) });
}

function updatePaginationControls() {
  const pageSize = Number(qs('pageSize')?.value || 100);
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / pageSize));
  qs('prevPage').disabled = state.currentPage <= 1 || !state.filtered.length;
  qs('nextPage').disabled = state.currentPage >= totalPages || !state.filtered.length;
  const downloadFiltered = qs('downloadFiltered');
  if (downloadFiltered) downloadFiltered.disabled = !state.filtered.length;
}

function renderFilterSummary(totalRows, totalPages) {
  const box = qs('filterSummary');
  if (!box) return;
  const pills = buildSearchChips(totalRows, totalPages);
  box.hidden = false;
  box.innerHTML = pills.map(pill => `<span class="filter-pill">${escapeHtml(pill)}</span>`).join('');
}

function selectedText(selector) {
  const el = qs(selector);
  return el?.selectedOptions?.[0]?.textContent || '';
}

function renderSearchPrompt(show = true) {
  const prompt = qs('searchPrompt');
  const panel = qs('resultsPanel');
  if (prompt) prompt.hidden = !show;
  if (panel) panel.hidden = show;
}

function renderEmptyHelp() {
  const suggestions = ['KGM', 'CSLA', 'WRKY', 'PF00069', 'GO:0003677', 'glucomannan', 'cellulose synthase', 'glycosyltransferase'];
  const species = qs('speciesFilter')?.value || '';
  const speciesInfo = SPECIES_OPTIONS.find(item => item.value === species);
  const speciesNote = speciesInfo && !speciesInfo.catalog
    ? `<p class="download-warning">${escapeHtml(speciesDataNote(species))}</p>`
    : '';
  qs('emptyHelp').hidden = false;
  qs('emptyHelp').innerHTML = `
    <p class="muted">未找到结果。</p>
    ${speciesNote}
    <strong>推荐关键词</strong>
    <div class="tag-list">${suggestions.map(s => `<button class="tag tag-button" data-search="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div>
  `;
}

function buildSearchChips(totalRows, totalPages) {
  const query = qs('searchInput')?.value.trim() || '';
  const topic = state.activeTopicId ? TOPICS.find(t => t.id === state.activeTopicId) : null;
  const fieldMode = qs('fieldFilter')?.value || 'all';
  const annotation = qs('annotationFilter')?.value || '';
  const species = qs('speciesFilter')?.value || '';
  const sortMode = qs('sortMode')?.value || 'relevance';
  const pills = [`结果数：${formatNumber(totalRows)}`, totalPages ? `页码：${state.currentPage}/${totalPages}` : '页码：0/0'];
  if (query) pills.push(`关键词：${query}`);
  if (topic) pills.push(`专题：${topic.title}`);
  if (fieldMode !== 'all') pills.push(`字段：${qs('fieldFilter')?.selectedOptions?.[0]?.textContent || fieldMode}`);
  if (species) {
    pills.push(`物种：${speciesLabel(species)}`);
    pills.push(`数据状态：${speciesStatus(species)}`);
  }
  if (annotation) pills.push(`注释：${qs('annotationFilter')?.selectedOptions?.[0]?.textContent || annotation}`);
  if (sortMode !== 'relevance') pills.push(`排序：${qs('sortMode')?.selectedOptions?.[0]?.textContent || sortMode}`);
  pills.push(`每页：${qs('pageSize')?.selectedOptions?.[0]?.textContent || '100'}`);
  return pills;
}

function renderQueryHint() {
  const box = qs('queryHint');
  const query = state.submittedQuery.trim();
  if (!query) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const terms = [...new Set([query, ...expandedTerms().slice(0, 12)])];
  if (!terms.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.innerHTML = `<strong>相关词</strong><div class="tag-list">${terms.map(t => `<button class="tag tag-button" data-search="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('')}</div>`;
}

function renderActiveTopic() {
  const box = qs('activeTopic');
  if (!state.activeTopicId) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  const topic = TOPICS.find(t => t.id === state.activeTopicId);
  if (!topic) return;
  box.hidden = false;
  box.innerHTML = `
    <strong>当前专题：${escapeHtml(topic.title)}</strong>
    <span class="muted">${escapeHtml(topic.description)}</span>
    <button class="mini-link" id="clearTopic">清除专题</button>
  `;
  qs('clearTopic')?.addEventListener('click', () => {
    state.activeTopicId = '';
    applyFilters(true, { skipUrl: true });
  });
}

function matchesGroups(text, groups) {
  if (!groups.length) return true;
  return groups.every(group => group.some(term => text.includes(term)));
}

function buildQueryGroups(query) {
  const tokens = query.toLowerCase().split(/\s+/).map(s => s.trim()).filter(Boolean);
  state.lastTokens = tokens;
  state.lastGroups = tokens.map(token => {
    const exp = SYNONYMS[token] || [];
    return [...new Set([token, ...exp.map(s => s.toLowerCase())])].filter(Boolean);
  });
  return state.lastGroups;
}

function expandedTerms() {
  const tokenSet = new Set(state.lastTokens);
  return [...new Set(state.lastGroups.flat().filter(t => !tokenSet.has(t)))];
}

function escapeRegExp(value) {
  return normalize(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightTerms() {
  return [...new Set([...state.lastTokens, ...expandedTerms()])].filter(t => t.length >= 2).sort((a, b) => b.length - a.length).slice(0, 18);
}

function highlightText(value, maxLength = 0) {
  let text = displayValue(value);
  if (maxLength && text.length > maxLength) text = text.slice(0, maxLength).trimEnd() + '...';
  const terms = highlightTerms();
  if (!terms.length) return escapeHtml(text);
  const regex = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  let html = '';
  let last = 0;
  text.replace(regex, (match, _g, offset) => {
    html += escapeHtml(text.slice(last, offset));
    html += `<mark class="search-hit">${escapeHtml(match)}</mark>`;
    last = offset + match.length;
    return match;
  });
  html += escapeHtml(text.slice(last));
  return html;
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

function sortRows(rows, mode, groups, fieldMode) {
  const copy = rows.slice();
  if (mode === 'gene_id') return copy.sort((a, b) => normalize(a.gene_id).localeCompare(normalize(b.gene_id), undefined, { numeric: true }));
  if (mode === 'location') return copy.sort((a, b) => normalize(a.chromosome).localeCompare(normalize(b.chromosome), undefined, { numeric: true }) || Number(a.start || 0) - Number(b.start || 0));
  if (mode === 'protein_desc') return copy.sort((a, b) => Number(b.protein_length || 0) - Number(a.protein_length || 0));
  if (mode === 'identity_desc') return copy.sort((a, b) => Number(b.sequence_identity || 0) - Number(a.sequence_identity || 0));
  if (mode === 'bitscore_desc') return copy.sort((a, b) => Number(b.bitscore || 0) - Number(a.bitscore || 0));
  return copy.sort((a, b) => scoreGene(b, groups, fieldMode) - scoreGene(a, groups, fieldMode) || normalize(a.gene_id).localeCompare(normalize(b.gene_id), undefined, { numeric: true }));
}

function scoreGene(gene, groups, fieldMode) {
  const raw = qs('searchInput')?.value.trim().toLowerCase() || '';
  let score = 0;
  const id = normalize(gene.gene_id).toLowerCase();
  const symbol = normalize(gene.gene_symbol).toLowerCase();
  const full = getCachedFieldText(gene, fieldMode);
  if (id === raw) score += 10000;
  if (id.startsWith(raw)) score += 2000;
  if (id.includes(raw)) score += 1200;
  if (symbol.includes(raw)) score += 500;
  if (full.includes(raw)) score += 100;
  groups.flat().forEach(term => {
    if (id.includes(term)) score += 80;
    if (symbol.includes(term)) score += 40;
    if (full.includes(term)) score += 12;
  });
  return score;
}

function evidenceBadges(gene) {
  const badges = [];
  if (listFrom(gene.go_terms).length || listFrom(gene.go_slim_terms).length) badges.push(['GO', 'ok']);
  if (listFrom(gene.kegg_terms).length || gene.ko_id || gene.ec_number) badges.push(['KEGG', 'ok']);
  if (listFrom(gene.interpro_domains).length) badges.push(['InterPro', 'ok']);
  if (listFrom(gene.pfam_domains).length) badges.push(['Pfam', 'ok']);
  if (gene.plantTFDB_family) badges.push([`TF:${gene.plantTFDB_family}`, 'tf']);
  if (gene.target_species) badges.push(['Homolog', 'muted']);
  return badges.length ? badges.map(([label, cls]) => `<span class="evidence ${cls}">${escapeHtml(label)}</span>`).join('') : '<span class="muted">No evidence</span>';
}

function renderStaticRoute(view) {
  const preserveScroll = state.currentRoute === view;
  state.currentRoute = view;
  showView(view, { resetScroll: !preserveScroll });
}

function renderHome() {
  showView('home');
}

function updateShareUrl() {}

function syncSearchInputs(value) {
  const text = value || '';
  if (qs('searchInput')) qs('searchInput').value = text;
  if (qs('homeSearchInput')) qs('homeSearchInput').value = text;
}

function renderSearchPromptAndPanel(show = true) {
  renderSearchPrompt(show);
}

async function runSearch(query, options = {}) {
  const startedAt = performance.now();
  const scoped = extractSpeciesScopedQuery(query);
  const searchQuery = scoped.query;
  if (scoped.speciesFilter) setSpeciesFilterValue(scoped.speciesFilter);
  setLoadingState('正在搜索...', null, true, false);
  await loadGenes();
  const workerReady = await ensureSearchWorker();
  if (workerReady) {
    try {
      const response = await searchInWorker(searchQuery);
      if (response) {
        if (response.requestId !== state.searchRequestId) return;
        const rows = (response.ids || []).map(id => state.geneById.get(id)).filter(Boolean);
        state.filtered = rows;
        state.lastTokens = Array.isArray(response.tokens) ? response.tokens : String(searchQuery || '').toLowerCase().split(/\s+/).filter(Boolean);
        state.lastGroups = Array.isArray(response.groups) ? response.groups : buildQueryGroups(searchQuery);
        state.lastSearchDuration = Number(response.elapsedMs) || (performance.now() - startedAt);
        qs('loadStatus').hidden = true;
        renderQueryHint();
        renderActiveTopic();
        renderSearchPrompt(false);
        renderResults(rows);
        saveSearchState();
        if (!options.skipUrl) window.location.hash = `#search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
        return;
      }
    } catch (error) {
      console.warn('search worker failed, falling back to main thread', error);
    }
  }
  const fieldMode = qs('fieldFilter')?.value || 'all';
  const speciesFilter = scoped.speciesFilter || qs('speciesFilter')?.value || '';
  const annotationFilter = qs('annotationFilter')?.value || '';
  const sortMode = qs('sortMode')?.value || 'relevance';
  const groups = buildQueryGroups(searchQuery);
  let rows = state.genes.filter(gene => {
    const fieldText = getFieldText(gene, fieldMode);
    if (!matchesGroups(fieldText, groups)) return false;
    if (speciesFilter && normalize(gene.species) !== speciesFilter) return false;
    if (!hasAnnotation(gene, annotationFilter)) return false;
    if (state.activeTopicId) {
      const topic = TOPICS.find(t => t.id === state.activeTopicId);
      if (topic && !topic.keywords.some(k => gene._search.includes(k.toLowerCase()))) return false;
    }
    return true;
  });
  rows = sortRows(rows, sortMode, groups, fieldMode);
  state.filtered = rows;
  state.lastTokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  state.lastGroups = groups;
  state.lastSearchDuration = performance.now() - startedAt;
  qs('loadStatus').hidden = true;
  renderQueryHint();
  renderActiveTopic();
  renderSearchPrompt(false);
  renderResults(rows);
  saveSearchState();
  if (!options.skipUrl) window.location.hash = `#search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
}

function renderSearchRoute(route) {
  showView('search');
  const scoped = extractSpeciesScopedQuery(route.query || state.submittedQuery || '');
  const routeQuery = scoped.query;
  if (scoped.speciesFilter) setSpeciesFilterValue(scoped.speciesFilter);
  syncSearchInputs(routeQuery);
  if (!routeQuery && !state.submittedQuery) {
    renderSearchPrompt(true);
    qs('resultsPanel').hidden = true;
    renderSearchStatus({});
    return;
  }
  if (routeQuery && routeQuery !== state.submittedQuery) state.submittedQuery = routeQuery;
  const saved = readSearchState();
  if (saved && saved.hash === window.location.hash) restoreSearchState(saved);
  void runSearch(state.submittedQuery || routeQuery || '');
}

function renderGeneRoute(route) {
  showView('gene');
  const gene = state.geneById.get(route.id);
  if (!gene) {
    renderGeneNotFound(route.id);
    return;
  }
  renderGeneDetail(gene, 'loading');
  const renderToken = routeNonce;
  void hydrateGeneOverlay(route.id, renderToken);
}

async function hydrateGeneOverlay(geneId, renderToken) {
  const statusEl = qs('overlayAnnotationStatus');
  const areaEl = qs('overlayAnnotationArea');
  if (!statusEl || !areaEl) return;
  try {
    statusEl.textContent = '正在加载增强注释索引...';
    const index = await loadOverlayIndex();
    if (renderToken !== routeNonce) return;
    statusEl.textContent = '正在加载增强注释分片...';
    const overlay = await getOverlayGene(geneId, index);
    if (renderToken !== routeNonce) return;
    if (!overlay) {
      statusEl.textContent = '增强注释暂不可用';
      return;
    }
    statusEl.hidden = true;
    areaEl.hidden = false;
    areaEl.innerHTML = renderOverlayPanel(overlay.gene);
  } catch (error) {
    if (renderToken !== routeNonce) return;
    statusEl.hidden = false;
    statusEl.textContent = error?.code === 'OVERLAY_INDEX_NOT_FOUND' || error?.code === 'OVERLAY_CHUNK_NOT_FOUND'
      ? '增强注释暂不可用'
      : '增强注释暂不可用';
  }
}

function parseHashRoute(hash = window.location.hash || '#/') {
  const raw = hash.replace(/^#/, '');
  if (!raw || raw === '/' || raw === 'home') return { view: 'home', query: '', id: '' };
  const [path, queryString = ''] = raw.split('?');
  const params = new URLSearchParams(queryString);
  if (path === 'search') return { view: 'search', query: (params.get('q') || '').trim(), id: '' };
  if (path.startsWith('gene/')) return { view: 'gene', id: decodeURIComponent(path.slice(5)), query: '' };
  if (['topics', 'kgm', 'browse', 'bulk', 'score', 'downloads', 'blast', 'sources', 'help'].includes(path)) return { view: path, query: '', id: '' };
  return { view: 'home', query: '', id: '' };
}

function downloadCsv(rows, filename) {
  const headers = ['gene_id', 'gene_symbol', 'species', 'chromosome', 'start', 'end', 'strand', 'functional_annotation'];
  const esc = (value) => `"${normalize(value).replace(/"/g, '""')}"`;
  const csv = [headers.join(',')].concat(rows.map(row => headers.map(h => esc(row[h])).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildHash(view, value = '') {
  if (view === 'home') return '#/';
  if (view === 'search') return value ? `#search?q=${encodeURIComponent(value)}` : '#search';
  if (view === 'gene') return `#gene/${encodeURIComponent(value)}`;
  return `#${view}`;
}

function goToHash(view, value = '') {
  const next = buildHash(view, value);
  if (window.location.hash !== next) window.location.hash = next;
  else handleRouteChange();
}

async function submitHomeSearch() {
  const value = String(qs('homeSearchInput')?.value || '').trim();
  syncSpeciesFilters('homeSpeciesFilter');
  if (!value) {
    setSearch('');
    return;
  }
  try {
    await loadGenes();
    const scoped = extractSpeciesScopedQuery(value);
    if (scoped.speciesFilter) setSpeciesFilterValue(scoped.speciesFilter);
    const queryValue = scoped.query;
    const speciesFilter = qs('speciesFilter')?.value || '';
    const exact = state.geneById.get(queryValue) || state.genes.find(gene => normalize(gene.gene_id).toLowerCase() === queryValue.toLowerCase());
    if (exact && (!speciesFilter || normalize(exact.species) === speciesFilter)) {
      goToHash('gene', exact.gene_id);
      return;
    }
    const groups = buildQueryGroups(queryValue);
    const matches = state.genes.filter(gene => {
      if (speciesFilter && normalize(gene.species) !== speciesFilter) return false;
      return matchesGroups(getFieldText(gene, 'all'), groups);
    });
    if (matches.length === 1) {
      goToHash('gene', matches[0].gene_id);
      return;
    }
  } catch (error) {
    console.warn('home search preflight failed, falling back to search route', error);
  }
  setSearch(value);
}

function setSearch(query, options = {}) {
  const value = String(query || '').trim();
  if (!value) {
    state.submittedQuery = '';
    state.currentPage = 1;
    syncSearchInputs('');
    setSpeciesFilterValue('');
    renderSearchPrompt(true);
    qs('resultsPanel').hidden = true;
    renderSearchStatus({});
    goToHash('search');
    return;
  }
  const scoped = extractSpeciesScopedQuery(value);
  if (scoped.speciesFilter) setSpeciesFilterValue(scoped.speciesFilter);
  const searchValue = scoped.query || value;
  state.submittedQuery = searchValue;
  syncSearchInputs(searchValue);
  state.activeTopicId = '';
  state.currentPage = 1;
  if (!options.skipHash) window.location.hash = buildHash('search', searchValue);
  else void runSearch(searchValue, options);
}

function searchByTopic(topicId) {
  const topic = TOPICS.find(t => t.id === topicId);
  if (!topic) return;
  state.activeTopicId = topicId;
  setSearch(topic.example || topic.keywords[0] || topic.title, { skipHash: false });
}

function syncSearchStateFromInputs() {
  state.submittedQuery = qs('searchInput')?.value.trim() || state.submittedQuery || '';
}

function bindEvents() {
  qs('homeSearchButton')?.addEventListener('click', () => { void submitHomeSearch(); });
  qs('homeSearchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') void submitHomeSearch(); });
  qs('homeSpeciesFilter')?.addEventListener('change', () => syncSpeciesFilters('homeSpeciesFilter'));
  qs('searchButton')?.addEventListener('click', () => setSearch(qs('searchInput')?.value || ''));
  qs('searchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') setSearch(qs('searchInput')?.value || ''); });
  qs('speciesFilter')?.addEventListener('change', () => { syncSpeciesFilters('speciesFilter'); applyFilters(true, { skipUrl: true }); });
  qs('fieldFilter')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('annotationFilter')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('sortMode')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('pageSize')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('resetButton')?.addEventListener('click', () => {
    state.submittedQuery = '';
    state.activeTopicId = '';
    state.currentPage = 1;
    syncSearchInputs('');
    setSpeciesFilterValue('');
    qs('fieldFilter').value = 'all';
    qs('annotationFilter').value = '';
    qs('sortMode').value = 'relevance';
    qs('pageSize').value = '100';
    renderSearchPrompt(true);
    qs('resultsPanel').hidden = true;
    goToHash('search');
  });
  qs('prevPage')?.addEventListener('click', () => { state.currentPage = Math.max(1, state.currentPage - 1); renderResults(state.filtered); });
  qs('nextPage')?.addEventListener('click', () => { state.currentPage += 1; renderResults(state.filtered); });
  qs('downloadFiltered')?.addEventListener('click', () => downloadCsv(state.filtered, 'konjac_gene_filtered.csv'));
  qs('backToSearch')?.addEventListener('click', () => window.location.hash = state.lastSearchHash || '#search');

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const searchEl = target.closest('[data-search]');
    if (searchEl) { setSearch(searchEl.getAttribute('data-search') || ''); return; }

    const homeSearchEl = target.closest('[data-home-search]');
    if (homeSearchEl) { syncSpeciesFilters('homeSpeciesFilter'); setSearch(homeSearchEl.getAttribute('data-home-search') || ''); return; }

    const topicEl = target.closest('[data-topic-search]');
    if (topicEl) { searchByTopic(topicEl.getAttribute('data-topic-search') || ''); return; }

    const viewEl = target.closest('a[data-view],button[data-view]');
    if (viewEl) {
      const id = viewEl.getAttribute('data-view') || '';
      if (state.geneById.has(id)) { goToHash('gene', id); return; }
      if (['home', 'search', 'score', 'topics', 'kgm', 'browse', 'bulk', 'downloads', 'blast', 'sources', 'help'].includes(id)) { goToHash(id); return; }
    }

    const copyGeneEl = target.closest('[data-action="copy-gene-id"]');
    if (copyGeneEl) {
      const geneId = copyGeneEl.getAttribute('data-gene-id') || copyGeneEl.getAttribute('data-copy') || '';
      const message = copyGeneEl.getAttribute('data-copy-message') || '已复制 Gene ID';
      void copyText(geneId, message);
      return;
    }

    const copyEl = target.closest('[data-copy]');
    if (copyEl) {
      const value = copyEl.getAttribute('data-copy') || '';
      const message = copyEl.getAttribute('data-copy-message') || (String(copyEl.textContent || '').includes('Gene ID') ? '已复制 Gene ID' : '已复制');
      void copyText(value, message);
      return;
    }

    const seqShow = target.closest('[data-action="show-sequence"]');
    if (seqShow) {
      void renderSequenceViewer(seqShow.getAttribute('data-gene-id') || '', seqShow.getAttribute('data-sequence-type') || 'cds');
      return;
    }

    const seqCopy = target.closest('[data-action="copy-sequence"],[data-copy-current-seq]');
    if (seqCopy) {
      if (!state.currentSequence) { showToast('请先查看序列'); return; }
      void copyText(state.currentSequence.seq, '已复制序列');
      return;
    }

    const seqDownload = target.closest('[data-action="download-sequence"],[data-download-current-seq]');
    if (seqDownload) {
      downloadCurrentSequence();
      return;
    }

    const blastDownload = target.closest('[data-action="download-blast-tsv"]');
    if (blastDownload) {
      downloadBlastTsv();
      return;
    }

    if (target.closest('#bulkLookup')) {
      void runBulkLookup();
      return;
    }

    if (target.closest('#bulkExample')) {
      const input = qs('bulkGeneIds');
      if (input) input.value = 'evm.model.CTG_28.2_Akon\nevm.model.HIC_ASM_6.713_Akon\nevm.model.HIC_ASM_3.9213_Akon';
      void runBulkLookup();
      return;
    }

    if (target.closest('#bulkDownloadCsv')) {
      downloadBulkCsv();
      return;
    }

    if (target.closest('#bulkDownloadCds')) {
      void downloadBulkFasta('cds');
      return;
    }

    if (target.closest('#bulkDownloadProtein')) {
      void downloadBulkFasta('protein');
      return;
    }

    if (target.closest('#scoreRun')) {
      void runScoreAnalysis();
      return;
    }

    if (target.closest('#scoreExampleGene')) {
      const input = qs('scoreQuery');
      if (input) input.value = 'evm.model.HIC_ASM_10.860_Akon';
      qs('scoreModeSelect').value = 'gene';
      void runScoreAnalysis();
      return;
    }

    if (target.closest('#scoreExampleFunction')) {
      const input = qs('scoreQuery');
      if (input) input.value = 'glucomannan biosynthesis';
      qs('scoreModeSelect').value = 'function';
      void runScoreAnalysis();
      return;
    }

    if (target.closest('#scoreDownloadCsv')) {
      downloadScoreCsv();
      return;
    }

    if (target.closest('#kgmDownloadCsv')) {
      downloadKgmCsv();
      return;
    }

    const seqClose = target.closest('[data-action="close-sequence"]');
    if (seqClose) {
      clearSequenceViewer();
      return;
    }
  });

  window.addEventListener('hashchange', handleRouteChange);
}

function applyFilters(resetPage = false, options = {}) {
  if (!state.submittedQuery) {
    renderSearchPrompt(true);
    qs('resultsPanel').hidden = true;
    renderSearchStatus({});
    return;
  }
  if (resetPage) state.currentPage = 1;
  void runSearch(state.submittedQuery, options);
}

function renderStaticSections() {
  renderTopicCards();
  renderBrowsePanels();
  renderBulkContent();
  renderScoreContent();
  renderDownloadCards();
  renderBlastContent();
  renderSourceContent();
  renderHelpContent();
}

function saveSearchState() {
  try {
    const hash = window.location.hash || buildHash('search', state.submittedQuery);
    state.lastSearchHash = hash;
    sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({
      query: state.submittedQuery,
      fieldFilter: qs('fieldFilter')?.value || 'all',
      speciesFilter: qs('speciesFilter')?.value || '',
      annotationFilter: qs('annotationFilter')?.value || '',
      sortMode: qs('sortMode')?.value || 'relevance',
      pageSize: qs('pageSize')?.value || '100',
      currentPage: state.currentPage,
      hash
    }));
  } catch (error) {}
}

function readSearchState() {
  try {
    const raw = sessionStorage.getItem(SEARCH_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function restoreSearchState(saved) {
  if (!saved) return;
  if (saved.query !== undefined) {
    state.submittedQuery = String(saved.query || '').trim();
    syncSearchInputs(state.submittedQuery);
  }
  if (saved.hash) state.lastSearchHash = saved.hash;
  if (saved.fieldFilter !== undefined) qs('fieldFilter').value = saved.fieldFilter || 'all';
  if (saved.speciesFilter !== undefined) setSpeciesFilterValue(saved.speciesFilter || '');
  if (saved.annotationFilter !== undefined) qs('annotationFilter').value = saved.annotationFilter || '';
  if (saved.sortMode !== undefined) qs('sortMode').value = saved.sortMode || 'relevance';
  if (saved.pageSize !== undefined) qs('pageSize').value = String(saved.pageSize || '100');
  if (saved.currentPage !== undefined) state.currentPage = Number(saved.currentPage) || 1;
}

function handleRouteChange() {
  routeNonce += 1;
  const route = parseHashRoute();
  if (route.view === 'home') { renderHome(); return; }
  if (route.view === 'search') { renderSearchRoute(route); return; }
  if (route.view === 'gene') { void loadGenes().then(() => renderGeneRoute(route)); return; }
  if (route.view === 'kgm') {
    renderStaticRoute('kgm');
    renderKgmTopicContent();
    return;
  }
  renderStaticRoute(route.view);
}

function updateSummarySections() {
  renderTopicCards();
  renderBrowsePanels();
  renderScoreContent();
  renderDownloadCards();
  renderBlastContent();
  renderSourceContent();
  renderHelpContent();
}

async function init() {
  const navJbrowseLink = qs('navJbrowseLink');
  if (navJbrowseLink) navJbrowseLink.href = runtimeUrls.jbrowseUrl('index.html');
  renderQuickSearches();
  populateSpeciesFilters();
  renderHomeModules();
  bindEvents();
  try {
    setLoadingState('正在加载摘要...', 10, true, false);
    await loadSummary();
    updateStats();
    updateSummarySections();
    setLoadingState('就绪', 100, false, false);
  } catch (error) {
    showLoadingError(error);
  }
  handleRouteChange();
}

function downloadSequenceData() {}

init();








