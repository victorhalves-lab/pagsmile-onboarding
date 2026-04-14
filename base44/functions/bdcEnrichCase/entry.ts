import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// ══════════════════════════════════════════════════════════════════
// DATASET GROUPS PER QUESTIONNAIRE TYPE — SPRINT 1+2 EXPANDED
// ══════════════════════════════════════════════════════════════════
const DATASET_GROUPS = {
  // Full compliance — Gateway, Marketplace, Plataformas Verticais
  FULL: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc','economic_group_kyc',
    'political_involvement','government_debtors','processes','lawsuits_distribution_data',
    'owners_lawsuits','owners_lawsuits_distribution','media_profile_and_exposure','financial_market',
    'relationships','economic_group_relationships','configurable_recency_qsa',
    'owners_influence','owners_electoral_donors',
    'domains','online_ads','passages','reputations_and_reviews',
    'awards_and_certifications','activity_indicators','marketplace_data',
    'collections','merchant_category_data','economic_group',
    'emails_extended','addresses_extended','phones_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'owners_industrial_property','industrial_property','licenses_and_authorizations',
    'esg_and_compliance',
  ],
  // Standard — E-commerce, SaaS, Infoprodutos, Dropshipping, Educação, Link Pgto
  STANDARD: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc','economic_group_kyc',
    'political_involvement','government_debtors','processes','lawsuits_distribution_data',
    'owners_lawsuits','owners_lawsuits_distribution','media_profile_and_exposure',
    'relationships','configurable_recency_qsa',
    'owners_influence','owners_electoral_donors',
    'domains','passages','reputations_and_reviews',
    'awards_and_certifications','activity_indicators','marketplace_data',
    'collections','merchant_category_data',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'esg_and_compliance',
  ],
  // Lite — MPE
  LITE: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','domains','passages',
    'collections','government_debtors','processes','lawsuits_distribution_data',
    'merchant_category_data','relationships',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'esg_and_compliance',
  ],
  // PIX Merchant
  PIX_MERCHANT: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','government_debtors','processes','lawsuits_distribution_data',
    'collections','domains','passages','merchant_category_data',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'esg_and_compliance',
  ],
  // PIX Intermediário
  PIX_INTERMEDIARIO: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc','economic_group_kyc',
    'activity_indicators','government_debtors','processes','lawsuits_distribution_data',
    'collections','domains','passages','merchant_category_data',
    'financial_market','economic_group','economic_group_relationships','relationships',
    'configurable_recency_qsa',
    'owners_lawsuits','owners_lawsuits_distribution','owners_influence',
    'media_profile_and_exposure','political_involvement',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'esg_and_compliance',
  ],
  // Subseller PJ
  SUBSELLER_PJ: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','domains','passages',
    'collections','government_debtors','processes','lawsuits_distribution_data',
    'merchant_category_data','relationships',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'reputations_and_reviews','media_profile_and_exposure',
    'esg_and_compliance',
  ],
  // Subseller PF (endpoint /pessoas)
  SUBSELLER_PF: [
    'basic_data','kyc','processes','collections',
    'emails_extended','phones_extended','addresses_extended',
    'media_profile_and_exposure','online_presence',
    'related_people_phones','related_people_emails','related_people_addresses',
    'risk_data',
  ],
};

// Model → dataset group mapping
const MODEL_TO_GROUP = {
  'ComplianceGatewayV4': 'FULL', 'ComplianceGatewayAutocomplete': 'FULL',
  'ComplianceMarketplaceV4': 'FULL', 'ComplianceMarketplaceAutocomplete': 'FULL',
  'CompliancePlataformaVerticalV4': 'FULL',
  'ComplianceEcommerceV4': 'STANDARD', 'ComplianceSaaSV4': 'STANDARD',
  'ComplianceInfoprodutosV4': 'STANDARD', 'ComplianceDropshippingV4': 'STANDARD',
  'ComplianceEducacaoV4': 'STANDARD', 'ComplianceMerchantLinkV4': 'STANDARD',
  'ComplianceMerchantAutocomplete': 'STANDARD',
  'ComplianceMPEV4': 'LITE',
  'CompliancePixMerchantV4': 'PIX_MERCHANT', 'pix_merchant_v4': 'PIX_MERCHANT',
  'pix_intermediario_v4': 'PIX_INTERMEDIARIO',
  'subseller': 'SUBSELLER_PJ', 'subseller_v2': 'SUBSELLER_PJ', 'subseller_pf': 'SUBSELLER_PF',
};

// Segment base scores (Camada 1)
const SEGMENT_BASE_SCORES = {
  'ComplianceGatewayV4': 175, 'ComplianceGatewayAutocomplete': 175,
  'ComplianceMarketplaceV4': 140, 'ComplianceMarketplaceAutocomplete': 140,
  'CompliancePlataformaVerticalV4': 120, 'ComplianceDropshippingV4': 110,
  'ComplianceInfoprodutosV4': 90, 'ComplianceEcommerceV4': 80,
  'ComplianceMerchantAutocomplete': 80, 'ComplianceSaaSV4': 70,
  'ComplianceEducacaoV4': 50, 'ComplianceMerchantLinkV4': 60,
  'ComplianceMPEV4': 35,
  'CompliancePixMerchantV4': 65, 'pix_merchant_v4': 65,
  'pix_intermediario_v4': 155,
  'subseller': 45, 'subseller_v2': 45, 'subseller_pf': 30,
};

const HIGH_RISK_CNAES = [
  '9200301','9200302','9200399','4789004','1220401','1220402','6499999','6619302','6622300',
  '6463800','6462000','4712100','4789099',
];

// ══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════
function safeGet(obj, path, def = null) {
  if (!obj) return def;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) { if (cur == null) return def; cur = cur[p]; }
  return cur ?? def;
}

function flattenBDCArray(dataset) {
  if (!dataset) return [];
  if (Array.isArray(dataset)) {
    return dataset.flatMap(d => {
      if (d && d.MatchKeys) return [d];
      if (Array.isArray(d)) return d;
      return [d];
    }).filter(Boolean);
  }
  return [dataset];
}

function extractBasicData(result) {
  const bd = result?.BasicData || result?.basic_data;
  if (!bd) return null;
  if (typeof bd === 'object' && !Array.isArray(bd)) return bd;
  const items = flattenBDCArray(bd);
  return items[0] || null;
}

// ══════════════════════════════════════════════════════════════════
// BLOCK ANALYSIS — B01 through B09
// ══════════════════════════════════════════════════════════════════
function analyzeBlocks(result, responses) {
  const blocks = [];
  const bd = extractBasicData(result);

  // B01 — CNPJ Inativo
  const status = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription');
  if (status && !String(status).toUpperCase().includes('ATIV')) {
    blocks.push({ code: 'B01', label: 'CNPJ Inativo', severity: 'BLOQUEIO', detail: `Situação cadastral: ${status}. Empresa não pode exercer atividades econômicas legalmente. Exigência: Circular BCB 3.978/2020 Art. 2º.`, score: 850 });
  }

  // B02 — Idade < 6 meses
  const founded = safeGet(bd, 'FoundedDate') || safeGet(bd, 'Age.FoundedDate');
  if (founded) {
    const months = (Date.now() - new Date(founded).getTime()) / (30.44 * 24 * 3600 * 1000);
    if (months < 6) {
      blocks.push({ code: 'B02', label: 'Empresa < 6 meses', severity: 'BLOQUEIO', detail: `Fundada em ${new Date(founded).toLocaleDateString('pt-BR')} (${Math.round(months)} meses). Empresas com menos de 6 meses não possuem histórico suficiente para avaliação de risco. Taxa de mortalidade no 1º ano: ~20%.`, score: 850 });
    }
  }

  // B03 — Sanções (empresa)
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kycItems = flattenBDCArray(kyc);
    for (const item of kycItems) {
      const sanctions = item?.Sanctions || item?.SanctionsDetails || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        const sources = sanctions.map(s => s.Source || s.ListName || 'N/I').join(', ');
        blocks.push({ code: 'B03', label: 'Empresa em lista de sanções', severity: 'BLOQUEIO', detail: `${sanctions.length} sanção(ões) encontrada(s): ${sources}. Listas verificadas: OFAC SDN, EU, UN, COAF, CEIS, CNEP. Fundamentação: Lei 9.613/1998 Art. 10 (PLD/FT). Transacionar com entidade sancionada pode resultar em multas milionárias e responsabilização criminal.`, score: 850 });
        break;
      }
    }
  }

  // B03b — Sócios em sanções
  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  if (ownersKyc) {
    const items = flattenBDCArray(ownersKyc);
    const sanctionedOwners = [];
    for (const item of items) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        sanctionedOwners.push(item?.Name || item?.RelatedPersonName || 'N/I');
      }
    }
    if (sanctionedOwners.length > 0) {
      blocks.push({ code: 'B03', label: 'Sócio(s) em lista de sanções', severity: 'BLOQUEIO', detail: `Sócios sancionados: ${sanctionedOwners.join(', ')}. Circular BCB 3.978/2020 Art. 16 exige identificação e verificação de todos os beneficiários finais.`, score: 850 });
    }
  }

  // B03c — KYC Grupo Econômico com sanções
  const egKyc = result?.EconomicGroupKyc || result?.economic_group_kyc;
  if (egKyc) {
    const items = flattenBDCArray(egKyc);
    const sanctionedEntities = [];
    for (const item of items) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        sanctionedEntities.push(item?.Name || item?.EntityName || 'N/I');
      }
    }
    if (sanctionedEntities.length > 0) {
      blocks.push({ code: 'B03c', label: 'Entidade do grupo econômico em sanções', severity: 'BLOQUEIO', detail: `Entidades sancionadas no grupo econômico: ${sanctionedEntities.join(', ')}. Circular BCB 3.978/2020 Art. 16 §§1-4 exige verificação de estruturas societárias complexas.`, score: 850 });
    }
  }

  // B05 — Shell Company
  const ai = result?.ActivityIndicators || result?.activity_indicators;
  if (ai) {
    const items = flattenBDCArray(ai);
    for (const item of items) {
      const shell = item?.ShellCompanyLikelyhood ?? item?.ShellCompanyLikelihood;
      if (shell != null && Number(shell) > 0.8) {
        blocks.push({ code: 'B05', label: 'Provável empresa de fachada', severity: 'BLOQUEIO', detail: `Shell Company score: ${(Number(shell) * 100).toFixed(0)}%. Probabilidade calculada pela BDC combinando: zero empregados, sem domínio ativo, sem passagens web, endereço virtual, capital mínimo. Acima de 80% = bloqueio automático.`, score: 850 });
        break;
      }
    }
  }

  // B06 — Dívida ativa > R$500k
  const debtors = result?.GovernmentDebtors || result?.government_debtors;
  if (debtors) {
    const items = flattenBDCArray(debtors);
    let totalDebt = 0;
    for (const item of items) { totalDebt += Number(item?.TotalValue || item?.Value || 0); }
    if (totalDebt > 500000) {
      blocks.push({ code: 'B06', label: 'Dívida ativa > R$500k', severity: 'BLOQUEIO', detail: `Total inscrito em dívida ativa: R$ ${totalDebt.toLocaleString('pt-BR', {minimumFractionDigits:2})}. Empresa com dívida ativa federal/estadual/municipal deste porte indica grave inadimplência fiscal.`, score: 850 });
    }
  }

  // B07 — Adverse media grave
  const media = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
  if (media) {
    const items = flattenBDCArray(media);
    for (const item of items) {
      const sentiment = item?.Sentiment || item?.OverallSentiment;
      if (sentiment && String(sentiment).toUpperCase().includes('VERY_NEGATIVE')) {
        const topics = item?.Topics || item?.MainTopics || [];
        const hasGrave = topics.some(t => /fraude|lavagem|crime|corrup/i.test(String(t)));
        if (hasGrave) {
          blocks.push({ code: 'B07', label: 'Adverse media grave', severity: 'BLOQUEIO', detail: `Mídia com sentimento MUITO NEGATIVO associada a: ${topics.join(', ')}. Notícias vinculando a empresa a fraude, lavagem de dinheiro ou corrupção representam risco reputacional e regulatório extremo.`, score: 850 });
          break;
        }
      }
    }
  }

  // B08 — ESG: Lista Suja MTE (trabalho escravo)
  const esg = result?.EsgAndCompliance || result?.esg_and_compliance || result?.ESG || result?.esg;
  if (esg) {
    const items = flattenBDCArray(esg);
    for (const item of items) {
      const slaveLabor = item?.SlaveLabor || item?.SlaveLaborList || item?.ListaSuja || item?.TrabalhoEscravo;
      const hasSlaveLabor = slaveLabor === true || (typeof slaveLabor === 'string' && /sim|true|encontrad/i.test(slaveLabor));
      if (hasSlaveLabor) {
        blocks.push({ code: 'B08', label: 'Lista Suja MTE — Trabalho Escravo', severity: 'BLOQUEIO', detail: `Empresa encontrada na Lista Suja do Ministério do Trabalho e Emprego. REJEIÇÃO AUTOMÁTICA IMEDIATA conforme legislação trabalhista brasileira e política ESG. Fazer negócio com empresa na lista suja pode resultar em responsabilização solidária.`, score: 850 });
        break;
      }
      // Check for environmental embargoes
      const envEmbargo = item?.EnvironmentalEmbargo || item?.IbamaEmbargo;
      if (envEmbargo === true) {
        blocks.push({ code: 'B09', label: 'Embargo ambiental IBAMA', severity: 'BLOQUEIO', detail: `Empresa com embargo ambiental ativo pelo IBAMA. Indica irregularidade ambiental grave. Requer investigação antes de qualquer aprovação.`, score: 850 });
      }
    }
  }

  return blocks;
}

// ══════════════════════════════════════════════════════════════════
// IDENTITY ANALYSIS — Deeply granular
// ══════════════════════════════════════════════════════════════════
function analyzeIdentity(result) {
  const bd = extractBasicData(result);
  if (!bd) return { score: 0, items: [] };
  const items = [];
  let score = 0;

  // Official name
  const officialName = safeGet(bd, 'OfficialName') || safeGet(bd, 'CompanyName');
  if (officialName) items.push({ label: 'Razão social', value: String(officialName), risk: 'INFO', points: 0 });

  // Trade name
  const tradeName = safeGet(bd, 'TradeName') || safeGet(bd, 'FantasyName');
  if (tradeName) items.push({ label: 'Nome fantasia', value: String(tradeName), risk: 'INFO', points: 0 });

  // Company age
  const founded = safeGet(bd, 'FoundedDate') || safeGet(bd, 'Age.FoundedDate');
  if (founded) {
    const years = (Date.now() - new Date(founded).getTime()) / (365.25 * 24 * 3600 * 1000);
    const y = Math.floor(years);
    if (y < 1) { score += 25; items.push({ label: 'Idade da empresa', value: `< 1 ano (fundada em ${new Date(founded).toLocaleDateString('pt-BR')})`, risk: 'ALTO', points: 25 }); }
    else if (y < 2) { score += 15; items.push({ label: 'Idade da empresa', value: `${y} ano(s) (fundada em ${new Date(founded).toLocaleDateString('pt-BR')})`, risk: 'MEDIO', points: 15 }); }
    else if (y < 5) { score += 5; items.push({ label: 'Idade da empresa', value: `${y} anos (fundada em ${new Date(founded).toLocaleDateString('pt-BR')})`, risk: 'BAIXO', points: 5 }); }
    else { items.push({ label: 'Idade da empresa', value: `${y} anos (fundada em ${new Date(founded).toLocaleDateString('pt-BR')})`, risk: 'OK', points: 0 }); }
  }

  // Tax status
  const statusVal = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription') || '';
  const statusDate = safeGet(bd, 'TaxIdStatusDate') || safeGet(bd, 'StatusDate') || '';
  const statusReason = safeGet(bd, 'TaxIdStatusReason') || safeGet(bd, 'StatusReason') || '';
  const statusStr = `${statusVal}${statusDate ? ` (desde ${new Date(statusDate).toLocaleDateString('pt-BR')})` : ''}${statusReason ? ` — Motivo: ${statusReason}` : ''}`;
  items.push({ label: 'Situação cadastral', value: statusStr, risk: String(statusVal).toUpperCase().includes('ATIV') ? 'OK' : 'CRITICO', points: 0 });

  // Company size
  const size = safeGet(bd, 'CompanySize') || safeGet(bd, 'Size') || safeGet(bd, 'CompanyType_ReceitaFederal');
  if (size) items.push({ label: 'Porte', value: String(size), risk: 'INFO', points: 0 });

  // Tax regime
  const taxRegime = safeGet(bd, 'TaxRegime');
  const simples = safeGet(bd, 'TaxRegimes.Simples');
  const simplesDate = safeGet(bd, 'TaxRegimes.SimplesDate') || safeGet(bd, 'TaxRegimes.SimplesInclusionDate');
  const mei = safeGet(bd, 'TaxRegimes.MEI') || safeGet(bd, 'IsMEI');
  if (taxRegime) items.push({ label: 'Regime tributário', value: `${taxRegime}${simples ? ' (Simples Nacional)' : ''}${mei ? ' / MEI' : ''}${simplesDate ? ` desde ${simplesDate}` : ''}`, risk: 'INFO', points: 0 });

  // Capital
  const capital = safeGet(bd, 'ShareCapital') || safeGet(bd, 'Capital');
  if (capital != null) {
    const val = Number(capital);
    items.push({ label: 'Capital social', value: `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, risk: val < 1000 ? 'ALTO' : val < 10000 ? 'MEDIO' : 'OK', points: val < 1000 ? 15 : val < 10000 ? 5 : 0 });
    if (val < 1000) score += 15; else if (val < 10000) score += 5;
  }

  // Legal nature
  let nature = safeGet(bd, 'LegalNature');
  if (nature && typeof nature === 'object') nature = nature.Activity || nature.Description || nature.Code || JSON.stringify(nature);
  const natureDesc = safeGet(bd, 'LegalNatureDescription');
  if (nature || natureDesc) items.push({ label: 'Natureza jurídica', value: String(natureDesc || nature), risk: 'INFO', points: 0 });

  // CNAE principal
  const cnae = safeGet(bd, 'MainEconomicActivity') || safeGet(bd, 'MainActivityCode');
  const cnaeDesc = safeGet(bd, 'MainEconomicActivityDescription') || safeGet(bd, 'MainActivityDescription') || '';
  if (cnae) {
    const isHighRisk = HIGH_RISK_CNAES.includes(String(cnae));
    items.push({ label: 'CNAE principal', value: `${cnae} — ${cnaeDesc}`, risk: isHighRisk ? 'CRITICO' : 'OK', points: isHighRisk ? 30 : 0 });
    if (isHighRisk) score += 30;
  }

  // Secondary CNAEs
  const secondaryCnaes = safeGet(bd, 'SecondaryActivities') || safeGet(bd, 'SecondaryEconomicActivities') || [];
  if (Array.isArray(secondaryCnaes) && secondaryCnaes.length > 0) {
    const cnaesStr = secondaryCnaes.slice(0, 10).map(c => typeof c === 'string' ? c : `${c.Code || c.Activity || ''} — ${c.Description || ''}`).join(' | ');
    const hasHighRiskSecondary = secondaryCnaes.some(c => HIGH_RISK_CNAES.includes(String(c?.Code || c)));
    items.push({ label: `CNAEs secundários (${secondaryCnaes.length})`, value: cnaesStr + (secondaryCnaes.length > 10 ? ` ... +${secondaryCnaes.length - 10}` : ''), risk: hasHighRiskSecondary ? 'ALTO' : 'INFO', points: hasHighRiskSecondary ? 15 : 0 });
    if (hasHighRiskSecondary) score += 15;
  }

  // Address
  const addr = safeGet(bd, 'Address') || safeGet(bd, 'MainAddress');
  if (addr) {
    const addrStr = typeof addr === 'object' ? [addr.Street || addr.StreetName, addr.Number || addr.AddressNumber, addr.Complement, addr.Neighborhood, addr.City, addr.State, addr.ZipCode].filter(Boolean).join(', ') : String(addr);
    items.push({ label: 'Endereço principal', value: addrStr, risk: 'INFO', points: 0 });
  }

  // E-mail and phone
  const mainEmail = safeGet(bd, 'Email') || safeGet(bd, 'MainEmail');
  const mainPhone = safeGet(bd, 'Phone') || safeGet(bd, 'MainPhone') || safeGet(bd, 'PhoneNumber');
  if (mainEmail) items.push({ label: 'E-mail principal', value: String(mainEmail), risk: 'INFO', points: 0 });
  if (mainPhone) items.push({ label: 'Telefone principal', value: String(mainPhone), risk: 'INFO', points: 0 });

  // Employees
  const employees = safeGet(bd, 'NumberOfEmployees') || safeGet(bd, 'EmployeesCount');
  if (employees != null) items.push({ label: 'Empregados (RAIS)', value: String(employees), risk: 'INFO', points: 0 });

  // Registration data
  const regData = result?.RegistrationData || result?.registration_data;
  if (regData) {
    const rItems = flattenBDCArray(regData);
    for (const rd of rItems) {
      const regNum = rd?.RegistrationNumber || rd?.StateRegistration;
      if (regNum) items.push({ label: 'Inscrição estadual', value: String(regNum), risk: 'INFO', points: 0 });
      const specialSituation = rd?.SpecialSituation || rd?.SituacaoEspecial;
      if (specialSituation && String(specialSituation) !== 'null' && String(specialSituation) !== '') {
        items.push({ label: 'Situação especial', value: String(specialSituation), risk: 'ALTO', points: 10 });
        score += 10;
      }
    }
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// COMPANY EVOLUTION & HISTORY — NEW SPRINT 1
// ══════════════════════════════════════════════════════════════════
function analyzeEvolution(result) {
  const items = [];
  let score = 0;

  // Company Evolution — temporal series
  const evolution = result?.CompanyEvolution || result?.company_evolution;
  if (evolution) {
    const eItems = flattenBDCArray(evolution);
    const changes = [];
    let capitalHistory = [];
    let employeeHistory = [];
    let ownerHistory = [];
    
    for (const item of eItems) {
      // Capital social over time
      if (item?.ShareCapital != null || item?.Capital != null) {
        capitalHistory.push({ date: item?.Date || item?.ReferenceDate || '', value: Number(item.ShareCapital || item.Capital || 0) });
      }
      // Employees over time
      if (item?.NumberOfEmployees != null || item?.EmployeesCount != null) {
        employeeHistory.push({ date: item?.Date || item?.ReferenceDate || '', value: Number(item.NumberOfEmployees || item.EmployeesCount || 0) });
      }
      // Owners over time
      if (item?.NumberOfOwners != null || item?.OwnersCount != null) {
        ownerHistory.push({ date: item?.Date || item?.ReferenceDate || '', value: Number(item.NumberOfOwners || item.OwnersCount || 0) });
      }
    }

    // Detect capital drop (>50%)
    if (capitalHistory.length >= 2) {
      const sorted = capitalHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0]?.value || 0;
      const last = sorted[sorted.length - 1]?.value || 0;
      if (first > 0 && last < first * 0.5) {
        score += 20;
        items.push({ label: 'Queda de capital social', value: `Capital caiu de R$ ${first.toLocaleString('pt-BR')} para R$ ${last.toLocaleString('pt-BR')} (${((1 - last/first) * 100).toFixed(0)}% de redução). Possível esvaziamento patrimonial.`, risk: 'ALTO', points: 20, details: { 'Série temporal': sorted.map(s => `${s.date}: R$ ${s.value.toLocaleString('pt-BR')}`).join(' → ') } });
      } else if (capitalHistory.length > 0) {
        items.push({ label: 'Evolução do capital social', value: `Histórico: ${sorted.map(s => `R$ ${s.value.toLocaleString('pt-BR')}`).join(' → ')}`, risk: 'INFO', points: 0 });
      }
    }

    // Detect employee drop (>80%)
    if (employeeHistory.length >= 2) {
      const sorted = employeeHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      const peak = Math.max(...sorted.map(s => s.value));
      const last = sorted[sorted.length - 1]?.value || 0;
      if (peak > 10 && last <= peak * 0.2) {
        score += 15;
        items.push({ label: 'Queda drástica de funcionários', value: `De ${peak} funcionários no pico para ${last} atual (${((1 - last/peak) * 100).toFixed(0)}% de redução). Sinal de crise operacional ou encerramento de atividades.`, risk: 'ALTO', points: 15, details: { 'Série temporal': sorted.map(s => `${s.date}: ${s.value} func.`).join(' → ') } });
      } else if (employeeHistory.length > 0) {
        items.push({ label: 'Evolução de funcionários', value: `Histórico: ${sorted.map(s => `${s.value}`).join(' → ')} funcionários`, risk: 'INFO', points: 0 });
      }
    }
  }

  // History Basic Data — cadastral changes over time
  const history = result?.HistoryBasicData || result?.history_basic_data;
  if (history) {
    const hItems = flattenBDCArray(history);
    let changeCount = 0;
    let recentChanges = [];
    const cnaeChanges = [];
    const nameChanges = [];

    for (const item of hItems) {
      changeCount++;
      const changeDate = item?.Date || item?.ChangeDate || item?.ReferenceDate || '';
      const changeType = item?.ChangeType || item?.Field || '';
      const oldVal = item?.OldValue || item?.PreviousValue || '';
      const newVal = item?.NewValue || item?.CurrentValue || '';
      
      if (changeDate) {
        const monthsAgo = (Date.now() - new Date(changeDate).getTime()) / (30.44 * 24 * 3600 * 1000);
        if (monthsAgo <= 12) recentChanges.push({ type: changeType, date: changeDate, oldVal, newVal });
      }
      if (/cnae|atividade/i.test(changeType)) cnaeChanges.push({ date: changeDate, from: oldVal, to: newVal });
      if (/nome|razao|razão/i.test(changeType)) nameChanges.push({ date: changeDate, from: oldVal, to: newVal });
    }

    if (recentChanges.length > 3) {
      score += 15;
      items.push({ label: 'Alterações cadastrais recentes', value: `${recentChanges.length} alterações nos últimos 12 meses — Instabilidade cadastral detectada. Mais de 3 alterações recentes pode indicar tentativa de mascarar atividade ou situação irregular.`, risk: 'ALTO', points: 15, details: { 'Alterações': recentChanges.slice(0, 5).map(c => `${c.date}: ${c.type} (${c.oldVal} → ${c.newVal})`).join('; ') } });
    } else if (changeCount > 0) {
      items.push({ label: 'Histórico de alterações cadastrais', value: `${changeCount} alteração(ões) registrada(s), ${recentChanges.length} nos últimos 12 meses`, risk: recentChanges.length > 1 ? 'MEDIO' : 'OK', points: 0 });
    }

    if (cnaeChanges.length > 0) {
      items.push({ label: 'Mudanças de CNAE', value: `${cnaeChanges.length} mudança(s) de atividade econômica: ${cnaeChanges.map(c => `${c.from} → ${c.to} (${c.date})`).join('; ')}`, risk: cnaeChanges.length > 2 ? 'ALTO' : 'MEDIO', points: cnaeChanges.length > 2 ? 10 : 0 });
      if (cnaeChanges.length > 2) score += 10;
    }

    if (nameChanges.length > 0) {
      items.push({ label: 'Mudanças de razão social', value: `${nameChanges.length} mudança(s): ${nameChanges.map(c => `${c.from} → ${c.to} (${c.date})`).join('; ')}`, risk: nameChanges.length > 1 ? 'MEDIO' : 'INFO', points: 0 });
    }
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// ESG ANALYSIS — NEW SPRINT 2
// ══════════════════════════════════════════════════════════════════
function analyzeESG(result) {
  const items = [];
  let score = 0;

  const esg = result?.EsgAndCompliance || result?.esg_and_compliance || result?.ESG || result?.esg;
  if (!esg) {
    items.push({ label: 'ESG / Lista Suja MTE', value: 'Dataset não consultado ou sem dados retornados', risk: 'INFO', points: 0 });
    return { score, items };
  }

  const eItems = flattenBDCArray(esg);
  for (const item of eItems) {
    // Lista Suja MTE
    const slaveLabor = item?.SlaveLabor || item?.SlaveLaborList || item?.ListaSuja || item?.TrabalhoEscravo;
    if (slaveLabor === true || (typeof slaveLabor === 'string' && /sim|true|encontrad/i.test(slaveLabor))) {
      score += 200;
      items.push({ label: 'Lista Suja MTE — Trabalho Escravo', value: 'ENCONTRADA — Empresa consta na Lista Suja do Ministério do Trabalho e Emprego por uso de trabalho em condições análogas à escravidão. REJEIÇÃO IMEDIATA conforme legislação trabalhista brasileira.', risk: 'CRITICO', points: 200 });
    } else {
      items.push({ label: 'Lista Suja MTE', value: 'NÃO encontrada — Empresa não consta na Lista Suja do MTE', risk: 'OK', points: 0 });
    }

    // Environmental indicators
    const envScore = item?.EnvironmentalScore || item?.ESGEnvironmental;
    const socialScore = item?.SocialScore || item?.ESGSocial;
    const govScore = item?.GovernanceScore || item?.ESGGovernance;

    if (envScore != null) items.push({ label: 'Score Ambiental ESG', value: `${envScore}`, risk: Number(envScore) < 30 ? 'ALTO' : 'INFO', points: 0 });
    if (socialScore != null) items.push({ label: 'Score Social ESG', value: `${socialScore}`, risk: Number(socialScore) < 30 ? 'ALTO' : 'INFO', points: 0 });
    if (govScore != null) items.push({ label: 'Score Governança ESG', value: `${govScore}`, risk: Number(govScore) < 30 ? 'ALTO' : 'INFO', points: 0 });

    // IBAMA embargoes
    const embargo = item?.EnvironmentalEmbargo || item?.IbamaEmbargo;
    if (embargo === true) {
      score += 40;
      items.push({ label: 'Embargo IBAMA', value: 'ATIVO — Empresa possui embargo ambiental do IBAMA. Indica infração ambiental grave.', risk: 'CRITICO', points: 40 });
    }

    // Deforestation
    const deforestation = item?.Deforestation || item?.DeforestationAlert;
    if (deforestation === true) {
      items.push({ label: 'Alerta de desmatamento', value: 'Área associada com alertas de desmatamento', risk: 'ALTO', points: 10 });
      score += 10;
    }
  }

  if (items.length === 0) {
    items.push({ label: 'ESG', value: 'Sem dados ESG retornados pela BDC', risk: 'INFO', points: 0 });
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// CONTACTS VALIDATION — NEW SPRINT 1
// ══════════════════════════════════════════════════════════════════
function analyzeContacts(result) {
  const items = [];
  let score = 0;

  // Extended phones
  const phones = result?.PhonesExtended || result?.phones_extended;
  if (phones) {
    const pItems = flattenBDCArray(phones);
    const validPhones = [];
    for (const item of pItems) {
      const number = item?.PhoneNumber || item?.Number || '';
      const type = item?.PhoneType || item?.Type || '';
      const carrier = item?.Carrier || item?.Operator || '';
      const isActive = item?.IsActive || item?.Active;
      if (number) validPhones.push({ number, type, carrier, active: isActive });
    }
    if (validPhones.length > 0) {
      items.push({ label: 'Telefones encontrados', value: `${validPhones.length} telefone(s): ${validPhones.slice(0, 5).map(p => `${p.number} (${p.type || 'N/I'}, ${p.carrier || 'N/I'}, ${p.active === false ? 'INATIVO' : 'ativo'})`).join('; ')}`, risk: validPhones.some(p => p.active === false) ? 'MEDIO' : 'OK', points: 0 });
    }
  }

  // Extended emails
  const emails = result?.EmailsExtended || result?.emails_extended;
  if (emails) {
    const eItems = flattenBDCArray(emails);
    const validEmails = [];
    for (const item of eItems) {
      const email = item?.Email || item?.EmailAddress || '';
      const domain = item?.Domain || '';
      const isGeneric = /gmail|hotmail|yahoo|outlook|live|bol|uol|terra|ig\.com/i.test(email);
      if (email) validEmails.push({ email, domain, isGeneric });
    }
    if (validEmails.length > 0) {
      const allGeneric = validEmails.every(e => e.isGeneric);
      items.push({ label: 'E-mails encontrados', value: `${validEmails.length} e-mail(s): ${validEmails.slice(0, 5).map(e => `${e.email}${e.isGeneric ? ' (genérico)' : ' (corporativo)'}`).join('; ')}`, risk: allGeneric ? 'MEDIO' : 'OK', points: allGeneric ? 5 : 0 });
      if (allGeneric) score += 5;
    }
  }

  // Extended addresses
  const addresses = result?.AddressesExtended || result?.addresses_extended;
  if (addresses) {
    const aItems = flattenBDCArray(addresses);
    if (aItems.length > 0) {
      const addressList = aItems.slice(0, 5).map(a => {
        const street = a?.Street || a?.StreetName || a?.Address || '';
        const city = a?.City || '';
        const state = a?.State || '';
        return `${street}, ${city}/${state}`.trim();
      }).filter(Boolean);
      items.push({ label: 'Endereços associados', value: `${aItems.length} endereço(s) encontrado(s): ${addressList.join('; ')}`, risk: 'INFO', points: 0 });
    }
  }

  // Related people phones
  const relPhones = result?.RelatedPeoplePhones || result?.related_people_phones;
  if (relPhones) {
    const rpItems = flattenBDCArray(relPhones);
    const relPhoneList = [];
    for (const item of rpItems) {
      const name = item?.Name || item?.PersonName || '';
      const phone = item?.PhoneNumber || item?.Number || '';
      const rel = item?.Relationship || item?.RelationType || '';
      if (phone) relPhoneList.push({ name, phone, rel });
    }
    if (relPhoneList.length > 0) {
      items.push({ label: 'Telefones de pessoas vinculadas', value: `${relPhoneList.length} telefone(s) de pessoas vinculadas: ${relPhoneList.slice(0, 5).map(p => `${p.name || 'N/I'} (${p.rel || 'vínculo'}): ${p.phone}`).join('; ')}`, risk: 'INFO', points: 0 });
    }
  }

  // Related people emails
  const relEmails = result?.RelatedPeopleEmails || result?.related_people_emails;
  if (relEmails) {
    const reItems = flattenBDCArray(relEmails);
    const relEmailList = [];
    for (const item of reItems) {
      const name = item?.Name || item?.PersonName || '';
      const email = item?.Email || item?.EmailAddress || '';
      const rel = item?.Relationship || item?.RelationType || '';
      if (email) relEmailList.push({ name, email, rel });
    }
    if (relEmailList.length > 0) {
      items.push({ label: 'E-mails de pessoas vinculadas', value: `${relEmailList.length} e-mail(s) de pessoas vinculadas: ${relEmailList.slice(0, 5).map(e => `${e.name || 'N/I'} (${e.rel || 'vínculo'}): ${e.email}`).join('; ')}`, risk: 'INFO', points: 0 });
    }
  }

  // Related people addresses
  const relAddresses = result?.RelatedPeopleAddresses || result?.related_people_addresses;
  if (relAddresses) {
    const raItems = flattenBDCArray(relAddresses);
    const relAddrList = [];
    for (const item of raItems) {
      const name = item?.Name || item?.PersonName || '';
      const addr = item?.Street || item?.StreetName || item?.Address || '';
      const city = item?.City || '';
      const state = item?.State || '';
      const rel = item?.Relationship || item?.RelationType || '';
      if (addr) relAddrList.push({ name, address: `${addr}, ${city}/${state}`.trim(), rel });
    }
    if (relAddrList.length > 0) {
      items.push({ label: 'Endereços de pessoas vinculadas', value: `${relAddrList.length} endereço(s) de pessoas vinculadas: ${relAddrList.slice(0, 3).map(a => `${a.name || 'N/I'} (${a.rel || 'vínculo'}): ${a.address}`).join('; ')}`, risk: 'INFO', points: 0 });
    }
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// OWNERS ANALYSIS — Deeply granular (kept from original + expanded)
// ══════════════════════════════════════════════════════════════════
function analyzeOwners(result) {
  const items = [];
  let score = 0;
  let pepFound = [];
  let sanctionedFound = [];

  // Relationships (QSA)
  const rels = result?.Relationships || result?.relationships;
  const owners = [];
  if (rels) {
    const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    if (Array.isArray(entries)) {
      for (const e of entries) {
        owners.push({
          name: e.RelatedEntityName || e.Name || 'N/I',
          doc: e.RelatedEntityTaxIdNumber || e.TaxIdNumber || '',
          role: e.RelationshipName || e.Qualification || e.Role || '',
          participation: e.Participation || e.SharePercentage || null,
        });
      }
    }
  }
  items.push({ label: 'Total sócios/QSA', value: `${owners.length} pessoa(s)`, risk: owners.length === 0 ? 'ALTO' : 'OK', points: owners.length === 0 ? 15 : 0, owners });
  if (owners.length === 0) score += 15;

  // Configurable Recency QSA — real-time RF data
  const recencyQsa = result?.ConfigurableRecencyQsa || result?.configurable_recency_qsa;
  if (recencyQsa) {
    const rItems = flattenBDCArray(recencyQsa);
    const recentOwners = [];
    for (const item of rItems) {
      const name = item?.Name || item?.RelatedEntityName || '';
      const doc = item?.TaxIdNumber || item?.CPF || '';
      const role = item?.Qualification || item?.Role || '';
      if (name) recentOwners.push(`${name} (${role || 'N/I'})`);
    }
    if (recentOwners.length > 0) {
      items.push({ label: 'QSA tempo real (Receita Federal)', value: `${recentOwners.length} sócio(s) na base real-time da RF: ${recentOwners.join('; ')}`, risk: 'INFO', points: 0 });
      // Check divergence with standard QSA
      if (Math.abs(recentOwners.length - owners.length) > 0) {
        items.push({ label: 'Divergência QSA padrão vs tempo real', value: `QSA padrão: ${owners.length} sócios | QSA tempo real RF: ${recentOwners.length} sócios — Possível alteração societária recente não refletida no cadastro padrão.`, risk: 'MEDIO', points: 5 });
        score += 5;
      }
    }
  }

  // Owners KYC
  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  if (ownersKyc) {
    const kycItems = flattenBDCArray(ownersKyc);
    for (const item of kycItems) {
      const name = item?.Name || item?.RelatedPersonName || 'N/I';
      const isPep = item?.IsPEP || item?.IsPep || false;
      const sanctions = item?.Sanctions || [];
      if (isPep) pepFound.push(name);
      if (Array.isArray(sanctions) && sanctions.length > 0) sanctionedFound.push(name);
    }
  }

  if (pepFound.length > 0) {
    score += 40;
    items.push({ label: 'PEP identificado(s)', value: `${pepFound.join(', ')} — Pessoa(s) Politicamente Exposta(s). Circular BCB 3.978/2020 Art. 14 exige Enhanced Due Diligence (EDD) e monitoramento reforçado.`, risk: 'ALTO', points: 40 });
  } else {
    items.push({ label: 'PEP', value: 'Nenhum PEP identificado entre os sócios diretos', risk: 'OK', points: 0 });
  }

  if (sanctionedFound.length > 0) {
    items.push({ label: 'Sócios em sanções', value: `BLOQUEANTE: ${sanctionedFound.join(', ')} — Sócio(s) encontrado(s) em listas de sanções internacionais`, risk: 'CRITICO', points: 80 });
  }

  // KYC Economic Group — NEW Sprint 2
  const egKyc = result?.EconomicGroupKyc || result?.economic_group_kyc;
  if (egKyc) {
    const egItems = flattenBDCArray(egKyc);
    let egPepCount = 0;
    let egSanctionCount = 0;
    const egPepNames = [];
    const egSanctionNames = [];
    
    for (const item of egItems) {
      const name = item?.Name || item?.EntityName || 'N/I';
      if (item?.IsPEP || item?.IsPep) { egPepCount++; egPepNames.push(name); }
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) { egSanctionCount++; egSanctionNames.push(name); }
    }

    if (egSanctionCount > 0) {
      score += 60;
      items.push({ label: 'Sanções no grupo econômico', value: `${egSanctionCount} entidade(s) sancionada(s) no grupo econômico: ${egSanctionNames.join(', ')}. Circular BCB 3.978/2020 Art. 16 §§1-4 exige verificação de toda cadeia societária.`, risk: 'CRITICO', points: 60 });
    }
    if (egPepCount > 0) {
      score += 20;
      items.push({ label: 'PEP no grupo econômico', value: `${egPepCount} PEP(s) identificado(s) no grupo econômico: ${egPepNames.join(', ')}. Risco indireto de exposição política.`, risk: 'ALTO', points: 20 });
    }
    if (egPepCount === 0 && egSanctionCount === 0 && egItems.length > 0) {
      items.push({ label: 'KYC grupo econômico', value: `${egItems.length} entidade(s) verificada(s) — Sem PEP ou sanções no grupo`, risk: 'OK', points: 0 });
    }
  }

  // Owners lawsuits — full detail (kept from original)
  const ownersLawsuitsRaw = result?.OwnersLawsuits || result?.owners_lawsuits;
  if (ownersLawsuitsRaw) {
    let criminalFound = false;
    const allOwnerLawsuits = [];
    const perOwnerEntries = typeof ownersLawsuitsRaw === 'object' && !Array.isArray(ownersLawsuitsRaw) ? Object.entries(ownersLawsuitsRaw).filter(([k]) => k !== 'MatchKeys') : [];
    
    if (perOwnerEntries.length > 0) {
      for (const [ownerDoc, ownerData] of perOwnerEntries) {
        const ownerName = ownerData?.Name || ownerData?.PersonName || ownerDoc;
        const lawsuitsArr = ownerData?.Lawsuits?.Lawsuits || ownerData?.Lawsuits || [];
        if (Array.isArray(lawsuitsArr)) {
          for (const lw of lawsuitsArr) {
            const lwType = lw?.Type || '';
            const courtType = lw?.CourtType || '';
            if (/criminal|penal|crime/i.test(lwType) || /criminal|penal|crime/i.test(courtType)) criminalFound = true;
            const updates = lw?.Updates || [];
            allOwnerLawsuits.push({
              number: lw?.Number || 'N/I', court: lw?.CourtName || '', courtType, judgingBody: lw?.JudgingBody || '',
              type: lwType, subject: lw?.MainSubject || '', otherSubjects: lw?.OtherSubjects || [],
              inferredSubject: lw?.InferredCNJSubjectName || '', status: lw?.Status || '',
              value: (lw?.Value != null && lw.Value >= 0) ? lw.Value : null,
              startDate: lw?.NoticeDate || lw?.StartDate || '', lastUpdate: lw?.LastMovementDate || '',
              state: lw?.State || '', area: lw?.InferredBroadCNJSubjectName || lwType,
              lastMovement: updates.length > 0 ? updates[0]?.Content || '' : '',
              recentUpdates: updates.slice(0, 5).map(u => ({ content: u?.Content || '', date: u?.PublishDate || '' })),
              parties: (lw?.Parties || []).map(p => ({ name: p?.Name || '', doc: p?.Doc || '', polarity: p?.Polarity || '', type: p?.Type || '', specificType: p?.PartyDetails?.SpecificType || '' })),
              ownerName: String(ownerName), jurisdiction: courtType,
            });
          }
        }
      }
    } else {
      const lItems = flattenBDCArray(ownersLawsuitsRaw);
      for (const item of lItems) {
        const lawsuitList = item?.Lawsuits?.Lawsuits || item?.Lawsuits || item?.LawsuitDetails || [];
        if (Array.isArray(lawsuitList)) {
          for (const lw of lawsuitList) {
            const lwType = lw?.Type || '';
            if (/criminal|penal|crime/i.test(lwType)) criminalFound = true;
            allOwnerLawsuits.push({
              number: lw?.Number || 'N/I', court: lw?.CourtName || '', type: lwType,
              subject: lw?.MainSubject || '', status: lw?.Status || '',
              value: (lw?.Value != null && lw.Value >= 0) ? lw.Value : null,
              startDate: lw?.NoticeDate || '', lastUpdate: lw?.LastMovementDate || '',
              parties: (lw?.Parties || []).map(p => ({ name: p?.Name || '', doc: p?.Doc || '', type: p?.Type || '' })),
              area: lw?.InferredBroadCNJSubjectName || lwType,
              lastMovement: (lw?.Updates || []).length > 0 ? lw.Updates[0]?.Content || '' : '',
              ownerName: item?.Name || '',
            });
          }
        }
      }
    }
    
    if (allOwnerLawsuits.length > 0) {
      const pts = criminalFound ? 50 : (allOwnerLawsuits.length > 10 ? 20 : 10);
      score += pts;
      const criminal = allOwnerLawsuits.filter(l => /criminal|penal|crime/i.test(l.type || '') || /criminal|penal|crime/i.test(l.courtType || ''));
      items.push({ label: 'Processos dos sócios', value: `${allOwnerLawsuits.length} processo(s) detalhado(s)${criminalFound ? ` — ⚠️ ${criminal.length} CRIMINAL(IS)` : ''}`, risk: criminalFound ? 'CRITICO' : 'ALTO', points: pts, lawsuits: allOwnerLawsuits });
    } else {
      const lItems = flattenBDCArray(ownersLawsuitsRaw);
      let totalReported = 0;
      for (const item of lItems) { totalReported += Number(item?.TotalLawsuits || 0); }
      if (totalReported > 0) {
        const pts = totalReported > 10 ? 20 : 10;
        score += pts;
        items.push({ label: 'Processos dos sócios', value: `${totalReported} processo(s) reportado(s) (detalhes não disponíveis)`, risk: 'ALTO', points: pts, lawsuitCount: totalReported });
      } else {
        items.push({ label: 'Processos dos sócios', value: 'Nenhum encontrado', risk: 'OK', points: 0 });
      }
    }
  }

  // Owners lawsuits distribution — NEW Sprint 2 (quick pre-filter)
  const ownersLawsuitsDist = result?.OwnersLawsuitsDistribution || result?.owners_lawsuits_distribution;
  if (ownersLawsuitsDist) {
    const dItems = flattenBDCArray(ownersLawsuitsDist);
    for (const item of dItems) {
      const totalCriminal = Number(item?.Criminal || item?.CriminalCount || 0);
      const totalCivil = Number(item?.Civil || item?.CivilCount || 0);
      const totalLabor = Number(item?.Labor || item?.LaborCount || 0);
      const total = Number(item?.Total || item?.TotalCount || 0);
      if (total > 0) {
        items.push({ label: 'Distribuição processos sócios', value: `Total: ${total} — Criminal: ${totalCriminal} | Cível: ${totalCivil} | Trabalhista: ${totalLabor}`, risk: totalCriminal > 0 ? 'CRITICO' : total > 20 ? 'ALTO' : 'INFO', points: 0 });
      }
    }
  }

  // Owners influence
  const influence = result?.OwnersInfluence || result?.owners_influence;
  if (influence) {
    const iItems = flattenBDCArray(influence);
    for (const item of iItems) {
      const level = item?.InfluenceLevel || item?.Level;
      if (level) items.push({ label: 'Influência do QSA', value: String(level), risk: 'INFO', points: 0 });
    }
  }

  // Electoral donors
  const donors = result?.OwnersElectoralDonors || result?.owners_electoral_donors;
  if (donors) {
    const dItems = flattenBDCArray(donors);
    let totalDonations = 0;
    for (const item of dItems) { totalDonations += Number(item?.TotalDonated || item?.Value || 0); }
    if (totalDonations > 0) {
      items.push({ label: 'Doações eleitorais', value: `R$ ${totalDonations.toLocaleString('pt-BR')}`, risk: totalDonations > 100000 ? 'ALTO' : 'MEDIO', points: totalDonations > 100000 ? 15 : 5 });
      score += totalDonations > 100000 ? 15 : 5;
    }
  }

  // Political involvement
  const political = result?.PoliticalInvolvement || result?.political_involvement;
  if (political) {
    const pItems = flattenBDCArray(political);
    if (pItems.length > 0 && pItems.some(p => p?.HasPoliticalInvolvement || p?.InvolvedPersons?.length > 0)) {
      score += 20;
      items.push({ label: 'Envolvimento político', value: 'Detectado — Sócio(s) com vínculos políticos (candidatura, filiação partidária, cargo público). Requer monitoramento reforçado.', risk: 'ALTO', points: 20 });
    }
  }

  return { score, items, pepFound, sanctionedFound };
}

// ══════════════════════════════════════════════════════════════════
// DIGITAL FOOTPRINT — kept from original + expanded
// ══════════════════════════════════════════════════════════════════
function analyzeDigitalFootprint(result) {
  const items = [];
  let score = 0;

  const domains = result?.Domains || result?.domains;
  if (domains) {
    const dItems = flattenBDCArray(domains);
    for (const item of dItems) {
      const domain = item?.Domain || item?.DomainName || '';
      const age = item?.DomainAge || item?.Age;
      const ssl = item?.HasSSL || item?.SSLEnabled;
      const platform = item?.Platform || item?.Technology || '';
      const paymentMethods = item?.PaymentMethods || item?.AcceptedPayments || [];
      const siteType = item?.SiteType || item?.WebsiteType || '';
      if (domain) {
        const ageYears = age ? Math.floor(Number(age) / 365) : null;
        let risk = 'OK'; let pts = 0;
        if (ssl === false) { risk = 'ALTO'; pts += 15; }
        if (ageYears !== null && ageYears < 1) { risk = 'ALTO'; pts += 10; }
        score += pts;
        const details = { age: ageYears != null ? `${ageYears} ano(s)` : 'N/D', ssl: ssl ? 'Sim' : ssl === false ? 'Não' : 'N/D', platform: platform || 'N/D' };
        if (siteType) details['Tipo de site'] = siteType;
        if (Array.isArray(paymentMethods) && paymentMethods.length > 0) details['Métodos de pagamento'] = paymentMethods.join(', ');
        items.push({ label: 'Domínio', value: domain, risk, points: pts, details });
      }
    }
  }

  const passages = result?.Passages || result?.passages;
  if (passages) {
    const pItems = flattenBDCArray(passages);
    let totalPassages = 0, last365 = 0;
    for (const item of pItems) {
      totalPassages += Number(item?.TotalPassages || 0);
      last365 += Number(item?.Last365DaysPassages || item?.RecentPassages || 0);
    }
    let risk = 'OK'; let pts = 0;
    if (totalPassages === 0) { risk = 'CRITICO'; pts = 30; }
    else if (last365 < 5) { risk = 'ALTO'; pts = 15; }
    score += pts;
    items.push({ label: 'Passagens web', value: `${totalPassages} total / ${last365} últimos 12 meses`, risk, points: pts });
  }

  const ai = result?.ActivityIndicators || result?.activity_indicators;
  if (ai) {
    const aItems = flattenBDCArray(ai);
    for (const item of aItems) {
      const actLevel = item?.ActivityLevel ?? item?.Level;
      const shell = item?.ShellCompanyLikelyhood ?? item?.ShellCompanyLikelihood;
      const employees = item?.EmployeesRange || item?.NumberOfEmployees || '';
      const income = item?.IncomeRange || item?.Revenue || '';
      const hasActiveDomain = item?.HasActiveDomain;

      if (actLevel != null) {
        const level = Number(actLevel);
        let r = level > 0.6 ? 'OK' : level > 0.3 ? 'MEDIO' : 'ALTO';
        let p = level < 0.3 ? 20 : level < 0.6 ? 10 : 0;
        score += p;
        items.push({ label: 'Nível de atividade', value: `${(level * 100).toFixed(0)}%`, risk: r, points: p });
      }
      if (shell != null) {
        const s = Number(shell);
        items.push({ label: 'Shell Company score', value: `${(s * 100).toFixed(0)}%`, risk: s > 0.5 ? 'CRITICO' : s > 0.3 ? 'ALTO' : 'OK', points: 0 });
      }
      if (employees) items.push({ label: 'Faixa de empregados', value: String(employees), risk: 'INFO', points: 0 });
      if (income) items.push({ label: 'Faixa de receita', value: String(income), risk: 'INFO', points: 0 });
      if (hasActiveDomain != null) items.push({ label: 'Domínio ativo', value: hasActiveDomain ? 'Sim' : 'Não', risk: hasActiveDomain ? 'OK' : 'ALTO', points: 0 });
    }
  }

  const mp = result?.MarketplaceData || result?.marketplace_data;
  if (mp) {
    const mItems = flattenBDCArray(mp);
    const marketplaces = [];
    for (const item of mItems) { const name = item?.MarketplaceName || item?.Platform || item?.Name; if (name) marketplaces.push(name); }
    if (marketplaces.length > 0) items.push({ label: 'Presença em marketplaces', value: marketplaces.join(', '), risk: 'OK', points: -10 });
  }

  const ads = result?.OnlineAds || result?.online_ads;
  if (ads) {
    const adItems = flattenBDCArray(ads);
    if (adItems.length > 0) items.push({ label: 'Anúncios online', value: `${adItems.length} encontrado(s)`, risk: 'INFO', points: 0 });
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// COMPLIANCE ANALYSIS — kept from original + expanded with distributions
// ══════════════════════════════════════════════════════════════════
function analyzeCompliance(result) {
  const items = [];
  let score = 0;

  // KYC (company)
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kItems = flattenBDCArray(kyc);
    let hasSanctions = false, isPep = false;
    for (const item of kItems) {
      if (item?.IsPEP || item?.IsPep) isPep = true;
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) hasSanctions = true;
    }
    items.push({ label: 'Sanções empresa', value: hasSanctions ? 'ENCONTRADA — Empresa em lista de sanções internacionais' : 'Nenhuma — Empresa não consta em listas OFAC, EU, UN, COAF, CEIS, CNEP', risk: hasSanctions ? 'CRITICO' : 'OK', points: hasSanctions ? 80 : 0 });
    items.push({ label: 'PEP empresa', value: isPep ? 'SIM — Empresa classificada como PEP' : 'Não', risk: isPep ? 'ALTO' : 'OK', points: isPep ? 40 : 0 });
    if (hasSanctions) score += 80;
    if (isPep) score += 40;
  }

  // Government debtors
  const debtors = result?.GovernmentDebtors || result?.government_debtors;
  if (debtors) {
    const dItems = flattenBDCArray(debtors);
    let totalDebt = 0;
    const sources = [];
    for (const item of dItems) {
      totalDebt += Number(item?.TotalValue || item?.Value || 0);
      const source = item?.Source || item?.Origin || '';
      if (source && !sources.includes(source)) sources.push(source);
    }
    if (totalDebt > 0) {
      const pts = totalDebt > 500000 ? 80 : totalDebt > 100000 ? 40 : 20;
      score += pts;
      items.push({ label: 'Dívida ativa', value: `R$ ${totalDebt.toLocaleString('pt-BR',{minimumFractionDigits:2})} — Inscrita em dívida ativa da União/Estados/Municípios`, risk: totalDebt > 500000 ? 'CRITICO' : 'ALTO', points: pts, details: { sources: sources.join(', ') || 'N/D' } });
    } else {
      items.push({ label: 'Dívida ativa', value: 'Nenhuma — Empresa não consta como devedora do governo', risk: 'OK', points: 0 });
    }
  }

  // Lawsuits distribution — NEW Sprint 2 (quick aggregate view)
  const lawsuitsDist = result?.LawsuitsDistributionData || result?.lawsuits_distribution_data;
  if (lawsuitsDist) {
    const ldItems = flattenBDCArray(lawsuitsDist);
    for (const item of ldItems) {
      const totalCriminal = Number(item?.Criminal || item?.CriminalCount || 0);
      const totalCivil = Number(item?.Civil || item?.CivilCount || 0);
      const totalLabor = Number(item?.Labor || item?.LaborCount || 0);
      const totalAdmin = Number(item?.Administrative || item?.AdminCount || 0);
      const total = Number(item?.Total || item?.TotalCount || (totalCriminal + totalCivil + totalLabor + totalAdmin));
      if (total > 0) {
        items.push({ label: 'Distribuição processos empresa', value: `Total: ${total} — Criminal: ${totalCriminal} | Cível: ${totalCivil} | Trabalhista: ${totalLabor} | Administrativo: ${totalAdmin}`, risk: totalCriminal > 0 ? 'CRITICO' : total > 20 ? 'ALTO' : 'INFO', points: 0 });
      }
    }
  }

  // Processes (company) — full detail (kept from original)
  const processesRaw = result?.Processes || result?.processes || result?.Lawsuits || result?.lawsuits;
  if (processesRaw) {
    let hasCriminal = false;
    const allLawsuits = [];
    const directLawsuits = processesRaw?.Lawsuits;
    if (Array.isArray(directLawsuits) && directLawsuits.length > 0) {
      for (const lw of directLawsuits) {
        const lwType = lw?.Type || lw?.LawsuitType || '';
        const courtType = lw?.CourtType || '';
        if (/criminal|penal|crime/i.test(lwType) || /criminal|penal|crime/i.test(courtType)) hasCriminal = true;
        const updates = lw?.Updates || [];
        allLawsuits.push({
          number: lw?.Number || 'N/I', court: lw?.CourtName || '', courtLevel: lw?.CourtLevel || '',
          courtType, courtDistrict: lw?.CourtDistrict || '', judgingBody: lw?.JudgingBody || '',
          type: lwType, subject: lw?.MainSubject || '', otherSubjects: lw?.OtherSubjects || [],
          inferredSubject: lw?.InferredCNJSubjectName || '', inferredBroadSubject: lw?.InferredBroadCNJSubjectName || lwType,
          status: lw?.Status || '', value: (lw?.Value != null && lw.Value >= 0) ? lw.Value : null,
          startDate: lw?.NoticeDate || lw?.RedistributionDate || '', lastUpdate: lw?.LastMovementDate || '',
          closeDate: lw?.CloseDate || '', lawsuitAge: lw?.LawSuitAge || null,
          numberOfParties: lw?.NumberOfParties || 0, numberOfUpdates: lw?.NumberOfUpdates || 0,
          state: lw?.State || '', hostService: lw?.LawsuitHostService || '',
          parties: (lw?.Parties || []).map(p => ({ name: p?.Name || '', doc: p?.Doc || '', polarity: p?.Polarity || '', type: p?.Type || '', specificType: p?.PartyDetails?.SpecificType || '', oab: p?.PartyDetails?.OAB || '' })),
          recentUpdates: updates.slice(0, 5).map(u => ({ content: u?.Content || '', date: u?.PublishDate || '' })),
          area: lw?.InferredBroadCNJSubjectName || lwType,
          lastMovement: updates.length > 0 ? updates[0]?.Content || '' : '',
          jurisdiction: `${courtType || ''} — Nível ${lw?.CourtLevel || 'N/I'}`,
        });
      }
    } else {
      const pItems = flattenBDCArray(processesRaw);
      for (const item of pItems) {
        const lawsuitList = item?.Lawsuits || item?.LawsuitDetails || item?.Items || [];
        if (Array.isArray(lawsuitList)) {
          for (const lw of lawsuitList) {
            const lwType = lw?.Type || '';
            if (/criminal|penal|crime/i.test(lwType)) hasCriminal = true;
            allLawsuits.push({
              number: lw?.Number || 'N/I', court: lw?.CourtName || '', type: lwType,
              subject: lw?.MainSubject || '', status: lw?.Status || '',
              value: (lw?.Value != null && lw.Value >= 0) ? lw.Value : null,
              startDate: lw?.NoticeDate || '', lastUpdate: lw?.LastMovementDate || '',
              parties: (lw?.Parties || []).map(p => ({ name: p?.Name || '', doc: p?.Doc || '', type: p?.Type || '' })),
              recentUpdates: (lw?.Updates || []).slice(0, 5).map(u => ({ content: u?.Content || '', date: u?.PublishDate || '' })),
              area: lw?.InferredBroadCNJSubjectName || lwType,
              lastMovement: (lw?.Updates || []).length > 0 ? lw.Updates[0]?.Content || '' : '',
            });
          }
        }
      }
    }

    if (allLawsuits.length > 0) {
      const pts = hasCriminal ? 50 : (allLawsuits.length > 20 ? 25 : 10);
      score += pts;
      const criminal = allLawsuits.filter(l => /criminal|penal|crime/i.test(l.type || '') || /criminal|penal|crime/i.test(l.courtType || ''));
      const civel = allLawsuits.filter(l => /c[ií]vel/i.test(l.type || '') || /c[ií]vel/i.test(l.courtType || ''));
      const trabalhista = allLawsuits.filter(l => /trabalh/i.test(l.type || '') || /trabalh/i.test(l.courtType || ''));
      const breakdown = [];
      if (criminal.length > 0) breakdown.push(`${criminal.length} criminal(is)`);
      if (civel.length > 0) breakdown.push(`${civel.length} cível(is)`);
      if (trabalhista.length > 0) breakdown.push(`${trabalhista.length} trabalhista(s)`);
      items.push({ label: 'Processos judiciais', value: `${allLawsuits.length} processo(s) detalhado(s)${hasCriminal ? ' — ⚠️ INCLUI CRIMINAL' : ''} — ${breakdown.join(', ')}`, risk: hasCriminal ? 'CRITICO' : 'ALTO', points: pts, lawsuits: allLawsuits });
    } else {
      const pItems = flattenBDCArray(processesRaw);
      let totalReported = 0;
      for (const item of pItems) { totalReported += Number(item?.TotalLawsuits || 0); }
      if (totalReported > 0) {
        const pts = totalReported > 20 ? 25 : 10;
        score += pts;
        items.push({ label: 'Processos judiciais', value: `${totalReported} processo(s) reportado(s)`, risk: 'ALTO', points: pts, lawsuitCount: totalReported });
      } else {
        items.push({ label: 'Processos judiciais', value: 'Nenhum', risk: 'OK', points: 0 });
      }
    }
  }

  // Collections
  const collections = result?.Collections || result?.collections;
  if (collections) {
    const cItems = flattenBDCArray(collections);
    let hasCollections = false, totalRecords = 0, totalValue = 0;
    const creditors = [], sources = [];
    for (const item of cItems) {
      if (item?.HasCollectionRecords || item?.TotalRecords > 0) hasCollections = true;
      totalRecords += Number(item?.TotalRecords || 0);
      totalValue += Number(item?.TotalValue || item?.Value || 0);
      const creditor = item?.CreditorName || item?.Creditor || '';
      if (creditor && !creditors.includes(creditor)) creditors.push(creditor);
      const src = item?.Source || item?.Origin || '';
      if (src && !sources.includes(src)) sources.push(src);
    }
    if (hasCollections) {
      score += 30;
      const details = {};
      if (totalRecords > 0) details['Registros'] = totalRecords;
      if (totalValue > 0) details['Valor total'] = `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      if (creditors.length > 0) details['Credores'] = creditors.slice(0, 10).join(', ');
      if (sources.length > 0) details['Fontes'] = sources.join(', ');
      items.push({ label: 'Em cobrança', value: `SIM — ${totalRecords} registro(s)${totalValue > 0 ? ` totalizando R$ ${totalValue.toLocaleString('pt-BR')}` : ''}`, risk: 'ALTO', points: 30, details });
    } else {
      items.push({ label: 'Em cobrança', value: 'Não — Empresa sem registros de negativação/cobrança', risk: 'OK', points: 0 });
    }
  }

  // Financial market
  const fm = result?.FinancialMarket || result?.financial_market;
  if (fm) {
    const fItems = flattenBDCArray(fm);
    const registrations = [];
    for (const item of fItems) { const reg = item?.RegistrationType || item?.Entity || ''; if (reg) registrations.push(reg); }
    if (registrations.length > 0) items.push({ label: 'Registro BCB/CVM/SUSEP', value: registrations.join(', '), risk: 'OK', points: -20 });
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// REPUTATION ANALYSIS — kept from original
// ══════════════════════════════════════════════════════════════════
function analyzeReputation(result) {
  const items = [];
  let score = 0;

  const media = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
  if (media) {
    const mItems = flattenBDCArray(media);
    let positive = 0, negative = 0, veryNeg = 0, neutral = 0;
    const headlines = [];
    for (const item of mItems) {
      const sentiment = String(item?.Sentiment || item?.OverallSentiment || '').toUpperCase();
      if (sentiment.includes('VERY_NEGATIVE')) { veryNeg++; headlines.push(item?.Title || item?.Headline || 'N/I'); }
      else if (sentiment.includes('NEGATIVE')) { negative++; headlines.push(item?.Title || item?.Headline || 'N/I'); }
      else if (sentiment.includes('POSITIVE')) positive++;
      else neutral++;
    }
    if (veryNeg > 0) { score += 80; items.push({ label: 'Mídia muito negativa', value: `${veryNeg} menção(ões) com sentimento VERY_NEGATIVE`, risk: 'CRITICO', points: 80, details: { headlines: headlines.slice(0, 5) } }); }
    if (negative > 0) { score += 30; items.push({ label: 'Mídia negativa', value: `${negative} menção(ões)`, risk: 'ALTO', points: 30, details: { headlines: headlines.slice(0, 5) } }); }
    if (positive > 0 || neutral > 0) items.push({ label: 'Mídia neutra/positiva', value: `${positive} positiva(s), ${neutral} neutra(s)`, risk: 'OK', points: 0 });
    if (mItems.length === 0) items.push({ label: 'Exposição na mídia', value: 'Nenhuma menção', risk: 'INFO', points: 0 });
  }

  const rep = result?.ReputationsAndReviews || result?.reputations_and_reviews;
  if (rep) {
    const rItems = flattenBDCArray(rep);
    for (const item of rItems) {
      const platform = item?.Platform || item?.Source || 'Reclame Aqui';
      const rating = item?.Rating || item?.Score || item?.GeneralScore;
      const complaints = item?.TotalComplaints || item?.ComplaintsCount || 0;
      const resolved = item?.ResolvedPercentage || item?.ResolutionRate || 0;
      if (rating != null) {
        const r = Number(rating);
        const risk = r >= 7 ? 'OK' : r >= 5 ? 'MEDIO' : 'ALTO';
        const pts = r < 5 ? 20 : r < 7 ? 10 : -10;
        score += pts;
        items.push({ label: platform, value: `Nota ${r}/10 — ${complaints} reclamações — ${resolved}% resolvidas`, risk, points: pts });
      }
    }
  }

  const awards = result?.AwardsAndCertifications || result?.awards_and_certifications;
  if (awards) {
    const aItems = flattenBDCArray(awards);
    if (aItems.length > 0) { items.push({ label: 'Prêmios/Certificações', value: `${aItems.length} encontrado(s)`, risk: 'OK', points: -15 }); score -= 15; }
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// FINANCIAL ANALYSIS — kept from original + expanded
// ══════════════════════════════════════════════════════════════════
function analyzeFinancial(result) {
  const items = [];
  let score = 0;

  // Economic group
  const eg = result?.EconomicGroup || result?.economic_group;
  if (eg) {
    const eItems = flattenBDCArray(eg);
    let groupSize = 0;
    for (const item of eItems) { groupSize += Number(item?.GroupSize || item?.TotalCompanies || 0); }
    if (groupSize > 0) {
      items.push({ label: 'Grupo econômico', value: `${groupSize} empresa(s) no grupo`, risk: groupSize > 20 ? 'ALTO' : 'INFO', points: groupSize > 20 ? 15 : 0 });
      if (groupSize > 20) score += 15;
    }
  }

  // Economic Group Relationships — NEW Sprint 2
  const egRels = result?.EconomicGroupRelationships || result?.economic_group_relationships;
  if (egRels) {
    const erItems = flattenBDCArray(egRels);
    let circularDetected = false;
    const companies = [];
    for (const item of erItems) {
      const name = item?.CompanyName || item?.EntityName || item?.Name || '';
      const doc = item?.CNPJ || item?.TaxIdNumber || '';
      const relType = item?.RelationshipType || item?.Type || '';
      if (name) companies.push(`${name} (${relType || 'vínculo'})`);
      if (item?.CircularParticipation || item?.IsCircular) circularDetected = true;
    }
    if (companies.length > 0) {
      items.push({ label: 'Empresas do grupo econômico', value: `${companies.length} empresa(s): ${companies.slice(0, 10).join('; ')}${companies.length > 10 ? ` ... +${companies.length - 10}` : ''}`, risk: circularDetected ? 'CRITICO' : 'INFO', points: circularDetected ? 30 : 0 });
      if (circularDetected) {
        score += 30;
        items.push({ label: 'Participação circular detectada', value: 'Estrutura societária com participações cruzadas/circulares — possível indicativo de lavagem de dinheiro ou ocultação de beneficiários finais', risk: 'CRITICO', points: 30 });
      }
    }
  }

  // MCC
  const mcc = result?.MerchantCategoryData || result?.merchant_category_data;
  if (mcc) {
    const mItems = flattenBDCArray(mcc);
    for (const item of mItems) {
      const code = item?.MCC || item?.CategoryCode || '';
      const desc = item?.Description || item?.CategoryDescription || '';
      if (code) items.push({ label: 'MCC real', value: `${code} — ${desc}`, risk: 'INFO', points: 0 });
    }
  }

  // Licenses
  const lic = result?.LicensesAndAuthorizations || result?.licenses_and_authorizations;
  if (lic) {
    const lItems = flattenBDCArray(lic);
    if (lItems.length > 0) { items.push({ label: 'Licenças', value: `${lItems.length} encontrada(s)`, risk: 'OK', points: -5 }); score -= 5; }
  }

  // Industrial property (patents, trademarks)
  const ip = result?.IndustrialProperty || result?.industrial_property;
  if (ip) {
    const ipItems = flattenBDCArray(ip);
    const patents = [];
    const trademarks = [];
    for (const item of ipItems) {
      const type = item?.Type || item?.PropertyType || '';
      const name = item?.Name || item?.Title || item?.Description || '';
      const status = item?.Status || '';
      if (/patent|inven/i.test(type)) patents.push({ name, status });
      else trademarks.push({ name, status });
    }
    if (patents.length > 0) {
      items.push({ label: 'Patentes registradas', value: `${patents.length} patente(s): ${patents.slice(0, 5).map(p => `${p.name} (${p.status || 'N/I'})`).join('; ')}`, risk: 'OK', points: -5 });
      score -= 5;
    }
    if (trademarks.length > 0) {
      items.push({ label: 'Marcas registradas', value: `${trademarks.length} marca(s): ${trademarks.slice(0, 5).map(t => `${t.name} (${t.status || 'N/I'})`).join('; ')}`, risk: 'OK', points: -5 });
      score -= 5;
    }
    if (ipItems.length > 0 && patents.length === 0 && trademarks.length === 0) {
      items.push({ label: 'Propriedade industrial', value: `${ipItems.length} registro(s) encontrado(s)`, risk: 'OK', points: -5 });
      score -= 5;
    }
  }

  // Owners industrial property
  const oip = result?.OwnersIndustrialProperty || result?.owners_industrial_property;
  if (oip) {
    const oipItems = flattenBDCArray(oip);
    if (oipItems.length > 0) {
      const ownerIpList = oipItems.slice(0, 5).map(item => {
        const owner = item?.OwnerName || item?.Name || 'N/I';
        const type = item?.Type || item?.PropertyType || 'registro';
        const title = item?.Title || item?.Description || '';
        return `${owner}: ${title || type}`;
      });
      items.push({ label: 'Propriedade industrial dos sócios', value: `${oipItems.length} registro(s): ${ownerIpList.join('; ')}`, risk: 'INFO', points: 0 });
    }
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// PERSON (PF) ANALYSIS — kept from original + risk_data
// ══════════════════════════════════════════════════════════════════
function analyzePersonBlocks(result) {
  const blocks = [];
  const bd = result?.BasicData || result?.basic_data;
  if (bd) {
    const items = flattenBDCArray(bd);
    const first = items[0] || {};
    const status = first?.TaxIdStatus || first?.TaxIdStatusDescription || '';
    if (status && !String(status).toUpperCase().includes('REGULAR')) {
      blocks.push({ code: 'B01', label: 'CPF Irregular', severity: 'BLOQUEIO', detail: `Situação: ${status}. CPF não regular impede qualquer operação financeira.`, score: 850 });
    }
    const birthDate = first?.BirthDate || first?.DateOfBirth;
    if (birthDate) {
      const age = (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) blocks.push({ code: 'B02', label: 'Menor de 18 anos', severity: 'BLOQUEIO', detail: `Idade: ${Math.floor(age)} anos. Menores de 18 não podem ser titulares de operações financeiras.`, score: 850 });
    }
    // Death check
    const isDead = first?.IsAlive === false || first?.DeathDate != null || first?.Obito === true;
    if (isDead) blocks.push({ code: 'B04', label: 'Pessoa falecida', severity: 'BLOQUEIO', detail: `CPF associado a óbito. Operação com CPF de pessoa falecida indica fraude.`, score: 850 });
  }
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kItems = flattenBDCArray(kyc);
    for (const item of kItems) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        blocks.push({ code: 'B03', label: 'Pessoa em lista de sanções', severity: 'BLOQUEIO', detail: `${sanctions.length} sanção(ões) — Listas: ${sanctions.map(s => s.Source || s.ListName || 'N/I').join(', ')}`, score: 850 });
      }
    }
  }
  return blocks;
}

function analyzePersonData(result) {
  const sections = { identity: { score: 0, items: [] }, compliance: { score: 0, items: [] }, reputation: { score: 0, items: [] } };

  const bd = result?.BasicData || result?.basic_data;
  if (bd) {
    const first = (typeof bd === 'object' && !Array.isArray(bd)) ? bd : (flattenBDCArray(bd)[0] || {});
    sections.identity.items.push({ label: 'Nome', value: first?.Name || first?.PersonalName || first?.FullName || 'N/D', risk: 'INFO', points: 0 });
    const cpfStatus = first?.TaxIdStatus || first?.TaxIdStatusDescription || 'N/D';
    sections.identity.items.push({ label: 'Situação CPF', value: cpfStatus, risk: String(cpfStatus).toUpperCase().includes('REGULAR') ? 'OK' : 'ALTO', points: 0 });
    if (first?.BirthDate || first?.DateOfBirth) {
      const bDate = first.BirthDate || first.DateOfBirth;
      const age = Math.floor((Date.now() - new Date(bDate).getTime()) / (365.25 * 24 * 3600 * 1000));
      sections.identity.items.push({ label: 'Idade / Nascimento', value: `${age} anos (${new Date(bDate).toLocaleDateString('pt-BR')})`, risk: age < 18 ? 'CRITICO' : 'OK', points: 0 });
    }
    if (first?.MotherName) sections.identity.items.push({ label: 'Nome da mãe', value: first.MotherName, risk: 'INFO', points: 0 });
    if (first?.Gender) sections.identity.items.push({ label: 'Gênero', value: first.Gender, risk: 'INFO', points: 0 });
    if (first?.Nationality) sections.identity.items.push({ label: 'Nacionalidade', value: first.Nationality, risk: 'INFO', points: 0 });
    const addr = first?.Address || first?.MainAddress;
    if (addr) {
      const addrStr = typeof addr === 'object' ? [addr.Street || addr.StreetName, addr.Number, addr.Complement, addr.Neighborhood, addr.City, addr.State, addr.ZipCode].filter(Boolean).join(', ') : String(addr);
      sections.identity.items.push({ label: 'Endereço', value: addrStr, risk: 'INFO', points: 0 });
    }
    if (first?.Email) sections.identity.items.push({ label: 'E-mail', value: first.Email, risk: 'INFO', points: 0 });
    if (first?.Phone || first?.PhoneNumber) sections.identity.items.push({ label: 'Telefone', value: first.Phone || first.PhoneNumber, risk: 'INFO', points: 0 });
  }

  // Risk data PF — NEW
  const riskData = result?.RiskData || result?.risk_data;
  if (riskData) {
    const rItems = flattenBDCArray(riskData);
    for (const item of rItems) {
      const hasCollection = item?.HasCollectionRecords || item?.InCollection;
      if (hasCollection) {
        sections.compliance.items.push({ label: 'Risco PF — Em cobrança', value: 'SIM — Pessoa com registros de cobrança/negativação', risk: 'ALTO', points: 15 });
        sections.compliance.score += 15;
      }
      const riskLevel = item?.RiskLevel || item?.Level;
      if (riskLevel) {
        sections.compliance.items.push({ label: 'Nível de risco PF', value: String(riskLevel), risk: /alto|high|critico/i.test(String(riskLevel)) ? 'ALTO' : 'INFO', points: 0 });
      }
    }
  }

  // KYC PEP/Sanctions
  const pKyc = result?.Kyc || result?.kyc;
  if (pKyc) {
    const kItems = flattenBDCArray(pKyc);
    let isPep = false, hasSanctions = false;
    const sanctionDetails = [];
    for (const item of kItems) {
      if (item?.IsPEP || item?.IsPep) isPep = true;
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) { hasSanctions = true; for (const s of sanctions) sanctionDetails.push(s?.Source || s?.ListName || 'N/I'); }
    }
    sections.compliance.items.push({ label: 'PEP', value: isPep ? 'SIM — Pessoa Politicamente Exposta. Circular BCB 3.978/2020 Art. 14 exige EDD.' : 'Não', risk: isPep ? 'ALTO' : 'OK', points: isPep ? 40 : 0 });
    if (isPep) sections.compliance.score += 40;
    if (hasSanctions) {
      sections.compliance.items.push({ label: 'Sanções', value: `ENCONTRADA(S): ${sanctionDetails.join(', ')}`, risk: 'CRITICO', points: 80 });
      sections.compliance.score += 80;
    }
  }

  // Processes PF — full detail
  const pProcesses = result?.Processes || result?.processes;
  if (pProcesses) {
    let hasCriminal = false;
    const allLawsuits = [];
    const directLawsuits = pProcesses?.Lawsuits;
    if (Array.isArray(directLawsuits) && directLawsuits.length > 0) {
      for (const lw of directLawsuits) {
        const lwType = lw?.Type || '';
        const courtType = lw?.CourtType || '';
        if (/criminal|penal|crime/i.test(lwType) || /criminal|penal|crime/i.test(courtType)) hasCriminal = true;
        const updates = lw?.Updates || [];
        allLawsuits.push({
          number: lw?.Number || 'N/I', court: lw?.CourtName || '', courtType, judgingBody: lw?.JudgingBody || '',
          type: lwType, subject: lw?.MainSubject || '', status: lw?.Status || '',
          value: (lw?.Value != null && lw.Value >= 0) ? lw.Value : null,
          startDate: lw?.NoticeDate || '', lastUpdate: lw?.LastMovementDate || '',
          parties: (lw?.Parties || []).map(p => ({ name: p?.Name || '', doc: p?.Doc || '', type: p?.Type || '' })),
          recentUpdates: updates.slice(0, 5).map(u => ({ content: u?.Content || '', date: u?.PublishDate || '' })),
          area: lw?.InferredBroadCNJSubjectName || lwType,
          lastMovement: updates.length > 0 ? updates[0]?.Content || '' : '',
        });
      }
    } else {
      const pItems = flattenBDCArray(pProcesses);
      for (const item of pItems) {
        const lawsuitList = item?.Lawsuits || item?.LawsuitDetails || [];
        if (Array.isArray(lawsuitList)) {
          for (const lw of lawsuitList) {
            const lwType = lw?.Type || '';
            if (/criminal|penal|crime/i.test(lwType)) hasCriminal = true;
            allLawsuits.push({
              number: lw?.Number || 'N/I', court: lw?.CourtName || '', type: lwType,
              subject: lw?.MainSubject || '', status: lw?.Status || '',
              value: (lw?.Value != null && lw.Value >= 0) ? lw.Value : null,
              startDate: lw?.NoticeDate || '', lastUpdate: lw?.LastMovementDate || '',
              parties: (lw?.Parties || []).map(p => ({ name: p?.Name || '', doc: p?.Doc || '', type: p?.Type || '' })),
              recentUpdates: (lw?.Updates || []).slice(0, 5).map(u => ({ content: u?.Content || '', date: u?.PublishDate || '' })),
              area: lw?.InferredBroadCNJSubjectName || lwType,
              lastMovement: (lw?.Updates || []).length > 0 ? lw.Updates[0]?.Content || '' : '',
            });
          }
        }
      }
    }
    if (allLawsuits.length > 0) {
      const pts = hasCriminal ? 50 : (allLawsuits.length > 5 ? 30 : 10);
      sections.compliance.items.push({ label: 'Processos judiciais', value: `${allLawsuits.length} processo(s)${hasCriminal ? ' — ⚠️ INCLUI CRIMINAL' : ''}`, risk: hasCriminal ? 'CRITICO' : (allLawsuits.length > 5 ? 'ALTO' : 'MEDIO'), points: pts, lawsuits: allLawsuits });
      sections.compliance.score += pts;
    } else {
      sections.compliance.items.push({ label: 'Processos judiciais', value: 'Nenhum', risk: 'OK', points: 0 });
    }
  }

  // Collections PF
  const pCollections = result?.Collections || result?.collections;
  if (pCollections) {
    const cItems = flattenBDCArray(pCollections);
    const has = cItems.some(i => i?.HasCollectionRecords || i?.TotalRecords > 0);
    const totalRecords = cItems.reduce((s, i) => s + (Number(i?.TotalRecords || 0)), 0);
    const totalValue = cItems.reduce((s, i) => s + (Number(i?.TotalValue || i?.Value || 0)), 0);
    sections.compliance.items.push({ label: 'Negativação', value: has ? `SIM — ${totalRecords} registro(s)${totalValue > 0 ? ` (R$ ${totalValue.toLocaleString('pt-BR')})` : ''}` : 'Não', risk: has ? 'ALTO' : 'OK', points: has ? 30 : 0 });
    if (has) sections.compliance.score += 30;
  }

  // Adverse media PF
  const pMedia = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
  if (pMedia) {
    const mItems = flattenBDCArray(pMedia);
    let neg = 0, veryNeg = 0;
    for (const item of mItems) {
      const sentiment = String(item?.Sentiment || item?.OverallSentiment || '').toUpperCase();
      if (sentiment.includes('VERY_NEGATIVE')) veryNeg++;
      else if (sentiment.includes('NEGATIVE')) neg++;
    }
    if (veryNeg > 0) { sections.reputation.items.push({ label: 'Mídia muito negativa', value: `${veryNeg} menção(ões)`, risk: 'CRITICO', points: 50 }); sections.reputation.score += 50; }
    if (neg > 0) { sections.reputation.items.push({ label: 'Mídia negativa', value: `${neg} menção(ões)`, risk: 'ALTO', points: 20 }); sections.reputation.score += 20; }
    if (veryNeg === 0 && neg === 0) sections.reputation.items.push({ label: 'Adverse media', value: mItems.length > 0 ? `${mItems.length} menção(ões), nenhuma negativa` : 'Nenhuma menção', risk: 'OK', points: 0 });
  }

  // Online presence PF
  const online = result?.OnlinePresence || result?.online_presence;
  if (online) {
    const oItems = flattenBDCArray(online);
    if (oItems.length > 0) {
      const profiles = oItems.map(o => o?.Platform || o?.Source || o?.SocialNetwork || '').filter(Boolean);
      sections.reputation.items.push({ label: 'Presença online', value: profiles.length > 0 ? profiles.join(', ') : `${oItems.length} registro(s)`, risk: 'INFO', points: 0 });
    }
  }

  return sections;
}

// ══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { onboardingCaseId, document, documentType, forceGroup } = await req.json();
    if (!onboardingCaseId && !document) return Response.json({ error: 'onboardingCaseId ou document é obrigatório' }, { status: 400 });

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    let doc = document;
    let docType = documentType;
    let templateModel = null;
    let onboardingCase = null;
    let merchant = null;
    let responses = [];

    if (onboardingCaseId) {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      onboardingCase = cases[0];
      if (!onboardingCase) return Response.json({ error: 'Case not found' }, { status: 404 });
      const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
      merchant = merchants[0];
      if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 });
      doc = merchant.cpfCnpj?.replace(/\D/g, '');
      docType = merchant.type === 'PF' ? 'cpf' : 'cnpj';
      if (onboardingCase.questionnaireTemplateId) {
        const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: onboardingCase.questionnaireTemplateId });
        if (templates[0]) templateModel = templates[0].model;
      }
      try { responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId }); } catch (e) { /* ok */ }
    }

    if (!doc) return Response.json({ error: 'No document found' }, { status: 400 });
    const cleanDoc = doc.replace(/\D/g, '');
    const isPF = docType === 'cpf' || cleanDoc.length === 11;
    const endpoint = isPF ? '/pessoas' : '/empresas';
    const groupKey = forceGroup || MODEL_TO_GROUP[templateModel] || (isPF ? 'SUBSELLER_PF' : 'STANDARD');
    const datasets = DATASET_GROUPS[groupKey] || DATASET_GROUPS.STANDARD;

    console.log(`BDC Enrich: ${cleanDoc} | ${endpoint} | group=${groupKey} | datasets=${datasets.length}`);

    const bdcResponse = await fetch(`${BDC_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'AccessToken': accessToken, 'TokenId': tokenId, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ Datasets: datasets.join(','), q: `doc{${cleanDoc}}`, Limit: 1 }),
    });

    const rawText = await bdcResponse.text();
    let bdcData;
    try { bdcData = JSON.parse(rawText); } catch (e) { return Response.json({ error: 'BDC parse error', raw: rawText.substring(0, 300) }, { status: 500 }); }

    const result = bdcData.Result?.[0] || {};

    let analysis;
    if (isPF) {
      const blocks = analyzePersonBlocks(result);
      const sections = analyzePersonData(result);
      const totalScore = sections.identity.score + sections.compliance.score + sections.reputation.score;
      const baseScore = SEGMENT_BASE_SCORES[templateModel] || 30;
      const finalScore = Math.max(0, Math.min(849, baseScore + totalScore));
      const hasBlock = blocks.length > 0;
      analysis = {
        type: 'PF', document: cleanDoc, templateModel, datasetGroup: groupKey,
        datasetsQueried: datasets.length, queryDate: bdcData.QueryDate, elapsedMs: bdcData.ElapsedMilliseconds,
        blocks, hasBlock, sections,
        scoring: {
          baseScore, variablesScore: totalScore, enrichmentScore: 0,
          finalScore: hasBlock ? 850 : finalScore,
          subfaixa: hasBlock ? '5' : finalScore <= 100 ? '1A' : finalScore <= 200 ? '1B' : finalScore <= 300 ? '2A' : finalScore <= 400 ? '2B' : finalScore <= 500 ? '3A' : finalScore <= 600 ? '3B' : finalScore <= 700 ? '4' : '5',
        },
        rawBdcStatus: bdcData.Status,
      };
    } else {
      const blocks = analyzeBlocks(result, responses);
      const identity = analyzeIdentity(result);
      const owners = analyzeOwners(result);
      const digital = analyzeDigitalFootprint(result);
      const compliance = analyzeCompliance(result);
      const reputation = analyzeReputation(result);
      const financial = analyzeFinancial(result);
      const evolution = analyzeEvolution(result);
      const esgData = analyzeESG(result);
      const contacts = analyzeContacts(result);

      const totalVariables = identity.score + owners.score + digital.score + compliance.score;
      const totalEnrichment = reputation.score + financial.score + evolution.score + esgData.score + contacts.score;
      const baseScore = SEGMENT_BASE_SCORES[templateModel] || 80;
      const rawScore = baseScore + totalVariables + totalEnrichment;
      const finalScore = Math.max(0, Math.min(849, rawScore));
      const hasBlock = blocks.length > 0;

      analysis = {
        type: 'PJ', document: cleanDoc, templateModel, datasetGroup: groupKey,
        datasetsQueried: datasets.length, queryDate: bdcData.QueryDate, elapsedMs: bdcData.ElapsedMilliseconds,
        blocks, hasBlock,
        sections: { identity, owners, digital, compliance, reputation, financial, evolution, esg: esgData, contacts },
        scoring: {
          baseScore, variablesScore: totalVariables, enrichmentScore: totalEnrichment,
          finalScore: hasBlock ? 850 : finalScore,
          subfaixa: hasBlock ? '5' : finalScore <= 100 ? '1A' : finalScore <= 200 ? '1B' : finalScore <= 300 ? '2A' : finalScore <= 400 ? '2B' : finalScore <= 500 ? '3A' : finalScore <= 600 ? '3B' : finalScore <= 700 ? '4' : '5',
        },
        rawBdcStatus: bdcData.Status,
      };
    }

    // Subfaixa names
    const subfaixaNames = { '1A': 'VERDE EXPRESS', '1B': 'VERDE', '2A': 'AZUL LEVE', '2B': 'AZUL', '3A': 'AMARELO', '3B': 'LARANJA', '4': 'VERMELHO', '5': 'BLOQUEIO' };
    analysis.scoring.subfaixaNome = subfaixaNames[analysis.scoring.subfaixa] || 'N/D';

    // Save results
    if (onboardingCaseId) {
      try {
        const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: onboardingCaseId });
        let scoreDelta = null;
        if (existing.length > 0 && existing[0].score_final != null) {
          scoreDelta = analysis.scoring.finalScore - existing[0].score_final;
          if (Math.abs(scoreDelta) >= 100) {
            console.warn(`[BDC-ALERT] Score delta of ${scoreDelta} for case ${onboardingCaseId}`);
            try {
              await base44.asServiceRole.entities.IntegrationLog.create({
                onboarding_case_id: onboardingCaseId, merchant_id: merchant?.id || '',
                provider: 'BigDataCorp', service_type: 'empresas_basic_data', status: 'success',
                result_status: scoreDelta > 0 ? 'PENDING_REVIEW' : 'APPROVED',
                request_payload: { alert: 'SCORE_DELTA_ALERT', oldScore: existing[0].score_final, newScore: analysis.scoring.finalScore, delta: scoreDelta },
                response_payload: { alert: `Score mudou ${scoreDelta > 0 ? '+' : ''}${scoreDelta} pontos`, oldSubfaixa: existing[0].subfaixa, newSubfaixa: analysis.scoring.subfaixa },
                red_flags: [Math.abs(scoreDelta) >= 200 ? `SCORE_DELTA_CRITICAL: ${scoreDelta > 0 ? '+' : ''}${scoreDelta} pts` : `SCORE_DELTA_WARNING: ${scoreDelta > 0 ? '+' : ''}${scoreDelta} pts`],
              });
            } catch (alertErr) { console.warn('[BDC-ALERT] Failed:', alertErr.message); }
          }
        }

        const v4RedFlags = analysis.blocks.map(b => `V4: ${b.code}_${b.label}`).concat(
          Object.values(isPF ? analysis.sections : analysis.sections).flatMap(s => (s.items || []).filter(i => i.risk === 'CRITICO' || i.risk === 'ALTO').map(i => `V4: ${i.label}: ${i.value}`))
        );
        const v4Positivos = Object.values(isPF ? analysis.sections : analysis.sections).flatMap(s => (s.items || []).filter(i => i.risk === 'OK' && i.points < 0).map(i => i.label));

        const scoreData = {
          onboarding_case_id: onboardingCaseId, framework_version: 'v4.0',
          segmento: templateModel || 'unknown',
          score_base_segmento: analysis.scoring.baseScore, score_variaveis: analysis.scoring.variablesScore,
          score_enriquecimento: analysis.scoring.enrichmentScore, score_final: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa, subfaixa_nome: analysis.scoring.subfaixaNome,
          bloqueios_ativos: analysis.blocks.map(b => `${b.code}_${b.label}`),
          variaveis_aplicadas: analysis.sections, red_flags: v4RedFlags,
          pontos_positivos: v4Positivos,
          fase_2_completa: true, data_analise_fase_2: new Date().toISOString(),
        };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scoreData);
        } else {
          await base44.asServiceRole.entities.ComplianceScore.create(scoreData);
        }

        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          bigDataCorpCompleted: true, riskScoreV4: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa, subfaixaNome: analysis.scoring.subfaixaNome,
          bloqueiosAtivos: analysis.blocks.map(b => `${b.code}_${b.label}`),
        });
      } catch (e) { console.warn('Error saving results:', e.message); }
    }

    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId, provider: 'BigDataCorp',
          validationType: `Enriquecimento ${isPF ? 'PF' : 'PJ'} — ${groupKey}`,
          endpoint, resultData: result, score: analysis.scoring.finalScore,
          status: 'Sucesso', timestamp: new Date().toISOString(),
          responseTime: bdcData.ElapsedMilliseconds || 0,
        });
      } catch (e) { console.warn('Error saving ExternalValidationResult:', e.message); }
    }

    return Response.json({ success: true, analysis });
  } catch (error) {
    console.error('bdcEnrichCase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});