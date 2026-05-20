// ╔══════════════════════════════════════════════════════════════════════╗
// ║  FONTE ÚNICA DE VERDADE para mapear segmento V4 → configuração      ║
// ║  de fluxo de compliance (questionário + upload de documentos).      ║
// ║                                                                      ║
// ║  Ao adicionar um novo segmento: atualize APENAS este arquivo.       ║
// ║  ComplianceDinamico.js, DocumentUploadFull.js e DocumentUploadPix.js║
// ║  leem daqui — não precisam mais ter MODEL_CONFIG próprio.           ║
// ╚══════════════════════════════════════════════════════════════════════╝

export const COMPLIANCE_MODEL_REGISTRY = {
  // ─── Modelos legados v1/v2 (mantidos só por retrocompatibilidade) ───
  merchant: {
    storageKey: 'compliance_data_merchant',
    documentsStorageKey: 'documents_merchant',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  gateway: {
    storageKey: 'compliance_data_gateway',
    documentsStorageKey: 'documents_gateway',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    cafRedirectUrl: 'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  },
  marketplace: {
    storageKey: 'compliance_data_marketplace',
    documentsStorageKey: 'documents_marketplace',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE',
    badgeColor: 'bg-amber-100 text-amber-700',
    cafRedirectUrl: 'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
  },
  ComplianceMerchantAutocomplete: {
    storageKey: 'compliance_data_merchant_v2',
    documentsStorageKey: 'documents_merchant_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT v2.0',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    cafRedirectUrl: 'https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e',
  },
  ComplianceGatewayAutocomplete: {
    storageKey: 'compliance_data_gateway_v2',
    documentsStorageKey: 'documents_gateway_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY v2.0',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    cafRedirectUrl: 'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  },
  ComplianceMarketplaceAutocomplete: {
    storageKey: 'compliance_data_marketplace_v2',
    documentsStorageKey: 'documents_marketplace_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE v2.0',
    badgeColor: 'bg-amber-100 text-amber-700',
    cafRedirectUrl: 'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
  },
  subseller_v2: {
    storageKey: 'compliance_data_subseller_v2',
    documentsStorageKey: 'documents_subseller_v2',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'subseller',
    badgeLabel: 'SUBSELLER',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },

  // ─── V4 — Full KYC (todos usam DocumentUploadFull) ───
  ComplianceGatewayV4: {
    storageKey: 'compliance_data_gateway_v4',
    documentsStorageKey: 'documents_gateway_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'GATEWAY v4',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  ComplianceMarketplaceV4: {
    storageKey: 'compliance_data_marketplace_v4',
    documentsStorageKey: 'documents_marketplace_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MARKETPLACE v4',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  CompliancePlataformaVerticalV4: {
    storageKey: 'compliance_data_plataforma_vertical_v4',
    documentsStorageKey: 'documents_plataforma_vertical_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'PLATAFORMA VERTICAL v4',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  ComplianceEcommerceV4: {
    storageKey: 'compliance_data_ecommerce_v4',
    documentsStorageKey: 'documents_ecommerce_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'E-COMMERCE v4',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  ComplianceInfoprodutosV4: {
    storageKey: 'compliance_data_infoprodutos_v4',
    documentsStorageKey: 'documents_infoprodutos_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'INFOPRODUTOS v4',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  ComplianceEducacaoV4: {
    storageKey: 'compliance_data_educacao_v4',
    documentsStorageKey: 'documents_educacao_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'EDUCAÇÃO v4',
    badgeColor: 'bg-sky-100 text-sky-700',
  },
  ComplianceSaaSV4: {
    storageKey: 'compliance_data_saas_v4',
    documentsStorageKey: 'documents_saas_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'SAAS v4',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  ComplianceMerchantLinkV4: {
    storageKey: 'compliance_data_merchant_link_v4',
    documentsStorageKey: 'documents_merchant_link_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MERCHANT LINK v4',
    badgeColor: 'bg-green-100 text-green-700',
  },
  ComplianceMPEV4: {
    storageKey: 'compliance_data_mpe_v4',
    documentsStorageKey: 'documents_mpe_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'MPE v4',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  ComplianceDropshippingV4: {
    storageKey: 'compliance_data_dropshipping_v4',
    documentsStorageKey: 'documents_dropshipping_v4',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'full_kyc',
    badgeLabel: 'DROPSHIPPING v4',
    badgeColor: 'bg-orange-100 text-orange-700',
  },

  // ─── V4 — PIX (usam DocumentUploadPix) ───
  CompliancePixMerchantV4: {
    storageKey: 'compliance_data_pix_merchant_v4',
    documentsStorageKey: 'documents_pix_merchant_v4',
    documentUploadPage: 'DocumentUploadPix',
    flowType: 'pix',
    badgeLabel: 'PIX MERCHANT v4',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  CompliancePixIntermediarioV4: {
    storageKey: 'compliance_data_pix_intermediario_v4',
    documentsStorageKey: 'documents_pix_intermediario_v4',
    documentUploadPage: 'DocumentUploadPix',
    flowType: 'pix',
    badgeLabel: 'PIX INTERMEDIÁRIO v4',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  // Alias legado lowercase
  pix_intermediario_v4: {
    storageKey: 'compliance_data_pix_intermediario_v4',
    documentsStorageKey: 'documents_pix_intermediario_v4',
    documentUploadPage: 'DocumentUploadPix',
    flowType: 'pix',
    badgeLabel: 'PIX INTERMEDIÁRIO v4',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  pix_api_enterprise: {
    storageKey: 'compliance_data_pix_api_enterprise',
    documentsStorageKey: 'documents_pix_api_enterprise',
    documentUploadPage: 'DocumentUploadPix',
    flowType: 'pix',
    badgeLabel: 'PIX API ENTERPRISE',
    badgeColor: 'bg-blue-100 text-blue-700',
  },

  // ─── V5.2 — Template dinâmico tier-aware (Fase 5.7) ───
  // Coexiste com V4. Quando model === 'ComplianceV5_2Dynamic', ComplianceDinamico
  // dispatcha para o renderer V5.2 em vez do DynamicQuestionnaire legado.
  ComplianceV5_2Dynamic: {
    storageKey: 'compliance_data_v5_2_dynamic',
    documentsStorageKey: 'documents_v5_2_dynamic',
    documentUploadPage: 'DocumentUploadFull',
    flowType: 'v5_2_dynamic',
    badgeLabel: 'V5.2 DINÂMICO',
    badgeColor: 'bg-[#2bc196]/15 text-[#36706c]',
    isV5_2: true,
  },

  // ─── Subseller PF (upload nativo em página separada) ───
  subseller_pf: {
    storageKey: 'compliance_data_subseller_pf',
    documentsStorageKey: 'documents_subseller_pf',
    documentUploadPage: 'SubsellerDocUpload',
    flowType: 'subseller_pf',
    badgeLabel: 'SUBSELLER PF',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
};

// Default seguro quando o model não é reconhecido.
const DEFAULT_MODEL_KEY = 'ComplianceEcommerceV4';

/**
 * Resolve a configuração de um model de forma tolerante:
 *   1. Match exato na chave
 *   2. Match case-insensitive
 *   3. Default (ComplianceEcommerceV4)
 *
 * Sempre retorna um objeto válido. Nunca retorna null.
 * A chave retornada em `_resolvedKey` é a que realmente foi usada.
 */
export function getComplianceModelConfig(model) {
  if (!model || typeof model !== 'string') {
    return { ...COMPLIANCE_MODEL_REGISTRY[DEFAULT_MODEL_KEY], _resolvedKey: DEFAULT_MODEL_KEY };
  }

  // Match exato
  if (COMPLIANCE_MODEL_REGISTRY[model]) {
    return { ...COMPLIANCE_MODEL_REGISTRY[model], _resolvedKey: model };
  }

  // Match case-insensitive
  const lowerModel = model.toLowerCase();
  for (const key of Object.keys(COMPLIANCE_MODEL_REGISTRY)) {
    if (key.toLowerCase() === lowerModel) {
      return { ...COMPLIANCE_MODEL_REGISTRY[key], _resolvedKey: key };
    }
  }

  // Default
  return { ...COMPLIANCE_MODEL_REGISTRY[DEFAULT_MODEL_KEY], _resolvedKey: DEFAULT_MODEL_KEY };
}

/**
 * Lê o model atual de múltiplas fontes, em ordem de prioridade:
 *   1. Query string da URL (?model=XXX) — fonte primária para links frescos
 *   2. localStorage 'current_compliance_model' — fallback entre páginas
 *   3. null — caso nada seja encontrado
 *
 * Isso garante que links compartilhados, reloads e "limpar cache" funcionem.
 */
export function resolveCurrentModel() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('model');
    if (fromUrl) return fromUrl;
  } catch (_) {}
  try {
    const fromStorage = localStorage.getItem('current_compliance_model');
    if (fromStorage) return fromStorage;
  } catch (_) {}
  return null;
}

// Mapa de modelos legados → equivalente V4 (redirect transparente)
export const LEGACY_TO_V4 = {
  'merchant': 'ComplianceEcommerceV4',
  'gateway': 'ComplianceGatewayV4',
  'marketplace': 'ComplianceMarketplaceV4',
  'ComplianceMerchantAutocomplete': 'ComplianceEcommerceV4',
  'ComplianceGatewayAutocomplete': 'ComplianceGatewayV4',
  'ComplianceMarketplaceAutocomplete': 'ComplianceMarketplaceV4',
};