import assert from 'node:assert/strict';
import scorer from './function-scorer-core.js';

const kgmGene = {
  gene_id: 'evm.model.HIC_ASM_10.860_Akon',
  gene_symbol: 'CSLA',
  functional_annotation: 'cellulose synthase-like protein involved in glucomannan biosynthesis',
  go_terms: ['GO:0016757 transferase activity'],
  interpro_domains: ['IPR005150 Glycosyltransferase family'],
  pfam_domains: ['PF00535 Glycosyl transferase family 2'],
  kegg_terms: ['starch and sucrose metabolism'],
  ko_id: 'K00703',
  ec_number: '2.4.1.-',
  plantTFDB_family: ''
};

const kinaseGene = {
  gene_id: 'evm.model.CTG_28.2_Akon',
  gene_symbol: '',
  functional_annotation: 'receptor-like protein kinase',
  go_terms: ['GO:0004672 protein kinase activity'],
  interpro_domains: ['IPR000719 Protein kinase domain'],
  pfam_domains: ['PF00069 Protein kinase domain'],
  kegg_terms: [],
  ko_id: '',
  ec_number: '',
  plantTFDB_family: ''
};

const tfGene = {
  gene_id: 'evm.model.CTG_1.1_Akon',
  gene_symbol: 'WRKY',
  functional_annotation: 'WRKY transcription factor',
  go_terms: ['GO:0003677 DNA binding'],
  interpro_domains: [],
  pfam_domains: ['PF03106 WRKY DNA-binding domain'],
  kegg_terms: [],
  ko_id: '',
  ec_number: '',
  plantTFDB_family: 'WRKY'
};

{
  const result = scorer.scoreGeneThemes(kgmGene)[0];
  assert.equal(result.themeId, 'kgm');
  assert.ok(result.score >= 70, `expected KGM score >= 70, got ${result.score}`);
  assert.ok(result.evidence.some(item => item.field === 'Functional annotation'));
}

{
  const rows = scorer.rankGenesForFunction([kgmGene, kinaseGene, tfGene], 'glucomannan biosynthesis', { limit: 3 });
  assert.equal(rows[0].gene.gene_id, kgmGene.gene_id);
  assert.ok(rows[0].score > 0);
}

{
  const rows = scorer.rankGenesForFunction([kgmGene, kinaseGene, tfGene], 'PF00069 kinase', { limit: 3 });
  assert.equal(rows[0].gene.gene_id, kinaseGene.gene_id);
  assert.ok(rows[0].evidence.some(item => item.value.includes('PF00069')));
}

{
  const rows = scorer.rankGenesForFunction([kgmGene, kinaseGene, tfGene], 'WRKY transcription factor', { limit: 3 });
  assert.equal(rows[0].gene.gene_id, tfGene.gene_id);
  assert.equal(rows[0].topTheme.themeId, 'tf');
}

console.log('function scorer tests passed');
