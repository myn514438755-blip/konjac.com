const DATA_URL = './data/genes.json';
const SUMMARY_URL = './data/build_summary.json';
const OVERLAY_INDEX_URL = './data/processed/annotations/overlay/annotation_overlay_index.json';
const JBROWSE_SEQID_MAP_URL = './data/processed/jbrowse/seqid_map.json';
const SEARCH_STATE_KEY = 'konjac_gene_search_state_v1';
const DATA_BYTES_HINT = 63035084;
const SUPABASE_URL = 'https://plvylqvdlavriupvphxj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdnlscXZkbGF2cml1cHZwaHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3OTgwMTMsImV4cCI6MjA5MzM3NDAxM30.hvrueYBgtzA9x5ISenK6fI6ofRO9OJ3maelA-D_CjVY';
const BLAST_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/blast`;
const BLAST_JOB_STORAGE_KEY = 'konjac_blast_last_job_v1';
const SUPABASE_AUTH_STORAGE_KEY = 'konjac_supabase_auth_v1';

const VIEW_IDS = ['homeView', 'searchView', 'geneView', 'topicsView', 'browseView', 'downloadsView', 'blastView', 'sourcesView', 'helpView'];
const SEQUENCE_FILES = {
  cds: './downloads/Amorphophallus_konjac.clean.cds',
  protein: './downloads/Amorphophallus_konjac.clean.pep'
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
  'zen_pfam_v2.0.tsv': { label: 'ZEN Pfam', description: 'Pfam 结构域注释结果。' }
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

function showView(view) {
  setVisibleViews([`${view}View`]);
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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
  qs('statUpdated').textContent = s.website_last_updated || '待补充';
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
  const fieldMode = qs('fieldFilter')?.value || 'all';
  const speciesFilter = qs('speciesFilter')?.value || '';
  const annotationFilter = qs('annotationFilter')?.value || '';
  const sortMode = qs('sortMode')?.value || 'relevance';
  return new Promise((resolve, reject) => {
    state.searchWorkerPending.set(requestId, { resolve, reject });
    try {
      state.searchWorker.postMessage({
        type: 'search',
        requestId,
        query,
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
    { title: '魔芋研究专题', href: '#topics', desc: '进入 KGM、CSLA、转录因子、抗病和细胞壁专题入口。' },
    { title: '注释分类浏览', href: '#browse', desc: '按 GO、InterPro、Pfam 和同源物种快速浏览。' },
    { title: '基因组浏览器', href: './data/processed/jbrowse-app/index.html', desc: '查看基因组坐标、基因结构和 GFF 注释轨道。' },
    { title: 'BLAST 本地说明', href: '#blast', desc: '查看已准备好的 BLAST 数据库、示例序列和本地运行命令。' },
    { title: '数据下载', href: '#downloads', desc: '下载整合表、GFF、CDS、protein FASTA 和 ZEN 文件。' },
    { title: '数据来源与引用', href: '#sources', desc: '查看数据来源、引用格式、许可说明和维护信息。' },
    { title: '使用帮助', href: '#help', desc: '查看搜索示例、本地运行方法和后续升级计划。' }
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
          <button class="button ghost small" data-topic-search="${topic.id}">Filter this topic</button>
          <button class="button secondary small" data-search="${escapeHtml(topic.example)}">Example search</button>
        </div>
      </article>
    `;
  }).join('');
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
  const updated = state.summary.website_last_updated || '待补充';
  const files = (state.summary.downloads || []).map(item => ({ name: item.name, path: './' + item.path, bytes: item.bytes, available: true }));
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
          <dt>大小</dt><dd>${file.bytes ? formatBytes(file.bytes) : '待补充'}</dd>
        </dl>
        ${unavailable ? '<p class="download-warning">下载链接不可用</p>' : ''}
        <a class="button ghost small" href="${escapeHtml(file.path || '#')}" ${unavailable ? 'aria-disabled="true" tabindex="-1"' : ''} download>${unavailable ? '不可用' : '下载文件'}</a>
      </article>
    `;
  }).join('');
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
        <dt>更新时间</dt><dd>${escapeHtml(state.summary.website_last_updated || '待补充')}</dd>
      </dl>
    </article>
    <article class="card">
      <h3>引用与许可</h3>
      <dl>
        <dt>PlantGARDEN DOI</dt><dd>待补充</dd>
        <dt>ZEN DOI</dt><dd>待补充</dd>
        <dt>NCBI assembly DOI / accession</dt><dd>GCA_022559845.1</dd>
        <dt>外部资源许可</dt><dd>GO、KEGG/KO/EC、InterPro、Pfam、PlantTFDB（待补充）</dd>
        <dt>维护者</dt><dd>待补充</dd>
        <dt>联系邮箱</dt><dd>待补充</dd>
        <dt>许可</dt><dd>待补充</dd>
        <dt>引用格式</dt><dd>待补充</dd>
      </dl>
    </article>
    <article class="card full">
      <h3>使用说明</h3>
      <ul class="check-list">
        <li>候选基因来自注释筛选，不等同于实验验证。</li>
        <li>JBrowse 轨道使用已重映射的 PlantGARDEN clean GFF，可从详情页按坐标跳转。</li>
        <li>DOI、许可、维护者和联系信息当前均为待补充，发布前需要人工核对。</li>
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
        <li>在结果中点击 Gene ID 或“查看详情”进入基因详情。</li>
        <li>在详情页查看功能注释、序列、JBrowse 坐标和下载链接。</li>
      </ol>
      <p class="help-note">基因组浏览器用于查看基因组坐标、基因结构和 GFF 注释轨道。</p>
    </article>
    <article class="card">
      <h3>本地运行</h3>
      <pre><code>npx http-server . -p 8002 -c-1 --cors</code></pre>
      <p>然后打开 <code>http://127.0.0.1:8002/#/</code>。</p>
    </article>
    <article class="card">
      <h3>JBrowse 本地预览</h3>
      <pre><code>http://127.0.0.1:8002/data/processed/jbrowse-app/index.html</code></pre>
      <p class="help-note">不要用不支持 Range 请求的临时服务器预览 JBrowse，否则可能出现 invalid bgzf、Downloading sequence 或轨道无法加载的问题。</p>
    </article>
    <article class="card">
      <h3>BLAST</h3>
      <p>当前版本提供 Supabase 登录提交、任务队列和本机 BLAST worker 流程。</p>
      <a class="button ghost small" href="#blast">打开 BLAST</a>
    </article>
    <article class="card full">
      <h3>后续升级</h3>
      <ul class="check-list">
        <li>BLAST 已采用无云服务器队列方案；本机 worker 在线时才会处理任务。</li>
        <li>表达热图需要 expression_tpm.csv 和 sample_metadata.csv。</li>
        <li>“待补充”表示该信息尚未核实，不会自动编造。</li>
      </ul>
    </article>
  `;
}

function renderBlastContent() {
  const host = qs('blastContent');
  if (!host) return;
  const cdsSize = formatBytes(49918089);
  const pepSize = formatBytes(17583227);
  host.innerHTML = `
    <article class="card full blast-card blast-online-card">
      <div class="blast-card-head">
        <div>
          <h3>在线 BLAST 队列</h3>
          <p class="help-note">提交 BLAST 需要登录；Supabase 记录任务状态，本机 worker 执行 BLAST 并回写结果。</p>
        </div>
        <span class="status-pill">Supabase Auth</span>
      </div>
      <div id="blastAuthPanel" class="blast-auth-panel"></div>
      <form id="blastOnlineForm" class="blast-form">
        <label>
          <span>程序</span>
          <select id="blastProgram">
            <option value="blastn">blastn against CDS</option>
            <option value="blastp">blastp against protein</option>
          </select>
        </label>
        <label>
          <span>最大命中数</span>
          <input id="blastMaxTargets" type="number" min="1" max="50" value="50">
        </label>
        <label class="blast-sequence-field">
          <span>查询序列</span>
          <textarea id="blastSequence" rows="8" spellcheck="false" placeholder=">query&#10;ATGG..."></textarea>
        </label>
        <div class="blast-actions">
          <button class="button" type="submit">提交 BLAST</button>
          <button class="button ghost" id="blastCheckLast" type="button">刷新上次任务</button>
          <span id="blastDatabaseHint" class="status-pill">数据库：konjac_cds</span>
        </div>
      </form>
      <div id="blastOnlineStatus" class="blast-online-status"></div>
    </article>
    <article class="card full blast-card blast-status-card">
      <h3>本地 BLAST 状态</h3>
      <div id="blastManifestStatus" class="blast-status-list">
        <span class="status-pill">正在检查 blastdb/manifest.json...</span>
      </div>
      <p class="help-note">当前网站仍是静态前端；BLAST 计算由本机 PowerShell worker 完成，任务状态写入 Supabase。</p>
    </article>
    <article class="card blast-card">
      <h3>已准备的软件</h3>
      <dl class="detail-dl">
        <dt>BLAST+ 路径</dt><dd><code>C:/Program Files/NCBI/blast-2.9.0+/bin</code></dd>
        <dt>工具</dt><dd><code>makeblastdb.exe</code>、<code>blastn.exe</code>、<code>blastp.exe</code></dd>
        <dt>检查命令</dt><dd><code>blastn -version</code></dd>
      </dl>
    </article>
    <article class="card blast-card">
      <h3>输入文件</h3>
      <dl class="detail-dl">
        <dt>CDS FASTA</dt><dd><code>downloads/Amorphophallus_konjac.clean.cds</code> (${cdsSize})</dd>
        <dt>Protein FASTA</dt><dd><code>downloads/Amorphophallus_konjac.clean.pep</code> (${pepSize})</dd>
        <dt>示例查询</dt><dd><code>examples/blast/query_cds.fa</code><br><code>examples/blast/query_protein.fa</code></dd>
      </dl>
    </article>
    <article class="card blast-card">
      <h3>一键建库</h3>
      <pre><code>Set-Location "D:\\桌面图标\\wwww. konjac"
./scripts/build-blast-db.ps1</code></pre>
      <p>生成 <code>blastdb/konjac_cds</code> 和 <code>blastdb/konjac_pep</code> 两套数据库。</p>
    </article>
    <article class="card blast-card">
      <h3>运行示例查询</h3>
      <pre><code>Set-Location "D:\\桌面图标\\wwww. konjac"
./scripts/run-blast-examples.ps1</code></pre>
      <p>输出 <code>blast_results/example_cds.tsv</code> 和 <code>blast_results/example_pep.tsv</code>。</p>
    </article>
    <article class="card blast-card">
      <h3>启动 Supabase worker</h3>
      <pre><code>Set-Location "D:\\桌面图标\\wwww. konjac"
$env:SUPABASE_URL="https://plvylqvdlavriupvphxj.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
./scripts/run-supabase-blast-worker.ps1</code></pre>
      <p>worker 会读取 <code>queued</code> 任务，运行本地 BLAST+，并把命中结果写回 Supabase。</p>
    </article>
    <article class="card blast-card">
      <h3>手动 blastn</h3>
      <pre><code>blastn -query examples/blast/query_cds.fa -db blastdb/konjac_cds -out blast_results/my_cds.tsv -outfmt "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore" -max_target_seqs 50</code></pre>
    </article>
    <article class="card blast-card">
      <h3>手动 blastp</h3>
      <pre><code>blastp -query examples/blast/query_protein.fa -db blastdb/konjac_pep -out blast_results/my_pep.tsv -outfmt "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore" -max_target_seqs 50</code></pre>
    </article>
    <article class="card full blast-card">
      <h3>输出字段</h3>
      <p><code>outfmt 6</code> 字段依次为：query ID、subject ID、identity、alignment length、mismatch、gap open、query start/end、subject start/end、E-value、bitscore。</p>
      <p class="help-note">在线提交只负责任务排队和状态查看；本机 worker 没运行时，任务会停留在 queued。</p>
    </article>
  `;
  bindBlastOnlineForm();
  bindBlastAuthPanel();
  void hydrateBlastAuthPanel();
  void restoreLastBlastJob();
  void hydrateBlastManifest();
}

async function hydrateBlastManifest() {
  const host = qs('blastManifestStatus');
  if (!host) return;
  try {
    const res = await fetch('./blastdb/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest missing');
    const manifest = await res.json();
    const databases = Array.isArray(manifest.databases) ? manifest.databases : [];
    const dbHtml = databases.map(db => {
      const files = Array.isArray(db.files) ? db.files : [];
      const bytes = files.reduce((sum, file) => sum + (Number(file.bytes) || 0), 0);
      return `<span class="status-pill ok">${escapeHtml(db.id || db.prefix || 'database')} · ${escapeHtml(db.dbtype || '')} · ${files.length} files · ${formatBytes(bytes)}</span>`;
    }).join('');
    host.innerHTML = `
      <span class="status-pill ok">数据库已生成</span>
      <span class="status-pill">${escapeHtml(manifest.blast_version || 'BLAST+')}</span>
      <span class="status-pill">Built: ${escapeHtml(manifest.built_at || 'unknown')}</span>
      ${dbHtml}
    `;
  } catch (error) {
    host.innerHTML = `
      <span class="status-pill warning">数据库尚未生成</span>
      <span class="status-pill">运行 scripts\\build-blast-db.ps1 后会生成 blastdb/manifest.json</span>
    `;
  }
}

function blastDatabaseForProgram(program) {
  return program === 'blastp' ? 'konjac_pep' : 'konjac_cds';
}

function updateBlastDatabaseHint() {
  const program = qs('blastProgram')?.value || 'blastn';
  const hint = qs('blastDatabaseHint');
  if (hint) hint.textContent = `数据库：${blastDatabaseForProgram(program)}`;
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
    throw new Error(data.error_description || data.msg || data.message || data.error || `Supabase Auth HTTP ${res.status}`);
  }
  return data;
}

function friendlyAuthError(error) {
  const message = error?.message ? String(error.message) : '';
  if (/invalid login credentials/i.test(message)) return '邮箱或密码不正确。如果还没有账号，请先输入邮箱和密码后点击注册。';
  if (/signup|signups.*disabled|not allowed/i.test(message)) return '当前 Supabase 项目未允许邮箱注册，请先在 Supabase Auth 设置里启用 Email/Password 注册。';
  if (/password/i.test(message) && /six|6|weak|short/i.test(message)) return '密码太短，请使用至少 6 位密码。';
  if (/email/i.test(message) && /invalid/i.test(message)) return '邮箱格式不正确。';
  return message || 'Supabase Auth 请求失败，请稍后重试。';
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
    const email = session.user?.email || 'Supabase user';
    host.innerHTML = `
      <div class="blast-auth-box signed-in">
        <div>
          <strong>已登录</strong>
          <span>${escapeHtml(email)}</span>
          <small>只有提交 BLAST 需要登录；状态刷新使用任务 token。</small>
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

function validateBlastSequenceInput(value, program) {
  const input = String(value || '').trim();
  if (!input) throw new Error('请输入 FASTA 或纯序列。');
  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const sequenceLines = lines[0]?.startsWith('>') ? lines.slice(1) : lines;
  const sequence = sequenceLines.join('').replace(/\s+/g, '').toUpperCase();
  if (!sequence) throw new Error('查询序列为空。');
  if (sequence.length > 20000) throw new Error('查询序列不能超过 20,000 bp/aa。');
  const validNucleotide = /^[ACGTRYSWKMBDHVN.-]+$/i;
  const validProtein = /^[ABCDEFGHIKLMNPQRSTVWXYZ*.-]+$/i;
  if (program === 'blastn' && !validNucleotide.test(sequence)) {
    throw new Error('blastn 只接受核酸序列字符。');
  }
  if (program === 'blastp' && !validProtein.test(sequence)) {
    throw new Error('blastp 只接受蛋白序列字符。');
  }
  return sequence.length;
}

function renderBlastOnlineStatus(html) {
  const host = qs('blastOnlineStatus');
  if (host) host.innerHTML = html;
}

async function submitOnlineBlast(event) {
  event.preventDefault();
  const program = qs('blastProgram')?.value || 'blastn';
  const sequence = qs('blastSequence')?.value || '';
  const maxTargetSeqs = Number(qs('blastMaxTargets')?.value || 50);
  try {
    const queryLength = validateBlastSequenceInput(sequence, program);
    const session = await ensureAuthSession();
    if (!session?.access_token) {
      await hydrateBlastAuthPanel('请先登录后再提交 BLAST。');
      renderBlastOnlineStatus('<p class="download-warning">BLAST 提交需要 Supabase 登录；其他页面仍可直接浏览。</p>');
      return;
    }
    renderBlastOnlineStatus(`<p class="help-note">正在提交 ${escapeHtml(program)} 查询，长度 ${formatNumber(queryLength)}...</p>`);
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
        sequence,
        max_target_seqs: maxTargetSeqs
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

function renderBlastJobResult(data) {
  const job = data.job || {};
  const hits = Array.isArray(data.hits) ? data.hits : [];
  const status = job.status || 'queued';
  const created = job.created_at ? new Date(job.created_at).toLocaleString() : 'unknown';
  const finished = job.finished_at ? new Date(job.finished_at).toLocaleString() : '';
  const rows = hits.map(hit => `
    <tr>
      <td data-label="#">${escapeHtml(hit.rank)}</td>
      <td data-label="Subject">${escapeHtml(hit.sseqid)}</td>
      <td data-label="Identity">${escapeHtml(hit.pident)}</td>
      <td data-label="Length">${escapeHtml(hit.alignment_length)}</td>
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
        <span class="status-pill">提交：${escapeHtml(created)}</span>
        ${finished ? `<span class="status-pill">完成：${escapeHtml(finished)}</span>` : ''}
      </div>
      ${job.error_message ? `<p class="download-warning">${escapeHtml(job.error_message)}</p>` : ''}
      ${hits.length ? `
        <div class="table-wrap blast-result-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Subject</th><th>Identity</th><th>Length</th><th>E-value</th><th>Bitscore</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      ` : `<p class="help-note">${status === 'queued' || status === 'running' ? '等待后台 worker 写入结果。' : '暂无命中结果。'}</p>`}
    </div>
  `);
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

async function loadSequenceIndex() {
  if (state.sequenceIndex) return state.sequenceIndex;
  if (state.sequenceIndexPromise) return state.sequenceIndexPromise;
  state.sequenceIndexPromise = (async () => {
    const res = await fetch('./data/processed/sequences/sequence_index.json');
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
    const res = await fetch(`./${normalized}`);
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
    const res = await fetch(`./${normalized}`);
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
    href: `./data/processed/jbrowse-app/index.html?config=./config.json&assembly=${encodeURIComponent('GCA_022559845.1_ASM2255984v1')}&loc=${encodeURIComponent(`${targetSeqid}:${from}..${to}`)}&tracks=Amorphophallus_konjac.clean.gff3&tracklist=false`
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
        ['Identity', gene.sequence_identity ? `${escapeHtml(displayValue(gene.sequence_identity))}%` : '<span class="muted">鏆傛棤娉ㄩ噴</span>'],
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
  return `
    <p class="muted">下方提供序列文件与注释下载。</p>
    <p class="download-inline">
      <a href="./downloads/Amorphophallus_konjac.clean.cds" download>下载 CDS</a>
      <a href="./downloads/Amorphophallus_konjac.clean.pep" download>下载 protein</a>
      <a href="./downloads/Amorphophallus_konjac.clean.gff" download>下载 GFF</a>
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
    tr.innerHTML = `
      <td data-label="Gene ID">
        <a class="gene-link" href="${buildHash('gene', gene.gene_id)}">${highlightText(gene.gene_id)}</a>
        <div class="row-actions">
          <button class="mini-link" data-action="copy-gene-id" data-gene-id="${escapeHtml(gene.gene_id)}" data-copy="${escapeHtml(gene.gene_id)}" data-copy-message="已复制 Gene ID">复制 ID</button>
          <button class="mini-link" data-search="${escapeHtml(gene.gene_id)}">搜索</button>
        </div>
      </td>
      <td data-label="Symbol">${highlightText(gene.gene_symbol)}<br>${renderTagList(gene.aliases, 3)}</td>
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
  qs('emptyHelp').hidden = false;
  qs('emptyHelp').innerHTML = `
    <p class="muted">未找到结果。</p>
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
  if (species) pills.push(`物种：${species}`);
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
  state.currentRoute = view;
  showView(view);
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
  setLoadingState('正在搜索...', null, true, false);
  await loadGenes();
  const workerReady = await ensureSearchWorker();
  if (workerReady) {
    try {
      const response = await searchInWorker(query);
      if (response) {
        if (response.requestId !== state.searchRequestId) return;
        const rows = (response.ids || []).map(id => state.geneById.get(id)).filter(Boolean);
        state.filtered = rows;
        state.lastTokens = Array.isArray(response.tokens) ? response.tokens : String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
        state.lastGroups = Array.isArray(response.groups) ? response.groups : buildQueryGroups(query);
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
  const speciesFilter = qs('speciesFilter')?.value || '';
  const annotationFilter = qs('annotationFilter')?.value || '';
  const sortMode = qs('sortMode')?.value || 'relevance';
  const groups = buildQueryGroups(query);
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
  state.lastTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
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
  syncSearchInputs(route.query || state.submittedQuery || '');
  if (!route.query && !state.submittedQuery) {
    renderSearchPrompt(true);
    qs('resultsPanel').hidden = true;
    renderSearchStatus({});
    return;
  }
  if (route.query && route.query !== state.submittedQuery) state.submittedQuery = route.query;
  const saved = readSearchState();
  if (saved && saved.hash === window.location.hash) restoreSearchState(saved);
  void runSearch(state.submittedQuery || route.query || '');
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
  if (['topics', 'browse', 'downloads', 'blast', 'sources', 'help'].includes(path)) return { view: path, query: '', id: '' };
  return { view: 'home', query: '', id: '' };
}

function handleRouteChange() {
  const route = parseHashRoute();
  if (route.view === 'home') return renderHome();
  if (route.view === 'search') return renderSearchRoute(route);
  if (route.view === 'gene') return void loadGenes().then(() => renderGeneRoute(route));
  if (route.view === 'topics') return renderStaticRoute('topics');
  if (route.view === 'browse') return renderStaticRoute('browse');
  if (route.view === 'downloads') return renderStaticRoute('downloads');
  if (route.view === 'sources') return renderStaticRoute('sources');
  if (route.view === 'help') return renderStaticRoute('help');
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
  if (!value) {
    setSearch('');
    return;
  }
  try {
    await loadGenes();
    const exact = state.geneById.get(value) || state.genes.find(gene => normalize(gene.gene_id).toLowerCase() === value.toLowerCase());
    if (exact) {
      goToHash('gene', exact.gene_id);
      return;
    }
    const groups = buildQueryGroups(value);
    const matches = state.genes.filter(gene => matchesGroups(getFieldText(gene, 'all'), groups));
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
    renderSearchPrompt(true);
    qs('resultsPanel').hidden = true;
    renderSearchStatus({});
    goToHash('search');
    return;
  }
  state.submittedQuery = value;
  syncSearchInputs(value);
  state.activeTopicId = '';
  state.currentPage = 1;
  if (!options.skipHash) window.location.hash = buildHash('search', value);
  else void runSearch(value, options);
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
  qs('searchButton')?.addEventListener('click', () => setSearch(qs('searchInput')?.value || ''));
  qs('searchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') setSearch(qs('searchInput')?.value || ''); });
  qs('speciesFilter')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('fieldFilter')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('annotationFilter')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('sortMode')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('pageSize')?.addEventListener('change', () => applyFilters(true, { skipUrl: true }));
  qs('resetButton')?.addEventListener('click', () => {
    state.submittedQuery = '';
    state.activeTopicId = '';
    state.currentPage = 1;
    syncSearchInputs('');
    qs('speciesFilter').value = '';
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
    if (homeSearchEl) { setSearch(homeSearchEl.getAttribute('data-home-search') || ''); return; }

    const topicEl = target.closest('[data-topic-search]');
    if (topicEl) { searchByTopic(topicEl.getAttribute('data-topic-search') || ''); return; }

    const viewEl = target.closest('[data-view]');
    if (viewEl) {
      const id = viewEl.getAttribute('data-view') || '';
      if (state.geneById.has(id)) { goToHash('gene', id); return; }
      if (['home', 'search', 'topics', 'browse', 'downloads', 'blast', 'sources', 'help'].includes(id)) { goToHash(id); return; }
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
  if (saved.speciesFilter !== undefined) qs('speciesFilter').value = saved.speciesFilter || '';
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
  renderStaticRoute(route.view);
}

function updateSummarySections() {
  renderTopicCards();
  renderBrowsePanels();
  renderDownloadCards();
  renderBlastContent();
  renderSourceContent();
  renderHelpContent();
}

async function init() {
  renderQuickSearches();
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








