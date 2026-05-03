const DATA_URL = './data/genes.json';
const SUMMARY_URL = './data/build_summary.json';
const OVERLAY_INDEX_URL = './data/processed/annotations/overlay/annotation_overlay_index.json';
const JBROWSE_SEQID_MAP_URL = './data/processed/jbrowse/seqid_map.json';
const SEARCH_STATE_KEY = 'konjac_gene_search_state_v1';
const DATA_BYTES_HINT = 63035084;

const VIEW_IDS = ['homeView', 'searchView', 'geneView', 'topicsView', 'browseView', 'downloadsView', 'sourcesView', 'helpView'];
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
  overlayChunkPromise: new Map()
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
  const s = state.summary.stats || {};
  qs('statGenes').textContent = formatNumber(s.gene_count ?? state.genes.length ?? '-');
  qs('statGo').textContent = formatNumber(s.go_count ?? '-');
  qs('statKegg').textContent = formatNumber(s.kegg_count ?? '-');
  qs('statInterpro').textContent = formatNumber(s.interpro_count ?? '-');
  qs('statTf').textContent = formatNumber(s.tf_count ?? '-');
  qs('statUpdated').textContent = state.summary.website_last_updated || '待补充';
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
    { title: '基因组浏览器', href: './data/processed/jbrowse-app/index.html', desc: '查看基因组坐标、基因结构和 GFF 注释轨道。', external: true },
    { title: '数据下载', href: '#downloads', desc: '下载整合表、GFF、CDS、protein FASTA 和 ZEN 文件。' },
    { title: '数据来源与引用', href: '#sources', desc: '查看数据来源、引用格式、许可说明和维护信息。' },
    { title: '使用帮助', href: '#help', desc: '查看搜索示例、本地运行方法和后续升级计划。' }
  ];
  qs('homeModules').innerHTML = items.map(item => `
    <a class="module-card" href="${escapeHtml(item.href)}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
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
  qs('detailTitle').textContent = '数据来源与引用';
  qs('detailContent').innerHTML = `
    <div class="detail-grid">
      <article class="card">
        <h3>当前数据集</h3>
        <dl>
          <dt>物种</dt><dd>Amorphophallus konjac</dd>
          <dt>基因组</dt><dd>PlantGARDEN t78372.G001 / NCBI assembly GCA_022559845.1</dd>
          <dt>基因模型</dt><dd>PlantGARDEN clean.gff</dd>
          <dt>CDS / 蛋白</dt><dd>clean.cds / clean.pep</dd>
          <dt>功能注释</dt><dd>ZEN annotation v2.0, GO, GO slim, KEGG/KO/EC, InterPro, Pfam, PlantTFDB</dd>
          <dt>网站版本</dt><dd>v1.2.1 static build</dd>
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
          <li>DOI、许可、维护者和联系信息当前均为待补充，发布前需要人工核对。</li>
          <li>当前静态版本不包含 BLAST、JBrowse 和表达热图。</li>
        </ul>
      </article>
    </div>
  `;
}

function renderHelpContent() {
  qs('detailTitle').textContent = '使用帮助';
  qs('detailContent').innerHTML = `
    <div class="help-grid">
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
          <li>点击首页“基因查询”进入搜索页。</li>
          <li>输入 Gene ID、关键词、GO、KEGG、Pfam 或转录因子家族并搜索。</li>
          <li>在结果中使用“复制 ID”“查看详情”“上一页/下一页”等操作。</li>
          <li>在详情页查看功能注释、序列与下载链接。</li>
        </ol>
        <p class="help-note">基因组浏览器用于查看基因组坐标、基因结构和 GFF 注释轨道。</p>
      </article>
      <article class="card">
        <h3>本地运行</h3>
        <pre><code>python -m http.server 8000</code></pre>
        <p>然后打开 <code>http://localhost:8000</code>。</p>
      </article>
      <article class="card">
        <h3>常见问题</h3>
        <ul class="check-list">
          <li>首页只展示门户入口，不直接展开所有结果。</li>
          <li>搜索结果默认分页显示，避免一次性加载过多内容。</li>
          <li>“待补充”表示该信息尚未核实，不会自动编造。</li>
        </ul>
      </article>
      <article class="card full">
        <h3>后续升级</h3>
        <ul class="check-list">
          <li>可选 BLAST 集成</li>
          <li>可选 JBrowse 集成</li>
          <li>可选 RNA-seq / 共表达模块</li>
        </ul>
      </article>
    </div>
  `;
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
      <a class="button ghost small" href="${escapeHtml(location.href)}" target="_blank" rel="noopener noreferrer">
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
        <strong>${highlightText(gene.gene_id)}</strong>
        <div class="row-actions">
          <button class="mini-link" data-action="copy-gene-id" data-gene-id="${escapeHtml(gene.gene_id)}" data-copy="${escapeHtml(gene.gene_id)}" data-copy-message="已复制 Gene ID">复制 ID</button>
          <button class="mini-link" data-search="${escapeHtml(gene.gene_id)}">搜索</button>
        </div>
      </td>
      <td data-label="Symbol">${highlightText(gene.gene_symbol)}<br>${renderTagList(gene.aliases, 3)}</td>
      <td data-label="Location">${highlightText(geneLocation(gene))}<br><span class="muted">${escapeHtml(displayValue(gene.species))}</span></td>
      <td data-label="Function">${highlightText(gene.functional_annotation, 220)}</td>
      <td data-label="Evidence"><div class="evidence-list">${evidenceBadges(gene)}</div></td>
      <td data-label="Action"><button class="button ghost small" data-view="${escapeHtml(gene.gene_id)}">查看详情</button></td>
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
  if (['topics', 'browse', 'downloads', 'sources', 'help'].includes(path)) return { view: path, query: '', id: '' };
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
  qs('homeSearchButton')?.addEventListener('click', () => setSearch(qs('homeSearchInput')?.value || ''));
  qs('homeSearchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') setSearch(qs('homeSearchInput')?.value || ''); });
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
      if (['home', 'search', 'topics', 'browse', 'downloads', 'sources', 'help'].includes(id)) { goToHash(id); return; }
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


