import React from 'react';
import Term from './Term';
import { getTerm } from '@/lib/v5_2/glossary';

/**
 * [V5.2 Fase 6.5.4] Wrapper inteligente que resolve o `code` do glossário a partir
 * de um identificador dinâmico de bloqueio (ex: "B-FIN-1", "B03", "B-CB-1") OU de
 * uma categoria/status (ex: status do Patch Financeiro: "verde", "amarelo"...).
 *
 * Regras de resolução (na ordem):
 *   1. Tenta mapear via tabela de aliases conhecidos (BLOCK_ALIASES / PATCH_ALIASES)
 *   2. Se não encontrar, normaliza o ID para snake_case e procura no glossário
 *   3. Se ainda não existir, renderiza apenas o texto sem tooltip (graceful fail)
 *
 * Props:
 *   - blockCode: ID do bloqueio (B-FIN-1, B03, B-CB-1, ...)
 *   - patchStatus: status do Patch (verde, amarelo, laranja, vermelho)
 *   - children: texto a renderizar (default = blockCode|patchStatus)
 *   - icon, inline, className → repassados ao Term
 */

// Aliases para bloqueios dinâmicos → códigos do GLOSSARY_V5_2
const BLOCK_ALIASES = {
  'B-FIN-1': 'b_fin_1',
  'B03': 'b_03',
  'B3': 'b_03',
  'B10': 'b_10',
  'B-CB-1': 'b_cb_1',
  'B-PV-LGPD-1-CRIT': 'b_pv_lgpd_1_crit',
  'B-GW-PCI-CRIT-1': 'b_gw_pci_crit_1',
};

// Aliases para status do Patch
const PATCH_ALIASES = {
  verde: 'patch_verde',
  amarelo: 'patch_amarelo',
  laranja: 'patch_laranja',
  vermelho: 'patch_vermelho',
  nao_aplicavel: 'patch_financeiro',
};

export default function TermBlock({ blockCode, patchStatus, children, ...rest }) {
  let code = null;

  if (blockCode) {
    code = BLOCK_ALIASES[blockCode];
    if (!code) {
      // Tenta normalizar: B-FIN-1 → b_fin_1
      const norm = blockCode.toLowerCase().replace(/-/g, '_');
      if (getTerm(norm)) code = norm;
    }
  } else if (patchStatus) {
    code = PATCH_ALIASES[patchStatus];
  }

  if (!code) {
    return <span className={rest.className}>{children || blockCode || patchStatus}</span>;
  }

  return <Term code={code} {...rest}>{children || blockCode || patchStatus}</Term>;
}