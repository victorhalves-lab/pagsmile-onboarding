import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// ══════════════════════════════════════════════════════════════════
// DATASET GROUPS PER QUESTIONNAIRE TYPE
// ══════════════════════════════════════════════════════════════════
const DATASET_GROUPS = {
  // Full compliance — Gateway, Marketplace, Plataformas Verticais
  FULL: [
    'basic_data','registration_data','kyc','owners_kyc',
    'political_involvement','government_debtors','processes',
    'owners_lawsuits','media_profile_and_exposure','financial_market',
    'relationships','owners_influence','owners_electoral_donors',
    'domains','online_ads','passages','reputations_and_reviews',
    'awards_and_certifications','activity_indicators','marketplace_data',
    'collections','merchant_category_data','economic_group',
    'emails_extended','addresses_extended','phones_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'owners_industrial_property','history_basic_data','company_evolution',
    'industrial_property','licenses_and_authorizations',
  ],
  // Standard — E-commerce, SaaS, Infoprodutos, Dropshipping, Educação, Link Pgto
  STANDARD: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'political_involvement','government_debtors','processes',
    'owners_lawsuits','media_profile_and_exposure',
    'relationships','owners_influence',
    'domains','passages','reputations_and_reviews',
    'awards_and_certifications','activity_indicators','marketplace_data',
    'collections','merchant_category_data',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'owners_electoral_donors',
  ],
  // Lite — MPE
  LITE: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','domains','passages',
    'collections','government_debtors','processes',
    'merchant_category_data','relationships',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
  ],
  // PIX Merchant
  PIX_MERCHANT: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','government_debtors','processes',
    'collections','domains','passages','merchant_category_data',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
  ],
  // PIX Intermediário
  PIX_INTERMEDIARIO: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','government_debtors','processes',
    'collections','domains','passages','merchant_category_data',
    'financial_market','economic_group','relationships',
    'owners_lawsuits','owners_influence','media_profile_and_exposure',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'political_involvement',
  ],
  // Subseller PJ
  SUBSELLER_PJ: [
    'basic_data','registration_data','history_basic_data','company_evolution',
    'kyc','owners_kyc',
    'activity_indicators','domains','passages',
    'collections','government_debtors','processes',
    'merchant_category_data','relationships',
    'phones_extended','emails_extended','addresses_extended',
    'related_people_phones','related_people_emails','related_people_addresses',
    'reputations_and_reviews','media_profile_and_exposure',
  ],
  // Subseller PF (endpoint /pessoas)
  SUBSELLER_PF: [
    'basic_data','kyc','processes','collections',
    'emails_extended','phones_extended','addresses_extended',
    'media_profile_and_exposure','online_presence',
    'related_people_phones','related_people_emails','related_people_addresses',
  ],
};

// Model → dataset group mapping
const MODEL_TO_GROUP = {
  'ComplianceGatewayV4': 'FULL',
  'ComplianceGatewayAutocomplete': 'FULL',
  'ComplianceMarketplaceV4': 'FULL',
  'ComplianceMarketplaceAutocomplete': 'FULL',
  'CompliancePlataformaVerticalV4': 'FULL',
  'ComplianceEcommerceV4': 'STANDARD',
  'ComplianceSaaSV4': 'STANDARD',
  'ComplianceInfoprodutosV4': 'STANDARD',
  'ComplianceDropshippingV4': 'STANDARD',
  'ComplianceEducacaoV4': 'STANDARD',
  'ComplianceMerchantLinkV4': 'STANDARD',
  'ComplianceMerchantAutocomplete': 'STANDARD',
  'ComplianceMPEV4': 'LITE',
  'CompliancePixMerchantV4': 'PIX_MERCHANT',
  'pix_merchant_v4': 'PIX_MERCHANT',
  'pix_intermediario_v4': 'PIX_INTERMEDIARIO',
  'subseller': 'SUBSELLER_PJ',
  'subseller_v2': 'SUBSELLER_PJ',
  'subseller_pf': 'SUBSELLER_PF',
};

// Segment base scores (Camada 1)
const SEGMENT_BASE_SCORES = {
  'ComplianceGatewayV4': 175, 'ComplianceGatewayAutocomplete': 175,
  'ComplianceMarketplaceV4': 140, 'ComplianceMarketplaceAutocomplete': 140,
  'CompliancePlataformaVerticalV4': 120,
  'ComplianceDropshippingV4': 110,
  'ComplianceInfoprodutosV4': 90,
  'ComplianceEcommerceV4': 80, 'ComplianceMerchantAutocomplete': 80,
  'ComplianceSaaSV4': 70,
  'ComplianceEducacaoV4': 50,
  'ComplianceMerchantLinkV4': 60,
  'ComplianceMPEV4': 35,
  'CompliancePixMerchantV4': 65, 'pix_merchant_v4': 65,
  'pix_intermediario_v4': 155,
  'subseller': 45, 'subseller_v2': 45, 'subseller_pf': 30,
};

// HIGH RISK CNAEs
const HIGH_RISK_CNAES = [
  '9200301','9200302','9200399','4789004','1220401','1220402','6499999','6619302','6622300',
  '6463800','6462000','4712100','4789099',
];

// ══════════════════════════════════════════════════════════════════
// ANALYSIS FUNCTIONS — COMPANY (PJ)
// ══════════════════════════════════════════════════════════════════

function safeGet(obj, path, def = null) {
  if (!obj) return def;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return def;
    cur = cur[p];
  }
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
  // BDC returns PascalCase keys: BasicData, ActivityIndicators, etc.
  const bd = result?.BasicData || result?.basic_data;
  if (!bd) return null;
  if (typeof bd === 'object' && !Array.isArray(bd)) return bd;
  const items = flattenBDCArray(bd);
  return items[0] || null;
}

function analyzeBlocks(result, responses) {
  const blocks = [];
  const bd = extractBasicData(result);

  // B01 — CNPJ Inativo
  const status = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription');
  if (status && !String(status).toUpperCase().includes('ATIV')) {
    blocks.push({ code: 'B01', label: 'CNPJ Inativo', severity: 'BLOQUEIO', detail: `Situação: ${status}`, score: 850 });
  }

  // B02 — Idade < 6 meses
  const founded = safeGet(bd, 'FoundedDate') || safeGet(bd, 'Age.FoundedDate');
  if (founded) {
    const months = (Date.now() - new Date(founded).getTime()) / (30.44 * 24 * 3600 * 1000);
    if (months < 6) {
      blocks.push({ code: 'B02', label: 'Empresa < 6 meses', severity: 'BLOQUEIO', detail: `Fundada em ${new Date(founded).toLocaleDateString('pt-BR')} (${Math.round(months)} meses)`, score: 850 });
    }
  }

  // B03 — Sanções (empresa ou sócios)
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kycItems = flattenBDCArray(kyc);
    for (const item of kycItems) {
      const sanctions = item?.Sanctions || item?.SanctionsDetails || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        blocks.push({ code: 'B03', label: 'Empresa em lista de sanções', severity: 'BLOQUEIO', detail: `${sanctions.length} sanção(ões): ${sanctions.map(s => s.Source || s.ListName || 'N/I').join(', ')}`, score: 850 });
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
      const pep = item?.IsPEP || item?.IsPep;
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        sanctionedOwners.push(item?.Name || item?.RelatedPersonName || 'N/I');
      }
    }
    if (sanctionedOwners.length > 0) {
      blocks.push({ code: 'B03', label: 'Sócio(s) em lista de sanções', severity: 'BLOQUEIO', detail: `Sócios: ${sanctionedOwners.join(', ')}`, score: 850 });
    }
  }

  // B05 — Shell Company
  const ai = result?.ActivityIndicators || result?.activity_indicators;
  if (ai) {
    const items = flattenBDCArray(ai);
    for (const item of items) {
      const shell = item?.ShellCompanyLikelyhood ?? item?.ShellCompanyLikelihood;
      if (shell != null && Number(shell) > 0.8) {
        blocks.push({ code: 'B05', label: 'Provável empresa de fachada', severity: 'BLOQUEIO', detail: `ShellCompany score: ${(Number(shell) * 100).toFixed(0)}%`, score: 850 });
        break;
      }
    }
  }

  // B06 — Dívida ativa > R$500k
  const debtors = result?.GovernmentDebtors || result?.government_debtors;
  if (debtors) {
    const items = flattenBDCArray(debtors);
    let totalDebt = 0;
    for (const item of items) {
      const val = item?.TotalValue || item?.Value || 0;
      totalDebt += Number(val) || 0;
    }
    if (totalDebt > 500000) {
      blocks.push({ code: 'B06', label: 'Dívida ativa > R$500k', severity: 'BLOQUEIO', detail: `Total: R$ ${totalDebt.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, score: 850 });
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
          blocks.push({ code: 'B07', label: 'Adverse media grave', severity: 'BLOQUEIO', detail: `Tópicos: ${topics.join(', ')}`, score: 850 });
          break;
        }
      }
    }
  }

  return blocks;
}

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
  const status = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription') || '';
  const statusDate = safeGet(bd, 'TaxIdStatusDate') || safeGet(bd, 'StatusDate') || '';
  const statusReason = safeGet(bd, 'TaxIdStatusReason') || safeGet(bd, 'StatusReason') || '';
  const statusVal = `${status}${statusDate ? ` (desde ${new Date(statusDate).toLocaleDateString('pt-BR')})` : ''}${statusReason ? ` — Motivo: ${statusReason}` : ''}`;
  items.push({ label: 'Situação cadastral', value: statusVal, risk: String(status).toUpperCase().includes('ATIV') ? 'OK' : 'CRITICO', points: 0 });

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
    const cnaesStr = secondaryCnaes.slice(0, 10).map(c => {
      if (typeof c === 'string') return c;
      return `${c.Code || c.Activity || ''} — ${c.Description || ''}`;
    }).join(' | ');
    const hasHighRiskSecondary = secondaryCnaes.some(c => HIGH_RISK_CNAES.includes(String(c?.Code || c)));
    items.push({ label: `CNAEs secundários (${secondaryCnaes.length})`, value: cnaesStr + (secondaryCnaes.length > 10 ? ` ... +${secondaryCnaes.length - 10}` : ''), risk: hasHighRiskSecondary ? 'ALTO' : 'INFO', points: hasHighRiskSecondary ? 15 : 0 });
    if (hasHighRiskSecondary) score += 15;
  }

  // Address
  const addr = safeGet(bd, 'Address') || safeGet(bd, 'MainAddress');
  if (addr) {
    const addrStr = typeof addr === 'object' 
      ? [addr.Street || addr.StreetName, addr.Number || addr.AddressNumber, addr.Complement, addr.Neighborhood, addr.City, addr.State, addr.ZipCode].filter(Boolean).join(', ')
      : String(addr);
    items.push({ label: 'Endereço principal', value: addrStr, risk: 'INFO', points: 0 });
  }

  // E-mail and phone from basic_data
  const mainEmail = safeGet(bd, 'Email') || safeGet(bd, 'MainEmail');
  const mainPhone = safeGet(bd, 'Phone') || safeGet(bd, 'MainPhone') || safeGet(bd, 'PhoneNumber');
  if (mainEmail) items.push({ label: 'E-mail principal', value: String(mainEmail), risk: 'INFO', points: 0 });
  if (mainPhone) items.push({ label: 'Telefone principal', value: String(mainPhone), risk: 'INFO', points: 0 });

  // Employees
  const employees = safeGet(bd, 'NumberOfEmployees') || safeGet(bd, 'EmployeesCount');
  if (employees != null) items.push({ label: 'Empregados (RAIS)', value: String(employees), risk: 'INFO', points: 0 });

  // Registration data enrichment
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

function analyzeOwners(result) {
  const items = [];
  let score = 0;
  let pepFound = [];
  let sanctionedFound = [];

  // Relationships (QSA)
  const rels = result?.Relationships || result?.relationships;
  const owners = [];
  if (rels) {
    // BDC structure: { Relationships: [ {RelatedEntityName, RelatedEntityTaxIdNumber, RelationshipName...} ] }
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

  // Owners KYC (PEP + sanctions per owner)
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
    items.push({ label: 'PEP identificado(s)', value: pepFound.join(', '), risk: 'ALTO', points: 40 });
  } else {
    items.push({ label: 'PEP', value: 'Nenhum PEP identificado', risk: 'OK', points: 0 });
  }

  if (sanctionedFound.length > 0) {
    items.push({ label: 'Sócios em sanções', value: sanctionedFound.join(', '), risk: 'CRITICO', points: 80 });
  }

  // Owners lawsuits — DETALHAMENTO COMPLETO
  const lawsuits = result?.OwnersLawsuits || result?.owners_lawsuits;
  if (lawsuits) {
    const lItems = flattenBDCArray(lawsuits);
    let totalLawsuits = 0;
    let criminalFound = false;
    const allOwnerLawsuits = [];
    for (const item of lItems) {
      const count = item?.TotalLawsuits || item?.LawsuitsCount || 0;
      totalLawsuits += Number(count) || 0;
      const types = item?.LawsuitTypes || item?.Categories || [];
      if (Array.isArray(types) && types.some(t => /criminal|penal|crime/i.test(String(t)))) criminalFound = true;
      // Extrai processos individuais
      const lawsuitList = item?.Lawsuits || item?.LawsuitDetails || item?.Items || [];
      if (Array.isArray(lawsuitList)) {
        for (const lw of lawsuitList) {
          allOwnerLawsuits.push({
            number: lw?.LawsuitNumber || lw?.Number || lw?.ProcessNumber || lw?.CnjNumber || 'N/I',
            court: lw?.Court || lw?.CourtName || lw?.JudicialBody || '',
            type: lw?.LawsuitType || lw?.Type || lw?.Category || '',
            subject: lw?.Subject || lw?.MainSubject || lw?.Description || '',
            status: lw?.Status || lw?.CurrentStatus || '',
            value: lw?.Value || lw?.CauseValue || lw?.Amount || null,
            startDate: lw?.StartDate || lw?.FilingDate || lw?.DistributionDate || '',
            lastUpdate: lw?.LastUpdate || lw?.LastMovementDate || lw?.UpdateDate || '',
            parties: lw?.Parties || lw?.Participants || lw?.InvolvedParties || [],
            pole: lw?.Pole || lw?.PartyRole || lw?.Side || '',
            jurisdiction: lw?.Jurisdiction || lw?.Instance || '',
            area: lw?.Area || lw?.LawArea || '',
            lastMovement: lw?.LastMovement || lw?.LastMovementDescription || '',
            ownerName: item?.Name || item?.RelatedPersonName || '',
          });
        }
      }
    }
    if (totalLawsuits > 0 || allOwnerLawsuits.length > 0) {
      const displayCount = Math.max(totalLawsuits, allOwnerLawsuits.length);
      const pts = criminalFound ? 50 : (displayCount > 10 ? 20 : 10);
      score += pts;
      items.push({ 
        label: 'Processos dos sócios', 
        value: `${displayCount} processo(s)${criminalFound ? ' — INCLUI CRIMINAL' : ''}`, 
        risk: criminalFound ? 'CRITICO' : 'ALTO', 
        points: pts,
        lawsuits: allOwnerLawsuits,
      });
    } else {
      items.push({ label: 'Processos dos sócios', value: 'Nenhum encontrado', risk: 'OK', points: 0 });
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
    for (const item of dItems) {
      const val = item?.TotalDonated || item?.Value || 0;
      totalDonations += Number(val) || 0;
    }
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
      items.push({ label: 'Envolvimento político', value: 'Detectado', risk: 'ALTO', points: 20 });
    }
  }

  return { score, items, pepFound, sanctionedFound };
}

function analyzeDigitalFootprint(result) {
  const items = [];
  let score = 0;

  // Domains
  const domains = result?.Domains || result?.domains;
  if (domains) {
    const dItems = flattenBDCArray(domains);
    for (const item of dItems) {
      const domain = item?.Domain || item?.DomainName || '';
      const age = item?.DomainAge || item?.Age;
      const ssl = item?.HasSSL || item?.SSLEnabled;
      const platform = item?.Platform || item?.Technology || '';
      if (domain) {
        const ageYears = age ? Math.floor(Number(age) / 365) : null;
        let risk = 'OK';
        let pts = 0;
        if (ssl === false) { risk = 'ALTO'; pts += 15; }
        if (ageYears !== null && ageYears < 1) { risk = 'ALTO'; pts += 10; }
        score += pts;
        items.push({ label: 'Domínio', value: domain, risk, points: pts, details: { age: ageYears != null ? `${ageYears} ano(s)` : 'N/D', ssl: ssl ? 'Sim' : ssl === false ? 'Não' : 'N/D', platform: platform || 'N/D' } });
      }
    }
  }

  // Passages (web activity)
  const passages = result?.Passages || result?.passages;
  if (passages) {
    const pItems = flattenBDCArray(passages);
    let totalPassages = 0;
    let last365 = 0;
    for (const item of pItems) {
      totalPassages += Number(item?.TotalPassages || 0);
      last365 += Number(item?.Last365DaysPassages || item?.RecentPassages || 0);
    }
    let risk = 'OK';
    let pts = 0;
    if (totalPassages === 0) { risk = 'CRITICO'; pts = 30; }
    else if (last365 < 5) { risk = 'ALTO'; pts = 15; }
    score += pts;
    items.push({ label: 'Passagens web', value: `${totalPassages} total / ${last365} últimos 12 meses`, risk, points: pts });
  }

  // Activity indicators
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
        let risk = level > 0.6 ? 'OK' : level > 0.3 ? 'MEDIO' : 'ALTO';
        let pts = level < 0.3 ? 20 : level < 0.6 ? 10 : 0;
        score += pts;
        items.push({ label: 'Nível de atividade', value: `${(level * 100).toFixed(0)}%`, risk, points: pts });
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

  // Marketplace data
  const mp = result?.MarketplaceData || result?.marketplace_data;
  if (mp) {
    const mItems = flattenBDCArray(mp);
    const marketplaces = [];
    for (const item of mItems) {
      const name = item?.MarketplaceName || item?.Platform || item?.Name;
      if (name) marketplaces.push(name);
    }
    if (marketplaces.length > 0) {
      items.push({ label: 'Presença em marketplaces', value: marketplaces.join(', '), risk: 'OK', points: -10 });
    }
  }

  // Online ads
  const ads = result?.OnlineAds || result?.online_ads;
  if (ads) {
    const adItems = flattenBDCArray(ads);
    if (adItems.length > 0) {
      items.push({ label: 'Anúncios online', value: `${adItems.length} encontrado(s)`, risk: 'INFO', points: 0 });
    }
  }

  return { score, items };
}

function analyzeCompliance(result) {
  const items = [];
  let score = 0;

  // KYC (company level sanctions/PEP)
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kItems = flattenBDCArray(kyc);
    let hasSanctions = false;
    let isPep = false;
    for (const item of kItems) {
      if (item?.IsPEP || item?.IsPep) isPep = true;
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) hasSanctions = true;
    }
    items.push({ label: 'Sanções empresa', value: hasSanctions ? 'ENCONTRADA' : 'Nenhuma', risk: hasSanctions ? 'CRITICO' : 'OK', points: hasSanctions ? 80 : 0 });
    items.push({ label: 'PEP empresa', value: isPep ? 'SIM' : 'Não', risk: isPep ? 'ALTO' : 'OK', points: isPep ? 40 : 0 });
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
      items.push({ label: 'Dívida ativa', value: `R$ ${totalDebt.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, risk: totalDebt > 500000 ? 'CRITICO' : 'ALTO', points: pts, details: { sources: sources.join(', ') || 'N/D' } });
    } else {
      items.push({ label: 'Dívida ativa', value: 'Nenhuma', risk: 'OK', points: 0 });
    }
  }

  // Processes (company) — DETALHAMENTO COMPLETO
  const processes = result?.Processes || result?.processes || result?.Lawsuits || result?.lawsuits;
  if (processes) {
    const pItems = flattenBDCArray(processes);
    let totalProcesses = 0;
    let hasCriminal = false;
    const allLawsuits = [];
    for (const item of pItems) {
      // Conta total
      const count = Number(item?.TotalLawsuits || item?.NumberOfLawsuits || 0);
      totalProcesses += count;
      const types = item?.LawsuitTypes || item?.Categories || [];
      if (Array.isArray(types) && types.some(t => /criminal|penal|crime/i.test(String(t)))) hasCriminal = true;
      // Extrai processos individuais da BDC
      const lawsuitList = item?.Lawsuits || item?.LawsuitDetails || item?.Items || [];
      if (Array.isArray(lawsuitList)) {
        for (const lw of lawsuitList) {
          allLawsuits.push({
            number: lw?.LawsuitNumber || lw?.Number || lw?.ProcessNumber || lw?.CnjNumber || 'N/I',
            court: lw?.Court || lw?.CourtName || lw?.JudicialBody || '',
            type: lw?.LawsuitType || lw?.Type || lw?.Category || '',
            subject: lw?.Subject || lw?.MainSubject || lw?.Description || '',
            status: lw?.Status || lw?.CurrentStatus || '',
            value: lw?.Value || lw?.CauseValue || lw?.Amount || null,
            startDate: lw?.StartDate || lw?.FilingDate || lw?.DistributionDate || '',
            lastUpdate: lw?.LastUpdate || lw?.LastMovementDate || lw?.UpdateDate || '',
            parties: lw?.Parties || lw?.Participants || lw?.InvolvedParties || [],
            pole: lw?.Pole || lw?.PartyRole || lw?.Side || '',
            jurisdiction: lw?.Jurisdiction || lw?.Instance || '',
            area: lw?.Area || lw?.LawArea || '',
            lastMovement: lw?.LastMovement || lw?.LastMovementDescription || '',
          });
        }
      }
      // Também tenta extrair de LawsuitsByType
      const byType = item?.LawsuitsByType || item?.ByType || {};
      if (typeof byType === 'object' && !Array.isArray(byType)) {
        for (const [typeName, typeItems] of Object.entries(byType)) {
          if (Array.isArray(typeItems)) {
            for (const lw of typeItems) {
              if (!allLawsuits.some(e => e.number === (lw?.LawsuitNumber || lw?.Number))) {
                allLawsuits.push({
                  number: lw?.LawsuitNumber || lw?.Number || 'N/I',
                  court: lw?.Court || lw?.CourtName || '',
                  type: typeName,
                  subject: lw?.Subject || lw?.Description || '',
                  status: lw?.Status || '',
                  value: lw?.Value || lw?.CauseValue || null,
                  startDate: lw?.StartDate || lw?.FilingDate || '',
                  lastUpdate: lw?.LastUpdate || '',
                  parties: lw?.Parties || [],
                  pole: lw?.Pole || '',
                  jurisdiction: lw?.Jurisdiction || '',
                  area: lw?.Area || typeName,
                  lastMovement: lw?.LastMovement || '',
                });
              }
            }
          }
        }
      }
    }
    if (totalProcesses > 0 || allLawsuits.length > 0) {
      const displayCount = Math.max(totalProcesses, allLawsuits.length);
      const pts = hasCriminal ? 50 : (displayCount > 20 ? 25 : 10);
      score += pts;
      items.push({ 
        label: 'Processos judiciais', 
        value: `${displayCount} processo(s)${hasCriminal ? ' — INCLUI CRIMINAL' : ''}`, 
        risk: hasCriminal ? 'CRITICO' : 'ALTO', 
        points: pts,
        lawsuits: allLawsuits,
      });
    } else {
      items.push({ label: 'Processos judiciais', value: 'Nenhum', risk: 'OK', points: 0 });
    }
  }

  // Collections — DETALHAMENTO
  const collections = result?.Collections || result?.collections;
  if (collections) {
    const cItems = flattenBDCArray(collections);
    let hasCollections = false;
    let totalRecords = 0;
    let totalValue = 0;
    const creditors = [];
    const sources = [];
    for (const item of cItems) {
      if (item?.HasCollectionRecords || item?.TotalRecords > 0) hasCollections = true;
      totalRecords += Number(item?.TotalRecords || 0);
      totalValue += Number(item?.TotalValue || item?.Value || 0);
      const creditor = item?.CreditorName || item?.Creditor || '';
      if (creditor && !creditors.includes(creditor)) creditors.push(creditor);
      const src = item?.Source || item?.Origin || '';
      if (src && !sources.includes(src)) sources.push(src);
      const creditorList = item?.Creditors || item?.CreditorNames || [];
      if (Array.isArray(creditorList)) {
        for (const c of creditorList) {
          const name = typeof c === 'string' ? c : c?.Name || '';
          if (name && !creditors.includes(name)) creditors.push(name);
        }
      }
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
      items.push({ label: 'Em cobrança', value: 'Não', risk: 'OK', points: 0 });
    }
  }

  // Financial market
  const fm = result?.FinancialMarket || result?.financial_market;
  if (fm) {
    const fItems = flattenBDCArray(fm);
    const registrations = [];
    for (const item of fItems) {
      const reg = item?.RegistrationType || item?.Entity || '';
      if (reg) registrations.push(reg);
    }
    if (registrations.length > 0) {
      items.push({ label: 'Registro BCB/CVM/SUSEP', value: registrations.join(', '), risk: 'OK', points: -20 });
    }
  }

  return { score, items };
}

function analyzeReputation(result) {
  const items = [];
  let score = 0;

  // Media profile (adverse media)
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
    if (veryNeg > 0) {
      score += 80;
      items.push({ label: 'Mídia muito negativa', value: `${veryNeg} menção(ões)`, risk: 'CRITICO', points: 80, details: { headlines: headlines.slice(0, 5) } });
    }
    if (negative > 0) {
      score += 30;
      items.push({ label: 'Mídia negativa', value: `${negative} menção(ões)`, risk: 'ALTO', points: 30, details: { headlines: headlines.slice(0, 5) } });
    }
    if (positive > 0 || neutral > 0) {
      items.push({ label: 'Mídia neutra/positiva', value: `${positive} positiva(s), ${neutral} neutra(s)`, risk: 'OK', points: 0 });
    }
    if (mItems.length === 0) {
      items.push({ label: 'Exposição na mídia', value: 'Nenhuma menção', risk: 'INFO', points: 0 });
    }
  }

  // Reputations (Reclame Aqui etc)
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

  // Awards
  const awards = result?.AwardsAndCertifications || result?.awards_and_certifications;
  if (awards) {
    const aItems = flattenBDCArray(awards);
    if (aItems.length > 0) {
      items.push({ label: 'Prêmios/Certificações', value: `${aItems.length} encontrado(s)`, risk: 'OK', points: -15 });
      score -= 15;
    }
  }

  return { score, items };
}

function analyzeFinancial(result) {
  const items = [];
  let score = 0;

  // Economic group
  const eg = result?.EconomicGroup || result?.economic_group;
  if (eg) {
    const eItems = flattenBDCArray(eg);
    let groupSize = 0;
    for (const item of eItems) {
      groupSize += Number(item?.GroupSize || item?.TotalCompanies || 0);
    }
    if (groupSize > 0) {
      items.push({ label: 'Grupo econômico', value: `${groupSize} empresa(s)`, risk: groupSize > 20 ? 'ALTO' : 'INFO', points: groupSize > 20 ? 15 : 0 });
      if (groupSize > 20) score += 15;
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
    if (lItems.length > 0) {
      items.push({ label: 'Licenças', value: `${lItems.length} encontrada(s)`, risk: 'OK', points: -5 });
      score -= 5;
    }
  }

  return { score, items };
}

// ══════════════════════════════════════════════════════════════════
// PERSON (PF) ANALYSIS
// ══════════════════════════════════════════════════════════════════
function analyzePersonBlocks(result) {
  const blocks = [];
  const bd = result?.BasicData || result?.basic_data;
  if (bd) {
    const items = flattenBDCArray(bd);
    const first = items[0] || {};
    const status = first?.TaxIdStatus || first?.TaxIdStatusDescription || '';
    if (status && !String(status).toUpperCase().includes('REGULAR')) {
      blocks.push({ code: 'B01', label: 'CPF Irregular', severity: 'BLOQUEIO', detail: `Situação: ${status}`, score: 850 });
    }
    const birthDate = first?.BirthDate || first?.DateOfBirth;
    if (birthDate) {
      const age = (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) {
        blocks.push({ code: 'B02', label: 'Menor de 18 anos', severity: 'BLOQUEIO', detail: `Idade: ${Math.floor(age)} anos`, score: 850 });
      }
    }
  }
  // Sanctions
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kItems = flattenBDCArray(kyc);
    for (const item of kItems) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        blocks.push({ code: 'B03', label: 'Pessoa em lista de sanções', severity: 'BLOQUEIO', detail: `${sanctions.length} sanção(ões)`, score: 850 });
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
    // Address from basic data
    const addr = first?.Address || first?.MainAddress;
    if (addr) {
      const addrStr = typeof addr === 'object'
        ? [addr.Street || addr.StreetName, addr.Number, addr.Complement, addr.Neighborhood, addr.City, addr.State, addr.ZipCode].filter(Boolean).join(', ')
        : String(addr);
      sections.identity.items.push({ label: 'Endereço', value: addrStr, risk: 'INFO', points: 0 });
    }
    if (first?.Email) sections.identity.items.push({ label: 'E-mail', value: first.Email, risk: 'INFO', points: 0 });
    if (first?.Phone || first?.PhoneNumber) sections.identity.items.push({ label: 'Telefone', value: first.Phone || first.PhoneNumber, risk: 'INFO', points: 0 });
  }

  // KYC PEP/Sanctions
  const pKyc = result?.Kyc || result?.kyc;
  if (pKyc) {
    const kItems = flattenBDCArray(pKyc);
    let isPep = false;
    let hasSanctions = false;
    const sanctionDetails = [];
    for (const item of kItems) {
      if (item?.IsPEP || item?.IsPep) isPep = true;
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        hasSanctions = true;
        for (const s of sanctions) sanctionDetails.push(s?.Source || s?.ListName || 'N/I');
      }
    }
    sections.compliance.items.push({ label: 'PEP', value: isPep ? 'SIM — Pessoa Politicamente Exposta' : 'Não', risk: isPep ? 'ALTO' : 'OK', points: isPep ? 40 : 0 });
    if (isPep) sections.compliance.score += 40;
    if (hasSanctions) {
      sections.compliance.items.push({ label: 'Sanções', value: `ENCONTRADA(S): ${sanctionDetails.join(', ')}`, risk: 'CRITICO', points: 80 });
      sections.compliance.score += 80;
    }
  }

  // Processes — with full detail extraction
  const pProcesses = result?.Processes || result?.processes;
  if (pProcesses) {
    const pItems = flattenBDCArray(pProcesses);
    let total = 0;
    let hasCriminal = false;
    const allLawsuits = [];
    for (const item of pItems) {
      total += Number(item?.TotalLawsuits || item?.NumberOfLawsuits || 0);
      const types = item?.LawsuitTypes || item?.Categories || [];
      if (Array.isArray(types) && types.some(t => /criminal|penal|crime/i.test(String(t)))) hasCriminal = true;
      const lawsuitList = item?.Lawsuits || item?.LawsuitDetails || item?.Items || [];
      if (Array.isArray(lawsuitList)) {
        for (const lw of lawsuitList) {
          allLawsuits.push({
            number: lw?.LawsuitNumber || lw?.Number || lw?.ProcessNumber || lw?.CnjNumber || 'N/I',
            court: lw?.Court || lw?.CourtName || lw?.JudicialBody || '',
            type: lw?.LawsuitType || lw?.Type || lw?.Category || '',
            subject: lw?.Subject || lw?.MainSubject || lw?.Description || '',
            status: lw?.Status || lw?.CurrentStatus || '',
            value: lw?.Value || lw?.CauseValue || lw?.Amount || null,
            startDate: lw?.StartDate || lw?.FilingDate || lw?.DistributionDate || '',
            lastUpdate: lw?.LastUpdate || lw?.LastMovementDate || lw?.UpdateDate || '',
            parties: lw?.Parties || lw?.Participants || lw?.InvolvedParties || [],
            pole: lw?.Pole || lw?.PartyRole || lw?.Side || '',
            jurisdiction: lw?.Jurisdiction || lw?.Instance || '',
            area: lw?.Area || lw?.LawArea || '',
            lastMovement: lw?.LastMovement || lw?.LastMovementDescription || '',
          });
        }
      }
    }
    const displayCount = Math.max(total, allLawsuits.length);
    if (displayCount > 0) {
      const pts = hasCriminal ? 50 : (displayCount > 5 ? 30 : 10);
      sections.compliance.items.push({ label: 'Processos judiciais', value: `${displayCount} processo(s)${hasCriminal ? ' — INCLUI CRIMINAL' : ''}`, risk: hasCriminal ? 'CRITICO' : (displayCount > 5 ? 'ALTO' : 'MEDIO'), points: pts, lawsuits: allLawsuits });
      sections.compliance.score += pts;
    } else {
      sections.compliance.items.push({ label: 'Processos judiciais', value: 'Nenhum', risk: 'OK', points: 0 });
    }
  }

  // Collections with details
  const pCollections = result?.Collections || result?.collections;
  if (pCollections) {
    const cItems = flattenBDCArray(pCollections);
    const has = cItems.some(i => i?.HasCollectionRecords || i?.TotalRecords > 0);
    const totalRecords = cItems.reduce((s, i) => s + (Number(i?.TotalRecords || 0)), 0);
    const totalValue = cItems.reduce((s, i) => s + (Number(i?.TotalValue || i?.Value || 0)), 0);
    const details = {};
    if (totalRecords > 0) details['Registros'] = totalRecords;
    if (totalValue > 0) details['Valor total'] = `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const creditors = cItems.flatMap(i => (i?.Creditors || i?.CreditorNames || []).map(c => typeof c === 'string' ? c : c?.Name || '')).filter(Boolean);
    if (creditors.length > 0) details['Credores'] = creditors.slice(0, 5).join(', ');
    sections.compliance.items.push({ label: 'Negativação', value: has ? `SIM — ${totalRecords} registro(s)${totalValue > 0 ? ` (R$ ${totalValue.toLocaleString('pt-BR')})` : ''}` : 'Não', risk: has ? 'ALTO' : 'OK', points: has ? 30 : 0, details: has ? details : undefined });
    if (has) sections.compliance.score += 30;
  }

  // Adverse media
  const pMedia = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
  if (pMedia) {
    const mItems = flattenBDCArray(pMedia);
    let neg = 0, veryNeg = 0;
    const headlines = [];
    for (const item of mItems) {
      const sentiment = String(item?.Sentiment || item?.OverallSentiment || '').toUpperCase();
      if (sentiment.includes('VERY_NEGATIVE')) { veryNeg++; headlines.push(item?.Title || item?.Headline || 'N/I'); }
      else if (sentiment.includes('NEGATIVE')) { neg++; headlines.push(item?.Title || item?.Headline || 'N/I'); }
    }
    if (veryNeg > 0) {
      sections.reputation.items.push({ label: 'Mídia muito negativa', value: `${veryNeg} menção(ões)`, risk: 'CRITICO', points: 50, details: { headlines: headlines.slice(0, 5) } });
      sections.reputation.score += 50;
    }
    if (neg > 0) {
      sections.reputation.items.push({ label: 'Mídia negativa', value: `${neg} menção(ões)`, risk: 'ALTO', points: 20, details: { headlines: headlines.slice(0, 5) } });
      sections.reputation.score += 20;
    }
    if (veryNeg === 0 && neg === 0) {
      sections.reputation.items.push({ label: 'Adverse media', value: mItems.length > 0 ? `${mItems.length} menção(ões), nenhuma negativa` : 'Nenhuma menção', risk: 'OK', points: 0 });
    }
  }

  // Online presence
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
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { onboardingCaseId, document, documentType, forceGroup } = await req.json();

    if (!onboardingCaseId && !document) {
      return Response.json({ error: 'onboardingCaseId ou document é obrigatório' }, { status: 400 });
    }

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    let doc = document;
    let docType = documentType; // 'cpf' or 'cnpj'
    let templateModel = null;
    let onboardingCase = null;
    let merchant = null;
    let responses = [];

    // If onboardingCaseId, load case + merchant + template
    if (onboardingCaseId) {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      onboardingCase = cases[0];
      if (!onboardingCase) return Response.json({ error: 'Case not found' }, { status: 404 });

      const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
      merchant = merchants[0];
      if (!merchant) return Response.json({ error: 'Merchant not found' }, { status: 404 });

      doc = merchant.cpfCnpj?.replace(/\D/g, '');
      docType = merchant.type === 'PF' ? 'cpf' : 'cnpj';

      // Get template model
      if (onboardingCase.questionnaireTemplateId) {
        const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: onboardingCase.questionnaireTemplateId });
        if (templates[0]) templateModel = templates[0].model;
      }

      // Get responses for cross-checking
      try {
        responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId });
      } catch (e) { /* ok */ }
    }

    if (!doc) return Response.json({ error: 'No document found' }, { status: 400 });
    const cleanDoc = doc.replace(/\D/g, '');
    const isPF = docType === 'cpf' || cleanDoc.length === 11;
    const endpoint = isPF ? '/pessoas' : '/empresas';

    // Determine dataset group
    const groupKey = forceGroup || MODEL_TO_GROUP[templateModel] || (isPF ? 'SUBSELLER_PF' : 'STANDARD');
    const datasets = DATASET_GROUPS[groupKey] || DATASET_GROUPS.STANDARD;

    console.log(`BDC Enrich: ${cleanDoc} | ${endpoint} | group=${groupKey} | datasets=${datasets.length}`);

    // Query BDC
    const bdcResponse = await fetch(`${BDC_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken,
        'TokenId': tokenId,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Datasets: datasets.join(','),
        q: `doc{${cleanDoc}}`,
        Limit: 1,
      }),
    });

    const rawText = await bdcResponse.text();
    let bdcData;
    try { bdcData = JSON.parse(rawText); } catch (e) {
      return Response.json({ error: 'BDC parse error', raw: rawText.substring(0, 300) }, { status: 500 });
    }

    const result = bdcData.Result?.[0] || {};

    // Analyze
    let analysis;
    if (isPF) {
      const blocks = analyzePersonBlocks(result);
      const sections = analyzePersonData(result);
      const totalScore = sections.identity.score + sections.compliance.score + sections.reputation.score;
      const baseScore = SEGMENT_BASE_SCORES[templateModel] || 30;
      const finalScore = Math.max(0, Math.min(849, baseScore + totalScore));
      const hasBlock = blocks.length > 0;

      analysis = {
        type: 'PF',
        document: cleanDoc,
        templateModel,
        datasetGroup: groupKey,
        datasetsQueried: datasets.length,
        queryDate: bdcData.QueryDate,
        elapsedMs: bdcData.ElapsedMilliseconds,
        blocks,
        hasBlock,
        sections,
        scoring: {
          baseScore,
          variablesScore: totalScore,
          enrichmentScore: 0,
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

      const totalVariables = identity.score + owners.score + digital.score + compliance.score;
      const totalEnrichment = reputation.score + financial.score;
      const baseScore = SEGMENT_BASE_SCORES[templateModel] || 80;
      const rawScore = baseScore + totalVariables + totalEnrichment;
      const finalScore = Math.max(0, Math.min(849, rawScore));
      const hasBlock = blocks.length > 0;

      analysis = {
        type: 'PJ',
        document: cleanDoc,
        templateModel,
        datasetGroup: groupKey,
        datasetsQueried: datasets.length,
        queryDate: bdcData.QueryDate,
        elapsedMs: bdcData.ElapsedMilliseconds,
        blocks,
        hasBlock,
        sections: { identity, owners, digital, compliance, reputation, financial },
        scoring: {
          baseScore,
          variablesScore: totalVariables,
          enrichmentScore: totalEnrichment,
          finalScore: hasBlock ? 850 : finalScore,
          subfaixa: hasBlock ? '5' : finalScore <= 100 ? '1A' : finalScore <= 200 ? '1B' : finalScore <= 300 ? '2A' : finalScore <= 400 ? '2B' : finalScore <= 500 ? '3A' : finalScore <= 600 ? '3B' : finalScore <= 700 ? '4' : '5',
        },
        rawBdcStatus: bdcData.Status,
      };
    }

    // Subfaixa names
    const subfaixaNames = {
      '1A': 'VERDE EXPRESS', '1B': 'VERDE', '2A': 'AZUL LEVE', '2B': 'AZUL',
      '3A': 'AMARELO', '3B': 'LARANJA', '4': 'VERMELHO', '5': 'BLOQUEIO',
    };
    analysis.scoring.subfaixaNome = subfaixaNames[analysis.scoring.subfaixa] || 'N/D';

    // Save to ComplianceScore if case-based
    if (onboardingCaseId) {
      try {
        const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: onboardingCaseId });
        const scoreData = {
          onboarding_case_id: onboardingCaseId,
          framework_version: 'v4.0',
          segmento: templateModel || 'unknown',
          score_base_segmento: analysis.scoring.baseScore,
          score_variaveis: analysis.scoring.variablesScore,
          score_enriquecimento: analysis.scoring.enrichmentScore,
          score_final: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa,
          subfaixa_nome: analysis.scoring.subfaixaNome,
          bloqueios_ativos: analysis.blocks.map(b => `${b.code}_${b.label}`),
          variaveis_aplicadas: analysis.sections,
          red_flags: analysis.blocks.map(b => b.label).concat(
            Object.values(isPF ? analysis.sections : analysis.sections).flatMap(s => (s.items || []).filter(i => i.risk === 'CRITICO' || i.risk === 'ALTO').map(i => `${i.label}: ${i.value}`))
          ),
          pontos_positivos: Object.values(isPF ? analysis.sections : analysis.sections).flatMap(s => (s.items || []).filter(i => i.risk === 'OK' && i.points < 0).map(i => i.label)),
          fase_2_completa: true,
          data_analise_fase_2: new Date().toISOString(),
          recomendacao_final: analysis.hasBlock ? 'Recusado' : analysis.scoring.finalScore <= 200 ? 'Aprovado' : analysis.scoring.finalScore <= 500 ? 'Aprovado com Condições' : analysis.scoring.finalScore <= 700 ? 'Revisão Manual' : 'Recusado',
          sumario_executivo: `Enriquecimento BDC: Score ${analysis.scoring.finalScore}/849 (${analysis.scoring.subfaixaNome}). ${analysis.blocks.length} bloqueio(s). ${analysis.datasetsQueried} datasets consultados.`,
        };
        if (existing.length > 0) {
          await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scoreData);
        } else {
          await base44.asServiceRole.entities.ComplianceScore.create(scoreData);
        }

        // Update case
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          bigDataCorpCompleted: true,
          riskScoreV4: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa,
          subfaixaNome: analysis.scoring.subfaixaNome,
          bloqueiosAtivos: analysis.blocks.map(b => `${b.code}_${b.label}`),
        });
      } catch (e) {
        console.warn('Error saving results:', e.message);
      }
    }

    // Save RAW BDC data to ExternalValidationResult for microscopic review
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'BigDataCorp',
          validationType: `Enriquecimento ${isPF ? 'PF' : 'PJ'} — ${groupKey}`,
          endpoint: endpoint,
          resultData: result,
          score: analysis.scoring.finalScore,
          status: 'Sucesso',
          timestamp: new Date().toISOString(),
          responseTime: bdcData.ElapsedMilliseconds || 0,
        });
      } catch (e) {
        console.warn('Error saving ExternalValidationResult:', e.message);
      }
    }

    return Response.json({ success: true, analysis });
  } catch (error) {
    console.error('bdcEnrichCase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});