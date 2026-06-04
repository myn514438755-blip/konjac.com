import assert from 'node:assert/strict';
import display from './gene-display-core.js';

const namedGene = {
  gene_id: 'evm.model.CTG_10.6_Akon',
  gene_symbol: '',
  functional_annotation: 'Thylakoid lumenal P17.1 protein',
  aliases: ['M0RGH4']
};

const symbolGene = {
  gene_id: 'evm.model.CTG_1.1_Akon',
  gene_symbol: 'WRKY',
  functional_annotation: 'WRKY transcription factor',
  aliases: []
};

assert.equal(display.getGeneDisplayName(namedGene), 'Thylakoid lumenal P17.1 protein');
assert.equal(display.getGeneDisplayName(symbolGene), 'WRKY transcription factor');
assert.equal(display.getGeneSymbolLabel(namedGene), '');
assert.equal(display.getGeneSymbolLabel(symbolGene), 'WRKY');

console.log('gene display tests passed');
