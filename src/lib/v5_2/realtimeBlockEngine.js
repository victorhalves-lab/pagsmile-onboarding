// ──────────────────────────────────────────────────────────────────────────────
// V5.2 — Engine de Bloqueios em Tempo Real (Fase 5.6)
// ──────────────────────────────────────────────────────────────────────────────
// Avalia respostas parciais durante o questionário e devolve uma lista de
// "soft warnings" (que o seller pode revisar) e "hard blocks" (que travam o
// avanço — bloqueios absolutos do núcleo duro regulatório).
//
// É puro JS — pode rodar a cada `onChange` para mostrar mensagem inline em
// real-time. NÃO substitui a avaliação final no backend (avaliarBloqueios.js),
// apenas dá feedback imediato ao seller para reduzir retrabalho.
//
// REGRAS COBERTAS NESTA SPRINT (sementes do Bloco 5.6):
//   - B05: CNPJ situação ≠ ATIVA → HARD
//   - B-CB-PAIS-CRIT-1: País FATF blacklist (crossborder) → HARD
//   - B-CB-1: País FATF blacklist (qualquer crossborder declarado) → HARD
//   - B-FIN-1: capital_social muito menor que TPV anual projetado → SOFT
//   - B-MCC-HIGH-RISK: MCC alto risco → SOFT (escalação tier 3, não bloqueio)
//   - B10 / lista suja MTE (via bdcSnapshot) → HARD
//   - B-PEP-UNDECLARED: PEP no BDC mas seller declarou que não → HARD
//
// As regras são DECLARATIVAS (RULES array) para facilitar manutenção.
// ──────────────────────────────────────────────────────────────────────────────

const PAISES_FATF_BLACKLIST = new Set(['IR', 'KP', 'MM']);
const MCC_ALTO_RISCO = new Set(['5912', '5993', '7995', '6051', '6211', '5816', '5817', '5818', '4829', '5967']);

function toNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Cada regra é { codigo, severity ('soft'|'hard'), evaluate(ctx) → string | null }
 * Se evaluate retorna string, é disparada com essa mensagem. Se null, ok.
 *
 * ctx = { respostas, bdcSnapshot, segmento, tier, capabilities_ativas }
 */
const RULES = [
  {
    codigo: 'B05',
    severity: 'hard',
    evaluate: ({ respostas }) => {
      const sit = respostas?.q_base_cnpj_situacao || respostas?.cnpj_situacao;
      if (sit && sit !== 'ATIVA') {
        return `CNPJ está com situação "${sit}" na Receita Federal — esperamos ATIVA.`;
      }
      return null;
    },
  },
  {
    codigo: 'B-CB-PAIS-CRIT-1',
    severity: 'hard',
    evaluate: ({ respostas, segmento, capabilities_ativas = [] }) => {
      const paises = Array.isArray(respostas?.q_cap_crossborder_paises_destino)
        ? respostas.q_cap_crossborder_paises_destino
        : (respostas?.paises_destino || []);
      const isCrossborder = segmento === 'crossborder' || capabilities_ativas.includes('crossborder');
      if (!isCrossborder) return null;
      const blacks = paises.filter((p) => PAISES_FATF_BLACKLIST.has(String(p).toUpperCase()));
      if (blacks.length > 0) {
        return `Crossborder em país FATF blacklist (${blacks.join(', ')}) — bloqueio absoluto.`;
      }
      return null;
    },
  },
  {
    codigo: 'B-CB-1',
    severity: 'hard',
    evaluate: ({ respostas, capabilities_ativas = [] }) => {
      const paises = Array.isArray(respostas?.q_cap_crossborder_paises_destino)
        ? respostas.q_cap_crossborder_paises_destino
        : (respostas?.paises_destino || []);
      if (!capabilities_ativas.includes('crossborder')) return null;
      const blacks = paises.filter((p) => PAISES_FATF_BLACKLIST.has(String(p).toUpperCase()));
      if (blacks.length > 0) {
        return `País em lista FATF detectado (${blacks.join(', ')}). Recusa direta por regulamentação.`;
      }
      return null;
    },
  },
  {
    codigo: 'B-FIN-1',
    severity: 'soft',
    evaluate: ({ respostas }) => {
      const capital = toNumber(respostas?.q_base_capital_social || respostas?.capital_social);
      const tpvMensal = toNumber(respostas?.q_base_tpv_mensal_declarado || respostas?.tpv_mensal_declarado);
      if (capital > 0 && tpvMensal > 0) {
        const tpvAnual = tpvMensal * 12;
        if (tpvAnual > capital * 24) {
          return `TPV anual projetado (R$ ${tpvAnual.toLocaleString('pt-BR')}) é muito superior ao Capital Social (R$ ${capital.toLocaleString('pt-BR')}). Pode exigir comprovação adicional.`;
        }
      }
      return null;
    },
  },
  {
    codigo: 'B-MCC-HIGH-RISK',
    severity: 'soft',
    evaluate: ({ respostas }) => {
      const mcc = String(respostas?.q_base_mcc || respostas?.mcc || '').trim();
      if (MCC_ALTO_RISCO.has(mcc)) {
        return `MCC ${mcc} é categorizado como alto risco — seu cadastro será analisado em Tier 3.`;
      }
      return null;
    },
  },
  {
    codigo: 'B10',
    severity: 'hard',
    evaluate: ({ bdcSnapshot }) => {
      if (bdcSnapshot?.lista_suja_mte === true) {
        return 'CNPJ identificado na Lista Suja do MTE (trabalho análogo ao escravo). Bloqueio absoluto.';
      }
      return null;
    },
  },
  {
    codigo: 'B-PEP-UNDECLARED',
    severity: 'hard',
    evaluate: ({ respostas, bdcSnapshot }) => {
      const bdcPep = bdcSnapshot?.pep_detectado === true;
      const declaredPep = respostas?.q_pep_declarado === true || respostas?.tem_socio_pep === true;
      if (bdcPep && !declaredPep && declaredPep !== undefined) {
        return 'Detectamos vínculo PEP em fontes oficiais mas não foi declarado. Ajuste sua resposta para prosseguir.';
      }
      return null;
    },
  },
];

/**
 * Avalia respostas parciais e retorna { soft: [], hard: [] }.
 *
 * @param {object} ctx { respostas, bdcSnapshot, segmento, tier, capabilities_ativas }
 * @returns {{ soft: Array<{codigo, message}>, hard: Array<{codigo, message}> }}
 */
export function evaluateRealtimeBlocks(ctx = {}) {
  const soft = [];
  const hard = [];
  for (const rule of RULES) {
    const msg = rule.evaluate(ctx);
    if (!msg) continue;
    (rule.severity === 'hard' ? hard : soft).push({ codigo: rule.codigo, message: msg });
  }
  return { soft, hard };
}

/**
 * Retorna apenas se há algum HARD block ativo (impedindo avanço).
 */
export function hasHardBlock(ctx) {
  return evaluateRealtimeBlocks(ctx).hard.length > 0;
}

export const _internal = { RULES, PAISES_FATF_BLACKLIST, MCC_ALTO_RISCO };