(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KonjacGeneDisplay = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalize(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function firstAlias(gene) {
    return Array.isArray(gene?.aliases) ? normalize(gene.aliases.find(Boolean)) : '';
  }

  function getGeneSymbolLabel(gene) {
    return normalize(gene?.gene_symbol);
  }

  function getGeneDisplayName(gene) {
    return normalize(gene?.functional_annotation)
      || normalize(gene?.gene_name)
      || normalize(gene?.name)
      || normalize(gene?.product)
      || firstAlias(gene)
      || normalize(gene?.transcript_id)
      || normalize(gene?.protein_id)
      || '暂无名称注释';
  }

  return {
    getGeneSymbolLabel,
    getGeneDisplayName
  };
});
