// ─────────────────────────────────────────────────────────────────────
// V5.2 — Cross-Validation 16 campos canônicos (DOC4 §15)
// ─────────────────────────────────────────────────────────────────────
// Função PURA: recebe dados estruturados (declarado + BDC), retorna
// resultado tabular com status por campo + sumário.
//
// 16 campos canônicos V5.1 mantidos em V5.2:
//   1. razao_social                  ← BasicData.OfficialName
//   2. nome_fantasia                 ← BasicData.TradeName
//   3. cnpj_situacao                 ← BasicData.TaxIdStatus
//   4. data_fundacao                 ← BasicData.FoundedDate
//   5. capital_social                ← BasicData.ShareCapital
//   6. cnae_principal                ← BasicData.MainEconomicActivity
//   7. endereco_cep                  ← BasicData.Address.ZipCode
//   8. endereco_logradouro           ← BasicData.Address.Street
//   9. socios_qsa                    ← Relationships
//  10. socios_pep                    ← OwnersKyc.IsPEP
//  11. socios_sancao                 ← OwnersKyc.Sanctions
//  12. tpv_mensal_declarado          ← FinancialData.TotalRevenue/12
//  13. faturamento_anual_declarado   ← FinancialData.TotalRevenue
//  14. email_corporativo             ← EmailsExtended
//  15. telefone_principal            ← PhonesExtended
//  16. dominio_site                  ← Domains
//
// Status por campo:
//   - match: declarado == BDC (ou divergência < 5%)
//   - divergence: declarado != BDC mas dentro de tolerância (5-30%)
//   - mismatch: declarado != BDC fora da tolerância (>30%)
//   - unknown: BDC não retornou dado
// ─────────────────────────────────────────────────────────────────────

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
  return flattenBDCArray(bd)[0] || null;
}

// Normaliza strings p/ comparação (lowercase + sem acento + sem pontuação extra)
function normStr(v) {
  if (!v) return '';
  return String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function normCep(v) {
  return String(v || '').replace(/\D/g, '');
}

function numEqualish(a, b, tolPct = 5) {
  if (a == null || b == null) return null;
  const na = Number(a), nb = Number(b);
  if (!isFinite(na) || !isFinite(nb)) return null;
  if (na === 0 && nb === 0) return 0;
  if (na === 0 || nb === 0) return 100;
  return Math.abs((na - nb) / Math.max(na, nb)) * 100;
}

// Classifica status por divergência %
function classifyByDivergence(divPct) {
  if (divPct == null) return 'unknown';
  if (divPct < 5) return 'match';
  if (divPct < 30) return 'divergence';
  return 'mismatch';
}

// Extrai campos canônicos do BDC result
function extractBdcCanonicalFields(result) {
  const bd = extractBasicData(result) || {};
  const rels = result?.Relationships || result?.relationships;
  const ownersKyc = result?.OwnersKyc || result?.owners_kyc;
  const fd = result?.FinancialData || result?.financial_data;
  const emails = result?.EmailsExtended || result?.emails_extended;
  const phones = result?.PhonesExtended || result?.phones_extended;
  const domains = result?.Domains || result?.domains;

  const addr = safeGet(bd, 'Address') || safeGet(bd, 'address') || {};

  // QSA
  let qsaCount = 0;
  if (rels) {
    const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    if (Array.isArray(entries)) qsaCount = entries.length;
  }

  // PEP/Sanção sócios
  let temPep = false, temSancao = false;
  if (ownersKyc) {
    for (const item of flattenBDCArray(ownersKyc)) {
      if (item?.IsPEP || item?.IsPep) temPep = true;
      const s = item?.Sanctions || [];
      if (Array.isArray(s) && s.length > 0) temSancao = true;
    }
  }

  // Receita anual real
  let receitaAnual = 0;
  if (fd) {
    for (const item of flattenBDCArray(fd)) {
      receitaAnual = Math.max(receitaAnual, Number(item?.TotalRevenue ?? item?.AnnualRevenue ?? item?.Revenue ?? 0));
    }
  }

  // E-mail / Telefone (primeiro encontrado)
  let primeiroEmail = '';
  if (emails) {
    for (const e of flattenBDCArray(emails)) {
      const list = e?.Emails || e?.EmailsList || (Array.isArray(e) ? e : []);
      if (Array.isArray(list) && list.length > 0) {
        primeiroEmail = String(list[0]?.EmailAddress || list[0]?.Email || list[0] || '');
        if (primeiroEmail) break;
      }
    }
  }

  let primeiroTelefone = '';
  if (phones) {
    for (const p of flattenBDCArray(phones)) {
      const list = p?.Phones || p?.PhonesList || (Array.isArray(p) ? p : []);
      if (Array.isArray(list) && list.length > 0) {
        const ph = list[0];
        primeiroTelefone = String(ph?.Number || ph?.PhoneNumber || ph || '');
        if (primeiroTelefone) break;
      }
    }
  }

  // Domínio
  let dominio = '';
  if (domains) {
    for (const d of flattenBDCArray(domains)) {
      const list = d?.Domains || d?.DomainsList || (Array.isArray(d) ? d : []);
      if (Array.isArray(list) && list.length > 0) {
        dominio = String(list[0]?.Domain || list[0] || '');
        if (dominio) break;
      }
    }
  }

  return {
    razao_social: bd?.OfficialName || bd?.CompanyName || '',
    nome_fantasia: bd?.TradeName || bd?.FantasyName || '',
    cnpj_situacao: bd?.TaxIdStatus || bd?.TaxIdStatusDescription || '',
    data_fundacao: bd?.FoundedDate || safeGet(bd, 'Age.FoundedDate') || '',
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

/**
 * Cross-Validação 16 campos.
 *
 * @param {Object} declarado - dados declarados pelo cliente (merchant + responses)
 * @param {Object} bdcResult - resposta merged do BDC (bdcEnrichCase result)
 * @returns {Object} { fields: [...], summary: {...}, bloqueios_disparados: [...] }
 */
export function crossValidate16({ declarado = {}, bdcResult = {} }) {
  const bdc = extractBdcCanonicalFields(bdcResult);
  const fields = [];

  const push = (id, label, declaredValue, bdcValue, status, divPct, opts = {}) => {
    fields.push({
      field_id: id, label,
      declared_value: declaredValue ?? '',
      bdc_value: bdcValue ?? '',
      source_dataset: opts.source || 'basic_data',
      status,
      divergence_pct: divPct == null ? null : Math.round(divPct * 10) / 10,
      peso_v5_1: opts.peso || 1,
      bloqueio_disparado: opts.bloqueio || null,
    });
  };

  // 1. razão social
  {
    const d = normStr(declarado.razao_social);
    const b = normStr(bdc.razao_social);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : (d.includes(b) || b.includes(d)) ? 'divergence' : 'mismatch';
    push('razao_social', 'Razão Social', declarado.razao_social, bdc.razao_social, st, null, { peso: 2 });
  }

  // 2. nome fantasia
  {
    const d = normStr(declarado.nome_fantasia);
    const b = normStr(bdc.nome_fantasia);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : (d.includes(b) || b.includes(d)) ? 'divergence' : 'mismatch';
    else if (!b) st = 'unknown';
    push('nome_fantasia', 'Nome Fantasia', declarado.nome_fantasia, bdc.nome_fantasia, st, null, { peso: 1 });
  }

  // 3. CNPJ situação — bloqueia se não-ATIVA
  {
    const b = String(bdc.cnpj_situacao || '').toUpperCase().trim();
    const st = !b ? 'unknown' : (b === 'ATIVA' || b.startsWith('ATIV')) ? 'match' : 'mismatch';
    push('cnpj_situacao', 'Situação Receita Federal', 'ATIVA (esperado)', bdc.cnpj_situacao, st, null, {
      peso: 5,
      bloqueio: st === 'mismatch' ? 'B01' : null,
      source: 'basic_data',
    });
  }

  // 4. data fundação
  {
    const d = declarado.data_fundacao;
    const b = bdc.data_fundacao;
    let st = 'unknown';
    if (d && b) {
      const dd = new Date(d), bb = new Date(b);
      if (!isNaN(dd) && !isNaN(bb)) {
        const diffDays = Math.abs(dd - bb) / (24 * 3600 * 1000);
        st = diffDays < 30 ? 'match' : diffDays < 180 ? 'divergence' : 'mismatch';
      }
    } else if (b) st = 'unknown';
    push('data_fundacao', 'Data de Fundação', d, b, st, null, { peso: 2 });
  }

  // 5. capital social
  {
    const divPct = numEqualish(declarado.capital_social, bdc.capital_social, 5);
    push('capital_social', 'Capital Social', declarado.capital_social, bdc.capital_social,
      classifyByDivergence(divPct), divPct, { peso: 2 });
  }

  // 6. CNAE principal
  {
    const d = String(declarado.cnae_principal || '').replace(/\D/g, '');
    const b = String(bdc.cnae_principal || '').replace(/\D/g, '');
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : (d.substring(0, 4) === b.substring(0, 4)) ? 'divergence' : 'mismatch';
    push('cnae_principal', 'CNAE Principal', declarado.cnae_principal, bdc.cnae_principal, st, null, { peso: 3 });
  }

  // 7. CEP endereço — bloqueia se mismatch (M02)
  {
    const d = normCep(declarado.endereco_cep);
    const b = normCep(bdc.endereco_cep);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : 'mismatch';
    push('endereco_cep', 'CEP Endereço', declarado.endereco_cep, bdc.endereco_cep, st, null, {
      peso: 3,
      bloqueio: st === 'mismatch' ? 'M02' : null,
    });
  }

  // 8. logradouro
  {
    const d = normStr(declarado.endereco_logradouro);
    const b = normStr(bdc.endereco_logradouro);
    let st = 'unknown';
    if (b && d) st = (d === b || d.includes(b) || b.includes(d)) ? 'match' : 'divergence';
    push('endereco_logradouro', 'Logradouro', declarado.endereco_logradouro, bdc.endereco_logradouro, st, null, { peso: 1 });
  }

  // 9. QSA — qtd sócios declarados vs BDC
  {
    const d = Number(declarado.socios_qsa_count) || 0;
    const b = Number(bdc.socios_qsa_count) || 0;
    let st = 'unknown';
    if (b > 0 || d > 0) st = d === b ? 'match' : Math.abs(d - b) <= 1 ? 'divergence' : 'mismatch';
    push('socios_qsa', 'Sócios no QSA', d, b, st, null, { peso: 3, source: 'relationships' });
  }

  // 10. sócios PEP — divergência se cliente disse "não" mas BDC tem
  {
    const d = declarado.socios_pep === true;
    const b = bdc.socios_pep === true;
    let st = 'unknown';
    if (bdc.socios_pep != null) {
      st = d === b ? 'match' : 'mismatch';
    }
    push('socios_pep', 'Sócios PEP', d ? 'Sim' : 'Não', b ? 'Sim' : 'Não', st, null, {
      peso: 4, source: 'owners_kyc',
      bloqueio: (st === 'mismatch' && b && !d) ? 'B-PEP-1' : null,
    });
  }

  // 11. sócios sancionados — bloqueio B03 se BDC retornou
  {
    const d = declarado.socios_sancao === true;
    const b = bdc.socios_sancao === true;
    let st = 'unknown';
    if (bdc.socios_sancao != null) st = d === b ? 'match' : 'mismatch';
    push('socios_sancao', 'Sócios em Sanção Internacional', d ? 'Sim' : 'Não', b ? 'Sim' : 'Não', st, null, {
      peso: 5, source: 'owners_kyc',
      bloqueio: b ? 'B03' : null,
    });
  }

  // 12. TPV mensal declarado vs receita real / 12
  {
    const d = Number(declarado.tpv_mensal_declarado) || 0;
    const b = bdc.tpv_mensal;
    let st = 'unknown', divPct = null;
    if (d > 0 && b > 0) {
      // TPV declarado pode ser maior que receita (TPV != faturamento), mas se for >3x é alerta.
      divPct = numEqualish(d, b, 5);
      const ratio = d / b;
      if (ratio > 3) st = 'mismatch';
      else if (ratio > 1.5) st = 'divergence';
      else st = 'match';
    }
    push('tpv_mensal_declarado', 'TPV Mensal Declarado', d, b, st, divPct, {
      peso: 4, source: 'financial_data',
      bloqueio: st === 'mismatch' ? 'B-FIN-1' : null,
    });
  }

  // 13. faturamento anual
  {
    const d = Number(declarado.faturamento_anual_declarado) || 0;
    const b = Number(bdc.faturamento_anual) || 0;
    const divPct = numEqualish(d, b, 5);
    push('faturamento_anual_declarado', 'Faturamento Anual', d, b, classifyByDivergence(divPct), divPct, {
      peso: 3, source: 'financial_data',
    });
  }

  // 14. e-mail
  {
    const d = normStr(declarado.email_corporativo);
    const b = normStr(bdc.email_corporativo);
    let st = 'unknown';
    if (b && d) st = d === b ? 'match' : 'divergence';
    push('email_corporativo', 'E-mail Corporativo', declarado.email_corporativo, bdc.email_corporativo, st, null, {
      peso: 1, source: 'emails_extended',
    });
  }

  // 15. telefone
  {
    const d = String(declarado.telefone_principal || '').replace(/\D/g, '');
    const b = String(bdc.telefone_principal || '').replace(/\D/g, '');
    let st = 'unknown';
    if (b && d) {
      // compara últimos 8 dígitos (sem DDD/DDI)
      const dd = d.slice(-8), bb = b.slice(-8);
      st = dd === bb ? 'match' : 'divergence';
    }
    push('telefone_principal', 'Telefone Principal', declarado.telefone_principal, bdc.telefone_principal, st, null, {
      peso: 1, source: 'phones_extended',
    });
  }

  // 16. domínio site
  {
    const d = normStr(declarado.dominio_site).replace(/^https?\/\//, '').replace(/^www/, '');
    const b = normStr(bdc.dominio_site).replace(/^https?\/\//, '').replace(/^www/, '');
    let st = 'unknown';
    if (b && d) st = (d === b || d.includes(b) || b.includes(d)) ? 'match' : 'divergence';
    push('dominio_site', 'Domínio do Site', declarado.dominio_site, bdc.dominio_site, st, null, {
      peso: 1, source: 'domains',
    });
  }

  // ── Sumário ──
  const match_count = fields.filter(f => f.status === 'match').length;
  const divergence_count = fields.filter(f => f.status === 'divergence').length;
  const mismatch_count = fields.filter(f => f.status === 'mismatch').length;
  const unknown_count = fields.filter(f => f.status === 'unknown').length;

  // Score CV: pondera por peso. match=1, divergence=0.5, mismatch=0, unknown=0.3
  let scoreCV = 0, pesoTotal = 0;
  for (const f of fields) {
    pesoTotal += f.peso_v5_1;
    const pts = { match: 1, divergence: 0.5, mismatch: 0, unknown: 0.3 }[f.status] ?? 0;
    scoreCV += pts * f.peso_v5_1;
  }
  const score_cross_val = pesoTotal > 0 ? Math.round((scoreCV / pesoTotal) * 100) : 0;

  // Bloqueios extraídos da CV (deduped)
  const bloqueios_disparados = Array.from(new Set(
    fields.filter(f => f.bloqueio_disparado).map(f => f.bloqueio_disparado)
  ));

  return {
    fields,
    summary: { match_count, divergence_count, mismatch_count, unknown_count, score_cross_val },
    bloqueios_disparados,
  };
}

/**
 * Regra transversal B-CNPJ-NOVO: CNPJ < 6 meses → revisão manual em TODOS
 * os tiers (inclusive subsellers). DOC4 §3.4.
 *
 * @param {string|Date} dataFundacao
 * @returns {{ disparado: boolean, idade_meses: number|null }}
 */
export function regraCnpjNovo(dataFundacao) {
  if (!dataFundacao) return { disparado: false, idade_meses: null };
  const d = new Date(dataFundacao);
  if (isNaN(d)) return { disparado: false, idade_meses: null };
  const meses = (Date.now() - d.getTime()) / (30.44 * 24 * 3600 * 1000);
  return { disparado: meses < 6, idade_meses: Math.round(meses * 10) / 10 };
}

/**
 * Extrai os campos canônicos do BDC para uso em triggers V5.2.
 * Mais leve que crossValidate16 — só os campos usados pelos triggers.
 */
export function extrairBdcParaTriggers(bdcResult) {
  const b = extractBdcCanonicalFields(bdcResult);
  // Idade em meses derivada de data_fundacao
  let idadeMeses = null;
  if (b.data_fundacao) {
    const d = new Date(b.data_fundacao);
    if (!isNaN(d)) idadeMeses = (Date.now() - d.getTime()) / (30.44 * 24 * 3600 * 1000);
  }
  return {
    has_pep: b.socios_pep,
    has_international_sanction: b.socios_sancao,
    has_criminal_lawsuit: false, // será populado pelo analyzer de processos no consumidor
    capital_social: b.capital_social,
    idade_empresa_meses: idadeMeses,
    endereco_tipo: null, // populado por analyzeAddressIntelligence no consumidor
    dominio_idade_dias: null,
    reclamacoes_graves_count: null,
  };
}