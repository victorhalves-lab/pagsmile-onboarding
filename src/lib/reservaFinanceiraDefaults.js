/**
 * reservaFinanceiraDefaults.js — Rolling Reserve / Reserva Financeira.
 *
 * Regras de negócio (v2026-05-12):
 *   • PIX:    percentuais permitidos = 1, 2, 3, 4, 5 — prazo SEMPRE 90 dias.
 *   • Cartão: percentuais permitidos = 5, 10, 15, 20 — prazo SEMPRE 180 dias.
 *   • Default Pagsmile: PIX 1%/90d + Cartão 20%/180d.
 *   • Disclaimer fixo: pode ser liberado antes conforme saudabilidade da operação.
 *
 * IMPORTANTE: prazos são FIXOS e NÃO editáveis pelo vendedor.
 */

export const PIX_PERCENT_OPTIONS = [1, 2, 3, 4, 5];
export const CARTAO_PERCENT_OPTIONS = [5, 10, 15, 20];

export const PIX_DIAS_RETENCAO = 90;
export const CARTAO_DIAS_RETENCAO = 180;

export const DEFAULT_DISCLAIMER =
  'A reserva financeira poderá ser liberada antecipadamente conforme a saudabilidade da operação.';

export const DEFAULT_RESERVA = {
  pix: { percentual: 1, diasRetencao: PIX_DIAS_RETENCAO, ativa: true },
  cartao: { percentual: 20, diasRetencao: CARTAO_DIAS_RETENCAO, ativa: true },
  disclaimer: DEFAULT_DISCLAIMER,
};

/**
 * Garante que rates.reservaFinanceira existe e tem o shape esperado.
 * Usado tanto no read (PropostaPublica) quanto no save (CriarProposta).
 *
 * Tolerante a:
 *   • Propostas antigas sem o campo (retorna o default)
 *   • Percentuais fora da lista (snap para o mais próximo permitido)
 *   • Prazos editados (força os fixos 90 / 180)
 */
export function getReservaWithDefaults(rates) {
  const r = rates?.reservaFinanceira || {};
  const pix = r.pix || {};
  const cartao = r.cartao || {};
  return {
    pix: {
      percentual: snapToList(pix.percentual, PIX_PERCENT_OPTIONS, DEFAULT_RESERVA.pix.percentual),
      diasRetencao: PIX_DIAS_RETENCAO,
      ativa: pix.ativa !== false,
    },
    cartao: {
      percentual: snapToList(cartao.percentual, CARTAO_PERCENT_OPTIONS, DEFAULT_RESERVA.cartao.percentual),
      diasRetencao: CARTAO_DIAS_RETENCAO,
      ativa: cartao.ativa !== false,
    },
    // Disclaimer é FIXO — nunca editável. Ignora qualquer valor gravado.
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

function snapToList(value, list, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  if (list.includes(n)) return n;
  // Snap para o valor permitido mais próximo
  return list.reduce((closest, opt) =>
    Math.abs(opt - n) < Math.abs(closest - n) ? opt : closest, list[0]);
}