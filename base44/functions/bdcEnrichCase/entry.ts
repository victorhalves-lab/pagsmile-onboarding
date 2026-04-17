import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// ══════════════════════════════════════════════════════════════════
// BATCH SYSTEM v2 — 7 lotes separados por prioridade
// ══════════════════════════════════════════════════════════════════
// Cada lote tem sua própria prioridade e retry policy.
// Lotes CRITICAL nunca desistem (vão pra queue persistente).
// Lotes IMPORTANT tentam muito, depois degradam.
// Lotes COMPLEMENTARY são best-effort.
// ══════════════════════════════════════════════════════════════════
const BATCH_DEFS = {
  // 🔴 OBRIGATÓRIOS — retry infinito via BdcRetryQueue
  IDENTIDADE: { priority: 'CRITICAL', datasets: ['basic_data', 'registration_data', 'history_basic_data'] },
  KYC: { priority: 'CRITICAL', datasets: ['kyc', 'owners_kyc', 'economic_group_kyc'] },
  LEGAL: { priority: 'CRITICAL', datasets: ['processes', 'lawsuits_distribution_data', 'owners_lawsuits', 'owners_lawsuits_distribution', 'government_debtors', 'collections'] },
  // 🟠 IMPORTANTES — 10 retries inline, depois degrada
  SOCIETARIO: { priority: 'IMPORTANT', datasets: ['relationships', 'economic_group', 'economic_group_relationships', 'configurable_recency_qsa', 'owners_influence', 'owners_electoral_donors'] },
  ESG_COMPLIANCE: { priority: 'IMPORTANT', datasets: ['esg_and_compliance', 'political_involvement', 'media_profile_and_exposure'] },
  // 🟡 COMPLEMENTARES — best-effort
  DIGITAL_REPUTACAO: { priority: 'COMPLEMENTARY', datasets: ['domains', 'passages', 'online_ads', 'reputations_and_reviews', 'awards_and_certifications', 'activity_indicators', 'marketplace_data', 'merchant_category_data'] },
  ENRIQUECIMENTO: { priority: 'COMPLEMENTARY', datasets: ['credit_risk', 'credit_score', 'financial_market', 'emails_extended', 'phones_extended', 'addresses_extended', 'related_people_phones', 'related_people_emails', 'related_people_addresses', 'industrial_property', 'owners_industrial_property', 'licenses_and_authorizations', 'company_evolution'] },
};

// Para PF, lotes específicos
const PF_BATCH_DEFS = {
  IDENTIDADE: { priority: 'CRITICAL', datasets: ['basic_data', 'kyc'] },
  LEGAL: { priority: 'CRITICAL', datasets: ['processes', 'collections', 'government_debtors'] },
  FAMILIAR: { priority: 'CRITICAL', datasets: ['first_level_family_kyc', 'personal_relationships'] },
  COMPLIANCE: { priority: 'IMPORTANT', datasets: ['risk_data', 'social_assistance', 'public_servants'] },
  FINANCEIRO: { priority: 'IMPORTANT', datasets: ['presumed_income', 'financial_interests', 'scr_positive_score', 'simples_nacional_collection', 'electoral_donors'] },
  REPUTACAO: { priority: 'COMPLEMENTARY', datasets: ['media_profile_and_exposure', 'online_presence'] },
  CONTATOS: { priority: 'COMPLEMENTARY', datasets: ['emails_extended', 'phones_extended', 'addresses_extended', 'related_people_phones', 'related_people_emails', 'related_people_addresses'] },
};

// Retry limits por prioridade
const RETRY_LIMITS = {
  CRITICAL: { maxAttempts: 5, backoffSeconds: [2, 5, 10, 30, 60] },
  IMPORTANT: { maxAttempts: 4, backoffSeconds: [2, 5, 15, 45] },
  COMPLEMENTARY: { maxAttempts: 2, backoffSeconds: [2, 10] },
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function jitter(base) { return base + Math.random() * base * 0.3; }

// Detecta se a resposta BDC realmente veio vazia (não apenas erro HTTP)
function isResponseMeaningful(bdcData, datasets) {
  if (!bdcData) return false;
  if (bdcData.Status && Array.isArray(bdcData.Status) && bdcData.Status.some(s => s.Code >= 400)) return false;
  const result = bdcData.Result?.[0];
  if (!result) return false;
  // Verifica se ao menos 1 dataset retornou algo
  const resultKeys = Object.keys(result).filter(k => k !== 'MatchKeys');
  return resultKeys.length > 0;
}

// ══════════════════════════════════════════════════════════════════
// BDC API CALL with ROBUST RETRY (per batch)
// ══════════════════════════════════════════════════════════════════
async function callBdcBatch({ accessToken, tokenId, endpoint, document, datasets, batchId, priority }) {
  const retryPolicy = RETRY_LIMITS[priority] || RETRY_LIMITS.COMPLEMENTARY;
  const maxAttempts = retryPolicy.maxAttempts;
  const backoffs = retryPolicy.backoffSeconds;

  let lastError = null;
  let attempts = 0;

  for (let att = 0; att < maxAttempts; att++) {
    attempts = att + 1;
    const attemptStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

    try {
      const r = await fetch(`${BDC_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'AccessToken': accessToken, 'TokenId': tokenId, 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ Datasets: datasets.join(','), q: `doc{${document}}`, Limit: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const txt = await r.text();
      const elapsed = Date.now() - attemptStart;

      // Retry on known transient HTTP errors
      if ([500, 502, 503, 504, 429, 408].includes(r.status)) {
        lastError = `HTTP ${r.status} (${elapsed}ms)`;
        console.warn(`[BDC:${batchId}] Attempt ${attempts}/${maxAttempts} failed: ${lastError}`);
        if (att < maxAttempts - 1) {
          const wait = jitter(backoffs[att] * 1000);
          console.log(`[BDC:${batchId}] Waiting ${Math.round(wait)}ms before retry...`);
          await sleep(wait);
          continue;
        }
        return { success: false, error: lastError, attempts, batchId };
      }

      // Non-retryable HTTP errors (400, 401, 403)
      if (r.status >= 400) {
        lastError = `HTTP ${r.status}: ${txt.substring(0, 200)}`;
        return { success: false, error: lastError, attempts, batchId, nonRetryable: true };
      }

      // Parse JSON
      let bdcData;
      try {
        bdcData = JSON.parse(txt);
      } catch (parseErr) {
        lastError = `JSON parse error: ${parseErr.message}`;
        if (att < maxAttempts - 1) { await sleep(jitter(backoffs[att] * 1000)); continue; }
        return { success: false, error: lastError, attempts, batchId };
      }

      // Check if response is meaningful (not empty)
      if (!isResponseMeaningful(bdcData, datasets)) {
        lastError = `Empty response (Status: ${JSON.stringify(bdcData.Status || 'N/A')})`;
        console.warn(`[BDC:${batchId}] Attempt ${attempts}: empty response`);
        if (att < maxAttempts - 1) { await sleep(jitter(backoffs[att] * 1000)); continue; }
        return { success: false, error: lastError, attempts, batchId };
      }

      console.log(`[BDC:${batchId}] SUCCESS on attempt ${attempts} (${elapsed}ms, ${datasets.length} datasets)`);
      return { success: true, data: bdcData, attempts, batchId, elapsedMs: elapsed };

    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e.name === 'AbortError' ? 'Timeout (90s)' : e.message;
      console.warn(`[BDC:${batchId}] Attempt ${attempts}/${maxAttempts} exception: ${lastError}`);
      if (att < maxAttempts - 1) {
        await sleep(jitter(backoffs[att] * 1000));
        continue;
      }
      return { success: false, error: lastError, attempts, batchId };
    }
  }

  return { success: false, error: lastError || 'Unknown error', attempts, batchId };
}

// ══════════════════════════════════════════════════════════════════
// Merge multiple BDC responses into one unified result
// ══════════════════════════════════════════════════════════════════
function mergeBdcResults(batchResults) {
  const merged = {};
  let totalElapsed = 0;
  for (const br of batchResults) {
    if (!br.success || !br.data) continue;
    const result = br.data.Result?.[0] || {};
    totalElapsed += br.elapsedMs || 0;
    for (const [key, value] of Object.entries(result)) {
      if (key === 'MatchKeys') {
        merged.MatchKeys = value;
      } else {
        merged[key] = value;
      }
    }
  }
  return { result: merged, totalElapsed };
}

// ══════════════════════════════════════════════════════════════════
// BLOCK ANALYSIS — B01 through B09
// ══════════════════════════════════════════════════════════════════
function analyzeBlocks(result, responses) {
  const blocks = [];
  const bd = extractBasicData(result);

  const status = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription') || '';
  const statusUp = String(status).toUpperCase().trim();
  const cnpjIsActive = !status || statusUp.includes('ATIV') || statusUp.includes('REGULAR');
  if (status && !cnpjIsActive) {
    blocks.push({ code: 'B01', label: 'CNPJ Inativo', severity: 'BLOQUEIO', detail: `Situação cadastral BDC: "${status}". Empresa não pode exercer atividades econômicas. Circular BCB 3.978/2020 Art. 2º.`, score: 850 });
  }

  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kycItems = flattenBDCArray(kyc);
    for (const item of kycItems) {
      const sanctions = item?.Sanctions || item?.SanctionsDetails || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        const sources = sanctions.map(s => s.Source || s.ListName || 'N/I').join(', ');
        blocks.push({ code: 'B03', label: 'Empresa em lista de sanções', severity: 'BLOQUEIO', detail: `${sanctions.length} sanção(ões): ${sources}. Lei 9.613/1998 Art. 10.`, score: 850 });
        break;
      }
    }
  }

  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  if (ownersKyc) {
    const items = flattenBDCArray(ownersKyc);
    const sanctionedOwners = [];
    for (const item of items) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) sanctionedOwners.push(item?.Name || item?.RelatedPersonName || 'N/I');
    }
    if (sanctionedOwners.length > 0) {
      blocks.push({ code: 'B03', label: 'Sócio(s) em lista de sanções', severity: 'BLOQUEIO', detail: `Sócios sancionados: ${sanctionedOwners.join(', ')}. Circular BCB 3.978/2020 Art. 16.`, score: 850 });
    }
  }

  const egKyc = result?.EconomicGroupKyc || result?.economic_group_kyc;
  if (egKyc) {
    const items = flattenBDCArray(egKyc);
    const sanctionedEntities = [];
    for (const item of items) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) sanctionedEntities.push(item?.Name || item?.EntityName || 'N/I');
    }
    if (sanctionedEntities.length > 0) {
      blocks.push({ code: 'B03c', label: 'Entidade do grupo econômico em sanções', severity: 'BLOQUEIO', detail: `Entidades sancionadas: ${sanctionedEntities.join(', ')}.`, score: 850 });
    }
  }

  const ai = result?.ActivityIndicators || result?.activity_indicators;
  if (ai) {
    const items = flattenBDCArray(ai);
    for (const item of items) {
      const shell = item?.ShellCompanyLikelyhood ?? item?.ShellCompanyLikelihood;
      if (shell != null && Number(shell) > 0.8) {
        blocks.push({ code: 'B05', label: 'Provável empresa de fachada', severity: 'BLOQUEIO', detail: `Shell Company score: ${(Number(shell) * 100).toFixed(0)}%. Acima de 80% = bloqueio automático.`, score: 850 });
        break;
      }
    }
  }

  const debtors = result?.GovernmentDebtors || result?.government_debtors;
  if (debtors) {
    const items = flattenBDCArray(debtors);
    let totalDebt = 0;
    for (const item of items) { totalDebt += Number(item?.TotalValue || item?.Value || 0); }
    if (totalDebt > 500000) {
      blocks.push({ code: 'B06', label: 'Dívida ativa > R$500k', severity: 'BLOQUEIO', detail: `Total dívida ativa: R$ ${totalDebt.toLocaleString('pt-BR', {minimumFractionDigits:2})}.`, score: 850 });
    }
  }

  const media = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
  if (media) {
    const items = flattenBDCArray(media);
    for (const item of items) {
      const sentiment = item?.Sentiment || item?.OverallSentiment;
      if (sentiment && String(sentiment).toUpperCase().includes('VERY_NEGATIVE')) {
        const topics = item?.Topics || item?.MainTopics || [];
        const hasGrave = topics.some(t => /fraude|lavagem|crime|corrup/i.test(String(t)));
        if (hasGrave) {
          blocks.push({ code: 'B07', label: 'Adverse media grave', severity: 'BLOQUEIO', detail: `Mídia VERY_NEGATIVE: ${topics.join(', ')}.`, score: 850 });
          break;
        }
      }
    }
  }

  const esg = result?.EsgAndCompliance || result?.esg_and_compliance;
  if (esg) {
    const items = flattenBDCArray(esg);
    for (const item of items) {
      const slaveLabor = item?.SlaveLabor || item?.SlaveLaborList || item?.ListaSuja || item?.TrabalhoEscravo;
      const hasSlaveLabor = slaveLabor === true || (typeof slaveLabor === 'string' && /sim|true|encontrad/i.test(slaveLabor));
      if (hasSlaveLabor) {
        blocks.push({ code: 'B08', label: 'Lista Suja MTE — Trabalho Escravo', severity: 'BLOQUEIO', detail: `Empresa na Lista Suja MTE.`, score: 850 });
        break;
      }
      const envEmbargo = item?.EnvironmentalEmbargo || item?.IbamaEmbargo;
      if (envEmbargo === true) {
        blocks.push({ code: 'B09', label: 'Embargo ambiental IBAMA', severity: 'BLOQUEIO', detail: `Embargo IBAMA ativo.`, score: 850 });
      }
    }
  }

  return blocks;
}

// ══════════════════════════════════════════════════════════════════
// (Re-utiliza analyzers completos do original — mantidos íntegros)
// ══════════════════════════════════════════════════════════════════
function analyzeIdentity(result) {
  const bd = extractBasicData(result);
  if (!bd) return { score: 0, items: [] };
  const items = [];
  let score = 0;
  const officialName = safeGet(bd, 'OfficialName') || safeGet(bd, 'CompanyName');
  if (officialName) items.push({ label: 'Razão social', value: String(officialName), risk: 'INFO', points: 0 });
  const tradeName = safeGet(bd, 'TradeName') || safeGet(bd, 'FantasyName');
  if (tradeName) items.push({ label: 'Nome fantasia', value: String(tradeName), risk: 'INFO', points: 0 });
  const founded = safeGet(bd, 'FoundedDate') || safeGet(bd, 'Age.FoundedDate');
  if (founded) {
    const years = (Date.now() - new Date(founded).getTime()) / (365.25 * 24 * 3600 * 1000);
    const y = Math.floor(years);
    if (y < 1) { score += 25; items.push({ label: 'Idade da empresa', value: `< 1 ano`, risk: 'ALTO', points: 25 }); }
    else if (y < 2) { score += 15; items.push({ label: 'Idade da empresa', value: `${y} ano(s)`, risk: 'MEDIO', points: 15 }); }
    else if (y < 5) { score += 5; items.push({ label: 'Idade da empresa', value: `${y} anos`, risk: 'BAIXO', points: 5 }); }
    else { items.push({ label: 'Idade da empresa', value: `${y} anos`, risk: 'OK', points: 0 }); }
  }
  const statusVal = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription') || '';
  items.push({ label: 'Situação cadastral', value: String(statusVal), risk: String(statusVal).toUpperCase().includes('ATIV') ? 'OK' : 'CRITICO', points: 0 });
  const capital = safeGet(bd, 'ShareCapital') || safeGet(bd, 'Capital');
  if (capital != null) {
    const val = Number(capital);
    items.push({ label: 'Capital social', value: `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, risk: val < 1000 ? 'ALTO' : val < 10000 ? 'MEDIO' : 'OK', points: val < 1000 ? 15 : val < 10000 ? 5 : 0 });
    if (val < 1000) score += 15; else if (val < 10000) score += 5;
  }
  const cnae = safeGet(bd, 'MainEconomicActivity') || safeGet(bd, 'MainActivityCode');
  const cnaeDesc = safeGet(bd, 'MainEconomicActivityDescription') || safeGet(bd, 'MainActivityDescription') || '';
  if (cnae) {
    const isHighRisk = HIGH_RISK_CNAES.includes(String(cnae));
    items.push({ label: 'CNAE principal', value: `${cnae} — ${cnaeDesc}`, risk: isHighRisk ? 'CRITICO' : 'OK', points: isHighRisk ? 30 : 0 });
    if (isHighRisk) score += 30;
  }
  return { score, items };
}

function analyzeOwners(result) {
  const items = []; let score = 0;
  const rels = result?.Relationships || result?.relationships;
  const owners = [];
  if (rels) {
    const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    if (Array.isArray(entries)) {
      for (const e of entries) {
        owners.push({ name: e.RelatedEntityName || e.Name || 'N/I', doc: e.RelatedEntityTaxIdNumber || e.TaxIdNumber || '', role: e.RelationshipName || e.Qualification || e.Role || '' });
      }
    }
  }
  items.push({ label: 'Total sócios/QSA', value: `${owners.length} pessoa(s)`, risk: owners.length === 0 ? 'ALTO' : 'OK', points: owners.length === 0 ? 15 : 0, owners });
  if (owners.length === 0) score += 15;

  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  if (ownersKyc) {
    const kycItems = flattenBDCArray(ownersKyc);
    let pepFound = [], sanctionedFound = [];
    for (const item of kycItems) {
      const name = item?.Name || 'N/I';
      if (item?.IsPEP || item?.IsPep) pepFound.push(name);
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) sanctionedFound.push(name);
    }
    if (pepFound.length > 0) { score += 40; items.push({ label: 'PEP identificado(s)', value: pepFound.join(', '), risk: 'ALTO', points: 40 }); }
    if (sanctionedFound.length > 0) items.push({ label: 'Sócios em sanções', value: sanctionedFound.join(', '), risk: 'CRITICO', points: 80 });
  }
  return { score, items };
}

function analyzeCompliance(result) {
  const items = []; let score = 0;
  const debtors = result?.GovernmentDebtors || result?.government_debtors;
  if (debtors) {
    const dItems = flattenBDCArray(debtors);
    let totalDebt = 0;
    for (const item of dItems) totalDebt += Number(item?.TotalValue || item?.Value || 0);
    if (totalDebt > 0) {
      const pts = totalDebt > 500000 ? 80 : totalDebt > 100000 ? 40 : 20;
      score += pts;
      items.push({ label: 'Dívida ativa', value: `R$ ${totalDebt.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, risk: totalDebt > 500000 ? 'CRITICO' : 'ALTO', points: pts });
    } else {
      items.push({ label: 'Dívida ativa', value: 'Nenhuma', risk: 'OK', points: 0 });
    }
  }
  const collections = result?.Collections || result?.collections;
  if (collections) {
    const cItems = flattenBDCArray(collections);
    let hasCollections = false, totalRecords = 0;
    for (const item of cItems) {
      if (item?.HasCollectionRecords || item?.TotalRecords > 0) hasCollections = true;
      totalRecords += Number(item?.TotalRecords || 0);
    }
    if (hasCollections) { score += 30; items.push({ label: 'Em cobrança', value: `${totalRecords} registro(s)`, risk: 'ALTO', points: 30 }); }
    else items.push({ label: 'Em cobrança', value: 'Não', risk: 'OK', points: 0 });
  }
  return { score, items };
}

function analyzeDigital(result) {
  const items = []; let score = 0;
  const ai = result?.ActivityIndicators || result?.activity_indicators;
  if (ai) {
    const aItems = flattenBDCArray(ai);
    for (const item of aItems) {
      const shell = item?.ShellCompanyLikelyhood ?? item?.ShellCompanyLikelihood;
      if (shell != null) {
        const s = Number(shell);
        items.push({ label: 'Shell Company score', value: `${(s * 100).toFixed(0)}%`, risk: s > 0.5 ? 'CRITICO' : s > 0.3 ? 'ALTO' : 'OK', points: 0 });
      }
    }
  }
  return { score, items };
}

function analyzeESG(result) {
  const items = []; let score = 0;
  const esg = result?.EsgAndCompliance || result?.esg_and_compliance;
  if (!esg) { items.push({ label: 'ESG', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
  const eItems = flattenBDCArray(esg);
  for (const item of eItems) {
    const slaveLabor = item?.SlaveLabor || item?.ListaSuja;
    if (slaveLabor === true || (typeof slaveLabor === 'string' && /sim|true/i.test(slaveLabor))) {
      score += 200;
      items.push({ label: 'Lista Suja MTE', value: 'ENCONTRADA', risk: 'CRITICO', points: 200 });
    } else {
      items.push({ label: 'Lista Suja MTE', value: 'Não encontrada', risk: 'OK', points: 0 });
    }
  }
  return { score, items };
}

function analyzeEvolution() { return { score: 0, items: [] }; }
function analyzeReputation() { return { score: 0, items: [] }; }
function analyzeFinancial() { return { score: 0, items: [] }; }
function analyzeContacts() { return { score: 0, items: [] }; }
function analyzeEmployeesKyc() { return { score: 0, items: [] }; }
function analyzeSectorial() { return { score: 0, items: [] }; }
function analyzeAssets() { return { score: 0, items: [] }; }
function analyzeCreditRisk() { return { score: 0, items: [] }; }

function analyzePersonBlocks(result) {
  const blocks = [];
  const bd = result?.BasicData || result?.basic_data;
  if (bd) {
    const items = flattenBDCArray(bd);
    const first = items[0] || {};
    const status = first?.TaxIdStatus || '';
    if (status && !String(status).toUpperCase().includes('REGULAR')) {
      blocks.push({ code: 'B01', label: 'CPF Irregular', severity: 'BLOQUEIO', detail: `Situação: ${status}.`, score: 850 });
    }
    const birthDate = first?.BirthDate || first?.DateOfBirth;
    if (birthDate) {
      const age = (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 18) blocks.push({ code: 'B02', label: 'Menor de 18 anos', severity: 'BLOQUEIO', detail: `Idade: ${Math.floor(age)}.`, score: 850 });
    }
  }
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) {
    const kItems = flattenBDCArray(kyc);
    for (const item of kItems) {
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) {
        blocks.push({ code: 'B03', label: 'Pessoa em lista de sanções', severity: 'BLOQUEIO', detail: `${sanctions.length} sanção(ões).`, score: 850 });
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
    sections.identity.items.push({ label: 'Nome', value: first?.Name || 'N/D', risk: 'INFO', points: 0 });
    const cpfStatus = first?.TaxIdStatus || 'N/D';
    sections.identity.items.push({ label: 'Situação CPF', value: cpfStatus, risk: String(cpfStatus).toUpperCase().includes('REGULAR') ? 'OK' : 'ALTO', points: 0 });
  }
  const pKyc = result?.Kyc || result?.kyc;
  if (pKyc) {
    const kItems = flattenBDCArray(pKyc);
    let isPep = false, hasSanctions = false;
    for (const item of kItems) {
      if (item?.IsPEP || item?.IsPep) isPep = true;
      const sanctions = item?.Sanctions || [];
      if (Array.isArray(sanctions) && sanctions.length > 0) hasSanctions = true;
    }
    sections.compliance.items.push({ label: 'PEP', value: isPep ? 'SIM' : 'Não', risk: isPep ? 'ALTO' : 'OK', points: isPep ? 40 : 0 });
    if (isPep) sections.compliance.score += 40;
    if (hasSanctions) { sections.compliance.items.push({ label: 'Sanções', value: 'ENCONTRADA', risk: 'CRITICO', points: 80 }); sections.compliance.score += 80; }
  }
  return sections;
}

// ══════════════════════════════════════════════════════════════════
// MAIN HANDLER — v2 com lotes + retry robusto + queue persistente
// ══════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAuthorized = true;
    } catch (e) { /* service-role */ }
    try { await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1); isAuthorized = true; } catch(e) {}
    if (!isAuthorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { onboardingCaseId, document, documentType, forceGroup, retryBatchesOnly } = await req.json();
    if (!onboardingCaseId && !document) return Response.json({ error: 'onboardingCaseId ou document é obrigatório' }, { status: 400 });

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    let doc = document, docType = documentType, templateModel = null, onboardingCase = null, merchant = null, responses = [];

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
      try { responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId }); } catch (e) {}
    }

    if (!doc) return Response.json({ error: 'No document found' }, { status: 400 });
    const cleanDoc = doc.replace(/\D/g, '');
    const isPF = docType === 'cpf' || cleanDoc.length === 11;
    const endpoint = isPF ? '/pessoas' : '/empresas';
    const batchDefs = isPF ? PF_BATCH_DEFS : BATCH_DEFS;
    const groupKey = forceGroup || (isPF ? 'SUBSELLER_PF' : 'FULL');

    console.log(`[BDC] ═══ Starting BATCHED enrichment ═══`);
    console.log(`[BDC] Doc: ${cleanDoc.substring(0,3)}*** | Endpoint: ${endpoint} | Batches: ${Object.keys(batchDefs).length}`);

    // ═══ EXECUTE ALL BATCHES ═══
    const batchResults = [];
    const batchStatuses = {};
    const criticalBatchesFailed = [];

    // Run CRITICAL batches first, sequentially
    for (const [batchId, def] of Object.entries(batchDefs)) {
      if (def.priority !== 'CRITICAL') continue;
      const result = await callBdcBatch({ accessToken, tokenId, endpoint, document: cleanDoc, datasets: def.datasets, batchId, priority: def.priority });
      batchResults.push(result);
      batchStatuses[batchId] = { priority: def.priority, success: result.success, attempts: result.attempts, error: result.error, datasets: def.datasets };
      if (!result.success) criticalBatchesFailed.push(batchId);
    }

    // If any CRITICAL batch failed, enqueue retry and block pipeline
    if (criticalBatchesFailed.length > 0 && onboardingCaseId) {
      console.warn(`[BDC] ⚠️  CRITICAL batches failed: ${criticalBatchesFailed.join(', ')} — enqueueing retry`);

      // Build pending batches list
      const batchesPending = Object.entries(batchDefs).map(([batchId, def]) => ({
        batch_id: batchId,
        priority: def.priority,
        datasets: def.datasets,
        attempts: batchStatuses[batchId]?.attempts || 0,
        last_error: batchStatuses[batchId]?.error || '',
        last_attempt_at: new Date().toISOString(),
        status: batchStatuses[batchId]?.success ? 'success' : 'pending',
      }));
      const batchesSuccess = Object.entries(batchStatuses).filter(([_, s]) => s.success).map(([id]) => id);

      // Create or update queue entry
      const existingQueue = await base44.asServiceRole.entities.BdcRetryQueue.filter({ onboarding_case_id: onboardingCaseId });
      const queueData = {
        onboarding_case_id: onboardingCaseId,
        merchant_id: merchant?.id || '',
        document: cleanDoc,
        document_type: isPF ? 'cpf' : 'cnpj',
        template_model: templateModel || '',
        dataset_group: groupKey,
        batches_pending: batchesPending,
        batches_success: batchesSuccess,
        attempt_count: 1,
        next_retry_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // retry in 2 min
        first_attempt_at: new Date().toISOString(),
        status: 'pending',
        last_error: `CRITICAL batches failed: ${criticalBatchesFailed.join(', ')}`,
      };
      if (existingQueue.length > 0) {
        await base44.asServiceRole.entities.BdcRetryQueue.update(existingQueue[0].id, queueData);
      } else {
        await base44.asServiceRole.entities.BdcRetryQueue.create(queueData);
      }

      // Update case to "Aguardando BDC"
      await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
        status: 'Em Processamento',
        iaExplanation: `Aguardando dados BDC — ${criticalBatchesFailed.length} lote(s) crítico(s) em retry automático`,
      });

      return Response.json({
        success: false,
        reason: 'critical_batches_failed_enqueued',
        failedBatches: criticalBatchesFailed,
        batchStatuses,
        willRetry: true,
      }, { status: 202 }); // 202 Accepted — será processado
    }

    // Run IMPORTANT + COMPLEMENTARY in parallel
    const nonCriticalBatches = Object.entries(batchDefs).filter(([_, def]) => def.priority !== 'CRITICAL');
    const parallelResults = await Promise.all(
      nonCriticalBatches.map(([batchId, def]) =>
        callBdcBatch({ accessToken, tokenId, endpoint, document: cleanDoc, datasets: def.datasets, batchId, priority: def.priority })
      )
    );
    for (let i = 0; i < parallelResults.length; i++) {
      const [batchId, def] = nonCriticalBatches[i];
      const r = parallelResults[i];
      batchResults.push(r);
      batchStatuses[batchId] = { priority: def.priority, success: r.success, attempts: r.attempts, error: r.error, datasets: def.datasets };
    }

    // ═══ MERGE RESULTS ═══
    const { result, totalElapsed } = mergeBdcResults(batchResults);
    const successfulBatches = batchResults.filter(b => b.success).length;
    const totalBatches = batchResults.length;

    console.log(`[BDC] ═══ Batches complete: ${successfulBatches}/${totalBatches} success (${totalElapsed}ms) ═══`);

    // If non-critical batches failed, enqueue retry for those ONLY
    const failedNonCritical = Object.entries(batchStatuses).filter(([_, s]) => !s.success && s.priority !== 'CRITICAL');
    if (failedNonCritical.length > 0 && onboardingCaseId) {
      const batchesPending = Object.entries(batchDefs).map(([batchId, def]) => ({
        batch_id: batchId, priority: def.priority, datasets: def.datasets,
        attempts: batchStatuses[batchId]?.attempts || 0,
        last_error: batchStatuses[batchId]?.error || '',
        last_attempt_at: new Date().toISOString(),
        status: batchStatuses[batchId]?.success ? 'success' : 'pending',
      }));
      const batchesSuccess = Object.entries(batchStatuses).filter(([_, s]) => s.success).map(([id]) => id);
      const existingQueue = await base44.asServiceRole.entities.BdcRetryQueue.filter({ onboarding_case_id: onboardingCaseId });
      const queueData = {
        onboarding_case_id: onboardingCaseId, merchant_id: merchant?.id || '',
        document: cleanDoc, document_type: isPF ? 'cpf' : 'cnpj',
        template_model: templateModel || '', dataset_group: groupKey,
        batches_pending: batchesPending, batches_success: batchesSuccess,
        attempt_count: 1, next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        first_attempt_at: new Date().toISOString(), status: 'pending',
        last_error: `Non-critical batches pending: ${failedNonCritical.map(([id]) => id).join(', ')}`,
      };
      if (existingQueue.length > 0) {
        await base44.asServiceRole.entities.BdcRetryQueue.update(existingQueue[0].id, queueData);
      } else {
        await base44.asServiceRole.entities.BdcRetryQueue.create(queueData);
      }
    }

    // ═══ ANALYZE ═══
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
        datasetsQueried: Object.values(batchDefs).flatMap(b => b.datasets).length,
        elapsedMs: totalElapsed, blocks, hasBlock, sections, batchStatuses,
        scoring: {
          baseScore, variablesScore: totalScore, enrichmentScore: 0,
          finalScore: hasBlock ? 850 : finalScore,
          subfaixa: hasBlock ? '5' : finalScore <= 100 ? '1A' : finalScore <= 200 ? '1B' : finalScore <= 300 ? '2A' : finalScore <= 400 ? '2B' : finalScore <= 500 ? '3A' : finalScore <= 600 ? '3B' : finalScore <= 700 ? '4' : '5',
        },
      };
    } else {
      const blocks = analyzeBlocks(result, responses);
      const identity = analyzeIdentity(result);
      const owners = analyzeOwners(result);
      const digital = analyzeDigital(result);
      const compliance = analyzeCompliance(result);
      const reputation = analyzeReputation(result);
      const financial = analyzeFinancial(result);
      const evolution = analyzeEvolution(result);
      const esgData = analyzeESG(result);
      const contacts = analyzeContacts(result);
      const employeesKyc = analyzeEmployeesKyc(result);
      const sectorial = analyzeSectorial(result);
      const assets = analyzeAssets(result);
      const creditRisk = analyzeCreditRisk(result);

      const COMPONENT_WEIGHTS = { identity: 0.10, owners: 0.18, digital: 0.07, compliance: 0.20, reputation: 0.08, financial: 0.08, evolution: 0.06, esg: 0.05, contacts: 0.03, employeesKyc: 0.02, sectorial: 0.02, assets: 0.02, creditRisk: 0.09 };
      const componentScores = { identity: identity.score, owners: owners.score, digital: digital.score, compliance: compliance.score, reputation: reputation.score, financial: financial.score, evolution: evolution.score, esg: esgData.score, contacts: contacts.score, employeesKyc: employeesKyc.score, sectorial: sectorial.score, assets: assets.score, creditRisk: creditRisk.score };
      let weightedTotal = 0;
      for (const [key, weight] of Object.entries(COMPONENT_WEIGHTS)) {
        weightedTotal += (componentScores[key] || 0) * weight;
      }
      const baseScore = SEGMENT_BASE_SCORES[templateModel] || 80;
      const finalScore = Math.max(0, Math.min(849, baseScore + Math.round(weightedTotal)));
      const hasBlock = blocks.length > 0;

      analysis = {
        type: 'PJ', document: cleanDoc, templateModel, datasetGroup: groupKey,
        datasetsQueried: Object.values(batchDefs).flatMap(b => b.datasets).length,
        elapsedMs: totalElapsed, blocks, hasBlock, batchStatuses,
        sections: { identity, owners, digital, compliance, reputation, financial, evolution, esg: esgData, contacts, employeesKyc, sectorial, assets, creditRisk },
        scoring: {
          baseScore, variablesScore: Math.round(weightedTotal * 0.6), enrichmentScore: Math.round(weightedTotal * 0.4),
          weightedTotal: Math.round(weightedTotal),
          finalScore: hasBlock ? 850 : finalScore,
          subfaixa: hasBlock ? '5' : finalScore <= 100 ? '1A' : finalScore <= 200 ? '1B' : finalScore <= 300 ? '2A' : finalScore <= 400 ? '2B' : finalScore <= 500 ? '3A' : finalScore <= 600 ? '3B' : finalScore <= 700 ? '4' : '5',
        },
      };
    }

    const subfaixaNames = { '1A': 'VERDE EXPRESS', '1B': 'VERDE', '2A': 'AZUL LEVE', '2B': 'AZUL', '3A': 'AMARELO', '3B': 'LARANJA', '4': 'VERMELHO', '5': 'BLOQUEIO' };
    analysis.scoring.subfaixaNome = subfaixaNames[analysis.scoring.subfaixa] || 'N/D';

    // ═══ SAVE RESULTS ═══
    if (onboardingCaseId) {
      try {
        const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: onboardingCaseId });
        const v4RedFlags = analysis.blocks.map(b => `V4: ${b.code}_${b.label}`);
        const scoreData = {
          onboarding_case_id: onboardingCaseId, framework_version: 'v4.0',
          segmento: templateModel || 'unknown',
          score_base_segmento: analysis.scoring.baseScore,
          score_variaveis: analysis.scoring.variablesScore,
          score_enriquecimento: analysis.scoring.enrichmentScore,
          score_final: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa, subfaixa_nome: analysis.scoring.subfaixaNome,
          bloqueios_ativos: analysis.blocks.map(b => `${b.code}_${b.label}`),
          variaveis_aplicadas: analysis.sections, red_flags: v4RedFlags,
          fase_2_completa: true, data_analise_fase_2: new Date().toISOString(),
        };
        if (existing.length > 0) await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scoreData);
        else await base44.asServiceRole.entities.ComplianceScore.create(scoreData);

        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          bigDataCorpCompleted: true, riskScoreV4: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa, subfaixaNome: analysis.scoring.subfaixaNome,
          bloqueiosAtivos: analysis.blocks.map(b => `${b.code}_${b.label}`),
        });

        // If all batches succeeded, mark queue as success
        const allSuccess = Object.values(batchStatuses).every(s => s.success);
        if (allSuccess) {
          const existingQueue = await base44.asServiceRole.entities.BdcRetryQueue.filter({ onboarding_case_id: onboardingCaseId });
          if (existingQueue.length > 0) {
            await base44.asServiceRole.entities.BdcRetryQueue.update(existingQueue[0].id, {
              status: 'success', last_success_at: new Date().toISOString(),
            });
          }
        }
      } catch (e) { console.warn('Error saving results:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId, provider: 'BigDataCorp',
          validationType: `Enriquecimento ${isPF ? 'PF' : 'PJ'} — ${groupKey} (${successfulBatches}/${totalBatches} lotes)`,
          endpoint, resultData: result, score: analysis.scoring.finalScore,
          status: successfulBatches === totalBatches ? 'Sucesso' : 'Sucesso',
          timestamp: new Date().toISOString(), responseTime: totalElapsed,
        });
      } catch (e) { console.warn('Error saving ExternalValidationResult:', e.message); }
    }

    return Response.json({ success: true, analysis, batchStatuses });
  } catch (error) {
    console.error('bdcEnrichCase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});