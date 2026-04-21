import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * getCafFallbackLinks — Retorna os links CAF cadastro.io por modelo de compliance.
 *
 * Faz merge de:
 *  1. Defaults hardcoded (em lib/cafOnboardingLinks.js no frontend — duplicados aqui)
 *  2. Overrides em ComplianceConfig (category='CAF_FALLBACK_LINKS', configKey='caf_fallback_link_<MODEL>')
 *
 * Público (sem auth) — leitura apenas. Usado pelo frontend para o fallback CAF.
 */

const DEFAULT_LINKS = {
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
  CompliancePixMerchantV4:        'https://cadastro.io/22bd30f9dfad265e9c5f8497bbbea476',
  CompliancePixIntermediarioV4:   'https://cadastro.io/22bd30f9dfad265e9c5f8497bbbea476',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Busca overrides em ComplianceConfig
    const configs = await base44.asServiceRole.entities.ComplianceConfig.filter({
      category: 'CAF_FALLBACK_LINKS',
      isActive: true,
    });

    const overrides = {};
    for (const c of configs) {
      const key = c.configKey || '';
      // Esperamos: caf_fallback_link_ComplianceGatewayV4
      if (key.startsWith('caf_fallback_link_') && c.configValue) {
        const model = key.replace('caf_fallback_link_', '');
        overrides[model] = c.configValue;
      }
    }

    const merged = { ...DEFAULT_LINKS, ...overrides };

    return Response.json({
      success: true,
      links: merged,
      overriddenModels: Object.keys(overrides),
    });
  } catch (error) {
    console.error('[getCafFallbackLinks] Error:', error);
    // Em caso de erro, retorna defaults para não quebrar o fluxo do cliente
    return Response.json({
      success: false,
      links: DEFAULT_LINKS,
      overriddenModels: [],
      error: error.message,
    });
  }
});