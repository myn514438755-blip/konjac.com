(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KonjacFunctionScorer = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const THEMES = [
    {
      id: 'kgm',
      title: 'KGM / glucomannan biosynthesis',
      description: 'Glucomannan, mannan, cellulose synthase-like and glycosyltransferase candidates.',
      terms: ['kgm', 'glucomannan', 'mannan', 'mannosyltransferase', 'cellulose synthase-like', 'csla', 'csl', 'glycosyltransferase', 'glycosyl transferase', 'cell wall polysaccharide']
    },
    {
      id: 'cellwall',
      title: 'Cell wall and polysaccharide metabolism',
      description: 'Cell wall, cellulose, pectin, xylan, lignin and expansin-related candidates.',
      terms: ['cell wall', 'polysaccharide', 'cellulose', 'pectin', 'xylan', 'lignin', 'expansin', 'xyloglucan', 'hemicellulose']
    },
    {
      id: 'tf',
      title: 'Transcription factor / DNA binding',
      description: 'PlantTFDB families and DNA-binding transcriptional regulators.',
      terms: ['transcription factor', 'planttfdb', 'wrky', 'myb', 'bhlh', 'nac', 'erf', 'bzip', 'dna binding', 'go:0003677']
    },
    {
      id: 'stress',
      title: 'Stress, defense and disease resistance',
      description: 'Stress response, defense, NBS-LRR, heat shock and peroxidase candidates.',
      terms: ['stress', 'defense', 'disease resistance', 'resistance protein', 'nbs-lrr', 'heat shock', 'peroxidase', 'pathogenesis']
    },
    {
      id: 'kinase',
      title: 'Kinase and receptor signaling',
      description: 'Protein kinase, receptor-like kinase and signaling candidates.',
      terms: ['kinase', 'protein kinase', 'receptor-like', 'serine/threonine', 'pf00069', 'go:0004672', 'signaling']
    },
    {
      id: 'transporter',
      title: 'Transporter',
      description: 'ABC, sugar, amino acid, ion transporter and aquaporin candidates.',
      terms: ['transporter', 'abc transporter', 'sugar transporter', 'amino acid transporter', 'ion transporter', 'aquaporin', 'membrane transport']
    },
    {
      id: 'enzyme',
      title: 'Enzyme and primary metabolism',
      description: 'Enzyme, EC, KO and metabolism-related candidates.',
      terms: ['enzyme', 'ec:', 'ec ', 'ko:', 'oxidoreductase', 'hydrolase', 'primary metabolism']
    },
    {
      id: 'domain',
      title: 'Domain-supported functional candidate',
      description: 'Candidates supported by Pfam or InterPro domain matches.',
      terms: ['pf', 'pfam', 'ipr', 'interpro', 'domain', 'family']
    }
  ];

  const FIELD_DEFS = [
    { key: 'gene_symbol', label: 'Gene symbol', weight: 14 },
    { key: 'functional_annotation', label: 'Functional annotation', weight: 34 },
    { key: 'go_terms', label: 'GO', weight: 26 },
    { key: 'go_slim_terms', label: 'GO slim', weight: 18 },
    { key: 'interpro_domains', label: 'InterPro', weight: 30 },
    { key: 'pfam_domains', label: 'Pfam', weight: 30 },
    { key: 'kegg_terms', label: 'KEGG', weight: 22 },
    { key: 'ko_id', label: 'KO', weight: 18 },
    { key: 'ec_number', label: 'EC', weight: 18 },
    { key: 'plantTFDB_family', label: 'PlantTFDB family', weight: 30 },
    { key: 'plantTFDB_description', label: 'PlantTFDB description', weight: 22 },
    { key: 'swissprot', label: 'Swiss-Prot', weight: 16 },
    { key: 'eggnog', label: 'eggNOG', weight: 12 },
    { key: 'notes', label: 'Notes', weight: 8 },
    { key: 'gene_id', label: 'Gene ID', weight: 6 }
  ];

  const SYNONYMS = {
    kgm: ['konjac glucomannan', 'glucomannan', 'mannan', 'mannosyltransferase', 'glycosyltransferase', 'cellulose synthase-like', 'csla', 'cell wall'],
    csl: ['cellulose synthase-like', 'csla', 'csld', 'cslh', 'mannan'],
    csla: ['cellulose synthase-like', 'mannan synthase', 'mannosyltransferase', 'glucomannan'],
    wrky: ['wrky', 'transcription factor', 'dna binding', 'go:0003677'],
    myb: ['myb', 'transcription factor', 'dna binding', 'go:0003677'],
    kinase: ['kinase', 'protein kinase', 'pf00069', 'go:0004672'],
    transporter: ['transporter', 'membrane transport', 'abc transporter']
  };

  function normalizeValue(value) {
    if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean).join(' ');
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function unique(values) {
    return Array.from(new Set(values.map(v => normalizeValue(v).toLowerCase()).filter(Boolean)));
  }

  function makeFieldValues(gene, field) {
    const value = gene ? gene[field.key] : '';
    if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean);
    const normalized = normalizeValue(value);
    return normalized ? [normalized] : [];
  }

  function queryTerms(query) {
    const raw = normalizeValue(query).toLowerCase();
    const tokens = raw.match(/[a-z0-9_.:-]+/g) || [];
    const expanded = [raw, ...tokens];
    tokens.forEach(token => {
      if (SYNONYMS[token]) expanded.push(...SYNONYMS[token]);
    });
    THEMES.forEach(theme => {
      if (theme.terms.some(term => raw.includes(term))) expanded.push(...theme.terms);
    });
    return unique(expanded).filter(term => term.length >= 2);
  }

  function termHit(value, term) {
    const text = normalizeValue(value).toLowerCase();
    if (!text || !term) return false;
    if (term.startsWith('go:') || term.startsWith('pf') || term.startsWith('ipr') || term.startsWith('ko:')) {
      return text.includes(term);
    }
    return text.includes(term);
  }

  function scoreGeneAgainstTerms(gene, terms, options = {}) {
    const evidence = [];
    let score = 0;
    FIELD_DEFS.forEach(field => {
      const values = makeFieldValues(gene, field);
      values.forEach(value => {
        const hits = terms.filter(term => termHit(value, term));
        if (!hits.length) return;
        const uniqueHits = unique(hits);
        const fieldScore = Math.min(field.weight, 8 + uniqueHits.length * 7);
        score += fieldScore;
        evidence.push({
          field: field.label,
          value,
          terms: uniqueHits,
          weight: fieldScore
        });
      });
    });
    if (options.requireGo && !evidence.some(item => item.field === 'GO' || item.field === 'GO slim')) return null;
    if (options.requireDomain && !evidence.some(item => item.field === 'InterPro' || item.field === 'Pfam')) return null;
    if (options.onlyTf && !normalizeValue(gene && gene.plantTFDB_family)) return null;
    const capped = Math.min(100, Math.round(score));
    if (capped <= 0) return null;
    evidence.sort((a, b) => b.weight - a.weight);
    return { score: capped, evidence: evidence.slice(0, 8) };
  }

  function scoreGeneThemes(gene) {
    return THEMES.map(theme => {
      const result = scoreGeneAgainstTerms(gene, theme.terms);
      return {
        themeId: theme.id,
        title: theme.title,
        description: theme.description,
        score: result ? result.score : 0,
        evidence: result ? result.evidence : []
      };
    }).sort((a, b) => b.score - a.score);
  }

  function rankGenesForFunction(genes, query, options = {}) {
    const terms = queryTerms(query);
    const limit = Number(options.limit) || 50;
    return (genes || [])
      .map(gene => {
        const result = scoreGeneAgainstTerms(gene, terms, options);
        if (!result) return null;
        const themes = scoreGeneThemes(gene);
        return {
          gene,
          score: result.score,
          evidence: result.evidence,
          topTheme: themes[0] || { themeId: '', title: '', score: 0 }
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || normalizeValue(a.gene.gene_id).localeCompare(normalizeValue(b.gene.gene_id)))
      .slice(0, limit);
  }

  return {
    THEMES,
    FIELD_DEFS,
    normalizeValue,
    queryTerms,
    scoreGeneAgainstTerms,
    scoreGeneThemes,
    rankGenesForFunction
  };
});
