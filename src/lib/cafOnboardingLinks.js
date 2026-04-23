/**
 * Mapa: modelo de compliance V4 → link de Onboarding Web CAF (cadastro.io).
 *
 * Cada link é um Query Template configurado no Trust Platform da CAF para o segmento.
 * O webhook URL desses templates deve estar apontando para /functions/cafWebhookHandler
 * (configurado manualmente no Trust Platform).
 *
 * Uso: quando o cliente falha 2x no FaceMatch/Liveness via SDK embarcado, oferecer
 * o link do segmento como fallback. Passamos externalId=<onboardingCaseId> na query
 * string para garantir vínculo determinístico do resultado ao cliente correto.
 *
 * ⚠️ Estes são os DEFAULTS hardcoded. Admin pode sobrescrever cada link via UI
 * (IntegracoesExternas → aba "Fallback CAF"), que salva em ComplianceConfig.
 * Em runtime, use `fetchCafFallbackLinks()` para pegar o mapa mesclado (overrides
 * da ComplianceConfig + defaults daqui).
 */

// SDK-FREE: this module may be imported from PUBLIC routes (CafVerificationStep).
// callPublicFunction works for anonymous clients; getCafFallbackLinks is safe to
// expose (returns a read-only map of fallback URLs configured by the admin).
import { callPublicFunction } from '@/lib/publicApi';

// Cache simples in-memory (TTL 60s) para não bater o backend toda hora
let _linksCache = null;
let _linksCacheAt = 0;
const LINKS_CACHE_TTL_MS = 60_000;

export async function fetchCafFallbackLinks({ force = false } = {}) {
  const now = Date.now();
  if (!force && _linksCache && (now - _linksCacheAt) < LINKS_CACHE_TTL_MS) {
    return _linksCache;
  }
  try {
    const body = await callPublicFunction('getCafFallbackLinks', {});
    const payload = body?.data ?? body;
    if (payload?.links) {
      _linksCache = payload.links;
      _linksCacheAt = now;
      return _linksCache;
    }
  } catch (err) {
    console.warn('[cafOnboardingLinks] Falha ao buscar overrides, usando defaults:', err?.message);
  }
  return CAF_ONBOARDING_LINKS_BY_COMPLIANCE_V4;
}

export const CAF_ONBOARDING_LINKS_BY_COMPLIANCE_V4 = {
  ComplianceGatewayV4:            'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  ComplianceDropshippingV4:       'https://cadastro.io/11b31cdf4650c56126d766671e15e8d4',
  ComplianceEcommerceV4:          'https://cadastro.io/f97ba64b86ae1964ff85e0ad9e833d63',
  ComplianceEducacaoV4:           'https://cadastro.io/6b2852b7919ea3f65edca7667f81bf58',
  ComplianceInfoprodutosV4:       'https://cadastro.io/ede0e7c940889f03adbbf5f5a49400b9',
  ComplianceMerchantLinkV4:       'https://cadastro.io/3ff25303e2a775e8aefa01575f4435fb',
  ComplianceMPEV4:                'https://cadastro.io/2df6ae66b394e25da18ae5acb2afc221',
  CompliancePlataformaVerticalV4: 'https://cadastro.io/c970cf175a8facad0185d452edf39ccb',
  ComplianceSaaSV4:               'https://cadastro.io/597a5b430412b83fa526211e0e9beb7e',
  ComplianceMarketplaceV4:        'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
  // PIX — mesmo link oficial para merchant e intermediário
  CompliancePixMerchantV4:        'https://cadastro.io/22bd30f9dfad265e9c5f8497bbbea476',
  CompliancePixIntermediarioV4:   'https://cadastro.io/22bd30f9dfad265e9c5f8497bbbea476',
};

/**
 * Monta a URL do fallback CAF com pré-preenchimento + vínculo via externalId.
 *
 * @param {string} complianceModel - Ex: 'ComplianceGatewayV4'
 * @param {object} context - { onboardingCaseId, cnpj, cpf, name, email, linksOverride? }
 * @returns {string|null} URL completa ou null se modelo não mapeado
 *
 * Se context.linksOverride for passado (mapa já carregado via fetchCafFallbackLinks),
 * ele é usado em vez dos defaults — permite respeitar customizações do admin.
 */
export function buildCafFallbackUrl(complianceModel, context = {}) {
  const linksMap = context.linksOverride || CAF_ONBOARDING_LINKS_BY_COMPLIANCE_V4;
  const baseUrl = linksMap[complianceModel];
  if (!baseUrl) return null;

  const params = new URLSearchParams();

  // externalId = vínculo infalível. Volta no webhook (attributes/variables/metadata.externalId).
  if (context.onboardingCaseId) {
    params.set('externalId', context.onboardingCaseId);
  }
  // Pré-preenchimento (reduz erro humano, bate CNPJ no webhook)
  if (context.cnpj) {
    const clean = String(context.cnpj).replace(/\D/g, '');
    if (clean.length === 14) params.set('cnpj', clean);
  }
  if (context.cpf) {
    const clean = String(context.cpf).replace(/\D/g, '');
    if (clean.length === 11) params.set('cpf', clean);
  }
  if (context.name) params.set('name', context.name);
  if (context.email) params.set('email', context.email);

  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}