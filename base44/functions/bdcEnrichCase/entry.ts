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
  // GAP 8: + company_group_owners (agrega empresas com sócios em comum)
  SOCIETARIO: { priority: 'IMPORTANT', datasets: ['relationships', 'economic_group', 'economic_group_relationships', 'configurable_recency_qsa', 'owners_influence', 'owners_electoral_donors', 'company_group_owners'] },
  ESG_COMPLIANCE: { priority: 'IMPORTANT', datasets: ['esg_and_compliance', 'political_involvement', 'media_profile_and_exposure'] },
  // 🟡 COMPLEMENTARES — best-effort
  DIGITAL_REPUTACAO: { priority: 'COMPLEMENTARY', datasets: ['domains', 'passages', 'online_ads', 'reputations_and_reviews', 'awards_and_certifications', 'activity_indicators', 'marketplace_data', 'merchant_category_data', 'digital_attributes'] },
  // GAP 5: + flags_and_features (modelos estatísticos BDC)
  // GAP 9: + companies_statistics (estatísticas por endereço — detector de endereço-fachada)
  ENRIQUECIMENTO: { priority: 'COMPLEMENTARY', datasets: ['credit_risk', 'credit_score', 'financial_market', 'emails_extended', 'phones_extended', 'addresses_extended', 'related_people_phones', 'related_people_emails', 'related_people_addresses', 'industrial_property', 'owners_industrial_property', 'licenses_and_authorizations', 'company_evolution', 'flags_and_features', 'companies_statistics'] },
  // 🟠 NOVOS LOTES — Sprint Expansão PLD (2026-05-15)
  FINANCEIRO_PROFUNDO: { priority: 'IMPORTANT', datasets: ['financial_data', 'default_business_data'] },
  CADEIA_SOCIETARIA: { priority: 'IMPORTANT', datasets: ['corporate_chain'] },
};

// Para PF, lotes específicos
const PF_BATCH_DEFS = {
  IDENTIDADE: { priority: 'CRITICAL', datasets: ['basic_data', 'kyc', 'pep'] },
  LEGAL: { priority: 'CRITICAL', datasets: ['processes', 'collections', 'government_debtors'] },
  // GAP 4: + first_level_relatives_kyc (cobertura agregada do grupo familiar — Circ. 3.978 Art. 14 §2º)
  FAMILIAR: { priority: 'CRITICAL', datasets: ['first_level_family_kyc', 'first_level_relatives_kyc', 'personal_relationships'] },
  // GAP 3: + bets_ownership (participação em casas de apostas — SPA/MF)
  COMPLIANCE: { priority: 'IMPORTANT', datasets: ['risk_data', 'social_assistance', 'public_servants', 'bets_ownership'] },
  FINANCEIRO: { priority: 'IMPORTANT', datasets: ['presumed_income', 'financial_interests', 'scr_positive_score', 'simples_nacional_collection', 'electoral_donors', 'financial_data'] },
  // 🟠 NOVO LOTE PF — Sprint Expansão PLD (2026-05-15)
  JURIDICO_PROFUNDO: { priority: 'IMPORTANT', datasets: ['judicial_assets', 'entrepreneur_quality'] },
  REPUTACAO: { priority: 'COMPLEMENTARY', datasets: ['media_profile_and_exposure', 'online_presence'] },
  // GAP 5: + flags_and_features (modelos estatísticos PF: Findability, IdentityConfidence)
  CONTATOS: { priority: 'COMPLEMENTARY', datasets: ['emails_extended', 'phones_extended', 'addresses_extended', 'related_people_phones', 'related_people_emails', 'related_people_addresses', 'flags_and_features'] },
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
  'pix_api_enterprise': 200,
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
// BLOCK ANALYSIS — B01 through B12 + ManualReviewFlags
// Returns { blocks, manualReviewFlags }
// ══════════════════════════════════════════════════════════════════
function analyzeBlocks(result, responses) {
  const blocks = [];
  const manualReviewFlags = [];
  const bd = extractBasicData(result);

  // ── REGRA 1: Status na Receita Federal deve ser ATIVA — caso contrário, REPROVAR.
  // Antes aceitávamos qualquer string contendo "ATIV" ou "REGULAR" (frouxo).
  // Régua nova: estritamente "ATIVA" passa; "SUSPENSA"/"INAPTA"/"BAIXADA"/"NULA" → bloqueio.
  const status = safeGet(bd, 'TaxIdStatus') || safeGet(bd, 'TaxIdStatusDescription') || '';
  const statusUp = String(status).toUpperCase().trim();
  const cnpjIsActive = !status || statusUp === 'ATIVA' || statusUp.startsWith('ATIV');
  if (status && !cnpjIsActive) {
    blocks.push({ code: 'B01', label: 'CNPJ não-ATIVO na Receita Federal', severity: 'BLOQUEIO', detail: `Situação cadastral Receita Federal: "${status}" (esperado: ATIVA). Empresa não pode exercer atividades econômicas. Circular BCB 3.978/2020 Art. 2º.`, score: 850 });
  }

  // ── REGRA 3: Idade da empresa
  //   A) < 6 meses → REVISÃO MANUAL
  //   B) 6 meses a 2 anos → risco médio (sem bloqueio, sem manual — apenas variável)
  //   C) ≥ 2 anos → OK
  // Nota: a regra B10 (≤ 1 mês = bloqueio) foi SUBSTITUÍDA pela régua nova; ≤ 6m agora é manual.
  const founded = safeGet(bd, 'FoundedDate') || safeGet(bd, 'Age.FoundedDate');
  if (founded) {
    const months = (Date.now() - new Date(founded).getTime()) / (30.44 * 24 * 3600 * 1000);
    if (months < 6) {
      manualReviewFlags.push({ code: 'M01', label: 'Empresa com menos de 6 meses', detail: `Empresa fundada há ${months.toFixed(1)} mês(es) — abaixo do mínimo de 6 meses. Encaminhar para análise manual.` });
    }
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

  // ── REGRA B12: UBO (beneficiário final) em corporate_chain está sancionado/PEP grave
  const chain = result?.CorporateChain || result?.corporate_chain;
  if (chain) {
    const chainItems = flattenBDCArray(chain);
    const sanctionedUbos = [];
    for (const item of chainItems) {
      const ubos = item?.UltimateBeneficialOwners || item?.UBOs || item?.BeneficialOwners || [];
      if (Array.isArray(ubos)) {
        for (const ubo of ubos) {
          const sanctions = ubo?.Sanctions || [];
          if (Array.isArray(sanctions) && sanctions.length > 0) {
            sanctionedUbos.push(ubo?.Name || ubo?.PersonName || 'N/I');
          }
        }
      }
    }
    if (sanctionedUbos.length > 0) {
      blocks.push({ code: 'B12', label: 'Beneficiário final (UBO) em sanções', severity: 'BLOQUEIO', detail: `UBOs sancionados na cadeia societária: ${sanctionedUbos.join(', ')}. Circular BCB 3.978/2020 Art. 14 (identificação do beneficiário final).`, score: 850 });
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

  // ── REGRA 2: CPF de sócios/administradores na Receita Federal ≠ REGULAR → REPROVAR.
  // Verifica o TaxIdStatus de cada sócio retornado em OwnersKyc/owners_kyc (cada item
  // representa um sócio, o KYC inclui dados pessoais incluindo a situação do CPF).
  const ownersKycForCpf = result?.OwnersKyc || result?.owners_kyc;
  if (ownersKycForCpf) {
    const items = flattenBDCArray(ownersKycForCpf);
    const irregularOwners = [];
    for (const item of items) {
      const ownerStatus = item?.TaxIdStatus || item?.CpfStatus || item?.PersonStatus || '';
      const ownerStatusUp = String(ownerStatus).toUpperCase().trim();
      // Só sinaliza se BDC retornou um status explícito e não-REGULAR
      if (ownerStatus && ownerStatusUp !== 'REGULAR' && !ownerStatusUp.includes('REGULAR')) {
        irregularOwners.push(`${item?.Name || item?.RelatedPersonName || 'sócio'} (${ownerStatus})`);
      }
    }
    if (irregularOwners.length > 0) {
      blocks.push({
        code: 'B11', label: 'CPF de sócio(s) irregular na Receita Federal', severity: 'BLOQUEIO',
        detail: `CPF não-REGULAR identificado em: ${irregularOwners.join('; ')}. Sócios com CPF irregular impedem prosseguir.`,
        score: 850,
      });
    }
  }

  // ── REGRA 4: Endereço da empresa na Receita Federal ≠ endereço declarado → REVISÃO MANUAL.
  // Compara o CEP da Receita (BasicData.Address.ZipCode) com o CEP declarado nas respostas.
  // Comparação por CEP é mais confiável que por logradouro (evita falsos positivos por abreviação).
  try {
    const rfAddressObj = safeGet(bd, 'Address') || safeGet(bd, 'address') || {};
    const rfZip = String(rfAddressObj?.ZipCode || rfAddressObj?.zipCode || rfAddressObj?.CEP || '').replace(/\D/g, '');
    if (rfZip && Array.isArray(responses)) {
      // Procura nas respostas do questionário um campo de CEP
      let declaredZip = '';
      for (const r of responses) {
        const qt = String(r?.questionText || '').toLowerCase();
        if (qt.includes('cep') || qt.includes('código postal') || qt.includes('codigo postal')) {
          const v = String(r?.valueText || '').replace(/\D/g, '');
          if (v.length === 8) { declaredZip = v; break; }
        }
      }
      if (declaredZip && declaredZip !== rfZip) {
        manualReviewFlags.push({
          code: 'M02', label: 'Endereço Receita Federal divergente do declarado',
          detail: `CEP Receita Federal: ${rfZip}; CEP declarado no onboarding: ${declaredZip}. Encaminhar para análise manual para validação de endereço.`,
        });
      }
    }
  } catch (_) { /* não-bloqueante */ }

  // ── REGRA B13/B14 (sprint v3 — 2026-05-16) ──
  // Bloqueios novos derivados dos analyzers de processos e endereço.
  const criminalBlock = detectCriminalBlock(result);
  if (criminalBlock) blocks.push(criminalBlock);

  const fakeAddrBlock = detectFakeAddressBlock(result);
  if (fakeAddrBlock) blocks.push(fakeAddrBlock);

  // ── REGRA M04 (sprint v3) ──
  // Mudança recente de QSA + sócios novos = manual review obrigatório.
  const qsaFlag = detectRecentQsaChangeFlag(result);
  if (qsaFlag) manualReviewFlags.push(qsaFlag);

  return { blocks, manualReviewFlags };
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
    const ageMs = Date.now() - new Date(founded).getTime();
    const months = ageMs / (30.44 * 24 * 3600 * 1000);
    const years = ageMs / (365.25 * 24 * 3600 * 1000);
    const y = Math.floor(years);
    // Régua nova:
    //   < 6 meses        → ALTO (vai pra manual via manualReviewFlags em analyzeBlocks)
    //   6 meses - 2 anos → MÉDIO (risco médio, 15 pts)
    //   ≥ 2 anos         → OK
    if (months < 6) { score += 25; items.push({ label: 'Idade da empresa', value: `< 6 meses (${months.toFixed(1)}m)`, risk: 'ALTO', points: 25 }); }
    else if (years < 2) { score += 15; items.push({ label: 'Idade da empresa', value: `${months.toFixed(0)} meses (entre 6m e 2 anos)`, risk: 'MEDIO', points: 15 }); }
    else if (y < 5) { items.push({ label: 'Idade da empresa', value: `${y} anos`, risk: 'OK', points: 0 }); }
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

// ══════════════════════════════════════════════════════════════════
// REAL ANALYZERS (v2 — 2026-04-21)
// Cada analyzer lê o dataset BDC correspondente e gera score + items.
// Todos envelopados em try/catch: se parse falhar, retorna {score:0,items:[]}
// para não quebrar o pipeline.
// ══════════════════════════════════════════════════════════════════

function analyzeEvolution(result) {
  try {
    const items = []; let score = 0;
    const hbd = result?.HistoryBasicData || result?.history_basic_data;
    if (!hbd) { items.push({ label: 'Evolução histórica', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    const histItems = flattenBDCArray(hbd);
    const first = histItems[0] || (typeof hbd === 'object' ? hbd : {});

    const cnaeChanges = Number(first?.CnaeTotalChanges ?? 0);
    if (cnaeChanges >= 5) { score += 25; items.push({ label: 'Mudanças de CNAE', value: `${cnaeChanges} alterações`, risk: 'ALTO', points: 25 }); }
    else if (cnaeChanges >= 3) { score += 15; items.push({ label: 'Mudanças de CNAE', value: `${cnaeChanges} alterações`, risk: 'MEDIO', points: 15 }); }
    else items.push({ label: 'Mudanças de CNAE', value: `${cnaeChanges} alterações`, risk: 'OK', points: 0 });

    const tradeChanges = Number(first?.TradeNameTotalChanges ?? 0);
    if (tradeChanges >= 3) { score += 15; items.push({ label: 'Mudanças de nome fantasia', value: `${tradeChanges}`, risk: 'ALTO', points: 15 }); }
    else if (tradeChanges >= 2) { score += 5; items.push({ label: 'Mudanças de nome fantasia', value: `${tradeChanges}`, risk: 'MEDIO', points: 5 }); }
    else items.push({ label: 'Mudanças de nome fantasia', value: `${tradeChanges}`, risk: 'OK', points: 0 });

    const regimeChanges = Number(first?.TaxRegimeTotalChanges ?? 0);
    if (regimeChanges >= 3) { score += 15; items.push({ label: 'Mudanças de regime tributário', value: `${regimeChanges}`, risk: 'ALTO', points: 15 }); }
    else items.push({ label: 'Mudanças de regime tributário', value: `${regimeChanges}`, risk: 'OK', points: 0 });

    const capitalChanges = Number(first?.CapitalTotalChanges ?? 0);
    if (capitalChanges >= 4) { score += 10; items.push({ label: 'Mudanças de capital social', value: `${capitalChanges}`, risk: 'MEDIO', points: 10 }); }
    else items.push({ label: 'Mudanças de capital social', value: `${capitalChanges}`, risk: 'OK', points: 0 });

    const totalChanges = Number(first?.TotalChanges ?? 0);
    items.push({ label: 'Total de alterações cadastrais', value: `${totalChanges}`, risk: totalChanges > 30 ? 'MEDIO' : 'OK', points: 0 });

    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Evolução', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeReputation(result) {
  try {
    const items = []; let score = 0;
    const rep = result?.ReputationsAndReviews || result?.reputations_and_reviews;
    const media = result?.MediaProfileAndExposure || result?.media_profile_and_exposure;
    let any = false;

    if (rep) {
      any = true;
      const repItems = flattenBDCArray(rep);
      for (const r of repItems) {
        const raScore = Number(r?.ReclameAquiScore ?? r?.ReclameAquiRating ?? r?.OverallRating);
        if (!isNaN(raScore) && raScore > 0) {
          if (raScore < 5) { score += 30; items.push({ label: 'Reclame Aqui', value: `Score ${raScore.toFixed(1)}`, risk: 'ALTO', points: 30 }); }
          else if (raScore < 7) { score += 10; items.push({ label: 'Reclame Aqui', value: `Score ${raScore.toFixed(1)}`, risk: 'MEDIO', points: 10 }); }
          else items.push({ label: 'Reclame Aqui', value: `Score ${raScore.toFixed(1)}`, risk: 'OK', points: 0 });
          break;
        }
      }
    }

    if (media) {
      any = true;
      const medItems = flattenBDCArray(media);
      for (const m of medItems) {
        const sentiment = String(m?.Sentiment || m?.OverallSentiment || '').toUpperCase();
        if (sentiment.includes('NEGATIVE') && !sentiment.includes('VERY_NEGATIVE')) {
          score += 15;
          items.push({ label: 'Sentimento em mídia', value: 'NEGATIVE', risk: 'MEDIO', points: 15 });
        } else if (sentiment.includes('POSITIVE')) {
          items.push({ label: 'Sentimento em mídia', value: sentiment, risk: 'OK', points: 0 });
        }
        const mentions = Number(m?.TotalMentions ?? m?.MentionsCount ?? 0);
        if (mentions > 0) items.push({ label: 'Menções em mídia', value: `${mentions}`, risk: 'INFO', points: 0 });
      }
    }

    if (!any) items.push({ label: 'Reputação', value: 'Dataset não consultado', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Reputação', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeFinancial(result) {
  try {
    const items = []; let score = 0;
    const fm = result?.FinancialMarket || result?.financial_market;
    const evol = result?.CompanyEvolution || result?.company_evolution;
    let any = false;

    if (fm) {
      any = true;
      const fmItems = flattenBDCArray(fm);
      for (const f of fmItems) {
        const revenue = Number(f?.TotalRevenue ?? f?.EstimatedRevenue ?? f?.Revenue);
        if (!isNaN(revenue) && revenue > 0) {
          items.push({ label: 'Receita estimada anual', value: `R$ ${revenue.toLocaleString('pt-BR')}`, risk: 'INFO', points: 0 });
        }
        const hasBankruptcy = f?.HasBankruptcy === true || f?.Bankruptcy === true;
        if (hasBankruptcy) { score += 50; items.push({ label: 'Falência/Recuperação judicial', value: 'SIM', risk: 'CRITICO', points: 50 }); }
      }
    }

    if (evol) {
      any = true;
      const evItems = flattenBDCArray(evol);
      for (const e of evItems) {
        const growth = Number(e?.RevenueGrowthPercentage ?? e?.YoYGrowth);
        if (!isNaN(growth)) {
          if (growth < -30) { score += 20; items.push({ label: 'Crescimento YoY', value: `${growth.toFixed(0)}%`, risk: 'ALTO', points: 20 }); }
          else items.push({ label: 'Crescimento YoY', value: `${growth.toFixed(0)}%`, risk: 'OK', points: 0 });
        }
      }
    }

    if (!any) items.push({ label: 'Financeiro', value: 'Dataset não consultado', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Financeiro', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeContacts(result) {
  try {
    const items = []; let score = 0;
    const FREE_PROVIDERS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'bol.com.br', 'uol.com.br', 'icloud.com', 'protonmail.com', 'live.com'];

    const emails = result?.EmailsExtended || result?.emails_extended;
    const phones = result?.PhonesExtended || result?.phones_extended;
    const addresses = result?.AddressesExtended || result?.addresses_extended;
    let any = false;

    if (emails) {
      any = true;
      const emItems = flattenBDCArray(emails);
      const emailList = [];
      for (const e of emItems) {
        const list = e?.Emails || e?.EmailsList || (Array.isArray(e) ? e : []);
        if (Array.isArray(list)) for (const item of list) emailList.push(item?.EmailAddress || item?.Email || item);
      }
      const onlyFree = emailList.length > 0 && emailList.every(em => {
        const dom = String(em || '').toLowerCase().split('@')[1];
        return FREE_PROVIDERS.includes(dom);
      });
      if (emailList.length === 0) { score += 10; items.push({ label: 'E-mails registrados', value: 'Nenhum encontrado', risk: 'MEDIO', points: 10 }); }
      else if (onlyFree) { score += 15; items.push({ label: 'E-mails', value: `${emailList.length} (apenas provedores gratuitos)`, risk: 'MEDIO', points: 15 }); }
      else items.push({ label: 'E-mails', value: `${emailList.length} registrados`, risk: 'OK', points: 0 });
    }

    if (phones) {
      any = true;
      const phItems = flattenBDCArray(phones);
      let phoneCount = 0;
      for (const p of phItems) {
        const list = p?.Phones || p?.PhonesList || (Array.isArray(p) ? p : []);
        if (Array.isArray(list)) phoneCount += list.length;
      }
      if (phoneCount === 0) { score += 10; items.push({ label: 'Telefones registrados', value: 'Nenhum', risk: 'MEDIO', points: 10 }); }
      else items.push({ label: 'Telefones registrados', value: `${phoneCount}`, risk: 'OK', points: 0 });
    }

    if (addresses) {
      any = true;
      const adItems = flattenBDCArray(addresses);
      let addrCount = 0;
      for (const a of adItems) {
        const list = a?.Addresses || a?.AddressesList || (Array.isArray(a) ? a : []);
        if (Array.isArray(list)) addrCount += list.length;
      }
      items.push({ label: 'Endereços registrados', value: `${addrCount}`, risk: addrCount === 0 ? 'MEDIO' : 'OK', points: addrCount === 0 ? 5 : 0 });
      if (addrCount === 0) score += 5;
    }

    if (!any) items.push({ label: 'Contatos', value: 'Datasets não consultados', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Contatos', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeEmployeesKyc(result) {
  try {
    const items = []; let score = 0;
    const rel = result?.RelatedPeopleKyc || result?.related_people_kyc;
    const infl = result?.OwnersInfluence || result?.owners_influence;
    let any = false;

    if (rel) {
      any = true;
      const relItems = flattenBDCArray(rel);
      let pepCount = 0, sanctionedCount = 0;
      for (const item of relItems) {
        if (item?.IsPEP || item?.IsPep) pepCount++;
        const sanctions = item?.Sanctions || [];
        if (Array.isArray(sanctions) && sanctions.length > 0) sanctionedCount++;
      }
      if (pepCount > 0) { score += 25; items.push({ label: 'PEPs em funcionários-chave', value: `${pepCount}`, risk: 'ALTO', points: 25 }); }
      if (sanctionedCount > 0) { score += 40; items.push({ label: 'Funcionários sancionados', value: `${sanctionedCount}`, risk: 'CRITICO', points: 40 }); }
      if (pepCount === 0 && sanctionedCount === 0) items.push({ label: 'KYC de funcionários-chave', value: 'Limpo', risk: 'OK', points: 0 });
    }

    if (infl) {
      any = true;
      const infItems = flattenBDCArray(infl);
      for (const i of infItems) {
        const infLevel = Number(i?.InfluenceLevel ?? i?.PoliticalInfluenceScore);
        if (!isNaN(infLevel) && infLevel > 0.7) { score += 15; items.push({ label: 'Influência política de sócios', value: `${(infLevel * 100).toFixed(0)}%`, risk: 'MEDIO', points: 15 }); }
      }
    }

    if (!any) items.push({ label: 'KYC funcionários', value: 'Datasets não consultados', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'KYC funcionários', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeSectorial(result) {
  try {
    const items = []; let score = 0;
    const mcc = result?.Mcc || result?.mcc;
    const mk = result?.MarketplaceData || result?.marketplace_data;
    const bd = extractBasicData(result);
    let any = false;

    if (mcc) {
      any = true;
      const mccItems = flattenBDCArray(mcc);
      for (const m of mccItems) {
        const code = m?.MccCode || m?.Code;
        if (code) items.push({ label: 'MCC (categoria)', value: String(code), risk: 'INFO', points: 0 });
      }
    }

    if (bd) {
      any = true;
      const activities = bd?.Activities || [];
      const mainCnae = activities.find(a => a?.IsMain)?.Code || bd?.MainEconomicActivity;
      if (mainCnae) items.push({ label: 'CNAE principal (BDC)', value: String(mainCnae), risk: 'INFO', points: 0 });
      if (activities.length > 8) { score += 10; items.push({ label: 'CNAEs secundários', value: `${activities.length - 1}`, risk: 'MEDIO', points: 10 }); }
      else if (activities.length > 0) items.push({ label: 'CNAEs secundários', value: `${activities.length - 1}`, risk: 'OK', points: 0 });
    }

    if (mk) {
      any = true;
      const mkItems = flattenBDCArray(mk);
      for (const m of mkItems) {
        const hasMkp = m?.IsMarketplaceSeller || m?.SellerCount > 0;
        if (hasMkp) items.push({ label: 'Presença em marketplace', value: 'Detectada', risk: 'INFO', points: 0 });
      }
    }

    if (!any) items.push({ label: 'Setorial', value: 'Datasets não consultados', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Setorial', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeAssets(result) {
  try {
    const items = []; let score = 0;
    const ip = result?.IndustrialProperty || result?.industrial_property;
    const oip = result?.OwnersIndustrialProperty || result?.owners_industrial_property;
    let any = false;

    if (ip) {
      any = true;
      const ipItems = flattenBDCArray(ip);
      let brands = 0, patents = 0;
      for (const item of ipItems) {
        brands += Number(item?.TotalBrands ?? item?.BrandCount ?? 0);
        patents += Number(item?.TotalPatents ?? item?.PatentCount ?? 0);
      }
      items.push({ label: 'Marcas registradas', value: `${brands}`, risk: 'INFO', points: 0 });
      items.push({ label: 'Patentes', value: `${patents}`, risk: 'INFO', points: 0 });
    }

    if (oip) {
      any = true;
      const oipItems = flattenBDCArray(oip);
      let ownerBrands = 0;
      for (const item of oipItems) ownerBrands += Number(item?.TotalBrands ?? 0);
      if (ownerBrands > 0) items.push({ label: 'Marcas dos sócios', value: `${ownerBrands}`, risk: 'INFO', points: 0 });
    }

    if (!any) items.push({ label: 'Propriedade industrial', value: 'Datasets não consultados', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Propriedade industrial', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeCreditRisk(result) {
  try {
    const items = []; let score = 0;
    const cr = result?.CreditRisk || result?.credit_risk;
    const cs = result?.CreditScore || result?.credit_score;
    const scrPos = result?.ScrPositiveScore || result?.scr_positive_score;
    let any = false;

    if (cs) {
      any = true;
      const csItems = flattenBDCArray(cs);
      for (const c of csItems) {
        const s = Number(c?.Score ?? c?.CreditScoreValue ?? c?.Value);
        if (!isNaN(s) && s > 0) {
          if (s < 200) { score += 50; items.push({ label: 'Credit Score', value: `${s}`, risk: 'CRITICO', points: 50 }); }
          else if (s < 400) { score += 30; items.push({ label: 'Credit Score', value: `${s}`, risk: 'ALTO', points: 30 }); }
          else if (s < 600) { score += 15; items.push({ label: 'Credit Score', value: `${s}`, risk: 'MEDIO', points: 15 }); }
          else items.push({ label: 'Credit Score', value: `${s}`, risk: 'OK', points: 0 });
          break;
        }
      }
    }

    if (cr) {
      any = true;
      const crItems = flattenBDCArray(cr);
      for (const c of crItems) {
        const level = String(c?.RiskLevel || c?.Level || '').toUpperCase();
        if (level.includes('HIGH') || level.includes('ALTO')) { score += 25; items.push({ label: 'Nível de risco de crédito', value: level, risk: 'ALTO', points: 25 }); }
        else if (level.includes('MEDIUM') || level.includes('MEDIO')) { score += 10; items.push({ label: 'Nível de risco de crédito', value: level, risk: 'MEDIO', points: 10 }); }
        else if (level) items.push({ label: 'Nível de risco de crédito', value: level, risk: 'OK', points: 0 });
      }
    }

    if (scrPos) {
      any = true;
      const scrItems = flattenBDCArray(scrPos);
      for (const s of scrItems) {
        const val = Number(s?.Score ?? s?.ScoreValue);
        if (!isNaN(val) && val > 0) items.push({ label: 'SCR BCB (positivo)', value: `${val}`, risk: val < 300 ? 'ALTO' : 'OK', points: 0 });
      }
    }

    if (!any) items.push({ label: 'Risco de crédito', value: 'Datasets não consultados', risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Risco de crédito', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

// ══════════════════════════════════════════════════════════════════
// NOVOS ANALYZERS — Sprint Expansão PLD (2026-05-15)
// ══════════════════════════════════════════════════════════════════

function analyzeDefaults(result) {
  // default_business_data — inadimplência consolidada (protestos, restrições BACEN, devolução de cheques)
  try {
    const items = []; let score = 0;
    const def = result?.DefaultBusinessData || result?.default_business_data;
    if (!def) { items.push({ label: 'Inadimplência', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    const dItems = flattenBDCArray(def);
    let totalProtests = 0, totalProtestValue = 0, hasBcbRestriction = false, hasBouncedChecks = false;
    for (const item of dItems) {
      totalProtests += Number(item?.TotalProtests ?? item?.ProtestsCount ?? 0);
      totalProtestValue += Number(item?.TotalProtestsValue ?? item?.ProtestsTotalValue ?? 0);
      if (item?.HasBcbRestrictions || item?.BcbRestrictionsCount > 0) hasBcbRestriction = true;
      if (item?.HasBouncedChecks || item?.BouncedChecksCount > 0) hasBouncedChecks = true;
    }
    if (totalProtests > 0) {
      const pts = totalProtestValue > 200000 ? 40 : totalProtestValue > 50000 ? 25 : 15;
      score += pts;
      items.push({ label: 'Protestos em cartório', value: `${totalProtests} protesto(s) — R$ ${totalProtestValue.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, risk: totalProtestValue > 200000 ? 'CRITICO' : totalProtestValue > 50000 ? 'ALTO' : 'MEDIO', points: pts });
    } else {
      items.push({ label: 'Protestos em cartório', value: 'Nenhum', risk: 'OK', points: 0 });
    }
    if (hasBcbRestriction) { score += 30; items.push({ label: 'Restrições BACEN/SCR', value: 'SIM', risk: 'ALTO', points: 30 }); }
    if (hasBouncedChecks) { score += 20; items.push({ label: 'Devolução de cheques', value: 'SIM', risk: 'ALTO', points: 20 }); }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Inadimplência', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeFinancialDeep(result, responses) {
  // financial_data — balanço + DRE (receita real, EBITDA, ativos). Cross-check com TPV declarado.
  try {
    const items = []; let score = 0;
    const fd = result?.FinancialData || result?.financial_data;
    if (!fd) { items.push({ label: 'Dados financeiros (balanço/DRE)', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items, declaredTpvMismatch: false }; }
    const fdItems = flattenBDCArray(fd);
    let revenue = 0, ebitda = null, equity = null;
    for (const item of fdItems) {
      revenue = Math.max(revenue, Number(item?.TotalRevenue ?? item?.AnnualRevenue ?? item?.Revenue ?? 0));
      if (item?.Ebitda != null) ebitda = Number(item.Ebitda);
      if (item?.Equity != null) equity = Number(item.Equity);
    }
    if (revenue > 0) items.push({ label: 'Receita real (BDC)', value: `R$ ${revenue.toLocaleString('pt-BR')}`, risk: 'INFO', points: 0 });
    if (ebitda != null) {
      const ebRisk = ebitda < 0 ? 'ALTO' : 'OK';
      const pts = ebitda < 0 ? 15 : 0;
      score += pts;
      items.push({ label: 'EBITDA', value: `R$ ${ebitda.toLocaleString('pt-BR')}`, risk: ebRisk, points: pts });
    }
    if (equity != null) {
      const eqRisk = equity < 0 ? 'CRITICO' : 'OK';
      const pts = equity < 0 ? 25 : 0;
      score += pts;
      items.push({ label: 'Patrimônio líquido', value: `R$ ${equity.toLocaleString('pt-BR')}`, risk: eqRisk, points: pts });
    }

    // Cross-check: TPV declarado vs receita real
    let declaredTpvMismatch = false;
    if (revenue > 0 && Array.isArray(responses)) {
      let declaredTpvMonthly = 0;
      for (const r of responses) {
        const qt = String(r?.questionText || '').toLowerCase();
        if (qt.includes('tpv') || qt.includes('faturamento mensal') || qt.includes('volume mensal')) {
          const v = Number(r?.valueNumber || r?.valueText || 0);
          if (v > 0) { declaredTpvMonthly = v; break; }
        }
      }
      if (declaredTpvMonthly > 0) {
        const declaredAnnual = declaredTpvMonthly * 12;
        const ratio = declaredAnnual / revenue;
        if (ratio > 3) {
          // Declarado é >3x maior que o real — inconsistência grave
          score += 30;
          declaredTpvMismatch = true;
          items.push({ label: 'Cross-check TPV declarado × receita real', value: `Declarado R$ ${declaredAnnual.toLocaleString('pt-BR')} é ${ratio.toFixed(1)}x maior que receita BDC (R$ ${revenue.toLocaleString('pt-BR')})`, risk: 'ALTO', points: 30 });
        } else {
          items.push({ label: 'Cross-check TPV declarado × receita real', value: `Coerente (${ratio.toFixed(2)}x)`, risk: 'OK', points: 0 });
        }
      }
    }
    return { score, items, declaredTpvMismatch };
  } catch (e) { return { score: 0, items: [{ label: 'Dados financeiros', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }], declaredTpvMismatch: false }; }
}

function analyzeCorporateChain(result) {
  // corporate_chain — cadeia até UBO. Bloqueios já são tratados em analyzeBlocks (B12).
  // Aqui calculamos profundidade, holdings offshore, complexidade.
  try {
    const items = []; let score = 0;
    const chain = result?.CorporateChain || result?.corporate_chain;
    if (!chain) { items.push({ label: 'Cadeia societária', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    const chainItems = flattenBDCArray(chain);
    let maxDepth = 0, hasOffshore = false, totalUbos = 0;
    for (const item of chainItems) {
      const depth = Number(item?.MaxChainDepth ?? item?.Depth ?? 0);
      if (depth > maxDepth) maxDepth = depth;
      if (item?.HasOffshoreEntities || item?.OffshoreEntitiesCount > 0) hasOffshore = true;
      const ubos = item?.UltimateBeneficialOwners || item?.UBOs || [];
      if (Array.isArray(ubos)) totalUbos += ubos.length;
    }
    if (maxDepth >= 4) { score += 20; items.push({ label: 'Profundidade da cadeia societária', value: `${maxDepth} níveis`, risk: 'ALTO', points: 20 }); }
    else if (maxDepth >= 3) { score += 10; items.push({ label: 'Profundidade da cadeia societária', value: `${maxDepth} níveis`, risk: 'MEDIO', points: 10 }); }
    else if (maxDepth > 0) items.push({ label: 'Profundidade da cadeia societária', value: `${maxDepth} níveis`, risk: 'OK', points: 0 });

    if (hasOffshore) { score += 25; items.push({ label: 'Entidades offshore na cadeia', value: 'SIM', risk: 'ALTO', points: 25 }); }
    if (totalUbos > 0) items.push({ label: 'Beneficiários finais (UBO) identificados', value: `${totalUbos}`, risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Cadeia societária', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeDigitalAttributes(result) {
  // digital_attributes — score digital BDC (complementa activity_indicators)
  try {
    const items = []; let score = 0;
    const da = result?.DigitalAttributes || result?.digital_attributes;
    if (!da) { items.push({ label: 'Atributos digitais', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    const dItems = flattenBDCArray(da);
    for (const item of dItems) {
      const digScore = Number(item?.DigitalScore ?? item?.OnlineActivityScore);
      if (!isNaN(digScore) && digScore > 0) {
        if (digScore < 20) { score += 15; items.push({ label: 'Score digital BDC', value: `${digScore}`, risk: 'MEDIO', points: 15 }); }
        else items.push({ label: 'Score digital BDC', value: `${digScore}`, risk: 'OK', points: 0 });
      }
      const socialPresence = item?.HasSocialMediaPresence;
      if (socialPresence === false) { score += 5; items.push({ label: 'Presença em redes sociais', value: 'Não detectada', risk: 'MEDIO', points: 5 }); }
      else if (socialPresence === true) items.push({ label: 'Presença em redes sociais', value: 'SIM', risk: 'OK', points: 0 });
    }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Atributos digitais', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

// PF novo: bens penhorados
function analyzeJudicialAssets(result) {
  try {
    const items = []; let score = 0;
    const ja = result?.JudicialAssets || result?.judicial_assets;
    if (!ja) { items.push({ label: 'Bens penhorados/judiciais', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    const jaItems = flattenBDCArray(ja);
    let total = 0, indisponiveis = 0;
    for (const item of jaItems) {
      total += Number(item?.TotalAssets ?? item?.AssetsCount ?? 0);
      indisponiveis += Number(item?.UnavailableAssetsCount ?? item?.IndisponibilidadeCount ?? 0);
    }
    if (indisponiveis > 0) { score += 30; items.push({ label: 'Bens indisponíveis (judicial)', value: `${indisponiveis}`, risk: 'CRITICO', points: 30 }); }
    if (total > 0 && indisponiveis === 0) items.push({ label: 'Bens em ações judiciais', value: `${total}`, risk: 'MEDIO', points: 10 });
    if (total === 0) items.push({ label: 'Bens penhorados/judiciais', value: 'Nenhum', risk: 'OK', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Bens penhorados', value: `Erro parse: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

// ══════════════════════════════════════════════════════════════════
// NOVOS ANALYZERS — Sprint Expansão BDC v3 (2026-05-16)
// Cobrem os GAPs que estavam consumidos sem análise (processes, political,
// qsa_changes) + GAPs novos (address intel, financial estimates, company
// group, licenses, flags, related people, bets).
// ══════════════════════════════════════════════════════════════════

const CRIMINAL_KW = /criminal|penal|fraude|lavagem|estelionato|sonega|tráfico|trafico|narc/i;

function analyzeProcesses(result) {
  // GAP INTERNO #1 — processes + lawsuits_distribution_data + owners_lawsuits*
  try {
    const items = []; let score = 0;
    const proc = result?.Processes || result?.processes;
    const dist = result?.LawsuitsDistributionData || result?.lawsuits_distribution_data;
    const ownProc = result?.OwnersLawsuits || result?.owners_lawsuits;
    const ownDist = result?.OwnersLawsuitsDistribution || result?.owners_lawsuits_distribution;
    if (!proc && !ownProc) { items.push({ label: 'Processos judiciais', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }

    const analyzeEntity = (datasets) => {
      let total = 0, value = 0, criminal = 0, recent = 0;
      for (const item of datasets) {
        total += Number(item?.TotalLawsuits ?? item?.NumberOfLawsuits ?? item?.LawsuitsCount ?? 0);
        value += Number(item?.TotalLawsuitsValue ?? item?.LawsuitsTotalValue ?? 0);
        recent += Number(item?.LawsuitsLast12Months ?? item?.RecentLawsuits ?? 0);
        const d = item?.LawsuitsDistribution || item?.DistributionByCourtType || item?.DistributionByLawsuitType || [];
        if (Array.isArray(d)) for (const x of d) {
          const t = String(x?.Type || x?.Court || x?.LawsuitType || x?.Description || '');
          if (CRIMINAL_KW.test(t)) criminal += Number(x?.Count || x?.TotalLawsuits || 1);
        }
      }
      return { total, value, criminal, recent };
    };

    if (proc || dist) {
      const r = analyzeEntity([...flattenBDCArray(proc), ...flattenBDCArray(dist)]);
      if (r.total === 0) items.push({ label: 'Processos da empresa', value: 'Nenhum', risk: 'OK', points: 0 });
      else {
        let pts = 0, risk = 'OK';
        if (r.total > 100) { pts = 25; risk = 'ALTO'; }
        else if (r.total > 50) { pts = 15; risk = 'MEDIO'; }
        else if (r.total > 10) { pts = 8; risk = 'MEDIO'; }
        score += pts;
        items.push({ label: 'Processos da empresa', value: `${r.total} processo(s)${r.value > 0 ? ` — R$ ${r.value.toLocaleString('pt-BR',{minimumFractionDigits:2})}` : ''}${r.recent > 0 ? ` (${r.recent} nos últimos 12m)` : ''}`, risk, points: pts });
        if (r.criminal > 0) { score += 60; items.push({ label: 'Processos CRIMINAIS da empresa', value: `${r.criminal} processo(s)`, risk: 'CRITICO', points: 60 }); }
        if (r.value > 1_000_000) { score += 30; items.push({ label: 'Valor em litígio', value: `R$ ${r.value.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, risk: 'ALTO', points: 30 }); }
      }
    }
    if (ownProc || ownDist) {
      const r = analyzeEntity([...flattenBDCArray(ownProc), ...flattenBDCArray(ownDist)]);
      if (r.total > 0) {
        const pts = r.total > 50 ? 15 : r.total > 20 ? 8 : 0;
        const risk = pts >= 15 ? 'ALTO' : pts >= 8 ? 'MEDIO' : 'INFO';
        score += pts;
        items.push({ label: 'Processos dos sócios (agregado)', value: `${r.total} processo(s)${r.value > 0 ? ` — R$ ${r.value.toLocaleString('pt-BR',{minimumFractionDigits:2})}` : ''}`, risk, points: pts });
        if (r.criminal > 0) { score += 80; items.push({ label: 'Processos CRIMINAIS de sócios', value: `${r.criminal} processo(s)`, risk: 'CRITICO', points: 80 }); }
      } else items.push({ label: 'Processos dos sócios', value: 'Nenhum', risk: 'OK', points: 0 });
    }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Processos', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzePoliticalExposure(result) {
  // GAP INTERNO #2 — political_involvement + owners_electoral_donors + owners_influence
  try {
    const items = []; let score = 0;
    const pi = result?.PoliticalInvolvement || result?.political_involvement;
    const ed = result?.OwnersElectoralDonors || result?.owners_electoral_donors;
    const oi = result?.OwnersInfluence || result?.owners_influence;
    if (!pi && !ed && !oi) { items.push({ label: 'Exposição política', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }

    if (pi) {
      let hasInv = false, contracts = 0;
      for (const item of flattenBDCArray(pi)) {
        if (item?.HasPoliticalInvolvement === true || item?.PoliticalInvolvement === true) hasInv = true;
        contracts += Number(item?.PublicContractsCount ?? item?.GovernmentContractsCount ?? 0);
      }
      if (hasInv) { score += 25; items.push({ label: 'Vínculo político identificado', value: 'SIM', risk: 'ALTO', points: 25 }); }
      if (contracts > 0) { const pts = contracts > 10 ? 15 : 5; score += pts; items.push({ label: 'Contratos com governo', value: `${contracts} contrato(s)`, risk: contracts > 10 ? 'ALTO' : 'MEDIO', points: pts }); }
    }
    if (ed) {
      let total = 0; const donors = [];
      for (const item of flattenBDCArray(ed)) {
        const val = Number(item?.TotalDonations ?? item?.DonationsTotalValue ?? item?.TotalDonatedValue ?? 0);
        total += val;
        if (val > 0) donors.push({ name: item?.Name || item?.RelatedPersonName || 'N/I', value: val });
      }
      if (total > 0) {
        let pts = 0, risk = 'OK';
        if (total > 500_000) { pts = 50; risk = 'CRITICO'; }
        else if (total > 100_000) { pts = 30; risk = 'ALTO'; }
        else if (total > 10_000) { pts = 10; risk = 'MEDIO'; }
        score += pts;
        const top = donors.sort((a, b) => b.value - a.value)[0];
        items.push({ label: 'Doações eleitorais (sócios)', value: `R$ ${total.toLocaleString('pt-BR',{minimumFractionDigits:2})} total${top ? ` — maior: ${top.name} (R$ ${top.value.toLocaleString('pt-BR',{minimumFractionDigits:2})})` : ''}`, risk, points: pts });
      } else items.push({ label: 'Doações eleitorais', value: 'Nenhuma', risk: 'OK', points: 0 });
    }
    if (oi) {
      let maxInf = 0; const high = [];
      for (const item of flattenBDCArray(oi)) {
        const lv = Number(item?.InfluenceLevel ?? item?.PoliticalInfluenceScore ?? item?.InfluenceScore ?? 0);
        if (lv > maxInf) maxInf = lv;
        if (lv > 0.7) high.push(item?.Name || item?.RelatedPersonName || 'N/I');
      }
      if (maxInf > 0.7) {
        const pts = maxInf > 0.9 ? 35 : 20;
        score += pts;
        items.push({ label: 'Sócio(s) com alta influência política', value: `${high.join(', ')} (score ${(maxInf * 100).toFixed(0)}%)`, risk: 'ALTO', points: pts });
      }
    }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Exposição política', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeQsaChanges(result) {
  // GAP INTERNO #3 — configurable_recency_qsa
  try {
    const items = []; let score = 0;
    const qsa = result?.ConfigurableRecencyQsa || result?.configurable_recency_qsa;
    if (!qsa) { items.push({ label: 'Recência do QSA', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }

    let total = 0, newOwners = 0;
    const periods = { last30: 0, last90: 0, last180: 0 };
    let mostRecent = null;
    for (const item of flattenBDCArray(qsa)) {
      const changes = item?.RecentChanges || item?.QsaChanges || item?.Changes || [];
      if (Array.isArray(changes)) for (const c of changes) {
        total++;
        const ds = c?.ChangeDate || c?.Date || c?.OperationDate;
        if (ds) {
          const d = new Date(ds);
          if (!isNaN(d)) {
            if (!mostRecent || d > mostRecent) mostRecent = d;
            const days = (Date.now() - d.getTime()) / (24 * 3600 * 1000);
            if (days <= 30) periods.last30++;
            if (days <= 90) periods.last90++;
            if (days <= 180) periods.last180++;
          }
        }
        if (c?.Operation === 'ADD' || c?.ChangeType === 'ENTRY' || c?.Type === 'NewOwner') newOwners++;
      }
    }

    if (total === 0) { items.push({ label: 'Mudanças no QSA', value: 'Nenhuma', risk: 'OK', points: 0 }); return { score, items }; }

    if (periods.last30 > 0) {
      const pts = periods.last30 >= 2 ? 30 : 20;
      score += pts;
      items.push({ label: 'Mudanças QSA — últimos 30 dias', value: `${periods.last30} alteração(ões)`, risk: 'CRITICO', points: pts });
    } else if (periods.last90 > 0) {
      score += 15;
      items.push({ label: 'Mudanças QSA — últimos 90 dias', value: `${periods.last90} alteração(ões)`, risk: 'ALTO', points: 15 });
    } else if (periods.last180 > 0) {
      score += 8;
      items.push({ label: 'Mudanças QSA — últimos 180 dias', value: `${periods.last180} alteração(ões)`, risk: 'MEDIO', points: 8 });
    } else if (mostRecent) {
      const days = Math.floor((Date.now() - mostRecent) / (24 * 3600 * 1000));
      items.push({ label: 'Última mudança QSA', value: `Há ${days} dia(s)`, risk: 'OK', points: 0 });
    }
    if (newOwners > 0 && periods.last90 > 0) {
      const pts = newOwners >= 2 ? 15 : 8;
      score += pts;
      items.push({ label: 'Novos sócios em 90d', value: `${newOwners} sócio(s) novo(s)`, risk: 'ALTO', points: pts });
    }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'QSA', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeAddressIntelligence(result) {
  // GAPs 2 + 9 — flag contabilidade + estatísticas por endereço
  try {
    const items = []; let score = 0;
    const addrExt = result?.AddressesExtended || result?.addresses_extended;
    const stats = result?.CompaniesStatistics || result?.companies_statistics;
    if (!addrExt && !stats) { items.push({ label: 'Inteligência de endereço', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }

    if (addrExt) {
      let accounting = false, virtual = false, residential = false;
      const samples = [];
      for (const a of flattenBDCArray(addrExt)) {
        const list = a?.Addresses || a?.AddressesList || (Array.isArray(a) ? a : [a]);
        const all = Array.isArray(list) ? list : [list];
        for (const item of all) {
          if (item?.IsAccountingOfficeAddress === true || item?.IsAccountingAddress === true || item?.AddressType === 'ACCOUNTING_OFFICE') {
            accounting = true;
            if (samples.length < 1) samples.push(item?.Address || item?.FullAddress || 'sem detalhe');
          }
          if (item?.IsVirtualOffice === true || item?.AddressType === 'VIRTUAL_OFFICE') virtual = true;
          if (item?.IsResidentialAddress === true || item?.AddressType === 'RESIDENTIAL') residential = true;
        }
      }
      if (accounting) { score += 40; items.push({ label: 'Endereço de contabilidade detectado', value: `Empresa registrada em escritório contábil${samples[0] ? ` (${samples[0]})` : ''}. Indicador forte de shell company.`, risk: 'CRITICO', points: 40 }); }
      if (virtual) { score += 25; items.push({ label: 'Endereço de escritório virtual', value: 'CNPJ em endereço de escritório virtual', risk: 'ALTO', points: 25 }); }
      if (residential) { score += 10; items.push({ label: 'Endereço residencial', value: 'CNPJ em endereço residencial', risk: 'MEDIO', points: 10 }); }
    }
    if (stats) {
      let totalC = 0, activeC = 0, totalEmp = 0;
      for (const s of flattenBDCArray(stats)) {
        totalC = Math.max(totalC, Number(s?.TotalCompanies ?? s?.CompaniesCount ?? 0));
        activeC = Math.max(activeC, Number(s?.ActiveCompanies ?? s?.ActiveCompaniesCount ?? 0));
        totalEmp += Number(s?.TotalEmployees ?? s?.EmployeesCount ?? 0);
      }
      if (totalC > 0) {
        const isFake = totalC > 20 && totalEmp === 0;
        const isHigh = totalC > 50;
        if (isFake) { score += 60; items.push({ label: 'Endereço-fachada provável', value: `${totalC} empresas no mesmo endereço, ${totalEmp} funcionário(s) agregado(s).`, risk: 'CRITICO', points: 60 }); }
        else if (isHigh) { score += 20; items.push({ label: 'Endereço de alta densidade empresarial', value: `${totalC} (${activeC} ativa(s))`, risk: 'ALTO', points: 20 }); }
        else if (totalC > 5) items.push({ label: 'Empresas no mesmo endereço', value: `${totalC} (${activeC} ativa(s))`, risk: 'MEDIO', points: 0 });
        else items.push({ label: 'Empresas no mesmo endereço', value: `${totalC}`, risk: 'OK', points: 0 });
      }
    }
    if (items.length === 0) items.push({ label: 'Inteligência de endereço', value: 'Sem flags', risk: 'OK', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Endereço', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeFinancialEstimates(result) {
  // GAP 7 — 4 estimativas + restituição IR
  try {
    const items = []; let score = 0;
    const fd = result?.FinancialData || result?.financial_data;
    if (!fd) { items.push({ label: 'Estimativas financeiras', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }

    const est = {};
    let irRest = null, irHist = [];
    for (const item of flattenBDCArray(fd)) {
      const e = item?.IncomeEstimates || item?.RevenueEstimates || item?.Estimates || {};
      if (typeof e === 'object') {
        if (e.IBGE != null) est.IBGE = Number(e.IBGE);
        if (e.MTE != null) est.MTE = Number(e.MTE);
        if (e.BIGDATA != null) est.BIGDATA = Number(e.BIGDATA);
        if (e.BIGDATA_V2 != null) est.BIGDATA_V2 = Number(e.BIGDATA_V2);
        if (e.COMPANY_OWNERSHIP != null) est.COMPANY_OWNERSHIP = Number(e.COMPANY_OWNERSHIP);
      }
      if (item?.IncomeIBGE != null) est.IBGE = Number(item.IncomeIBGE);
      if (item?.IncomeMTE != null) est.MTE = Number(item.IncomeMTE);
      if (item?.IncomeBigData != null) est.BIGDATA = Number(item.IncomeBigData);
      if (item?.IncomeBigDataV2 != null) est.BIGDATA_V2 = Number(item.IncomeBigDataV2);
      if (item?.IncomeFromCompanyOwnership != null) est.COMPANY_OWNERSHIP = Number(item.IncomeFromCompanyOwnership);
      if (item?.IrRestitution != null || item?.IncomeTaxRestitution != null) irRest = Number(item.IrRestitution ?? item.IncomeTaxRestitution);
      const h = item?.IrRestitutionHistory || item?.RestitutionHistory || [];
      if (Array.isArray(h) && h.length > 0) irHist = h;
    }
    const vals = Object.entries(est).filter(([_, v]) => v > 0);
    if (vals.length === 0) { items.push({ label: 'Estimativas financeiras', value: 'Sem dados', risk: 'INFO', points: 0 }); return { score, items }; }

    for (const [src, val] of vals) items.push({ label: `Estimativa ${src}`, value: `R$ ${val.toLocaleString('pt-BR',{minimumFractionDigits:2})}/mês`, risk: 'INFO', points: 0 });
    const arr = vals.map(([_, v]) => v);
    const max = Math.max(...arr), min = Math.min(...arr);
    if (min > 0 && max / min > 3) { score += 10; items.push({ label: 'Divergência entre estimativas', value: `Máx/Mín = ${(max / min).toFixed(1)}x`, risk: 'MEDIO', points: 10 }); }
    if (est.COMPANY_OWNERSHIP > 0) {
      const formalAvg = ((est.IBGE || 0) + (est.MTE || 0)) / 2;
      if (formalAvg > 0 && est.COMPANY_OWNERSHIP > formalAvg * 5) {
        score += 25;
        items.push({ label: 'Renda societária >> renda formal', value: `COMPANY_OWNERSHIP é ${(est.COMPANY_OWNERSHIP / formalAvg).toFixed(1)}x maior — UBO oculto provável`, risk: 'ALTO', points: 25 });
      }
    }
    if (irRest > 0) items.push({ label: 'Restituição IR (último ano)', value: `R$ ${irRest.toLocaleString('pt-BR',{minimumFractionDigits:2})}`, risk: 'OK', points: 0 });
    if (irHist.length >= 3) items.push({ label: 'Histórico restituições IR', value: `${irHist.length} anos`, risk: 'OK', points: 0 });
    else if (irHist.length === 0 && irRest == null && est.IBGE > 5000) {
      score += 10;
      items.push({ label: 'IR ausente com renda relevante', value: `Sem restituição apesar de renda estimada R$ ${est.IBGE.toLocaleString('pt-BR')}/mês`, risk: 'MEDIO', points: 10 });
    }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Financeiro', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeCompanyGroupOwners(result) {
  // GAP 8 — company_group_owners (rede de empresas com sócios em comum)
  try {
    const items = []; let score = 0;
    const cgo = result?.CompanyGroupOwners || result?.company_group_owners;
    if (!cgo) { items.push({ label: 'Grupo (sócios comuns)', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    let total = 0, active = 0, inactive = 0, shared = 0;
    const tops = [];
    for (const item of flattenBDCArray(cgo)) {
      total += Number(item?.TotalRelatedCompanies ?? item?.CompaniesCount ?? item?.RelatedCompaniesCount ?? 0);
      active += Number(item?.ActiveRelatedCompanies ?? item?.ActiveCompaniesCount ?? 0);
      inactive += Number(item?.InactiveRelatedCompanies ?? item?.InactiveCompaniesCount ?? 0);
      shared = Math.max(shared, Number(item?.SharedOwnersCount ?? item?.CommonOwnersCount ?? 0));
      const rel = item?.RelatedCompanies || item?.Companies || [];
      if (Array.isArray(rel)) for (const c of rel.slice(0, 5)) tops.push({ name: c?.Name || c?.CompanyName || 'N/I', status: c?.Status || c?.TaxIdStatus || '' });
    }
    if (total === 0) { items.push({ label: 'Empresas com sócios em comum', value: 'Nenhuma', risk: 'OK', points: 0 }); return { score, items }; }
    let pts = 0, risk = 'OK';
    if (total > 30) { pts = 40; risk = 'CRITICO'; }
    else if (total > 15) { pts = 25; risk = 'ALTO'; }
    else if (total > 5) { pts = 10; risk = 'MEDIO'; }
    score += pts;
    items.push({ label: 'Empresas com sócios em comum', value: `${total} (${active} ativa(s), ${inactive} inativa(s)${shared > 0 ? `, ${shared} sócio(s) comuns` : ''})`, risk, points: pts });
    if (inactive > 0 && total > 5 && inactive / total > 0.5) {
      score += 25;
      items.push({ label: 'Taxa de inativas no grupo', value: `${((inactive / total) * 100).toFixed(0)}% inativas/baixadas`, risk: 'ALTO', points: 25 });
    }
    if (tops.length > 0) items.push({ label: 'Exemplos relacionados', value: tops.slice(0, 3).map(c => `${c.name}${c.status ? ` (${c.status})` : ''}`).join('; '), risk: 'INFO', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Grupo', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeLicenses(result) {
  // GAP 6 — licenses_and_authorizations
  try {
    const items = []; let score = 0;
    const lic = result?.LicensesAndAuthorizations || result?.licenses_and_authorizations;
    if (!lic) { items.push({ label: 'Licenças', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    let total = 0, active = 0, expired = 0;
    const types = new Set(); const expSamples = [];
    for (const item of flattenBDCArray(lic)) {
      const list = item?.Licenses || item?.LicensesList || (Array.isArray(item) ? item : [item]);
      const all = Array.isArray(list) ? list : [list];
      for (const l of all) {
        if (!l || typeof l !== 'object') continue;
        total++;
        const status = String(l?.Status || l?.LicenseStatus || '').toUpperCase();
        const type = l?.LicenseType || l?.Type || l?.Category || 'N/I';
        if (type !== 'N/I') types.add(String(type));
        const exp = l?.ExpiryDate || l?.ValidUntil || l?.ExpirationDate;
        if (exp) {
          const ed = new Date(exp);
          if (!isNaN(ed)) {
            if (ed < new Date()) { expired++; if (expSamples.length < 3) expSamples.push(`${type} (vencida ${ed.toLocaleDateString('pt-BR')})`); }
            else active++;
          }
        } else if (status.includes('ATIV') || status.includes('VIGENTE') || status === 'OK') active++;
        else if (status.includes('VENC') || status.includes('EXPIR')) expired++;
      }
    }
    if (total === 0) { items.push({ label: 'Licenças', value: 'Nenhuma registrada', risk: 'INFO', points: 0 }); return { score, items }; }
    items.push({ label: 'Total de licenças', value: `${total} (${active} ativa(s)${expired > 0 ? `, ${expired} vencida(s)` : ''})`, risk: expired > 0 ? 'MEDIO' : 'OK', points: 0 });
    if (types.size > 0) items.push({ label: 'Tipos identificados', value: Array.from(types).slice(0, 5).join(', '), risk: 'INFO', points: 0 });
    if (expired > 0) { const pts = expired >= 3 ? 15 : 8; score += pts; items.push({ label: 'Licenças vencidas', value: expSamples.join('; '), risk: expired >= 3 ? 'ALTO' : 'MEDIO', points: pts }); }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Licenças', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeFlagsAndFeatures(result) {
  // GAP 5 — flags_and_features (modelos estatísticos BDC)
  try {
    const items = []; let score = 0;
    const ff = result?.FlagsAndFeatures || result?.flags_and_features;
    if (!ff) { items.push({ label: 'Modelos BDC', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    const feats = {};
    for (const item of flattenBDCArray(ff)) {
      for (const [k, v] of Object.entries(item || {})) {
        if (k === 'MatchKeys') continue;
        if (typeof v === 'number') feats[k] = v;
        else if (typeof v === 'boolean') feats[k] = v ? 1 : 0;
        else if (typeof v === 'object' && v?.Value != null) feats[k] = Number(v.Value);
      }
    }
    if (Object.keys(feats).length === 0) { items.push({ label: 'Modelos BDC', value: 'Sem dados', risk: 'INFO', points: 0 }); return { score, items }; }
    const check = (name, label, thr, pts) => {
      const v = feats[name];
      if (v == null) return;
      if (v < thr) { score += pts; items.push({ label, value: `Score ${(v * 100).toFixed(0)}% (limiar ${(thr * 100).toFixed(0)}%)`, risk: pts >= 20 ? 'ALTO' : 'MEDIO', points: pts }); }
      else items.push({ label, value: `Score ${(v * 100).toFixed(0)}%`, risk: 'OK', points: 0 });
    };
    check('EmploymentStability', 'Estabilidade profissional', 0.4, 10);
    check('Findability', 'Facilidade de localização', 0.3, 15);
    check('FinancialSophistication', 'Sofisticação financeira', 0.3, 5);
    check('IdentityConfidence', 'Confiança de identidade', 0.5, 25);
    check('BusinessStability', 'Estabilidade do negócio', 0.4, 15);
    check('OperationalActivity', 'Atividade operacional', 0.3, 20);
    check('MarketReputation', 'Reputação no mercado', 0.4, 10);
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Modelos', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeRelatedPeople(result) {
  // GAP INTERNO — related_people_*
  try {
    const items = []; let score = 0;
    const rpp = result?.RelatedPeoplePhones || result?.related_people_phones;
    const rpe = result?.RelatedPeopleEmails || result?.related_people_emails;
    const rpa = result?.RelatedPeopleAddresses || result?.related_people_addresses;
    if (!rpp && !rpe && !rpa) { items.push({ label: 'Pessoas relacionadas', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    let phones = 0, addrs = 0, peps = 0, sanc = 0;
    const accum = (ds, counter) => {
      if (!ds) return 0;
      let c = 0;
      for (const x of flattenBDCArray(ds)) {
        const list = x?.RelatedPeople || x?.People || [];
        if (Array.isArray(list)) {
          c += list.length;
          for (const p of list) {
            if (p?.IsPEP || p?.IsPep) peps++;
            if (Array.isArray(p?.Sanctions) && p.Sanctions.length > 0) sanc++;
          }
        }
      }
      return c;
    };
    phones = accum(rpp);
    accum(rpe);
    addrs = accum(rpa);
    if (sanc > 0) { score += 50; items.push({ label: 'Pessoas SANCIONADAS via contatos', value: `${sanc} pessoa(s) sancionada(s) compartilham contato/endereço`, risk: 'CRITICO', points: 50 }); }
    if (peps > 0) { const pts = peps > 2 ? 20 : 10; score += pts; items.push({ label: 'PEPs via contatos', value: `${peps} PEP(s) compartilham contato`, risk: 'ALTO', points: pts }); }
    if (phones > 20) { score += 15; items.push({ label: 'Telefone compartilhado', value: `${phones} pessoa(s) com o(s) telefone(s) da empresa`, risk: 'ALTO', points: 15 }); }
    if (addrs > 30) { score += 10; items.push({ label: 'Endereço compartilhado', value: `${addrs} pessoa(s) no mesmo endereço`, risk: 'MEDIO', points: 10 }); }
    if (items.length === 0) items.push({ label: 'Pessoas relacionadas', value: 'Sem flags', risk: 'OK', points: 0 });
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Relacionados', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

function analyzeBetsOwnership(result) {
  // GAP 3 (PF) — bets_ownership
  try {
    const items = []; let score = 0;
    const bo = result?.BetsOwnership || result?.bets_ownership;
    if (!bo) { items.push({ label: 'Participação em bets', value: 'Dataset não consultado', risk: 'INFO', points: 0 }); return { score, items }; }
    let total = 0, regulated = 0, pct = 0;
    const names = [];
    for (const item of flattenBDCArray(bo)) {
      const list = item?.Bets || item?.BetsList || item?.Companies || (Array.isArray(item) ? item : [item]);
      const all = Array.isArray(list) ? list : [list];
      for (const b of all) {
        if (!b || typeof b !== 'object' || !b?.Name) continue;
        total++;
        if (b?.IsRegulated === true || b?.IsRegisteredSPA === true || b?.SpaRegistered === true) regulated++;
        const p = Number(b?.Participation ?? b?.ParticipationPercentage ?? 0);
        pct += p;
        if (names.length < 5) names.push(`${b.Name}${p > 0 ? ` (${p}%)` : ''}`);
      }
    }
    if (total === 0) { items.push({ label: 'Participação em bets', value: 'Nenhuma', risk: 'OK', points: 0 }); return { score, items }; }
    const unreg = total - regulated;
    if (unreg > 0) { score += 60; items.push({ label: 'Participação em bets NÃO-REGULADAS', value: `${unreg} casa(s) sem registro SPA/MF`, risk: 'CRITICO', points: 60 }); }
    if (regulated > 0) { score += 25; items.push({ label: 'Participação em bets reguladas', value: `${regulated}: ${names.join('; ')}`, risk: 'ALTO', points: 25 }); }
    if (pct >= 25) { score += 15; items.push({ label: 'Participação relevante em bets', value: `${pct.toFixed(1)}% total — qualifica como UBO de bet`, risk: 'ALTO', points: 15 }); }
    return { score, items };
  } catch (e) { return { score: 0, items: [{ label: 'Bets', value: `Erro: ${e.message}`, risk: 'INFO', points: 0 }] }; }
}

// ── Detector de bloqueio B13 (processos criminais graves) ──
function detectCriminalBlock(result) {
  try {
    const all = [
      ...flattenBDCArray(result?.Processes || result?.processes),
      ...flattenBDCArray(result?.LawsuitsDistributionData || result?.lawsuits_distribution_data),
      ...flattenBDCArray(result?.OwnersLawsuits || result?.owners_lawsuits),
      ...flattenBDCArray(result?.OwnersLawsuitsDistribution || result?.owners_lawsuits_distribution),
    ];
    let crim = 0; const samples = [];
    for (const item of all) {
      const d = item?.LawsuitsDistribution || item?.DistributionByCourtType || item?.DistributionByLawsuitType || [];
      if (Array.isArray(d)) for (const x of d) {
        const t = String(x?.Type || x?.Court || x?.LawsuitType || x?.Description || '');
        if (CRIMINAL_KW.test(t)) {
          crim += Number(x?.Count || x?.TotalLawsuits || 1);
          if (samples.length < 3) samples.push(t);
        }
      }
    }
    if (crim >= 3) return { code: 'B13', label: 'Processos criminais graves recorrentes', severity: 'BLOQUEIO', detail: `${crim} processos criminais (ex.: ${samples.join('; ')}). Lei 9.613/1998.`, score: 850 };
    return null;
  } catch { return null; }
}

// ── Detector de bloqueio B14 (endereço-fachada) ──
function detectFakeAddressBlock(result) {
  try {
    const stats = result?.CompaniesStatistics || result?.companies_statistics;
    if (!stats) return null;
    let totalC = 0, totalEmp = 0;
    for (const s of flattenBDCArray(stats)) {
      totalC = Math.max(totalC, Number(s?.TotalCompanies ?? s?.CompaniesCount ?? 0));
      totalEmp += Number(s?.TotalEmployees ?? s?.EmployeesCount ?? 0);
    }
    // > 50 empresas + 0 funcionários no endereço = bloqueio
    if (totalC > 50 && totalEmp === 0) {
      return { code: 'B14', label: 'Endereço-fachada (alta densidade sem funcionários)', severity: 'BLOQUEIO', detail: `${totalC} empresas no mesmo endereço com 0 funcionários agregados. Padrão de coworking-fraude.`, score: 850 };
    }
    return null;
  } catch { return null; }
}

// ── Detector de manual flag M04 (mudança QSA recente + sem histórico) ──
function detectRecentQsaChangeFlag(result) {
  try {
    const qsa = result?.ConfigurableRecencyQsa || result?.configurable_recency_qsa;
    if (!qsa) return null;
    let last30 = 0, newOwners = 0;
    for (const item of flattenBDCArray(qsa)) {
      const changes = item?.RecentChanges || item?.QsaChanges || item?.Changes || [];
      if (Array.isArray(changes)) for (const c of changes) {
        const ds = c?.ChangeDate || c?.Date || c?.OperationDate;
        if (ds) {
          const d = new Date(ds);
          if (!isNaN(d) && (Date.now() - d.getTime()) / (24 * 3600 * 1000) <= 30) last30++;
        }
        if (c?.Operation === 'ADD' || c?.ChangeType === 'ENTRY' || c?.Type === 'NewOwner') newOwners++;
      }
    }
    if (last30 >= 2 || (last30 >= 1 && newOwners >= 2)) {
      return { code: 'M04', label: 'Mudança recente significativa de QSA', detail: `${last30} alteração(ões) nos últimos 30 dias${newOwners > 0 ? ` e ${newOwners} sócio(s) novo(s)` : ''}. Padrão clássico de empresa antiga "vendida" para fraude — encaminhar para análise manual.` };
    }
    return null;
  } catch { return null; }
}

function analyzePersonBlocks(result) {
  const blocks = [];
  const bd = result?.BasicData || result?.basic_data;
  if (bd) {
    const first = flattenBDCArray(bd)[0] || (typeof bd === 'object' ? bd : {});
    const status = first?.TaxIdStatus || '';
    if (status && !String(status).toUpperCase().includes('REGULAR')) blocks.push({ code: 'B01', label: 'CPF Irregular', severity: 'BLOQUEIO', detail: `Situação: ${status}.`, score: 850 });
    const bdt = first?.BirthDate || first?.DateOfBirth;
    if (bdt) { const age = (Date.now() - new Date(bdt).getTime()) / (365.25 * 24 * 3600 * 1000); if (age < 18) blocks.push({ code: 'B02', label: 'Menor de 18 anos', severity: 'BLOQUEIO', detail: `Idade: ${Math.floor(age)}.`, score: 850 }); }
  }
  const kyc = result?.Kyc || result?.kyc;
  if (kyc) for (const item of flattenBDCArray(kyc)) { const s = item?.Sanctions || []; if (Array.isArray(s) && s.length > 0) blocks.push({ code: 'B03', label: 'Pessoa em lista de sanções', severity: 'BLOQUEIO', detail: `${s.length} sanção(ões).`, score: 850 }); }
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
    let isPep = false, hasSanc = false;
    for (const item of flattenBDCArray(pKyc)) { if (item?.IsPEP || item?.IsPep) isPep = true; if (Array.isArray(item?.Sanctions) && item.Sanctions.length > 0) hasSanc = true; }
    sections.compliance.items.push({ label: 'PEP', value: isPep ? 'SIM' : 'Não', risk: isPep ? 'ALTO' : 'OK', points: isPep ? 40 : 0 });
    if (isPep) sections.compliance.score += 40;
    if (hasSanc) { sections.compliance.items.push({ label: 'Sanções', value: 'ENCONTRADA', risk: 'CRITICO', points: 80 }); sections.compliance.score += 80; }
  }
  return sections;
}

// ══════════════════════════════════════════════════════════════════
// MAIN HANDLER — v2 com lotes + retry robusto + queue persistente
// ══════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Accept: (1) admin users, (2) service-role invocations from orquestrador pipeline
    //         (autoEnrichOnboarding, bdcRetryWorker, etc.), (3) public callers with valid case.
    // The actual data isolation happens via `onboardingCaseId` scoping — the worst a bad
    // caller can do is burn BDC credits on a doc they already know. No PII leaks.
    let isAuthorized = false;
    try { const u = await base44.auth.me(); if (u?.role === 'admin') isAuthorized = true; } catch {}
    if (!isAuthorized) {
      try {
        // Service-role probe — if we can list the entity, we're running server-side.
        await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1);
        isAuthorized = true;
      } catch { /* still unauthorized */ }
    }
    // Last resort: if caller provides a valid onboardingCaseId, allow it (pipeline chain).
    // This prevents the "chained function call 403" bug where asServiceRole loses context.
    //
    // FIX SECURITY (2026-04-21): Apenas aceita se o caso foi criado nos últimos 24h E
    // ainda não teve BDC rodado (bigDataCorpCompleted=false). Isso impede ataque onde
    // um atacante descobre um caseId antigo e tenta queimar créditos BDC em re-run.
    const { onboardingCaseId, document, documentType, forceGroup, retryBatchesOnly } = await req.json();
    if (!isAuthorized && onboardingCaseId) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        const caseRec = cases[0];
        if (caseRec) {
          const caseAgeHours = (Date.now() - new Date(caseRec.created_date).getTime()) / 3600000;
          const isRecent = caseAgeHours < 24;
          const bdcNotRun = !caseRec.bigDataCorpCompleted;
          const inProcessing = caseRec.status === 'Pendente' || caseRec.status === 'Em Processamento';
          if (isRecent && bdcNotRun && inProcessing) {
            isAuthorized = true;
          } else {
            console.warn(`[BDC] Rejecting anonymous request for case ${onboardingCaseId} — age=${caseAgeHours.toFixed(1)}h bdcDone=${caseRec.bigDataCorpCompleted} status=${caseRec.status}`);
          }
        }
      } catch { /* */ }
    }
    if (!isAuthorized) return Response.json({ error: 'Forbidden' }, { status: 403 });
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

    // ═══ ALL-OR-ENQUEUE (v2 — 2026-04-21) ═══
    // Política: qualquer batch pendente (mesmo non-critical) bloqueia o pipeline.
    // Score só é calculado com 100% dos datasets disponíveis.
    // Worker (bdcRetryWorker) continua retentando em background.
    const failedNonCritical = Object.entries(batchStatuses).filter(([_, s]) => !s.success && s.priority !== 'CRITICAL');
    if (failedNonCritical.length > 0 && onboardingCaseId) {
      console.warn(`[BDC] ⏸️  Non-critical batches failed: ${failedNonCritical.map(([id]) => id).join(', ')} — enqueueing retry + BLOCKING pipeline`);

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

      // BLOCK pipeline — retorna 202, autoEnrichOnboarding entende como enqueued
      await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
        status: 'Em Processamento',
        iaExplanation: `Aguardando dados BDC — ${failedNonCritical.length} lote(s) não-crítico(s) em retry automático. Pipeline bloqueado até completude.`,
      });

      return Response.json({
        success: false,
        reason: 'non_critical_batches_failed_enqueued',
        failedBatches: failedNonCritical.map(([id]) => id),
        batchStatuses,
        willRetry: true,
      }, { status: 202 });
    }

    // ═══ ANALYZE ═══
    let analysis;
    if (isPF) {
      const blocks = analyzePersonBlocks(result);
      const sections = analyzePersonData(result);
      const judicialAssets = analyzeJudicialAssets(result);
      sections.judicialAssets = judicialAssets;
      // ── NOVOS PF v3 (2026-05-16) — GAPs 3, 5, 7 + interno related_people ──
      const pfFinancialEstimates = analyzeFinancialEstimates(result);
      const pfBets = analyzeBetsOwnership(result);
      const pfFlags = analyzeFlagsAndFeatures(result);
      const pfRelated = analyzeRelatedPeople(result);
      sections.financialEstimates = pfFinancialEstimates;
      sections.betsOwnership = pfBets;
      sections.flagsFeatures = pfFlags;
      sections.relatedPeople = pfRelated;
      const totalScore = sections.identity.score + sections.compliance.score + sections.reputation.score + judicialAssets.score + pfFinancialEstimates.score + pfBets.score + pfFlags.score + pfRelated.score;
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
      const { blocks, manualReviewFlags } = analyzeBlocks(result, responses);
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
      // ── NOVOS ANALYZERS — Sprint Expansão PLD (2026-05-15) ──
      const defaults = analyzeDefaults(result);
      const financialDeep = analyzeFinancialDeep(result, responses);
      const corporateChain = analyzeCorporateChain(result);
      const digitalAttributes = analyzeDigitalAttributes(result);
      // ── NOVOS ANALYZERS — Sprint Expansão BDC v3 (2026-05-16) ──
      const processes = analyzeProcesses(result);
      const politicalExposure = analyzePoliticalExposure(result);
      const qsaChanges = analyzeQsaChanges(result);
      const addressIntel = analyzeAddressIntelligence(result);
      const financialEstimates = analyzeFinancialEstimates(result);
      const companyGroup = analyzeCompanyGroupOwners(result);
      const licenses = analyzeLicenses(result);
      const flagsFeatures = analyzeFlagsAndFeatures(result);
      const relatedPeople = analyzeRelatedPeople(result);
      // Adiciona manual flag M03 se houver divergência grave de TPV
      if (financialDeep.declaredTpvMismatch) {
        manualReviewFlags.push({ code: 'M03', label: 'TPV declarado divergente da receita real BDC', detail: 'Volume declarado pelo cliente é >3x maior que a receita real reportada pela BigDataCorp. Encaminhar para análise manual.' });
      }

      // Pesos v3 — soma = 1.00. 26 componentes (17 antigos + 9 novos). Calibrados por criticidade PLD.
      const COMPONENT_WEIGHTS = { identity: 0.07, owners: 0.12, digital: 0.04, compliance: 0.13, reputation: 0.05, financial: 0.05, evolution: 0.04, esg: 0.04, contacts: 0.02, employeesKyc: 0.02, sectorial: 0.02, assets: 0.01, creditRisk: 0.06, defaults: 0.03, financialDeep: 0.03, corporateChain: 0.02, digitalAttributes: 0.01, processes: 0.08, politicalExposure: 0.04, qsaChanges: 0.03, addressIntel: 0.06, financialEstimates: 0.02, companyGroup: 0.04, licenses: 0.01, flagsFeatures: 0.01, relatedPeople: 0.01 };
      const componentScores = {
        identity: identity.score, owners: owners.score, digital: digital.score, compliance: compliance.score,
        reputation: reputation.score, financial: financial.score, evolution: evolution.score, esg: esgData.score,
        contacts: contacts.score, employeesKyc: employeesKyc.score, sectorial: sectorial.score, assets: assets.score,
        creditRisk: creditRisk.score, defaults: defaults.score, financialDeep: financialDeep.score,
        corporateChain: corporateChain.score, digitalAttributes: digitalAttributes.score,
        processes: processes.score, politicalExposure: politicalExposure.score, qsaChanges: qsaChanges.score,
        addressIntel: addressIntel.score, financialEstimates: financialEstimates.score,
        companyGroup: companyGroup.score, licenses: licenses.score, flagsFeatures: flagsFeatures.score,
        relatedPeople: relatedPeople.score,
      };
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
        elapsedMs: totalElapsed, blocks, hasBlock, manualReviewFlags, batchStatuses,
        sections: { identity, owners, digital, compliance, reputation, financial, evolution, esg: esgData, contacts, employeesKyc, sectorial, assets, creditRisk, defaults, financialDeep, corporateChain, digitalAttributes, processes, politicalExposure, qsaChanges, addressIntel, financialEstimates, companyGroup, licenses, flagsFeatures, relatedPeople },
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
        const v4ManualFlags = (analysis.manualReviewFlags || []).map(f => `MANUAL: ${f.code}_${f.label}`);
        const scoreData = {
          onboarding_case_id: onboardingCaseId, framework_version: 'v4.0',
          segmento: templateModel || 'unknown',
          score_base_segmento: analysis.scoring.baseScore,
          score_variaveis: analysis.scoring.variablesScore,
          score_enriquecimento: analysis.scoring.enrichmentScore,
          score_final: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa, subfaixa_nome: analysis.scoring.subfaixaNome,
          bloqueios_ativos: analysis.blocks.map(b => `${b.code}_${b.label}`),
          variaveis_aplicadas: analysis.sections, red_flags: [...v4RedFlags, ...v4ManualFlags],
          fase_2_completa: true, data_analise_fase_2: new Date().toISOString(),
        };
        if (existing.length > 0) await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scoreData);
        else await base44.asServiceRole.entities.ComplianceScore.create(scoreData);

        // ── Compute existing redFlags + add MANUAL: flags (regra 3-A < 6m, regra 4 endereço)
        const [existingCaseForFlags] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        const previousFlags = (existingCaseForFlags?.redFlags || []).filter(f => !String(f).startsWith('MANUAL:'));
        const newRedFlags = [...previousFlags, ...v4ManualFlags];

        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          bigDataCorpCompleted: true, riskScoreV4: analysis.scoring.finalScore,
          subfaixa: analysis.scoring.subfaixa, subfaixaNome: analysis.scoring.subfaixaNome,
          bloqueiosAtivos: analysis.blocks.map(b => `${b.code}_${b.label}`),
          redFlags: newRedFlags,
        });

      } catch (e) { console.warn('Error saving results:', e.message); }

      try {
        // GAP 11 — extrai links de evidência (PDF/XML/CSV) de cada batch BDC.
        const evidenceUrls = [];
        for (const br of batchResults) {
          if (!br.success || !br.data) continue;
          const st = br.data.Status || {};
          for (const [ds, statuses] of Object.entries(st)) {
            if (Array.isArray(statuses)) for (const s of statuses) {
              if (s?.EvidenceUrl || s?.EvidenceLink || s?.DownloadUrl) {
                evidenceUrls.push({ dataset: ds, url: s.EvidenceUrl || s.EvidenceLink || s.DownloadUrl, format: s.EvidenceFormat || 'PDF', generatedAt: s.EvidenceDate || new Date().toISOString() });
              }
            }
          }
        }
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId, provider: 'BigDataCorp',
          validationType: `Enriquecimento ${isPF ? 'PF' : 'PJ'} — ${groupKey} (${successfulBatches}/${totalBatches} lotes)`,
          endpoint,
          resultData: evidenceUrls.length > 0 ? { ...result, _evidenceUrls: evidenceUrls } : result,
          score: analysis.scoring.finalScore,
          status: successfulBatches === totalBatches ? 'Sucesso' : 'Sucesso',
          timestamp: new Date().toISOString(), responseTime: totalElapsed,
        });
        if (evidenceUrls.length > 0) console.log(`[BDC] ${evidenceUrls.length} evidence URL(s) saved for case ${onboardingCaseId}`);
      } catch (e) { console.warn('Error saving ExternalValidationResult:', e.message); }
    }

    return Response.json({ success: true, analysis, batchStatuses });
  } catch (error) {
    console.error('bdcEnrichCase error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});