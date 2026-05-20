// ─────────────────────────────────────────────────────────────────────
// featureFlagServer — SNIPPET DE REFERÊNCIA (não é importável)
// ─────────────────────────────────────────────────────────────────────
// ⚠️ Deno backend functions NÃO permitem local imports — cada função é
// deployada isolada. Este arquivo serve como CONTRATO/REFERÊNCIA do
// padrão a copiar dentro de cada backend function que precisar ler a flag.
//
// Padrão a inlinear (já aplicado em publicComplianceSubmit):
//
//   const V5_2_FLAG_PROVIDER = 'V5_2_Flags';
//   const V5_2_FLAG_KEY = 'score_engine_v5_2';
//   async function isV5_2EngineEnabled(base44) {
//     try {
//       const rows = await base44.asServiceRole.entities.IntegrationConfig.filter({ provider: V5_2_FLAG_PROVIDER });
//       const services = rows[0]?.services_enabled;
//       return Array.isArray(services) && services.includes(V5_2_FLAG_KEY);
//     } catch (_) { return false; }
//   }
//
// Storage: services_enabled é um array no schema fixo de IntegrationConfig.
// O campo `settings` NÃO aceita chaves arbitrárias (rejeitadas pela validação).
// ─────────────────────────────────────────────────────────────────────

const PROVIDER_KEY = 'V5_2_Flags';
const FLAG_KEY = 'score_engine_v5_2';

/**
 * Lê a flag server-side. Retorna `false` (default seguro) em qualquer erro.
 * @param {object} base44 - cliente Base44 (createClientFromRequest)
 * @returns {Promise<boolean>}
 */
export async function isV5_2EngineEnabled(base44) {
  try {
    const rows = await base44.asServiceRole.entities.IntegrationConfig.filter({ provider: PROVIDER_KEY });
    const cfg = rows[0];
    return !!(cfg?.settings?.[FLAG_KEY]);
  } catch (_) {
    return false;
  }
}