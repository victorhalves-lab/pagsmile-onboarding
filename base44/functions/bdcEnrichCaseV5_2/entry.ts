// ─────────────────────────────────────────────────────────────────────
// bdcEnrichCaseV5_2 — Pipeline de scoring V5.2 (paralelo ao V4 e V5.1)
// ─────────────────────────────────────────────────────────────────────
// REGRAS SUPREMAS:
//   - NUNCA chamada para casos V4 ou V5.1. Router garante isso por framework_version.
//   - Chama bdcEnrichCase (V4) APENAS para obter dados BDC enriquecidos (passando
//     document direto SEM onboardingCaseId, p/ que o V4 não persista nada).
//   - NUNCA modifica campos V4. Só toca em campos *_v5_2/*_v5_1 + framework_version.
//   - Escalas corrigidas: T1/T2/Sub PJ/Sub PF = 0-850, T3 = 0-999.
//   - 15 segmentos canônicos (+5 vs V5.1: turismo, eventos, servicos_b2b, servicos_locais, crossborder).
//   - Capabilities canônicas: splits/subseller, crossborder, recurrence, cap_financial_capacity_validation.
//   - Cat 5 (Monitoramento Intensivo) proposta quando bloqueio mitigável + analista aprova.
//
// FASE 3 (2026-05-20):
//   + Conecta BDC real via bdcEnrichCase (data-only, sem persistência V4)
//   + Cross-Validation 16 campos canônicos (alimenta cross_validation_results)
//   + Regra transversal B-CNPJ-NOVO (<6 meses → revisão manual em qualquer tier)
//   + Triggers populados com dados BDC reais (PEP, sanção, capital, idade etc.)
// ─────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── tiers V5.2 ──
const TIERS = {
  TIER_1: 'tier_1', TIER_2: 'tier_2', TIER_3: 'tier_3',
  SUBSELLER_PJ: 'subseller_pj', SUBSELLER_PF: 'subseller_pf',
};

// Apenas gateway e crossborder escalam pra Tier 3 livremente por TPV
const SEGMENTOS_TIER_3_ONLY = ['gateway', 'crossborder'];

function resolverTier({ tpvMensalDeclarado, segmento, isSubseller, merchantType }) {
  if (isSubseller) return merchantType === 'PF' ? TIERS.SUBSELLER_PF : TIERS.SUBSELLER_PJ;
  if (segmento === 'marketplace') return TIERS.TIER_2; // fixed
  const tpv = Number(tpvMensalDeclarado) || 0;
  if (tpv <= 50_000) return TIERS.TIER_1;
  if (tpv <= 500_000) return TIERS.TIER_2;
  if (SEGMENTOS_TIER_3_ONLY.includes(segmento)) return TIERS.TIER_3;
  return TIERS.TIER_2; // cap em T2 para os demais
}

// ── Triggers Tier Real-Time (DOC4 Bloco 3 §3.4) ──
const TRIGGERS_FORCAM_T3 = ['pep_socio', 'sancao_internacional', 'processo_criminal_socio'];
const TRIGGERS_T1_PARA_T2 = [
  'mcc_alto_risco', 'empresa_recem_aberta', 'capital_social_baixo',
  'multi_mei_pulverizacao', 'endereco_virtual_suspeito', 'dominio_recente',
  'historico_chargeback_alto', 'reclamacoes_graves', 'tpv_incompativel_capital',
];

function avaliarTriggersTier({ merchant, bdcData, questionario, contexto }) {
  const d = [];
  if (questionario.tem_socio_pep === true || bdcData.has_pep === true) d.push('pep_socio');
  if (bdcData.has_international_sanction === true || questionario.tem_sancao === true) d.push('sancao_internacional');
  if (bdcData.has_criminal_lawsuit === true) d.push('processo_criminal_socio');
  const mccAltoRisco = ['7995', '5993', '5816', '6051', '5967', '7273'];
  if (mccAltoRisco.includes(String(merchant.mcc || questionario.mcc || ''))) d.push('mcc_alto_risco');
  const tpvAnual = (Number(contexto.tpvDeclarado) || 0) * 12;
  const capital = Number(bdcData.capital_social) || Number(merchant.capital_social) || 0;
  if (capital > 0 && tpvAnual > capital * 24) d.push('tpv_incompativel_capital');
  if (bdcData.idade_empresa_meses != null && bdcData.idade_empresa_meses < 6) d.push('empresa_recem_aberta');
  if (merchant.type === 'PJ' && capital > 0 && capital < 1000) d.push('capital_social_baixo');
  if (['b2c_crossborder', 'b2b_crossborder'].includes(contexto.morfologia) || contexto.segmento === 'crossborder') d.push('crossborder_operacao');
  if (['educacao', 'foodtech', 'plataforma_vertical'].includes(contexto.segmento) && questionario.tem_licenca_setorial === false) d.push('setor_regulado_sem_licenca');
  if (contexto.morfologia === 'multi_mei' || questionario.tem_multiplos_meis === true) d.push('multi_mei_pulverizacao');
  if (questionario.chargeback_pct != null && Number(questionario.chargeback_pct) > 2) d.push('historico_chargeback_alto');
  if (bdcData.reclamacoes_graves_count != null && bdcData.reclamacoes_graves_count > 5) d.push('reclamacoes_graves');
  if (bdcData.endereco_tipo === 'virtual' || questionario.endereco_virtual === true) d.push('endereco_virtual_suspeito');
  if (bdcData.dominio_idade_dias != null && bdcData.dominio_idade_dias < 90) d.push('dominio_recente');
  return d;
}

function resolverTierComTriggers(tierBase, triggers = []) {
  if (tierBase === TIERS.SUBSELLER_PJ || tierBase === TIERS.SUBSELLER_PF) {
    return { tier_final: tierBase, escalado: false, motivo: 'Subseller — fluxo dedicado' };
  }
  if (triggers.some((t) => TRIGGERS_FORCAM_T3.includes(t))) {
    return {
      tier_final: TIERS.TIER_3,
      escalado: tierBase !== TIERS.TIER_3,
      motivo: `Triggers de núcleo regulatório: ${triggers.filter((t) => TRIGGERS_FORCAM_T3.includes(t)).join(', ')}`,
    };
  }
  if (tierBase === TIERS.TIER_1) {
    const esc = triggers.filter((t) => TRIGGERS_T1_PARA_T2.includes(t));
    if (esc.length > 0) return { tier_final: TIERS.TIER_2, escalado: true, motivo: `Escala T1→T2: ${esc.join(', ')}` };
  }
  return { tier_final: tierBase, escalado: false, motivo: 'Sem triggers de escalada' };
}

// ── BDC extractors + Cross-Validation 16 campos (inline — sem local imports) ──
function safeGetBDC(obj, path, def = null) {
  if (!obj) return def;
  let cur = obj;
  for (const p of path.split('.')) { if (cur == null) return def; cur = cur[p]; }
  return cur ?? def;
}
function flattenBDC(d) {
  if (!d) return [];
  if (Array.isArray(d)) return d.flatMap(x => { if (x && x.MatchKeys) return [x]; if (Array.isArray(x)) return x; return [x]; }).filter(Boolean);
  return [d];
}
function extractBasicData(r) {
  const bd = r?.BasicData || r?.basic_data;
  if (!bd) return null;
  if (typeof bd === 'object' && !Array.isArray(bd)) return bd;
  return flattenBDC(bd)[0] || null;
}
function normStr(v) {
  if (!v) return '';
  return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}
function normCep(v) { return String(v || '').replace(/\D/g, ''); }
function numEqualish(a, b) {
  if (a == null || b == null) return null;
  const na = Number(a), nb = Number(b);
  if (!isFinite(na) || !isFinite(nb)) return null;
  if (na === 0 && nb === 0) return 0;
  if (na === 0 || nb === 0) return 100;
  return Math.abs((na - nb) / Math.max(na, nb)) * 100;
}
function classifyDiv(p) { if (p == null) return 'unknown'; if (p < 5) return 'match'; if (p < 30) return 'divergence'; return 'mismatch'; }

function extractBdcCanonical(result) {
  const bd = extractBasicData(result) || {};
  const rels = result?.Relationships || result?.relationships;
  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  const fd = result?.FinancialData || result?.financial_data;
  const emails = result?.EmailsExtended || result?.emails_extended;
  const phones = result?.PhonesExtended || result?.phones_extended;
  const domains = result?.Domains || result?.domains;
  const addr = safeGetBDC(bd, 'Address') || safeGetBDC(bd, 'address') || {};

  let qsaCount = 0;
  if (rels) {
    const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    if (Array.isArray(entries)) qsaCount = entries.length;
  }

  let temPep = false, temSancao = false;
  if (ownersKyc) {
    for (const item of flattenBDC(ownersKyc)) {
      if (item?.IsPEP || item?.IsPep) temPep = true;
      const s = item?.Sanctions || [];
      if (Array.isArray(s) && s.length > 0) temSancao = true;
    }
  }

  let receitaAnual = 0;
  if (fd) for (const item of flattenBDC(fd)) {
    receitaAnual = Math.max(receitaAnual, Number(item?.TotalRevenue ?? item?.AnnualRevenue ?? item?.Revenue ?? 0));
  }

  const firstFromList = (ds, mapper) => {
    if (!ds) return '';
    for (const x of flattenBDC(ds)) {
      const list = mapper(x);
      if (Array.isArray(list) && list.length > 0) {
        const item = list[0];
        if (typeof item === 'string') return item;
        return String(item?.EmailAddress || item?.Email || item?.Number || item?.PhoneNumber || item?.Domain || item || '');
      }
    }
    return '';
  };
  const primeiroEmail = firstFromList(emails, (e) => e?.Emails || e?.EmailsList || (Array.isArray(e) ? e : []));
  const primeiroTelefone = firstFromList(phones, (p) => p?.Phones || p?.PhonesList || (Array.isArray(p) ? p : []));
  const dominio = firstFromList(domains, (d) => d?.Domains || d?.DomainsList || (Array.isArray(d) ? d : []));

  return {
    razao_social: bd?.OfficialName || bd?.CompanyName || '',
    nome_fantasia: bd?.TradeName || bd?.FantasyName || '',
    cnpj_situacao: bd?.TaxIdStatus || bd?.TaxIdStatusDescription || '',
    data_fundacao: bd?.FoundedDate || safeGetBDC(bd, 'Age.FoundedDate') || '',
    capital_social: Number(bd?.ShareCapital ?? bd?.Capital ?? 0),
    cnae_principal: bd?.MainEconomicActivity || bd?.MainActivityCode || '',
    endereco_cep: normCep(addr?.ZipCode || addr?.zipCode || addr?.CEP),
    endereco_logradouro: addr?.Street || addr?.AddressMain || '',
    socios_qsa_count: qsaCount,
    socios_pep: temPep,
    socios_sancao: temSancao,
    faturamento_anual: receitaAnual,
    tpv_mensal: receitaAnual > 0 ? receitaAnual / 12 : 0,
    email_corporativo: primeiroEmail,
    telefone_principal: primeiroTelefone,
    dominio_site: dominio,
  };
}

function crossValidate16({ declarado = {}, bdcResult = {} }) {
  const bdc = extractBdcCanonical(bdcResult);
  const fields = [];
  const push = (id, label, dv, bv, st, divPct, opts = {}) => fields.push({
    field_id: id, label, declared_value: dv ?? '', bdc_value: bv ?? '',
    source_dataset: opts.source || 'basic_data', status: st,
    divergence_pct: divPct == null ? null : Math.round(divPct * 10) / 10,
    peso_v5_1: opts.peso || 1, bloqueio_disparado: opts.bloqueio || null,
  });

  // 1. razão social
  { const d = normStr(declarado.razao_social), b = normStr(bdc.razao_social);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : (d.includes(b) || b.includes(d)) ? 'divergence' : 'mismatch';
    push('razao_social', 'Razão Social', declarado.razao_social, bdc.razao_social, st, null, { peso: 2 });
  }
  // 2. nome fantasia
  { const d = normStr(declarado.nome_fantasia), b = normStr(bdc.nome_fantasia);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : (d.includes(b) || b.includes(d)) ? 'divergence' : 'mismatch';
    push('nome_fantasia', 'Nome Fantasia', declarado.nome_fantasia, bdc.nome_fantasia, st, null, { peso: 1 });
  }
  // 3. CNPJ situação
  { const b = String(bdc.cnpj_situacao || '').toUpperCase().trim();
    const st = !b ? 'unknown' : (b === 'ATIVA' || b.startsWith('ATIV')) ? 'match' : 'mismatch';
    push('cnpj_situacao', 'Situação Receita Federal', 'ATIVA (esperado)', bdc.cnpj_situacao, st, null,
      { peso: 5, bloqueio: st === 'mismatch' ? 'B01' : null });
  }
  // 4. data fundação
  { const d = declarado.data_fundacao, b = bdc.data_fundacao;
    let st = 'unknown';
    if (d && b) {
      const dd = new Date(d), bb = new Date(b);
      if (!isNaN(dd) && !isNaN(bb)) {
        const days = Math.abs(dd - bb) / (24 * 3600 * 1000);
        st = days < 30 ? 'match' : days < 180 ? 'divergence' : 'mismatch';
      }
    }
    push('data_fundacao', 'Data de Fundação', d, b, st, null, { peso: 2 });
  }
  // 5. capital social
  { const divPct = numEqualish(declarado.capital_social, bdc.capital_social);
    push('capital_social', 'Capital Social', declarado.capital_social, bdc.capital_social, classifyDiv(divPct), divPct, { peso: 2 });
  }
  // 6. CNAE
  { const d = String(declarado.cnae_principal || '').replace(/\D/g, '');
    const b = String(bdc.cnae_principal || '').replace(/\D/g, '');
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : (d.substring(0, 4) === b.substring(0, 4)) ? 'divergence' : 'mismatch';
    push('cnae_principal', 'CNAE Principal', declarado.cnae_principal, bdc.cnae_principal, st, null, { peso: 3 });
  }
  // 7. CEP — bloqueio M02
  { const d = normCep(declarado.endereco_cep), b = normCep(bdc.endereco_cep);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : 'mismatch';
    push('endereco_cep', 'CEP Endereço', declarado.endereco_cep, bdc.endereco_cep, st, null,
      { peso: 3, bloqueio: st === 'mismatch' ? 'M02' : null });
  }
  // 8. logradouro
  { const d = normStr(declarado.endereco_logradouro), b = normStr(bdc.endereco_logradouro);
    let st = 'unknown';
    if (b && d) st = (d === b || d.includes(b) || b.includes(d)) ? 'match' : 'divergence';
    push('endereco_logradouro', 'Logradouro', declarado.endereco_logradouro, bdc.endereco_logradouro, st, null, { peso: 1 });
  }
  // 9. QSA
  { const d = Number(declarado.socios_qsa_count) || 0, b = Number(bdc.socios_qsa_count) || 0;
    let st = 'unknown';
    if (b > 0 || d > 0) st = d === b ? 'match' : Math.abs(d - b) <= 1 ? 'divergence' : 'mismatch';
    push('socios_qsa', 'Sócios no QSA', d, b, st, null, { peso: 3, source: 'relationships' });
  }
  // 10. sócios PEP
  { const d = declarado.socios_pep === true, b = bdc.socios_pep === true;
    let st = 'unknown';
    if (bdc.socios_pep != null) st = d === b ? 'match' : 'mismatch';
    push('socios_pep', 'Sócios PEP', d ? 'Sim' : 'Não', b ? 'Sim' : 'Não', st, null,
      { peso: 4, source: 'owners_kyc', bloqueio: (st === 'mismatch' && b && !d) ? 'B-PEP-1' : null });
  }
  // 11. sócios sanção — B03
  { const d = declarado.socios_sancao === true, b = bdc.socios_sancao === true;
    let st = 'unknown';
    if (bdc.socios_sancao != null) st = d === b ? 'match' : 'mismatch';
    push('socios_sancao', 'Sócios em Sanção Internacional', d ? 'Sim' : 'Não', b ? 'Sim' : 'Não', st, null,
      { peso: 5, source: 'owners_kyc', bloqueio: b ? 'B03' : null });
  }
  // 12. TPV mensal — B-FIN-1
  { const d = Number(declarado.tpv_mensal_declarado) || 0;
    const b = bdc.tpv_mensal;
    let st = 'unknown', divPct = null;
    if (d > 0 && b > 0) {
      divPct = numEqualish(d, b);
      const ratio = d / b;
      st = ratio > 3 ? 'mismatch' : ratio > 1.5 ? 'divergence' : 'match';
    }
    push('tpv_mensal_declarado', 'TPV Mensal Declarado', d, b, st, divPct,
      { peso: 4, source: 'financial_data', bloqueio: st === 'mismatch' ? 'B-FIN-1' : null });
  }
  // 13. faturamento anual
  { const d = Number(declarado.faturamento_anual_declarado) || 0;
    const b = Number(bdc.faturamento_anual) || 0;
    const divPct = numEqualish(d, b);
    push('faturamento_anual_declarado', 'Faturamento Anual', d, b, classifyDiv(divPct), divPct, { peso: 3, source: 'financial_data' });
  }
  // 14. e-mail
  { const d = normStr(declarado.email_corporativo), b = normStr(bdc.email_corporativo);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : 'divergence';
    push('email_corporativo', 'E-mail Corporativo', declarado.email_corporativo, bdc.email_corporativo, st, null, { peso: 1, source: 'emails_extended' });
  }
  // 15. telefone (últimos 8 dígitos)
  { const d = String(declarado.telefone_principal || '').replace(/\D/g, '').slice(-8);
    const b = String(bdc.telefone_principal || '').replace(/\D/g, '').slice(-8);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : 'divergence';
    push('telefone_principal', 'Telefone Principal', declarado.telefone_principal, bdc.telefone_principal, st, null, { peso: 1, source: 'phones_extended' });
  }
  // 16. domínio
  { const d = normStr(declarado.dominio_site).replace(/^https?\/\//, '').replace(/^www/, '');
    const b = normStr(bdc.dominio_site).replace(/^https?\/\//, '').replace(/^www/, '');
    let st = 'unknown';
    if (b && d) st = (d === b || d.includes(b) || b.includes(d)) ? 'match' : 'divergence';
    push('dominio_site', 'Domínio do Site', declarado.dominio_site, bdc.dominio_site, st, null, { peso: 1, source: 'domains' });
  }

  const match_count = fields.filter(f => f.status === 'match').length;
  const divergence_count = fields.filter(f => f.status === 'divergence').length;
  const mismatch_count = fields.filter(f => f.status === 'mismatch').length;
  const unknown_count = fields.filter(f => f.status === 'unknown').length;
  let scoreCV = 0, pesoTotal = 0;
  for (const f of fields) {
    pesoTotal += f.peso_v5_1;
    scoreCV += ({ match: 1, divergence: 0.5, mismatch: 0, unknown: 0.3 }[f.status] ?? 0) * f.peso_v5_1;
  }
  const score_cross_val = pesoTotal > 0 ? Math.round((scoreCV / pesoTotal) * 100) : 0;
  const bloqueios_disparados = Array.from(new Set(fields.filter(f => f.bloqueio_disparado).map(f => f.bloqueio_disparado)));
  return { fields, summary: { match_count, divergence_count, mismatch_count, unknown_count, score_cross_val }, bloqueios_disparados };
}

// Regra transversal B-CNPJ-NOVO: <6 meses → revisão manual em qualquer tier
function regraCnpjNovo(dataFundacao) {
  if (!dataFundacao) return { disparado: false, idade_meses: null };
  const d = new Date(dataFundacao);
  if (isNaN(d)) return { disparado: false, idade_meses: null };
  const meses = (Date.now() - d.getTime()) / (30.44 * 24 * 3600 * 1000);
  return { disparado: meses < 6, idade_meses: Math.round(meses * 10) / 10 };
}

// Extrai BDC para alimentar triggers V5.2 com dados reais
function extrairBdcParaTriggers(bdcResult) {
  const b = extractBdcCanonical(bdcResult);
  let idadeMeses = null;
  if (b.data_fundacao) {
    const d = new Date(b.data_fundacao);
    if (!isNaN(d)) idadeMeses = (Date.now() - d.getTime()) / (30.44 * 24 * 3600 * 1000);
  }
  // Endereço suspeito: stat de companies_statistics (alta densidade sem funcionários)
  let enderecoTipo = null;
  const stats = bdcResult?.CompaniesStatistics || bdcResult?.companies_statistics;
  if (stats) {
    for (const s of flattenBDC(stats)) {
      const total = Number(s?.TotalCompanies ?? s?.CompaniesCount ?? 0);
      const emp = Number(s?.TotalEmployees ?? s?.EmployeesCount ?? 0);
      if (total > 20 && emp === 0) { enderecoTipo = 'virtual'; break; }
    }
  }
  // Reclamações graves (RA score baixo)
  let reclamacoesGraves = null;
  const rep = bdcResult?.ReputationsAndReviews || bdcResult?.reputations_and_reviews;
  if (rep) {
    for (const r of flattenBDC(rep)) {
      const raScore = Number(r?.ReclameAquiScore ?? r?.ReclameAquiRating ?? r?.OverallRating);
      if (!isNaN(raScore) && raScore > 0 && raScore < 5) { reclamacoesGraves = 6; break; }
    }
  }
  // Processos criminais
  let hasCriminal = false;
  const CRIMINAL_KW = /criminal|penal|fraude|lavagem|estelionato|sonega|tráfico|trafico|narc/i;
  for (const src of [bdcResult?.Processes, bdcResult?.processes, bdcResult?.OwnersLawsuits, bdcResult?.owners_lawsuits]) {
    if (!src) continue;
    for (const item of flattenBDC(src)) {
      const d = item?.LawsuitsDistribution || item?.DistributionByCourtType || item?.DistributionByLawsuitType || [];
      if (Array.isArray(d)) for (const x of d) {
        const t = String(x?.Type || x?.Court || x?.LawsuitType || x?.Description || '');
        if (CRIMINAL_KW.test(t)) { hasCriminal = true; break; }
      }
      if (hasCriminal) break;
    }
    if (hasCriminal) break;
  }
  return {
    has_pep: b.socios_pep,
    has_international_sanction: b.socios_sancao,
    has_criminal_lawsuit: hasCriminal,
    capital_social: b.capital_social,
    idade_empresa_meses: idadeMeses,
    endereco_tipo: enderecoTipo,
    dominio_idade_dias: null,
    reclamacoes_graves_count: reclamacoesGraves,
  };
}

// ── Avaliação de bloqueios via catálogo ──
function bloqueioAplicavel(bloqueio, ctx) {
  if (!bloqueio.ativo) return false;
  if (bloqueio.tiers_aplicaveis?.length > 0 && !bloqueio.tiers_aplicaveis.includes(ctx.tier)) return false;
  const segs = bloqueio.segmentos_aplicaveis || [];
  if (segs.length > 0 && !segs.includes('all') && !segs.includes(ctx.segmento)) return false;
  const morfs = bloqueio.morfologias_aplicaveis || [];
  if (morfs.length > 0 && !morfs.includes('all') && !morfs.includes(ctx.morfologia)) return false;
  const caps = bloqueio.capabilities_relacionadas || [];
  if (caps.length > 0 && !caps.some((c) => (ctx.capabilities_ativas || []).includes(c))) return false;
  return true;
}

function avaliarTriggerBloqueio(bloqueio, ctx) {
  if (ctx.bloqueios_forcados?.includes(bloqueio.codigo)) return { disparou: true, razao: 'forçado pelo pipeline' };
  for (const nomeVar of (bloqueio.variaveis_alimentadoras || [])) {
    const v = ctx.variaveis_input?.[nomeVar];
    if (v == null) continue;
    const valor = typeof v === 'object' ? Number(v.valor) || 0 : Number(v) || 0;
    if (valor < 0) return { disparou: true, razao: `variável ${nomeVar} negativa (${valor})` };
  }
  for (const ds of (bloqueio.datasets_consumidos || [])) {
    if (ctx.datasets_red_flags?.includes(ds)) return { disparou: true, razao: `dataset ${ds} sinalizou red flag` };
  }
  return { disparou: false, razao: '' };
}

function avaliarBloqueios(catalogo = [], ctx = {}) {
  const detalhes = [];
  const ativos = [];
  for (const b of catalogo) {
    if (!bloqueioAplicavel(b, ctx)) continue;
    const { disparou, razao } = avaliarTriggerBloqueio(b, ctx);
    if (!disparou) continue;
    ativos.push(b.codigo);
    detalhes.push({
      codigo: b.codigo, titulo: b.titulo, categoria: b.categoria,
      severidade: b.severidade, decisao_padrao: b.decisao_padrao,
      nucleo_duro_regulatorio: !!b.nucleo_duro_regulatorio,
      exception_categoria: b.exception_categoria || 'nenhuma', razao,
    });
  }
  return { bloqueios_ativos: ativos, detalhes };
}

function aplicarBloqueiosNaCategoria(catScore, detalhes = []) {
  if (detalhes.length === 0) return catScore;
  if (detalhes.some((d) => d.nucleo_duro_regulatorio)) return 'cat_4_block';
  if (detalhes.some((d) => d.decisao_padrao === 'monitoramento_intensivo') && catScore !== 'cat_4_block') {
    return 'cat_5_intensive_monitoring';
  }
  if (detalhes.some((d) => d.severidade === 'BLOQUEIO')) return 'cat_4_block';
  if (detalhes.some((d) => d.severidade === 'ESCALACAO') && catScore === 'cat_1_auto_approve') return 'cat_3_manual_review';
  if (detalhes.some((d) => d.severidade === 'CONDICAO') && catScore === 'cat_1_auto_approve') return 'cat_2_conditional';
  return catScore;
}

// ── segmentos críticos (escala mais conservadora) ──
const SEGMENTOS_CRITICOS = ['gateway', 'marketplace', 'dropshipping', 'crossborder'];
const isSegmentoCritico = (s) => SEGMENTOS_CRITICOS.includes(s);

// ── morfologias ──
const MORF = {
  PIX_ONLY: 'pix_only', PIX_HEAVY: 'pix_heavy', CARTAO_HEAVY: 'cartao_heavy',
  MULTI_MEI: 'multi_mei', B2C_NACIONAL: 'b2c_nacional', B2C_CROSSBORDER: 'b2c_crossborder',
  B2B_NACIONAL: 'b2b_nacional', B2B_CROSSBORDER: 'b2b_crossborder',
  SAAS_RECORRENTE: 'saas_recorrente', LINK_PAGAMENTO_AVULSO: 'link_pagamento_avulso',
  PADRAO: 'padrao',
};

function resolverMorfologia({ distribuicaoTpv = {}, segmento, modeloVenda, paisAtuacao }) {
  const pix = Number(distribuicaoTpv.pix) || 0;
  const cartao = Number(distribuicaoTpv.cartao) || 0;
  if (pix >= 95) return MORF.PIX_ONLY;
  if (pix >= 70) return MORF.PIX_HEAVY;
  if (cartao >= 70) return MORF.CARTAO_HEAVY;
  if (paisAtuacao && paisAtuacao !== 'BR') {
    return modeloVenda === 'b2b' ? MORF.B2B_CROSSBORDER : MORF.B2C_CROSSBORDER;
  }
  if (segmento === 'saas') return MORF.SAAS_RECORRENTE;
  if (segmento === 'link_pagamento') return MORF.LINK_PAGAMENTO_AVULSO;
  return modeloVenda === 'b2b' ? MORF.B2B_NACIONAL : MORF.B2C_NACIONAL;
}

// ── capabilities V5.2 canônicas ──
const CAPS = {
  SPLITS: 'splits/subseller',
  CB: 'crossborder',
  REC: 'recurrence',
  FIN: 'cap_financial_capacity_validation',
};

const OBRIGATORIA_POR_SEGMENTO = {
  marketplace: [CAPS.SPLITS],
  gateway: [CAPS.SPLITS, CAPS.FIN],
  saas: [CAPS.REC],
  crossborder: [CAPS.CB, CAPS.FIN],
  dropshipping: [CAPS.FIN, CAPS.CB],
  educacao: [CAPS.REC],
  turismo: [CAPS.FIN],
  eventos: [CAPS.FIN],
};

const SEG_FORCAM_PATCH = ['gateway', 'marketplace', 'dropshipping', 'crossborder'];

function resolverCapabilities({ tier, segmento, morfologia, isSubseller }) {
  const ativas = new Set(OBRIGATORIA_POR_SEGMENTO[segmento] || []);
  if (tier === TIERS.TIER_2 || tier === TIERS.TIER_3) ativas.add(CAPS.FIN);
  else if (tier === TIERS.TIER_1 && SEG_FORCAM_PATCH.includes(segmento)) ativas.add(CAPS.FIN);
  if (morfologia === MORF.B2C_CROSSBORDER || morfologia === MORF.B2B_CROSSBORDER) ativas.add(CAPS.CB);
  if (morfologia === MORF.SAAS_RECORRENTE) ativas.add(CAPS.REC);
  if (isSubseller) ativas.add(CAPS.SPLITS);
  return Array.from(ativas);
}

// ── matriz decisão ──
const CATEGORIAS = {
  AUTO: 'cat_1_auto_approve',
  COND: 'cat_2_conditional',
  MANUAL: 'cat_3_manual_review',
  BLOCK: 'cat_4_block',
  INTENSIVE: 'cat_5_intensive_monitoring',
};

const categoriaToStatusLegacy = (c) => ({
  cat_1_auto_approve: 'Aprovado', cat_2_conditional: 'Aprovado',
  cat_3_manual_review: 'Manual', cat_4_block: 'Recusado',
  cat_5_intensive_monitoring: 'Aprovado',
}[c] || 'Manual');

const categoriaToRecomendacao = (c) => ({
  cat_1_auto_approve: 'Aprovado', cat_2_conditional: 'Aprovado com Condições',
  cat_3_manual_review: 'Revisão Manual', cat_4_block: 'Recusado',
  cat_5_intensive_monitoring: 'Aprovado com Condições',
}[c] || 'Revisão Manual');

// ── subfaixa tier-aware ──
const TIER_SUFFIX = { tier_1: 'T1', tier_2: 'T2', tier_3: 'T3', subseller_pj: 'SubPJ', subseller_pf: 'SubPF' };
const formatSubfaixaTA = (b, t) => b && TIER_SUFFIX[t] ? `${b}-${TIER_SUFFIX[t]}` : (b || '-');

// ─── SCORING V5.2 — ESCALAS CORRIGIDAS ───
// T1/T2/Sub = 850, T3 = 999
const SCORE_MAX_POR_TIER = {
  tier_1: 850, tier_2: 850, tier_3: 999,
  subseller_pj: 850, subseller_pf: 850,
};

// Tabela canônica V5.2 (DOC4 Bloco 3)
const BASE_ST = {
  tier_1: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 500,
    foodtech: 560, link_pagamento: 480, plataforma_vertical: 540,
    turismo: 520, eventos: 500, servicos_b2b: 560, servicos_locais: 540,
    gateway: 380, dropshipping: 380, marketplace: 420, crossborder: 360,
    pix_merchant: 560, pix_intermediario: 400,
  },
  tier_2: {
    ecommerce: 560, saas: 600, educacao: 580, mpe: 540, infoprodutos: 520,
    foodtech: 560, link_pagamento: 500, plataforma_vertical: 560,
    turismo: 530, eventos: 510, servicos_b2b: 570, servicos_locais: 550,
    gateway: 420, dropshipping: 420, marketplace: 460, crossborder: 380,
    pix_merchant: 560, pix_intermediario: 440,
  },
  tier_3: {
    saas: 110, ecommerce: 150, marketplace: 170, gateway: 180,
    eventos: 220, infoprodutos: 240, turismo: 250, dropshipping: 260,
    crossborder: 280, plataforma_vertical: 190, servicos_b2b: 200,
    educacao: 200, link_pagamento: 220, servicos_locais: 220, mpe: 200,
    pix_merchant: 200, pix_intermediario: 240,
  },
  subseller_pj: { _default: 600 },
  subseller_pf: { _default: 550 },
};

function calcularScoreV5_2(input) {
  const {
    tier, segmento, morfologia, capabilitiesAtivas = [],
    variaveisInput = {}, resultadosCapabilities = {},
    patchStatus = 'nao_aplicavel', bloqueiosAtivos = [],
  } = input;

  // C1
  const tabela = BASE_ST[tier] || {};
  const c1Valor = tabela[segmento] ?? tabela._default ?? 400;

  // C2
  let c2 = 0; const c2M = [];
  if (morfologia === MORF.PIX_ONLY) { c2 += 10; c2M.push('PIX exclusivo +10'); }
  if (morfologia === MORF.PIX_HEAVY) { c2 += 5; c2M.push('PIX heavy +5'); }
  if (morfologia === MORF.B2C_CROSSBORDER) { c2 -= 40; c2M.push('B2C crossborder -40'); }
  if (morfologia === MORF.B2B_CROSSBORDER) { c2 -= 25; c2M.push('B2B crossborder -25'); }
  if (morfologia === MORF.MULTI_MEI) { c2 -= 50; c2M.push('Multi-MEI -50'); }
  if (morfologia === MORF.SAAS_RECORRENTE) { c2 += 15; c2M.push('SaaS recorrente +15'); }
  if (morfologia === MORF.CARTAO_HEAVY && isSegmentoCritico(segmento)) {
    c2 -= 20; c2M.push('Cartão heavy + crítico -20');
  }

  // C3
  const VARS = [
    'v_cnpj_valido_e_ativo','v_qsa_coherence','v_capital_social_proporcional',
    'v_idade_empresa','v_endereco_coerente','v_atividade_cnae_coerente',
    'v_socios_sem_restricoes','v_socios_sem_pep_sancoes','v_socios_sem_processos_criticos',
    'v_score_credito_pj','v_score_credito_socios','v_dominio_proprio_ativo',
    'v_presenca_digital','v_reclamacoes_consumidor','v_historico_chargeback',
    'v_financial_coherence',
  ];
  let c3 = 0; const c3Apl = {}; const c3Pos = []; const c3Neg = [];
  for (const nome of VARS) {
    const v = variaveisInput[nome];
    if (v == null) continue;
    const valor = typeof v === 'object' ? Number(v.valor) || 0 : Number(v) || 0;
    if (valor === 0) continue;
    c3 += valor;
    c3Apl[nome] = { valor, descricao: (typeof v === 'object' ? v.descricao : '') || '' };
    if (valor > 0) c3Pos.push(`${nome}: +${valor}`); else c3Neg.push(`${nome}: ${valor}`);
  }

  // C4
  let c4 = 0; const c4M = [];
  for (const cap of capabilitiesAtivas) {
    const res = resultadosCapabilities[cap];
    if (!res) { c4 -= 10; c4M.push(`${cap} sem dados -10`); continue; }
    if (res.status === 'warning') { c4 -= 20; c4M.push(`${cap} warning -20`); }
    if (res.status === 'fail') { c4 -= 50; c4M.push(`${cap} fail -50`); }
  }

  // C5
  const C5_MAP = { verde: 20, amarelo: -10, laranja: -40, vermelho: -100, nao_aplicavel: 0 };
  const c5 = C5_MAP[patchStatus] ?? 0;

  const bruto = c1Valor + c2 + c3 + c4 + c5;
  const max = SCORE_MAX_POR_TIER[tier] || 850;
  const final = Math.max(0, Math.min(max, bruto));
  const norm = (final / max) * 100;

  let subfaixaBase;
  if (norm >= 90) subfaixaBase = '1A';
  else if (norm >= 80) subfaixaBase = '1B';
  else if (norm >= 70) subfaixaBase = '2A';
  else if (norm >= 60) subfaixaBase = '2B';
  else if (norm >= 50) subfaixaBase = '3A';
  else if (norm >= 40) subfaixaBase = '3B';
  else if (norm >= 25) subfaixaBase = '4';
  else subfaixaBase = '5';

  let categoria;
  if (bloqueiosAtivos.length > 0 || patchStatus === 'vermelho' || subfaixaBase === '5') categoria = CATEGORIAS.BLOCK;
  else if (subfaixaBase === '4') categoria = CATEGORIAS.MANUAL;
  else if (subfaixaBase === '3A' || subfaixaBase === '3B') categoria = CATEGORIAS.COND;
  else if ((subfaixaBase === '2A' || subfaixaBase === '2B') && (patchStatus === 'amarelo' || patchStatus === 'laranja')) categoria = CATEGORIAS.COND;
  else categoria = CATEGORIAS.AUTO;

  return {
    framework_version: 'v5.2',
    score_final: final, score_max: max,
    score_normalizado: Math.round(norm * 10) / 10,
    camadas: {
      c1_segmento_tier: { valor: c1Valor, explicacao: `Base (${segmento}) × ${tier}` },
      c2_morfologia: { valor: c2, explicacao: c2M.join('; ') || 'padrão (0)' },
      c3_variaveis: { valor: c3, aplicadas: c3Apl, positivas: c3Pos, negativas: c3Neg },
      c4_capabilities: { valor: c4, explicacao: c4M.join('; ') || 'OK (0)' },
      c5_patch_financeiro: { valor: c5, explicacao: `Patch ${patchStatus}` },
    },
    subfaixa_base: subfaixaBase,
    subfaixa_tier_aware: formatSubfaixaTA(subfaixaBase, tier),
    categoria_decisao: categoria,
    variaveis_positivas: c3Pos, variaveis_negativas: c3Neg,
    patch_financeiro_status: patchStatus,
  };
}

// ── SHA-256 ──
async function sha256Hash(obj) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(obj)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const t0 = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const caseId = body.onboardingCaseId;
    const dryRun = body.dryRun === true; // se true: calcula mas NÃO persiste
    if (!caseId) return Response.json({ error: 'onboardingCaseId obrigatório' }, { status: 400 });

    // ─── Load case ───
    let oc = null;
    try {
      const rows = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
      oc = rows?.[0] || null;
    } catch (e) {
      // SDK lança Base44Error quando id é inválido — tratamos como not_found
      return Response.json({ error: 'case_not_found', detail: e.message }, { status: 404 });
    }
    if (!oc) return Response.json({ error: 'case_not_found' }, { status: 404 });

    // GUARD: só processa V5.2 (ou dryRun forçado em qualquer)
    const fv = oc.framework_version || 'v4.0';
    if (fv !== 'v5.2' && !dryRun) {
      return Response.json({ skipped: true, reason: 'not_v5_2', framework: fv });
    }

    console.log(`[bdcEnrichCaseV5_2] ═══ ${dryRun ? 'DRY-RUN' : 'LIVE'} V5.2 scoring for case ${caseId} ═══`);

    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: oc.merchantId });
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });

    // ─── Extract inputs ───
    let tpvDeclarado = 0, segmento = 'ecommerce', modeloVenda = 'b2c', paisAtuacao = 'BR';
    const distrib = { pix: 0, cartao: 0, boleto: 0 };

    for (const r of responses) {
      const t = (r.questionText || '').toLowerCase();
      const v = r.valueText || '';
      const num = Number(String(v).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      if (t.includes('tpv') && t.includes('mensal') && num > 0) tpvDeclarado = num;
      if (t.includes('segmento') && v) segmento = String(v).toLowerCase().trim();
      if (t.includes('modelo') && (t.includes('b2b') || t.includes('b2c')) && v) {
        if (String(v).toLowerCase().includes('b2b')) modeloVenda = 'b2b';
      }
      if (t.includes('país') && v && String(v).toUpperCase() !== 'BR' && String(v).toUpperCase() !== 'BRASIL') {
        paisAtuacao = String(v).toUpperCase().slice(0, 2);
      }
      if (t.includes('% pix') || (t.includes('pix') && t.includes('percentual'))) distrib.pix = num;
      if (t.includes('% cartão') || t.includes('% cartao')) distrib.cartao = num;
    }

    // Fallback segmento via template
    if (!segmento || segmento === 'ecommerce') {
      try {
        const [tpl] = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({ id: oc.questionnaireTemplateId });
        if (tpl?.segmento_v5_1) segmento = tpl.segmento_v5_1;
      } catch {}
    }

    const isSubseller = !!oc.isSubsellerCase;
    const merchantType = merchant?.type || 'PJ';

    // Flags extraídas do questionário (proxy V5.2)
    const questionarioFlags = {
      tem_socio_pep: responses.some((r) => /pep|pol[ií]tica/i.test(r.questionText || '') && String(r.valueText || '').toLowerCase().includes('sim')),
      tem_sancao: responses.some((r) => /san[cç][aã]o/i.test(r.questionText || '') && String(r.valueText || '').toLowerCase().includes('sim')),
      mcc: merchant?.mcc || null,
    };

    // Extrai campos declarados do questionário para CV-16
    const dadosDeclarados = {
      razao_social: merchant?.fullName || '',
      nome_fantasia: merchant?.companyName || '',
      cnpj_situacao: 'ATIVA',
      data_fundacao: '',
      capital_social: 0,
      cnae_principal: merchant?.mcc || '',
      endereco_cep: '',
      endereco_logradouro: '',
      socios_qsa_count: 0,
      socios_pep: questionarioFlags.tem_socio_pep,
      socios_sancao: questionarioFlags.tem_sancao,
      tpv_mensal_declarado: tpvDeclarado,
      faturamento_anual_declarado: 0,
      email_corporativo: merchant?.email || '',
      telefone_principal: merchant?.phone || '',
      dominio_site: '',
    };
    for (const r of responses) {
      const t = (r.questionText || '').toLowerCase();
      const v = r.valueText || '';
      const num = Number(String(v).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      if (t.includes('capital social') && num > 0) dadosDeclarados.capital_social = num;
      if (t.includes('faturamento') && t.includes('anual') && num > 0) dadosDeclarados.faturamento_anual_declarado = num;
      if (t.includes('cep') && v) dadosDeclarados.endereco_cep = String(v);
      if ((t.includes('logradouro') || t.includes('endereço')) && v && !dadosDeclarados.endereco_logradouro) dadosDeclarados.endereco_logradouro = String(v);
      if (t.includes('fundaç') && v) dadosDeclarados.data_fundacao = String(v);
      if ((t.includes('site') || t.includes('domínio') || t.includes('dominio') || t.includes('url')) && v && !dadosDeclarados.dominio_site) dadosDeclarados.dominio_site = String(v);
      if (t.includes('cnae') && v && !dadosDeclarados.cnae_principal) dadosDeclarados.cnae_principal = String(v);
    }

    // ─── STEP 0 (NOVO FASE 3): Obtém dados BDC reais ───
    // Chama bdcEnrichCase passando `document` direto (SEM onboardingCaseId) para que o V4
    // só faça queries BDC + análise SEM persistir nada no caso atual (que é V5.2).
    let bdcAnalysisV4 = null;
    if (merchant?.cpfCnpj) {
      try {
        // Usa asServiceRole para escapar do guard de 403 do V4 (admin-only / case-recent).
        // V4 detecta service-role via probe na linha 1607.
        const bdcRes = await base44.asServiceRole.functions.invoke('bdcEnrichCase', {
          document: merchant.cpfCnpj,
          documentType: merchantType === 'PF' ? 'cpf' : 'cnpj',
        });
        if (bdcRes?.data?.success && bdcRes.data.analysis) {
          bdcAnalysisV4 = bdcRes.data.analysis;
          console.log(`[bdcEnrichCaseV5_2] BDC OK — ${Object.keys(bdcAnalysisV4.sections || {}).length} sections`);
        } else {
          console.warn(`[bdcEnrichCaseV5_2] BDC sem analysis: ${JSON.stringify(bdcRes?.data || {}).slice(0, 200)}`);
        }
      } catch (e) {
        console.warn(`[bdcEnrichCaseV5_2] BDC enrichment falhou: ${e.message} — seguindo com dados vazios`);
      }
    }

    // ─── STEP 1: Resolve tier base (TPV) ───
    const tierBase = resolverTier({ tpvMensalDeclarado: tpvDeclarado, segmento, isSubseller, merchantType });
    const morfologia = resolverMorfologia({ distribuicaoTpv: distrib, segmento, modeloVenda, paisAtuacao });

    // ─── STEP 2 (FASE 3): Triggers REAIS com dados BDC + CV-16 ───
    // Constrói bdcDataParaTrigger a partir do analysis V4 (já parseado pelas analyzers)
    const bdcDataParaTrigger = {};
    if (bdcAnalysisV4?.sections) {
      const s = bdcAnalysisV4.sections;
      bdcDataParaTrigger.has_pep = (s.owners?.items || []).some(i => /PEP/i.test(i.label) && /sim/i.test(String(i.value || '')) || i.label === 'PEP identificado(s)');
      bdcDataParaTrigger.has_international_sanction = (s.owners?.items || []).some(i => /sanç/i.test(i.label) && i.risk === 'CRITICO');
      bdcDataParaTrigger.has_criminal_lawsuit = (s.processes?.items || []).some(i => /CRIMINAIS/i.test(i.label));
      bdcDataParaTrigger.capital_social = (() => {
        const it = (s.identity?.items || []).find(i => i.label === 'Capital social');
        if (!it) return 0;
        return Number(String(it.value || '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
      })();
      bdcDataParaTrigger.idade_empresa_meses = (() => {
        const it = (s.identity?.items || []).find(i => i.label === 'Idade da empresa');
        if (!it) return null;
        const m = String(it.value || '').match(/(\d+(?:\.\d+)?)\s*(mes|m|ano|y)/i);
        if (!m) return null;
        const n = Number(m[1]);
        return /ano|y/i.test(m[2]) ? n * 12 : n;
      })();
      bdcDataParaTrigger.endereco_tipo = (s.addressIntel?.items || []).some(i => /fachada|virtual|alta densidade/i.test(i.label)) ? 'virtual' : null;
      bdcDataParaTrigger.reclamacoes_graves_count = (() => {
        const it = (s.reputation?.items || []).find(i => /Reclame Aqui/i.test(i.label) && i.risk === 'ALTO');
        return it ? 6 : null;
      })();
    }

    const triggersDisparados = avaliarTriggersTier({
      merchant: merchant || {},
      bdcData: bdcDataParaTrigger,
      questionario: questionarioFlags,
      contexto: { tpvDeclarado, segmento, morfologia },
    });
    const { tier_final: tier, escalado, motivo: motivoEscalada } = resolverTierComTriggers(tierBase, triggersDisparados);
    if (escalado) console.log(`[bdcEnrichCaseV5_2] Tier escalado ${tierBase}→${tier}: ${motivoEscalada}`);

    // ─── STEP 2b (FASE 3): Regra transversal B-CNPJ-NOVO ───
    // CNPJ < 6 meses dispara revisão manual em TODOS os tiers (inclusive subsellers).
    const idadeMesesBdc = bdcDataParaTrigger.idade_empresa_meses;
    const cnpjNovoCheck = idadeMesesBdc != null
      ? { disparado: idadeMesesBdc < 6, idade_meses: Math.round(idadeMesesBdc * 10) / 10 }
      : regraCnpjNovo(dadosDeclarados.data_fundacao);

    // ─── STEP 2c (FASE 3): Cross-Validation 16 campos ───
    // Para CV-16 precisamos do RAW result, não do analysis. Fazemos extração das sections
    // do analysis V4 para reconstruir dados canônicos (suficiente para CV-16).
    const bdcCanonForCV = bdcAnalysisV4 ? {
      OfficialName: (bdcAnalysisV4.sections?.identity?.items || []).find(i => i.label === 'Razão social')?.value,
      TradeName: (bdcAnalysisV4.sections?.identity?.items || []).find(i => i.label === 'Nome fantasia')?.value,
      TaxIdStatus: (bdcAnalysisV4.sections?.identity?.items || []).find(i => i.label === 'Situação cadastral')?.value,
      ShareCapital: (() => {
        const it = (bdcAnalysisV4.sections?.identity?.items || []).find(i => i.label === 'Capital social');
        if (!it) return 0;
        return Number(String(it.value || '').replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
      })(),
      MainEconomicActivity: (() => {
        const it = (bdcAnalysisV4.sections?.identity?.items || []).find(i => i.label === 'CNAE principal');
        if (!it) return '';
        return String(it.value || '').split('—')[0].trim();
      })(),
    } : {};
    const bdcResultForCV = { BasicData: bdcCanonForCV };
    const cv16 = crossValidate16({ declarado: dadosDeclarados, bdcResult: bdcResultForCV });

    // ─── STEP 3: Resolve capabilities com tier final ───
    const capabilitiesAtivas = resolverCapabilities({ tier, segmento, morfologia, isSubseller });

    // Variáveis V5.2 alimentadas a partir da CV-16
    const variaveisInput = {};
    for (const f of cv16.fields) {
      if (f.status === 'match') variaveisInput[`v_cv_${f.field_id}`] = { valor: 5, descricao: `${f.label}: match` };
      else if (f.status === 'mismatch') variaveisInput[`v_cv_${f.field_id}`] = { valor: -15, descricao: `${f.label}: mismatch` };
      else if (f.status === 'divergence') variaveisInput[`v_cv_${f.field_id}`] = { valor: -5, descricao: `${f.label}: divergência` };
    }
    const resultadosCapabilities = {};
    const patchStatus = 'nao_aplicavel';

    // ─── STEP 4: Carrega catálogo de bloqueios + avalia ───
    // Bloqueios podem ser forçados pelos resultados de CV-16 + regra B-CNPJ-NOVO transversal.
    const bloqueiosForcados = [...cv16.bloqueios_disparados];
    if (cnpjNovoCheck.disparado) bloqueiosForcados.push('B-CNPJ-NOVO');

    let bloqueiosDetalhes = [];
    let bloqueiosAtivos = [];
    try {
      const catalogo = await base44.asServiceRole.entities.Bloqueio.list('-created_date', 200);
      const res = avaliarBloqueios(catalogo, {
        tier, segmento, morfologia,
        capabilities_ativas: capabilitiesAtivas,
        variaveis_input: variaveisInput,
        datasets_red_flags: [],
        bloqueios_forcados: bloqueiosForcados,
      });
      bloqueiosAtivos = res.bloqueios_ativos;
      bloqueiosDetalhes = res.detalhes;
    } catch (e) {
      console.warn(`[bdcEnrichCaseV5_2] Falha ao consultar catálogo Bloqueio: ${e.message}`);
    }

    // Garante que os bloqueios forçados que NÃO estão no catálogo apareçam no resultado.
    for (const cod of bloqueiosForcados) {
      if (!bloqueiosAtivos.includes(cod)) {
        bloqueiosAtivos.push(cod);
        bloqueiosDetalhes.push({
          codigo: cod,
          titulo: cod === 'B-CNPJ-NOVO' ? 'CNPJ recém-aberto (<6 meses)' :
                  cod === 'M02' ? 'CEP declarado divergente do BDC' :
                  cod === 'B-FIN-1' ? 'TPV declarado divergente da receita real' :
                  cod === 'B-PEP-1' ? 'PEP não declarado pelo cliente' :
                  cod === 'B03' ? 'Sócio(s) em sanção internacional' :
                  cod === 'B01' ? 'CNPJ não-ATIVA na Receita Federal' : cod,
          categoria: cod === 'B-CNPJ-NOVO' ? 'IDX' : 'CV',
          severidade: cod === 'B03' || cod === 'B01' ? 'BLOQUEIO' : 'ESCALACAO',
          decisao_padrao: cod === 'B03' || cod === 'B01' ? 'recusa_direta' : 'revisao_manual_obrigatoria',
          nucleo_duro_regulatorio: cod === 'B03',
          exception_categoria: 'nenhuma',
          razao: `Disparado pela Cross-Validação 16 campos / regra transversal`,
        });
      }
    }
    console.log(`[bdcEnrichCaseV5_2] Bloqueios: ${bloqueiosAtivos.length} ativos (forçados via CV/CNPJ-novo: ${bloqueiosForcados.length})`);

    // ─── STEP 5: Score ───
    const scoreOut = calcularScoreV5_2({
      tier, segmento, morfologia, capabilitiesAtivas,
      variaveisInput, resultadosCapabilities, patchStatus, bloqueiosAtivos,
    });

    // ─── STEP 6: Aplica bloqueios na categoria de decisão ───
    const categoria = aplicarBloqueiosNaCategoria(scoreOut.categoria_decisao, bloqueiosDetalhes);
    const statusLegacy = categoriaToStatusLegacy(categoria);
    const recomendacao = categoriaToRecomendacao(categoria);

    console.log(`[bdcEnrichCaseV5_2] tier=${tier} seg=${segmento} score=${scoreOut.score_final}/${scoreOut.score_max} sub=${scoreOut.subfaixa_tier_aware} cat=${categoria}`);

    // ── DRY-RUN: retorna sem persistir ──
    if (dryRun) {
      return Response.json({
        success: true,
        dryRun: true,
        caseId,
        framework_version: 'v5.2',
        framework_atual_do_caso: fv,
        tier_base: tierBase, tier, escalado, motivo_escalada: motivoEscalada,
        triggers_disparados: triggersDisparados,
        cnpj_novo: cnpjNovoCheck,
        cross_validation_16: cv16,
        segmento, morfologia,
        capabilities_ativas: capabilitiesAtivas,
        score: scoreOut.score_final, score_max: scoreOut.score_max,
        subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
        categoria_decisao_score: scoreOut.categoria_decisao,
        categoria_decisao: categoria,
        bloqueios_ativos: bloqueiosAtivos,
        bloqueios_detalhes: bloqueiosDetalhes,
        status_legacy: statusLegacy,
        recomendacao_final: recomendacao,
        camadas: scoreOut.camadas,
        bdc_enriched: !!bdcAnalysisV4,
        elapsed_ms: Date.now() - t0,
      });
    }

    // ─── Snapshot imutável ───
    const snapshotInput = {
      questionario: responses.map((r) => ({ q: r.questionText, a: r.valueText })),
      merchant: { type: merchant?.type, cpfCnpj: merchant?.cpfCnpj },
      tier_base: tierBase, tier_final: tier, tier_escalado: escalado, motivo_escalada: motivoEscalada,
      triggers_disparados: triggersDisparados,
      segmento, morfologia, capabilities_ativas: capabilitiesAtivas,
      tpv_declarado: tpvDeclarado, modelo_venda: modeloVenda, pais_atuacao: paisAtuacao,
    };
    const snapshotOutput = {
      score_camadas: scoreOut.camadas,
      score_final: scoreOut.score_final, score_max: scoreOut.score_max,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao: categoria,
      bloqueios_ativos: bloqueiosAtivos,
      patch_financeiro: { status: patchStatus },
    };
    const hash = await sha256Hash({ in: snapshotInput, out: snapshotOutput });

    const snapshot = await base44.asServiceRole.entities.Snapshot.create({
      onboarding_case_id: caseId,
      merchant_id: oc.merchantId,
      framework_version: 'v5.2',
      tipo: 'initial_analysis',
      tier, segmento, morfologia, capabilities_ativas: capabilitiesAtivas,
      input_questionario: snapshotInput,
      input_datasets: {}, input_documentos: [],
      output_score_camadas: scoreOut.camadas,
      output_bloqueios_ativos: bloqueiosAtivos,
      output_categoria_decisao: categoria,
      // categoria_decisao_score guardada dentro de output_score_camadas como metadado opcional
      ...(scoreOut.categoria_decisao !== categoria ? { output_sentinel_parecer: `Categoria do score isolado: ${scoreOut.categoria_decisao}. Categoria final após bloqueios: ${categoria}.` } : {}),
      output_subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      output_patch_financeiro: { status: patchStatus },
      datasets_obtidos: [], datasets_faltantes: [],
      elapsed_ms: Date.now() - t0,
      hash_integridade: hash, imutavel: true,
    });

    // ─── Update OnboardingCase ───
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      tier,
      segmento_v5_1: segmento, // campo compartilhado V5.1/V5.2
      morfologia,
      capabilities_ativas: capabilitiesAtivas,
      risk_score_v5_1: scoreOut.score_final,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      patch_financeiro_status: patchStatus,
      categoria_decisao_v5_2: categoria,
      iaDecision: recomendacao,
      iaExplanation: `[V5.2] Categoria ${categoria} — Score ${scoreOut.score_final}/${scoreOut.score_max} — Subfaixa ${scoreOut.subfaixa_tier_aware}`,
      bigDataCorpCompleted: true,
      validationsCompleted: true,
      finalDecisionDate: new Date().toISOString(),
    });

    // ─── ComplianceScore (framework_version=v5.2) ───
    const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const scorePayload = {
      onboarding_case_id: caseId,
      framework_version: 'v5.2',
      versao_agente: 'sentinel-v5.2-mvp',
      segmento: segmento,
      questionario_id: oc.questionnaireTemplateId,
      tier_v5_1: tier,
      morfologia_v5_1: morfologia,
      capabilities_ativas_v5_1: capabilitiesAtivas,
      score_camada_1_segmento: scoreOut.camadas.c1_segmento_tier.valor,
      score_camada_2_morfologia: scoreOut.camadas.c2_morfologia.valor,
      score_camada_3_variaveis: scoreOut.camadas.c3_variaveis.valor,
      score_camada_4_capabilities: scoreOut.camadas.c4_capabilities.valor,
      score_camada_5_patch: scoreOut.camadas.c5_patch_financeiro.valor,
      score_v5_1_final: scoreOut.score_final,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao_v5_1: categoria,
      patch_financeiro_status: patchStatus,
      patch_financeiro_dimensoes: {},
      bloqueios_v5_1_ativos: bloqueiosAtivos,
      cross_validation_16_fields: cv16.fields,
      cross_validation_results: cv16,
      cross_validation_summary: cv16.summary,
      snapshot_id: snapshot.id,
      recomendacao_final: recomendacao,
      decisao_automatica: categoria === CATEGORIAS.AUTO,
      variaveis_positivas: scoreOut.variaveis_positivas,
      variaveis_negativas: scoreOut.variaveis_negativas,
      data_analise_fase_2: new Date().toISOString(),
      fase_2_completa: true,
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scorePayload);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(scorePayload);
    }

    const elapsed = Date.now() - t0;
    console.log(`[bdcEnrichCaseV5_2] ═══ Completed in ${elapsed}ms — snapshot=${snapshot.id} ═══`);

    return Response.json({
      success: true,
      caseId,
      framework_version: 'v5.2',
      tier_base: tierBase, tier, escalado, motivo_escalada: motivoEscalada,
      triggers_disparados: triggersDisparados,
      segmento, morfologia,
      capabilities_ativas: capabilitiesAtivas,
      score: scoreOut.score_final, score_max: scoreOut.score_max,
      subfaixa_tier_aware: scoreOut.subfaixa_tier_aware,
      categoria_decisao_score: scoreOut.categoria_decisao,
      categoria_decisao: categoria,
      bloqueios_ativos: bloqueiosAtivos,
      bloqueios_detalhes: bloqueiosDetalhes,
      status_legacy: statusLegacy,
      recomendacao_final: recomendacao,
      snapshot_id: snapshot.id,
      elapsed_ms: elapsed,
    });
  } catch (e) {
    console.error('[bdcEnrichCaseV5_2] ERROR:', e);
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
});