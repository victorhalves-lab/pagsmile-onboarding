// ============================================================
// BDC ENRICHED LEAD SCORING SYSTEM
// Score 0-100 — 40% declaratório + 60% BDC verificado
// 14 BDC flags + cross-validation
// ============================================================

import { FREE_EMAIL_DOMAINS as FREE_EMAILS_V5 } from '@/components/lead-pagsmile/pagsmileQuestionnaireData';

const FREE_EMAIL_DOMAINS = FREE_EMAILS_V5;

// ============================================================
// BDC FLAGS (14)
// ============================================================
export function calculateBDCFlags(bdcData) {
  if (!bdcData) return {};
  const flags = {};
  const ai = bdcData.activityIndicators;
  const domains = bdcData.domains || [];
  const collections = bdcData.collections;
  const passages = bdcData.passages;
  const reputation = bdcData.reputation;
  const kyc = bdcData.kyc;
  const mcc = bdcData.mcc;

  // 1. Shell company
  if (ai?.shellCompanyLikelihood != null) {
    flags.BDC_SHELL_COMPANY = ai.shellCompanyLikelihood > 0.5;
  }
  // 2. No activity
  if (ai?.activityLevel != null) {
    flags.BDC_NO_ACTIVITY = ai.activityLevel < 0.1;
  }
  // 3. No domain
  if (ai?.hasActiveDomain != null) {
    flags.BDC_NO_DOMAIN = ai.hasActiveDomain === false;
  } else {
    flags.BDC_NO_DOMAIN = domains.length === 0;
  }
  // 4. No corporate email
  if (ai?.hasCorporateEmail != null) {
    flags.BDC_GENERIC_EMAIL_ONLY = ai.hasCorporateEmail === false;
  }
  // 5. Negative reputation
  if (reputation && reputation.length > 0) {
    flags.BDC_NEGATIVE_REPUTATION = reputation.some(r => r.rating != null && Number(r.rating) < 5);
  }
  // 6. In collection
  if (collections) {
    flags.BDC_IN_COLLECTION = collections.hasCollections === true;
  }
  // 7. Young domain
  if (domains.length > 0) {
    const ageYears = domains[0].age ? Number(domains[0].age) / 365 : null;
    flags.BDC_YOUNG_DOMAIN = ageYears != null && ageYears < 0.5;
  }
  // 8. No SSL
  if (domains.length > 0) {
    flags.BDC_NO_SSL = domains[0].hasSSL === false;
  }
  // 9. Zero passages
  if (passages) {
    flags.BDC_ZERO_PASSAGES = passages.total === 0;
  }
  // 10-11. KYC flags
  if (kyc) {
    flags.BDC_PEP_FOUND = kyc.companyPep || kyc.ownersPep?.length > 0;
    flags.BDC_SANCTIONS_FOUND = kyc.companySanctions || kyc.ownersSanctions?.length > 0;
  }

  return flags;
}

// TPV vs Income mismatch
export function checkTPVvsIncome(tpvMensal, bdcData) {
  if (!bdcData?.activityIndicators?.incomeRange || !tpvMensal) return false;
  const incomeMap = {
    'ATE 81K': 81000, 'ATE 360K': 360000, 'ACIMA DE 360K ATE 1.5MM': 1500000,
    'ACIMA DE 1.5MM ATE 2.5MM': 2500000, 'ACIMA DE 2.5MM ATE 5MM': 5000000,
    'ACIMA DE 5MM ATE 10MM': 10000000, 'ACIMA DE 10MM ATE 30MM': 30000000,
    'ACIMA DE 30MM ATE 100MM': 100000000, 'ACIMA DE 100MM': 999999999,
  };
  // Normalize: try to find a matching key
  const range = bdcData.activityIndicators.incomeRange.toUpperCase();
  let maxIncome = 0;
  for (const [key, val] of Object.entries(incomeMap)) {
    if (range.includes(key) || key.includes(range)) { maxIncome = val; break; }
  }
  if (maxIncome === 0) return false;
  return (Number(tpvMensal) * 12) > (maxIncome * 2);
}

// MCC mismatch check
export function checkMCCMismatch(segmento, bdcData) {
  if (!bdcData?.mcc?.code || !segmento) return false;
  // Simple heuristic — if MCC doesn't match common segment MCCs, flag it
  const segmentMCCMap = {
    'ecommerce': ['5411','5311','5331','5399','5699','5999'],
    'saas': ['5734','5817','5818','7372'],
    'educacao': ['8211','8220','8241','8244','8249','8299'],
    'infoprodutos': ['5815','5816','5817','5818'],
    'gateway': ['4816','7399'],
    'marketplace': ['5399','5999','7399'],
  };
  const expectedMCCs = segmentMCCMap[segmento];
  if (!expectedMCCs) return false;
  return !expectedMCCs.includes(String(bdcData.mcc.code));
}

// ============================================================
// BDC ENRICHED SCORE (0-100)
// ============================================================
export function calculateBDCEnrichedScore(declarativeScore, bdcData, tpvMensal, segmento) {
  if (!bdcData || !bdcData.activityIndicators) {
    // No BDC data — return declarative only
    return { finalScore: declarativeScore, bdcScore: null, bdcFlags: {}, crossValidation: {} };
  }

  const bdcFlags = calculateBDCFlags(bdcData);

  // TPV vs Income
  bdcFlags.BDC_TPV_VS_INCOME_MISMATCH = checkTPVvsIncome(tpvMensal, bdcData);
  // MCC mismatch
  bdcFlags.BDC_MCC_MISMATCH = checkMCCMismatch(segmento, bdcData);

  // Calculate BDC component score (0-100)
  let bdcScore = 50; // neutral base
  const ai = bdcData.activityIndicators;

  // Activity level: +/- 15
  if (ai.activityLevel != null) {
    if (ai.activityLevel >= 0.6) bdcScore += 15;
    else if (ai.activityLevel >= 0.3) bdcScore += 5;
    else bdcScore -= 15;
  }
  // Domain: +/- 10
  if (!bdcFlags.BDC_NO_DOMAIN) bdcScore += 5;
  else bdcScore -= 10;
  if (bdcFlags.BDC_NO_SSL) bdcScore -= 5;
  if (bdcFlags.BDC_YOUNG_DOMAIN) bdcScore -= 5;
  // Employees
  if (ai.employeesRange) {
    const empStr = ai.employeesRange.toUpperCase();
    if (empStr.includes('050') || empStr.includes('100') || empStr.includes('250') || empStr.includes('500')) bdcScore += 10;
    else if (empStr.includes('020') || empStr.includes('049')) bdcScore += 5;
  }
  // Corporate email
  if (ai.hasCorporateEmail) bdcScore += 5;
  else if (ai.hasCorporateEmail === false) bdcScore -= 5;
  // Passages
  if (bdcData.passages) {
    if (bdcData.passages.total > 50) bdcScore += 10;
    else if (bdcData.passages.total > 10) bdcScore += 5;
    else if (bdcData.passages.total === 0) bdcScore -= 15;
  }
  // Reputation
  if (bdcData.reputation?.length > 0) {
    const bestRating = Math.max(...bdcData.reputation.map(r => Number(r.rating) || 0));
    if (bestRating >= 7) bdcScore += 10;
    else if (bestRating < 5 && bestRating > 0) bdcScore -= 10;
  }
  // Collections
  if (bdcFlags.BDC_IN_COLLECTION) bdcScore -= 15;
  // Marketplace presence
  if (bdcData.marketplaces?.length > 0) bdcScore += 5;
  // Shell company
  if (bdcFlags.BDC_SHELL_COMPANY) bdcScore -= 30;
  // KYC
  if (bdcFlags.BDC_PEP_FOUND) bdcScore -= 10;
  if (bdcFlags.BDC_SANCTIONS_FOUND) bdcScore -= 30;
  // Cross-validation penalties
  if (bdcFlags.BDC_TPV_VS_INCOME_MISMATCH) bdcScore -= 15;
  if (bdcFlags.BDC_MCC_MISMATCH) bdcScore -= 10;

  bdcScore = Math.max(0, Math.min(100, bdcScore));

  // Weighted final: 40% declarative + 60% BDC
  const finalScore = Math.round(declarativeScore * 0.4 + bdcScore * 0.6);

  // Cross-validation summary
  const crossValidation = buildCrossValidation(bdcData, bdcFlags);

  // Active flags list
  const activeFlags = Object.entries(bdcFlags).filter(([, v]) => v === true).map(([k]) => k);

  return {
    finalScore: Math.max(0, Math.min(100, finalScore)),
    bdcScore,
    declarativeScore,
    bdcFlags,
    activeFlags,
    crossValidation,
  };
}

function buildCrossValidation(bdcData, flags) {
  const checks = [];
  const ai = bdcData.activityIndicators;

  if (ai) {
    checks.push({
      label: 'Atividade real',
      status: ai.activityLevel >= 0.3 ? 'ok' : 'alert',
      detail: `Nível: ${ai.activityLevel != null ? (ai.activityLevel * 100).toFixed(0) + '%' : 'N/D'}`,
    });
    checks.push({
      label: 'Empresa de fachada',
      status: (ai.shellCompanyLikelihood || 0) <= 0.3 ? 'ok' : 'danger',
      detail: `Probabilidade: ${ai.shellCompanyLikelihood != null ? (ai.shellCompanyLikelihood * 100).toFixed(0) + '%' : 'N/D'}`,
    });
    checks.push({
      label: 'Domínio ativo',
      status: ai.hasActiveDomain !== false ? 'ok' : 'alert',
      detail: ai.hasActiveDomain ? 'Sim' : 'Não',
    });
    checks.push({
      label: 'E-mail corporativo',
      status: ai.hasCorporateEmail !== false ? 'ok' : 'alert',
      detail: ai.hasCorporateEmail ? 'Sim' : 'Não',
    });
  }
  if (flags.BDC_IN_COLLECTION) {
    checks.push({ label: 'Negativação', status: 'danger', detail: 'Empresa com registros em cobrança' });
  } else if (bdcData.collections) {
    checks.push({ label: 'Negativação', status: 'ok', detail: 'Sem registros' });
  }
  if (flags.BDC_TPV_VS_INCOME_MISMATCH) {
    checks.push({ label: 'TPV vs Faixa receita', status: 'danger', detail: `TPV declarado excede faixa BDC: ${bdcData.activityIndicators?.incomeRange || 'N/D'}` });
  }
  if (flags.BDC_MCC_MISMATCH) {
    checks.push({ label: 'MCC vs Segmento', status: 'alert', detail: `MCC BDC: ${bdcData.mcc?.code || 'N/D'} — ${bdcData.mcc?.description || ''}` });
  }
  if (bdcData.kyc) {
    if (flags.BDC_SANCTIONS_FOUND) {
      checks.push({ label: 'Sanções', status: 'danger', detail: `Sanções encontradas: ${bdcData.kyc.ownersSanctions?.join(', ') || 'Empresa'}` });
    } else {
      checks.push({ label: 'Sanções', status: 'ok', detail: 'Nenhuma' });
    }
    if (flags.BDC_PEP_FOUND) {
      checks.push({ label: 'PEP', status: 'alert', detail: `PEP: ${bdcData.kyc.ownersPep?.join(', ') || 'Empresa'}` });
    }
  }

  return { checks, total: checks.length, ok: checks.filter(c => c.status === 'ok').length, alerts: checks.filter(c => c.status === 'alert').length, dangers: checks.filter(c => c.status === 'danger').length };
}

export function getBDCScoreLabel(score) {
  if (score >= 80) return { label: 'EXCELENTE', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  if (score >= 60) return { label: 'BOM', color: 'text-green-600', bg: 'bg-green-100' };
  if (score >= 40) return { label: 'REGULAR', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (score >= 20) return { label: 'FRACO', color: 'text-orange-600', bg: 'bg-orange-100' };
  return { label: 'INSUFICIENTE', color: 'text-red-600', bg: 'bg-red-100' };
}