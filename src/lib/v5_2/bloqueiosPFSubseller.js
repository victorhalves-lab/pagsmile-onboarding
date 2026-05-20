// ─────────────────────────────────────────────────────────────────────
// V5.2 Fase 4 — Catálogo Canônico: 8 Bloqueios PF + 3 Bloqueios Subseller PJ
// ─────────────────────────────────────────────────────────────────────
// FUNDAMENTO: DOC4 Bloco 4 §4.5 (Subseller PF) + DOC5 V5.2 §32-33 + DELTA.
//
// Esses 11 bloqueios são adicionais ao catálogo universal V5.2 (72 bloqueios).
// São disparados APENAS quando merchantType=PF (subseller PF) ou no caso dos
// 3 bloqueios PJ — quando isSubseller=true E grau=A/B/C.
//
// Cada bloqueio é DECLARATIVO: pode ser persistido como linha na entidade
// `Bloqueio` (entrada `nucleo_duro_regulatorio`, severidade, etc.) OU
// avaliado em runtime via o `avaliarBloqueiosPFSubseller()` puro deste módulo.
//
// FUNÇÃO PURA. Pipeline orquestra.
// ─────────────────────────────────────────────────────────────────────

import { TIERS } from './tiers';

// ─────────────────────────────────────────────────────────────────────
// 8 BLOQUEIOS PF (Subseller PF — graus A/B/C)
// ─────────────────────────────────────────────────────────────────────
export const BLOQUEIOS_PF = {
  'B-PF-1': {
    codigo: 'B-PF-1',
    titulo: 'Score de crédito PF crítico + renda alta declarada',
    categoria: 'FIN',
    severidade: 'BLOQUEIO',
    decisao_padrao: 'recusa_direta',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_3_estrutural',
    fundamentacao: 'Resol. BCB 4.557/2017 (gestão de risco) + Manual BACEN PLD',
    mensagem_analista: 'Score Serasa <300 com renda declarada >R$10k — incompatibilidade clara.',
    mensagem_cliente: null,
    exibe_para_cliente: false,
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-2': {
    codigo: 'B-PF-2',
    titulo: 'Comprometimento de renda extremo (TPV > 50× renda)',
    categoria: 'FIN',
    severidade: 'BLOQUEIO',
    decisao_padrao: 'recusa_direta',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_2_operacional',
    fundamentacao: 'Circ. BCB 3.978 Art. 19 + análise PLD',
    mensagem_analista: 'TPV mensal projetado >50× a renda líquida declarada — alto risco de fraude/lavagem.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-3': {
    codigo: 'B-PF-3',
    titulo: 'Restrições financeiras PF superiores a R$50k',
    categoria: 'FIN',
    severidade: 'ESCALACAO',
    decisao_padrao: 'revisao_manual_obrigatoria',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_1_documental',
    fundamentacao: 'Resol. BCB 4.557/2017',
    mensagem_analista: 'CPF com negativações ativas >R$50k — exige análise manual.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-PEP-1': {
    codigo: 'B-PF-PEP-1',
    titulo: 'Subseller PF é PEP / relacionado a PEP',
    categoria: 'PEP',
    severidade: 'ESCALACAO',
    decisao_padrao: 'revisao_manual_obrigatoria',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_3_estrutural',
    fundamentacao: 'Circ. BCB 3.978 Art. 19 + Lei 12.683/2012 Art. 9-B',
    mensagem_analista: 'CPF declarado/detectado como Pessoa Politicamente Exposta. Exige due diligence reforçada.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-SANC-1': {
    codigo: 'B-PF-SANC-1',
    titulo: 'Subseller PF em lista de sanções (OFAC/UN/UK/EU)',
    categoria: 'SAN',
    severidade: 'BLOQUEIO',
    decisao_padrao: 'recusa_direta',
    nucleo_duro_regulatorio: true,
    exception_categoria: 'nenhuma',
    fundamentacao: 'Lei 13.810/2019 + Lei 9.613/1998 Art. 11',
    mensagem_analista: 'CPF em lista internacional de sanções — bloqueio absoluto.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-FRAUDE-1': {
    codigo: 'B-PF-FRAUDE-1',
    titulo: 'Subseller PF com indicadores de fraude (menor de idade / CPF inválido)',
    categoria: 'FRA',
    severidade: 'BLOQUEIO',
    decisao_padrao: 'recusa_direta',
    nucleo_duro_regulatorio: true,
    exception_categoria: 'nenhuma',
    fundamentacao: 'CDC + Código Civil Art. 5º + Lei 13.709/2018 (LGPD menores)',
    mensagem_analista: 'CPF de menor de idade OU CPF inválido — bloqueio absoluto.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-DOC-1': {
    codigo: 'B-PF-DOC-1',
    titulo: 'Documentos PF essenciais ausentes',
    categoria: 'DOC',
    severidade: 'CONDICAO',
    decisao_padrao: 'aprovado_com_condicoes',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_1_documental',
    fundamentacao: 'Circ. BCB 3.978 Art. 17 (KYC)',
    mensagem_analista: 'Selfie OU documento de identidade ausente após 48h.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
  'B-PF-CB-1': {
    codigo: 'B-PF-CB-1',
    titulo: 'Subseller PF declara operação internacional sem capability crossborder',
    categoria: 'CB',
    severidade: 'ESCALACAO',
    decisao_padrao: 'revisao_manual_obrigatoria',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_3_estrutural',
    fundamentacao: 'FATF + Circ. BCB 3.978 Art. 22',
    mensagem_analista: 'PF declarou recebimento do exterior mas não tem perfil de operação crossborder.',
    aplicavel_tiers: [TIERS.SUBSELLER_PF],
  },
};

// ─────────────────────────────────────────────────────────────────────
// 3 BLOQUEIOS SUBSELLER PJ
// ─────────────────────────────────────────────────────────────────────
export const BLOQUEIOS_SUBSELLER_PJ = {
  'B-SUB-PJ-1': {
    codigo: 'B-SUB-PJ-1',
    titulo: 'Subseller PJ excede teto do grau C (>R$500k TPV/mês)',
    categoria: 'OPE',
    severidade: 'ESCALACAO',
    decisao_padrao: 'revisao_manual_obrigatoria',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_2_operacional',
    fundamentacao: 'Resol. BCB 80/2021 (limites sub-credenciamento)',
    mensagem_analista: 'TPV declarado excede o limite máximo do grau C subseller PJ — promover para seller principal.',
    aplicavel_tiers: [TIERS.SUBSELLER_PJ],
  },
  'B-SUB-PJ-2': {
    codigo: 'B-SUB-PJ-2',
    titulo: 'Seller mestre do subseller não tem capability splits/subseller ativa',
    categoria: 'KYB',
    severidade: 'BLOQUEIO',
    decisao_padrao: 'recusa_direta',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_3_estrutural',
    fundamentacao: 'Resol. BCB 80/2021 Art. 4º',
    mensagem_analista: 'O seller mestre não está habilitado para operar com subsellers — habilitar capability antes de processar o subseller.',
    aplicavel_tiers: [TIERS.SUBSELLER_PJ],
  },
  'B-SUB-PJ-3': {
    codigo: 'B-SUB-PJ-3',
    titulo: 'Subseller PJ com mesmo UBO de outro subseller já recusado',
    categoria: 'FRA',
    severidade: 'BLOQUEIO',
    decisao_padrao: 'recusa_direta',
    nucleo_duro_regulatorio: false,
    exception_categoria: 'cat_3_estrutural',
    fundamentacao: 'Circ. BCB 3.978 Art. 19 + análise PLD',
    mensagem_analista: 'UBO do subseller já vinculado a caso recusado nos últimos 12 meses — provável tentativa de re-cadastro.',
    aplicavel_tiers: [TIERS.SUBSELLER_PJ],
  },
};

/**
 * União dos catálogos (11 bloqueios).
 */
export const BLOQUEIOS_PF_SUBSELLER = {
  ...BLOQUEIOS_PF,
  ...BLOQUEIOS_SUBSELLER_PJ,
};

export const BLOQUEIOS_PF_SUBSELLER_CODES = Object.keys(BLOQUEIOS_PF_SUBSELLER);

// ─────────────────────────────────────────────────────────────────────
// Avaliador puro: dado o resultado da capability financeira + contexto,
// retorna lista de bloqueios disparados.
// ─────────────────────────────────────────────────────────────────────

/**
 * Avalia bloqueios PF + Subseller PJ.
 *
 * @param {Object} ctx
 * @param {string} ctx.tier
 * @param {boolean} ctx.isSubseller
 * @param {string} ctx.grau
 * @param {number} ctx.tpvMensalDeclarado
 * @param {Object} ctx.resultadoFinanceiro - saída de avaliarCapacidadeFinanceira()
 * @param {Object} ctx.bdcSnapshot
 * @param {Object} ctx.respostas
 * @param {Object} ctx.sellerMaster - { capabilities_ativas: string[] } do seller pai
 * @param {string[]} ctx.ubo_ja_recusado_caseIds - IDs de casos recusados com mesmo UBO
 * @returns {Array<{codigo, ...metadata, razao}>}
 */
export function avaliarBloqueiosPFSubseller(ctx = {}) {
  const disparados = [];
  const {
    tier,
    isSubseller = false,
    grau,
    tpvMensalDeclarado,
    resultadoFinanceiro = {},
    bdcSnapshot = {},
    respostas = {},
    sellerMaster = {},
    ubo_ja_recusado_caseIds = [],
  } = ctx;

  // ─── PF ─────────────────────────────────────────────────────────
  if (tier === TIERS.SUBSELLER_PF) {
    // Códigos sugeridos pela capability financeira
    const sugeridos = resultadoFinanceiro.bloqueios_sugeridos || [];
    for (const code of sugeridos) {
      const meta = BLOQUEIOS_PF_SUBSELLER[code];
      if (meta) disparados.push({ ...meta, razao: 'capacidade financeira PF' });
    }

    // PEP/sanção
    if (respostas.tem_socio_pep === true || bdcSnapshot.pep_pf === true) {
      disparados.push({ ...BLOQUEIOS_PF['B-PF-PEP-1'], razao: 'PEP detectado' });
    }
    if (bdcSnapshot.sancao_internacional_pf === true) {
      disparados.push({ ...BLOQUEIOS_PF['B-PF-SANC-1'], razao: 'sanção internacional detectada' });
    }

    // CB sem capability
    const declarouInternacional =
      respostas.opera_internacional === true ||
      respostas.opera_internacional === 'sim' ||
      Number(respostas.pct_volume_internacional || 0) > 0;
    const capCbAtiva = (ctx.capabilities_ativas || []).includes('crossborder');
    if (declarouInternacional && !capCbAtiva) {
      disparados.push({ ...BLOQUEIOS_PF['B-PF-CB-1'], razao: 'opera internacional sem capability' });
    }

    // Documentos ausentes (sinalizado pelo pipeline em ctx.doc_status)
    if (ctx.doc_status === 'incompleto_apos_48h') {
      disparados.push({ ...BLOQUEIOS_PF['B-PF-DOC-1'], razao: 'documentos ausentes >48h' });
    }
  }

  // ─── Subseller PJ ────────────────────────────────────────────────
  if (tier === TIERS.SUBSELLER_PJ && isSubseller) {
    // B-SUB-PJ-1: excede teto grau C
    const tpv = Number(tpvMensalDeclarado) || 0;
    if (grau === 'C' && tpv > 500_000) {
      disparados.push({ ...BLOQUEIOS_SUBSELLER_PJ['B-SUB-PJ-1'], razao: `TPV R$${tpv} excede limite grau C` });
    }

    // B-SUB-PJ-2: seller master sem capability
    const masterCaps = sellerMaster.capabilities_ativas || [];
    if (!masterCaps.includes('splits/subseller')) {
      disparados.push({ ...BLOQUEIOS_SUBSELLER_PJ['B-SUB-PJ-2'], razao: 'seller mestre sem splits/subseller' });
    }

    // B-SUB-PJ-3: UBO já recusado
    if (Array.isArray(ubo_ja_recusado_caseIds) && ubo_ja_recusado_caseIds.length > 0) {
      disparados.push({
        ...BLOQUEIOS_SUBSELLER_PJ['B-SUB-PJ-3'],
        razao: `UBO vinculado a ${ubo_ja_recusado_caseIds.length} caso(s) recusado(s)`,
      });
    }
  }

  return disparados;
}

/**
 * Helper: retorna catálogo como array (formato compatível com avaliarBloqueios.js).
 */
export function bloqueiosPFSubsellerComoCatalogo() {
  return Object.values(BLOQUEIOS_PF_SUBSELLER).map((b) => ({
    ...b,
    ativo: true,
    tiers_aplicaveis: b.aplicavel_tiers,
    segmentos_aplicaveis: ['all'],
  }));
}