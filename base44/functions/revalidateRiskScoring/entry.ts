import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ══════════════════════════════════════════════════════════════════════════════
// MOTOR DE RISK SCORING v4.0 — FRAMEWORK COMPLETO CONFORME SPEC
// 3 Camadas | 60 Variáveis | 11 Enriquecimentos | 10 Bloqueios | 7 Subfaixas + Faixa 5 (Bloqueio)
//
// FÓRMULA: Score Final = max(0, min(849, C1 + ΣC2 + ΣC3))
// Score só atinge 850+ por bloqueio B01-B10 (impedimentos legais).
// ══════════════════════════════════════════════════════════════════════════════

// ── CAMADA 1: Score base por segmento (spec Parte 2.2) ──
const SEGMENTS_BASE = {
  gateway: 175,            // Q1
  marketplace: 150,        // Q2
  plataforma_vertical: 140,// Q3
  dropshipping: 125,       // Q4
  infoprodutos: 110,       // Q5
  ecommerce: 75,           // Q6
  link_pagamento: 65,      // Q7
  foodtech: 50,            // Q8
  saas: 50,                // Q9
  educacao: 40,            // Q10
  mpe: 35,                 // Q11
};
// PIX variants (base + 30): pix_merchant = MPE+30 = 65, pix_intermediario = Gateway+30 = 205
const PIX_SEGMENTS = { pix_merchant: 65, pix_intermediario: 205 };

const PIX_ADDON = 30;
const INTERMEDIARIOS = ['gateway', 'marketplace', 'plataforma_vertical', 'pix_intermediario'];
const PIX_SEGS = ['pix_merchant', 'pix_intermediario'];

// ── SUBFAIXAS (spec Parte 3) ──
const SUBFAIXAS = [
  { id: '1A', nome: 'VERDE EXPRESS',    min: 0,   max: 99,  rr: 0,  auto: true,  mon: 'PADRAO' },
  { id: '1B', nome: 'VERDE',            min: 100, max: 199, rr: 0,  auto: true,  mon: 'PADRAO' },
  { id: '2A', nome: 'AZUL LEVE',        min: 200, max: 299, rr: 0,  auto: true,  mon: 'REFORÇADO_LEVE' },
  { id: '2B', nome: 'AZUL',             min: 300, max: 399, rr: 5,  auto: true,  mon: 'REFORÇADO' },
  { id: '3A', nome: 'AMARELO',          min: 400, max: 499, rr: 10, auto: true,  mon: 'INTENSO' },
  { id: '3B', nome: 'AMARELO INTENSO',  min: 500, max: 599, rr: 15, auto: true,  mon: 'INTENSO_PLUS' },
  { id: '4',  nome: 'LARANJA',          min: 600, max: 849, rr: 15, auto: false, mon: 'MAXIMO' },
  { id: '5',  nome: 'VERMELHO',         min: 850, max: 1000,rr: 20, auto: false, mon: 'MAXIMO' },
];

function getSubfaixa(score) {
  for (const sf of SUBFAIXAS) { if (score >= sf.min && score <= sf.max) return sf; }
  return SUBFAIXAS[SUBFAIXAS.length - 1];
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS: Extrair dados de respostas do questionário
// ══════════════════════════════════════════════════════════════════════════════

function getAnswer(responses, keywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const qid = (r.questionId || '').toLowerCase();
    const v = String(r.valueText || r.valueNumber || '').toLowerCase();
    for (const kw of keywords) {
      if (q.includes(kw) || qid.includes(kw) || v.includes(kw)) return v;
    }
  }
  return null;
}

function answerContains(responses, qKeywords, vKeywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const qid = (r.questionId || '').toLowerCase();
    const v = String(r.valueText || r.valueNumber || '').toLowerCase();
    const arr = (r.valueArray || []).map(x => x.toLowerCase());
    const matchQ = qKeywords.some(kw => q.includes(kw) || qid.includes(kw));
    if (!matchQ) continue;
    if (vKeywords.some(kw => v.includes(kw) || arr.some(a => a.includes(kw)))) return true;
  }
  return false;
}

function getNumericAnswer(responses, keywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const qid = (r.questionId || '').toLowerCase();
    if (keywords.some(kw => q.includes(kw) || qid.includes(kw))) {
      if (r.valueNumber != null) return r.valueNumber;
      const parsed = parseFloat(String(r.valueText || '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function answerIs(responses, qKeywords, value) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const qid = (r.questionId || '').toLowerCase();
    const v = String(r.valueText || '').toLowerCase().trim();
    if (qKeywords.some(kw => q.includes(kw) || qid.includes(kw)) && v === value.toLowerCase()) return true;
  }
  return false;
}

// ── Inferir segmento a partir de dados existentes ou respostas ──
function inferSegment(existingScore, responses) {
  if (existingScore?.segmento) return existingScore.segmento;
  const texts = responses.map(r => (r.valueText || '').toLowerCase()).join(' ');
  if (texts.includes('gateway') || texts.includes('psp') || texts.includes('subadquirente')) return 'gateway';
  if (texts.includes('marketplace')) return 'marketplace';
  if (texts.includes('plataforma vertical')) return 'plataforma_vertical';
  if (texts.includes('dropshipping')) return 'dropshipping';
  if (texts.includes('infoproduto')) return 'infoprodutos';
  if (texts.includes('e-commerce') || texts.includes('ecommerce') || texts.includes('loja virtual')) return 'ecommerce';
  if (texts.includes('saas') || texts.includes('software as a service')) return 'saas';
  if (texts.includes('educação') || texts.includes('educacao') || texts.includes('escola')) return 'educacao';
  if (texts.includes('foodtech') || texts.includes('food') || texts.includes('restaurante') || texts.includes('alimentação')) return 'foodtech';
  if (texts.includes('pix') && (texts.includes('intermediário') || texts.includes('intermediario'))) return 'pix_intermediario';
  if (texts.includes('link de pagamento') || texts.includes('link pagamento')) return 'link_pagamento';
  if (texts.includes('pix')) return 'pix_merchant';
  return 'mpe';
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTRAIR DADOS DE ENRIQUECIMENTO REAL (ExternalValidationResult + ComplianceScore existente)
// ══════════════════════════════════════════════════════════════════════════════
function extractEnrichmentData(existingScore, externalValidations, merchant) {
  const enrich = {
    bdcAvailable: false,
    cafAvailable: false,
    // BDC data
    pepDetectedBDC: false,
    processosDetectedBDC: false,
    ceisDetectedBDC: false,
    cnepDetectedBDC: false,
    negativadaBDC: false,
    adverseMediaBDC: false,
    cpfObitoBDC: false,
    cpfIrregularBDC: false,
    sancoesOFAC: false,
    cnpjInativo: false,
    situacaoEspecial: false,
    idadeEmpresa: null,
    capitalSocial: null,
    isMEI: false,
    temSiteBDC: false,
    siteOnlineBDC: false,
    mapsAvaliacoesBDC: 0,
    mapsNotaBDC: 0,
    temSedeBDC: false,
    empregados: null,
    bcbConfirmadoBDC: false,
    volumeNFs: null,
    // CAF data
    livenessOK: null,
    faceMatchScore: null,
    docAutentico: null,
  };

  // From ExternalValidationResult records
  for (const v of externalValidations) {
    if (v.provider === 'BigDataCorp' && v.status === 'Sucesso') {
      enrich.bdcAvailable = true;
      const data = v.resultData || {};
      
      if (data.situacaoCadastral) {
        const sit = data.situacaoCadastral.toLowerCase();
        if (!sit.includes('ativa') && (sit.includes('inati') || sit.includes('suspens') || sit.includes('baixa') || sit.includes('nul'))) {
          enrich.cnpjInativo = true;
        }
      }
      // Also check BDC raw structure: BasicData.TaxIdStatus
      const bdBasic = data.BasicData || data.basic_data;
      if (bdBasic) {
        const bdFirst = Array.isArray(bdBasic) ? bdBasic[0] : bdBasic;
        const txStatus = bdFirst?.TaxIdStatus || bdFirst?.TaxIdStatusDescription || '';
        if (txStatus && !String(txStatus).toUpperCase().includes('ATIV')) {
          enrich.cnpjInativo = true;
        }
        // Company age from BDC
        const founded = bdFirst?.FoundedDate || bdFirst?.Age?.FoundedDate;
        if (founded) {
          enrich.idadeEmpresa = (Date.now() - new Date(founded).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        }
        // Capital
        const cap = bdFirst?.ShareCapital || bdFirst?.Capital;
        if (cap != null) enrich.capitalSocial = Number(cap);
        // MEI
        if (bdFirst?.TaxRegimes?.MEI || bdFirst?.IsMEI) enrich.isMEI = true;
        // Employees
        const emp = bdFirst?.NumberOfEmployees || bdFirst?.EmployeesCount;
        if (emp != null) enrich.empregados = Number(emp);
      }
      // Shell situations
      if (data.situacaoEspecial || data.recuperacaoJudicial) enrich.situacaoEspecial = true;
      if (data.dataAbertura && !enrich.idadeEmpresa) {
        enrich.idadeEmpresa = (Date.now() - new Date(data.dataAbertura).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      }
      if (data.capitalSocial && !enrich.capitalSocial) enrich.capitalSocial = data.capitalSocial;
      if (data.opcaoPeloMei || data.mei) enrich.isMEI = true;
      if (data.pep) enrich.pepDetectedBDC = true;
      if (data.processos) enrich.processosDetectedBDC = true;
      if (data.ceis) enrich.ceisDetectedBDC = true;
      if (data.cnep) enrich.cnepDetectedBDC = true;
      if (data.negativacao || data.negativada) enrich.negativadaBDC = true;
      if (data.adverseMedia) enrich.adverseMediaBDC = true;
      if (data.cpfObito) enrich.cpfObitoBDC = true;
      if (data.cpfIrregular) enrich.cpfIrregularBDC = true;
      if (data.sancoes || data.ofac) enrich.sancoesOFAC = true;
      if (data.bcbAutorizado) enrich.bcbConfirmadoBDC = true;
      if (data.site) enrich.temSiteBDC = true;
      if (data.siteOnline) enrich.siteOnlineBDC = true;
      if (data.googleMapsAvaliacoes) enrich.mapsAvaliacoesBDC = data.googleMapsAvaliacoes;
      if (data.googleMapsNota) enrich.mapsNotaBDC = data.googleMapsNota;
      if (data.sedeVerificada) enrich.temSedeBDC = true;
      if (data.empregados != null && !enrich.empregados) enrich.empregados = data.empregados;
      if (data.volumeNFs != null) enrich.volumeNFs = data.volumeNFs;

      // BDC raw: check KYC for PEP and sanctions
      const kycData = data.Kyc || data.kyc;
      if (kycData) {
        const kycItems = Array.isArray(kycData) ? kycData : [kycData];
        for (const ki of kycItems) {
          if (ki?.IsPEP || ki?.IsPep) enrich.pepDetectedBDC = true;
          const sanctions = ki?.Sanctions || [];
          if (Array.isArray(sanctions) && sanctions.length > 0) enrich.sancoesOFAC = true;
        }
      }
      // BDC raw: check OwnersKyc for PEP
      const ownersKyc = data.OwnersKyc || data.owners_kyc;
      if (ownersKyc) {
        const okItems = Array.isArray(ownersKyc) ? ownersKyc : [ownersKyc];
        for (const oki of okItems) {
          if (oki?.IsPEP || oki?.IsPep) enrich.pepDetectedBDC = true;
          const sanctions = oki?.Sanctions || [];
          if (Array.isArray(sanctions) && sanctions.length > 0) enrich.sancoesOFAC = true;
        }
      }
      // BDC raw: check Processes
      const procs = data.Processes || data.processes || data.Lawsuits || data.lawsuits;
      if (procs) {
        const pItems = Array.isArray(procs) ? procs : [procs];
        for (const pi of pItems) {
          if ((pi?.TotalLawsuits || pi?.NumberOfLawsuits || 0) > 0) enrich.processosDetectedBDC = true;
        }
      }
      // BDC raw: check Collections
      const colls = data.Collections || data.collections;
      if (colls) {
        const cItems = Array.isArray(colls) ? colls : [colls];
        for (const ci of cItems) {
          if (ci?.HasCollectionRecords || (ci?.TotalRecords || 0) > 0) enrich.negativadaBDC = true;
        }
      }
      // BDC raw: check Domains + ActivityIndicators
      const domains = data.Domains || data.domains;
      if (domains) {
        const dItems = Array.isArray(domains) ? domains : [domains];
        if (dItems.some(d => d?.Domain || d?.DomainName)) enrich.temSiteBDC = true;
      }
      const actInd = data.ActivityIndicators || data.activity_indicators;
      if (actInd) {
        const aItems = Array.isArray(actInd) ? actInd : [actInd];
        for (const ai of aItems) {
          if (ai?.HasActiveDomain === true) enrich.siteOnlineBDC = true;
        }
      }
      // BDC raw: adverse media
      const media = data.MediaProfileAndExposure || data.media_profile_and_exposure;
      if (media) {
        const mItems = Array.isArray(media) ? media : [media];
        for (const mi of mItems) {
          const sentiment = String(mi?.Sentiment || mi?.OverallSentiment || '').toUpperCase();
          if (sentiment.includes('NEGATIVE')) enrich.adverseMediaBDC = true;
        }
      }
    }
    
    // ══ CAF data — FIXED: read ACTUAL field names saved by cafVerifyResult ══
    if (v.provider === 'CAF') {
      enrich.cafAvailable = true;
      const data = v.resultData || {};
      
      // FaceLiveness results (saved by cafVerifyResult with these exact field names)
      if (v.validationType === 'FaceLiveness' || v.validationType?.includes('Liveness')) {
        if (data.isAlive === true) enrich.livenessOK = true;
        else if (data.isAlive === false) enrich.livenessOK = false;
        
        // Face match score: use similarity if available, otherwise derive from isMatch
        if (data.similarity != null) {
          enrich.faceMatchScore = Math.round(data.similarity * 100);
        } else if (data.isMatch === true) {
          enrich.faceMatchScore = 100;
        } else if (data.isMatch === false) {
          enrich.faceMatchScore = 0;
        }
        
        // Legacy field names (from older flows)
        if (enrich.livenessOK === null && data.livenessResult != null) {
          enrich.livenessOK = data.livenessResult === 'alive';
        }
        if (enrich.faceMatchScore === null && data.faceMatchScore != null) {
          enrich.faceMatchScore = data.faceMatchScore;
        }
      }
      
      // DocumentDetector results
      if (v.validationType?.includes('Document')) {
        if (data.isCaptureValid === false) {
          enrich.docAutentico = false;
        } else if (data.isCaptureValid === true && enrich.docAutentico !== false) {
          enrich.docAutentico = true;
        }
        // Legacy field name
        if (data.documentAuthenticity) {
          enrich.docAutentico = data.documentAuthenticity !== 'forged';
        }
      }
    }
  }

  // From existing ComplianceScore enrichment analysis (SENTINEL may have enriched)
  if (existingScore) {
    const va = existingScore.variaveis_aplicadas || {};
    if (va.E01?.ativa) enrich.pepDetectedBDC = true;
    if (va.E02?.ativa) enrich.processosDetectedBDC = true;
    if ((existingScore.bloqueios_ativos || []).includes('B04_SANCAO_OFAC')) enrich.sancoesOFAC = true;
    if ((existingScore.bloqueios_ativos || []).includes('B05_CPF_OBITO')) enrich.cpfObitoBDC = true;
    if ((existingScore.bloqueios_ativos || []).includes('B06_DEEPFAKE')) enrich.livenessOK = false;
    if ((existingScore.bloqueios_ativos || []).includes('B07_DOC_FALSIFICADO')) enrich.docAutentico = false;
    if ((existingScore.bloqueios_ativos || []).includes('B08_FACEMATCH_LOW')) enrich.faceMatchScore = 0;
  }

  return enrich;
}

// ══════════════════════════════════════════════════════════════════════════════
// MONITORAMENTO DETALHADO POR SUBFAIXA (spec Parte 3)
// ══════════════════════════════════════════════════════════════════════════════
function buildMonitoramentoDetalhes(subfaixa) {
  const configs = {
    '1A': { frequencia_revisao: 'Anual', alertas_cb: 1.5, alertas_med: 0.5, alertas_pico: 5, revisao_periodica: '12 meses' },
    '1B': { frequencia_revisao: 'Anual', alertas_cb: 1.5, alertas_med: 0.5, alertas_pico: 5, revisao_periodica: '12 meses' },
    '2A': { frequencia_revisao: 'Semanal', alertas_cb: 1.0, alertas_med: 0.3, alertas_pico: 3, revisao_periodica: '6 meses', promocao_se_limpo: '6 meses sem incidente → 1B' },
    '2B': { frequencia_revisao: 'Semanal', alertas_cb: 0.8, alertas_med: 0.2, alertas_pico: 3, revisao_periodica: '3 meses', promocao_se_limpo: '90 dias sem incidente → 2A (RR zerado)' },
    '3A': { frequencia_revisao: 'Diária', alertas_cb: 0.5, alertas_med: 0.1, alertas_pico: 2, revisao_periodica: '60 dias', promocao_se_limpo: '60 dias sem incidente → 2B (RR 10%→5%)' },
    '3B': { frequencia_revisao: 'Diária + relatório semanal', alertas_cb: 0.3, alertas_med: 0.1, alertas_pico: 2, revisao_periodica: '30 dias', promocao_se_limpo: '30 dias sem incidente → 3A (RR 15%→10%)' },
    '4':  { frequencia_revisao: 'Diária + relatório diário + EDD obrigatório', alertas_cb: 0, alertas_med: 0, alertas_pico: 0, revisao_periodica: 'Mensal', promocao_se_limpo: 'Qualquer desvio = suspensão preventiva' },
    '5':  { frequencia_revisao: 'N/A — Bloqueado', alertas_cb: 0, alertas_med: 0, alertas_pico: 0, revisao_periodica: 'N/A', promocao_se_limpo: 'Só Comitê de Compliance pode reverter' },
  };
  return configs[subfaixa.id] || configs['1A'];
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMOÇÃO AUTOMÁTICA DE SUBFAIXA (spec Parte 3)
// Cada subfaixa tem um caminho de promoção se o cliente opera sem incidentes.
// ══════════════════════════════════════════════════════════════════════════════
function buildPromocao(subfaixa) {
  const now = new Date();
  const addDays = (d) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0]; };
  
  const promoMap = {
    '1A': { destino: null, dias: null },      // Já é o melhor
    '1B': { destino: '1A', dias: 365 },       // Revisão anual
    '2A': { destino: '1B', dias: 180 },       // 6 meses sem incidente
    '2B': { destino: '2A', dias: 90 },        // 90 dias sem incidente → RR zerado
    '3A': { destino: '2B', dias: 60 },        // 60 dias sem incidente → RR 10%→5%
    '3B': { destino: '3A', dias: 30 },        // 30 dias sem incidente → RR 15%→10%
    '4':  { destino: '3B', dias: 30 },        // Analista avalia mensalmente
    '5':  { destino: null, dias: null },       // Bloqueado
  };
  
  const promo = promoMap[subfaixa.id] || { destino: null, dias: null };
  return {
    destino: promo.destino,
    proximaData: promo.dias ? addDays(promo.dias) : null,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MOTOR COMPLETO: 60 Variáveis + 11 Enriquecimentos + 10 Bloqueios
// ══════════════════════════════════════════════════════════════════════════════
function calculateFullScore(segmento, responses, existingScore, enrichData) {
  const isPix = PIX_SEGS.includes(segmento) || (existingScore?.is_pix === true);
  const isIntermed = INTERMEDIARIOS.includes(segmento);

  // ══ CAMADA 1: Score Base ══
  let c1;
  if (PIX_SEGMENTS[segmento] != null) {
    c1 = PIX_SEGMENTS[segmento]; // pix_merchant=65, pix_intermediario=205
  } else {
    const baseCartao = SEGMENTS_BASE[segmento] || 50;
    c1 = isPix ? baseCartao + PIX_ADDON : baseCartao;
  }

  // ══ DADOS DO QUESTIONÁRIO ══
  const idadeEmpresa = enrichData.idadeEmpresa ?? 
    getNumericAnswer(responses, ['idade', 'anos', 'tempo de empresa', 'data início']) ?? 
    (existingScore?.variaveis_aplicadas?.V15?.ativa ? 6 : 
     existingScore?.variaveis_aplicadas?.V06?.ativa ? 0.3 : 2);

  const capitalSocial = enrichData.capitalSocial ?? 
    getNumericAnswer(responses, ['capital social', 'capital']) ?? 0;

  const volumeDeclarado = getNumericAnswer(responses, ['volume', 'tpv', 'faturamento', 'receita mensal']) || 0;
  
  const isMEI = enrichData.isMEI || 
    answerContains(responses, ['mei', 'microempreendedor', 'porte'], ['mei', 'sim', 'microempreendedor']);

  const emailGratuito = answerContains(responses, ['email', 'e-mail'], ['gmail', 'hotmail', 'outlook', 'yahoo']);
  
  const temSite = answerContains(responses, ['site', 'url', 'website'], ['http', 'www', '.com', '.br']) || enrichData.temSiteBDC;
  const temMaps = enrichData.mapsAvaliacoesBDC >= 50 && enrichData.mapsNotaBDC >= 4.0 ||
    answerContains(responses, ['maps', 'google maps', 'avaliações'], ['sim', 'yes', '50', '100']);
  const temSede = enrichData.temSedeBDC || 
    answerContains(responses, ['sede', 'ponto físico', 'endereço comercial', 'loja física'], ['sim', 'yes']);

  // PEP: do questionário
  const pepDeclaredYes = answerContains(responses, ['pep', 'pessoa exposta', 'politicamente'], ['sim', 'yes']);
  const pepDeclaredNo = answerContains(responses, ['pep', 'pessoa exposta', 'politicamente'], ['não', 'no', 'nao']);
  // PEP: do BDC (fonte real de enriquecimento)
  const pepFromBDC = enrichData.pepDetectedBDC;
  // PEP efetivo: ou declarou sim, ou BDC detectou
  const isPEP = pepDeclaredYes || pepFromBDC;
  // PEP DIVERGENTE: declarou NÃO mas BDC diz SIM (spec V25/E01)
  const pepDivergente = pepDeclaredNo && pepFromBDC;

  const processosDeclaradosSim = answerContains(responses, ['processo', 'judicial', 'criminal', 'ação judicial'], ['sim', 'yes']);
  const processosDeclaradosNao = answerContains(responses, ['processo', 'judicial', 'criminal', 'ação judicial'], ['não', 'no', 'nao']);
  const processosFromBDC = enrichData.processosDetectedBDC;
  const temProcessos = processosDeclaradosSim || processosFromBDC;
  // PROCESSOS DIVERGENTES: declarou NÃO mas BDC encontrou (spec E02)
  const processosDivergentes = processosDeclaradosNao && processosFromBDC;

  const cbRate = getNumericAnswer(responses, ['chargeback', 'cb', 'taxa de contestação']) ?? 0;
  const medRate = getNumericAnswer(responses, ['med', 'mecanismo especial']) ?? 0;

  const temPLD = answerContains(responses, ['pld', 'lavagem', 'prevenção'], ['sim', 'yes', 'implementad']);
  const temKYC = answerContains(responses, ['kyc', 'know your', 'conheça seu'], ['sim', 'yes', 'implementad']);
  const temTM = answerContains(responses, ['monitoramento de transações', 'transaction monitoring'], ['sim', 'yes']);
  const temBCBDeclarado = answerContains(responses, ['bcb', 'banco central', 'autorização', 'baas'], ['sim', 'yes', 'autorizado', 'baas']);
  const temBCB = temBCBDeclarado || enrichData.bcbConfirmadoBDC;
  const temCO = answerContains(responses, ['compliance officer', 'encarregado', 'gestor de compliance'], ['sim', 'yes']);
  const temAntifraude = answerContains(responses, ['antifraude', 'anti-fraude', 'fraud'], ['sim', 'yes']);
  const temAntibolcao = answerContains(responses, ['bolção', 'resolução 518', '518'], ['sim', 'yes']);
  const splitValidado = answerContains(responses, ['split', 'divisão'], ['validado', 'sim', 'yes']);
  const merchantsTransferem = answerContains(responses, ['transfere', 'terceiros', 'repasse'], ['sim', 'yes']);
  const afiliadosSupervisionados = answerContains(responses, ['afiliado', 'supervisão'], ['sim', 'yes', 'supervisionado']);
  const reguladoCredencial = answerContains(responses, ['credencial', 'crm', 'crefito', 'registro'], ['sim', 'yes']);
  const fornecedorContrato = answerContains(responses, ['fornecedor', 'contrato'], ['sim', 'yes', 'formalizado']);
  const contaEncerrada = answerContains(responses, ['conta encerrada', 'conta cancelada'], ['sim', 'yes']);
  const encerradaPLD = answerContains(responses, ['encerrada', 'pld', 'lavagem'], ['sim', 'pld']);
  const notificadoCOAF = answerContains(responses, ['coaf', 'notificação'], ['sim', 'yes']);
  
  const negativadaDeclarada = answerContains(responses, ['negativação', 'negativada', 'serasa', 'spc'], ['sim', 'yes']);
  const negativadaOculta = !negativadaDeclarada && enrichData.negativadaBDC;
  const negativada = negativadaDeclarada || enrichData.negativadaBDC;
  
  const dividaAtiva = answerContains(responses, ['dívida ativa', 'divida ativa'], ['sim', 'yes']);

  // ══ BLOQUEIOS B01-B10 (spec Parte 5) ══
  const bloqueios = [];

  // B01: CNPJ inativo — RF
  if (enrichData.cnpjInativo) {
    bloqueios.push('B01_CNPJ_INATIVO');
  } else {
    const cnpjStatus = getAnswer(responses, ['situação cadastral', 'situacao_cadastral']) || '';
    if (cnpjStatus && !cnpjStatus.includes('ativ') && 
        (cnpjStatus.includes('inati') || cnpjStatus.includes('suspens') || cnpjStatus.includes('baixa') || cnpjStatus.includes('nul'))) {
      bloqueios.push('B01_CNPJ_INATIVO');
    }
  }

  // B02: Situação especial / RJ
  if (enrichData.situacaoEspecial || answerContains(responses, ['recuperação judicial', 'situação especial', 'liquidação'], ['sim', 'yes'])) {
    bloqueios.push('B02_SITUACAO_ESPECIAL');
  }

  // B03: Atividade proibida (Anexo I)
  if (answerContains(responses, ['atividade proibida', 'cnae vedado', 'armas', 'jogos de azar', 'criptomoeda sem registro'], ['sim', 'yes', 'vedado', 'proibid'])) {
    bloqueios.push('B03_ATIVIDADE_PROIBIDA');
  }

  // B04: Sanção OFAC/ONU/UE
  if (enrichData.sancoesOFAC || answerContains(responses, ['sanção', 'ofac', 'onu'], ['sim', 'yes', 'positivo'])) {
    bloqueios.push('B04_SANCAO_OFAC');
  }

  // B05: CPF óbito
  if (enrichData.cpfObitoBDC || answerContains(responses, ['óbito', 'falecido'], ['sim', 'yes'])) {
    bloqueios.push('B05_CPF_OBITO');
  }

  // B06: CAF Liveness deepfake (E08 → bloqueio)
  if (enrichData.livenessOK === false) bloqueios.push('B06_DEEPFAKE');

  // B07: CAF Doc falsificado (E10 → bloqueio)
  if (enrichData.docAutentico === false) bloqueios.push('B07_DOC_FALSIFICADO');

  // B08: CAF Face Match below threshold (E09 → bloqueio)
  // Threshold is configurable via ComplianceConfig entity (face_match_threshold)
  const faceMatchThreshold = enrichData._faceMatchThreshold ?? 50;
  if (enrichData.faceMatchScore != null && enrichData.faceMatchScore < faceMatchThreshold) bloqueios.push('B08_FACEMATCH_LOW');

  // B09: MEI como intermediário
  if (isMEI && isIntermed) bloqueios.push('B09_MEI_INTERMEDIARIO');

  // B10: RJ + PIX intermediário
  if (enrichData.situacaoEspecial && segmento === 'pix_intermediario') {
    bloqueios.push('B10_RJ_PIX_INTERMEDIARIO');
  } else if (answerContains(responses, ['recuperação judicial'], ['sim', 'yes']) && segmento === 'pix_intermediario') {
    bloqueios.push('B10_RJ_PIX_INTERMEDIARIO');
  }

  // Se bloqueio → score 1000, Faixa 5
  if (bloqueios.length > 0) {
    return {
      c1, c2: 0, c3: 0, scoreFinal: 1000,
      subfaixa: SUBFAIXAS[7],
      bloqueios, isPix,
      varsPositivas: [], varsNegativas: [], varsAplicadas: {},
      condicoes: [],
    };
  }

  // ══ CAMADA 2: Variáveis V04-V60 (spec Parte 4) ══
  const vars = {};
  const addVar = (id, pts, desc, ativa) => {
    vars[id] = { pontos: ativa ? pts : 0, ativa: !!ativa, desc };
  };

  // ── Dimensão 1: Identidade & Presença Digital ──
  addVar('V04', 40, 'CNAE vs Segmento incoerente', 
    answerContains(responses, ['cnae', 'incoerên'], ['sim', 'incoerente', 'divergente']));
  addVar('V05', 100, 'Setor regulado sem licença', 
    isIntermed && answerContains(responses, ['regulado', 'financeiro', 'cnae 64', 'cnae 65', 'cnae 66'], ['sim']) && !temBCB);
  addVar('V06', 30, 'Empresa < 6 meses', idadeEmpresa < 0.5);
  addVar('V07', 15, 'Empresa 6-12 meses', idadeEmpresa >= 0.5 && idadeEmpresa < 1);
  // V08: spec = capital < 1% do volume anualizado | Q1-6 only (gateway, marketplace, plat_vertical, dropshipping, infoprodutos, ecommerce)
  const volAnualizado = volumeDeclarado * 12;
  const V08_SEGMENTS = ['gateway', 'marketplace', 'plataforma_vertical', 'dropshipping', 'infoprodutos', 'ecommerce'];
  addVar('V08', 20, 'Capital desproporcional', 
    capitalSocial > 0 && volAnualizado > 0 && capitalSocial < (volAnualizado * 0.01) && V08_SEGMENTS.includes(segmento));
  addVar('V10', 20, 'E-mail domínio gratuito (intermediário)', isIntermed && emailGratuito);
  addVar('V11', 40, 'Zero presença digital', !temSite && !temMaps);
  addVar('V12', -100, 'Google Maps ≥50 avaliações ≥4★', temMaps);
  addVar('V13', -80, 'Sede física verificada', temSede);
  addVar('V14', -60, 'Site ativo + SSL + plataforma', 
    temSite && ['ecommerce', 'dropshipping', 'infoprodutos', 'saas', 'foodtech'].includes(segmento));
  addVar('V15', -40, 'Empresa > 5 anos', idadeEmpresa > 5);

  // ── Dimensão 2: PEP, Sanções e Crimes ──
  addVar('V16', 80, 'PEP direto', isPEP);
  addVar('V17', 30, 'PEP parente/associado', 
    answerContains(responses, ['pep parente', 'associado pep', 'pep familiar'], ['sim', 'yes']));
  addVar('V19', 60, 'CEIS / CNEP', enrichData.ceisDetectedBDC || enrichData.cnepDetectedBDC || 
    answerContains(responses, ['ceis', 'cnep', 'inidône'], ['sim', 'yes']));
  addVar('V20', 120, 'Processos crimes financeiros', temProcessos);
  addVar('V21', 200, 'Crimes contra sistema financeiro', 
    isIntermed && answerContains(responses, ['lei 7492', 'crimes financeiros', 'gestão fraudulenta'], ['sim', 'yes']));
  addVar('V23', 100, 'CPF cancelado/irregular', 
    enrichData.cpfIrregularBDC || answerContains(responses, ['cpf irregular', 'cpf cancelado'], ['sim', 'irregular', 'cancelado']));
  addVar('V24', 80, 'Adverse media', 
    enrichData.adverseMediaBDC || answerContains(responses, ['mídia adversa', 'adverse media'], ['sim', 'yes', 'positivo']));
  // V25: PEP DIVERGENTE — declarou NÃO mas BDC detectou (FIX gap #3)
  addVar('V25', 100, 'PEP divergente', pepDivergente);
  // V26: Todos checks limpos (questionnaire + BDC)
  addVar('V26', -50, 'Todos checks PEP/sanções limpos', !isPEP && !temProcessos && !negativada && !enrichData.adverseMediaBDC);
  addVar('V27', -80, 'Empresa >10 anos + limpa', idadeEmpresa > 10 && vars['V26']?.ativa);

  // ── Dimensão 3: Transacional ──
  addVar('V28', 100, 'Chargeback > 2%', cbRate > 2);
  addVar('V29', 50, 'Chargeback 1-2%', cbRate >= 1 && cbRate <= 2);
  // V30: CB < 0,5% = -30 | Cartão | Positivo forte. Merchant saudável.
  addVar('V30', -30, 'Chargeback < 0,5%', cbRate >= 0 && cbRate < 0.5 && !isPix);
  addVar('V31', 100, 'MED PIX > 1%', isPix && medRate > 1);
  addVar('V32', 50, 'MED PIX 0,5-1%', isPix && medRate >= 0.5 && medRate <= 1);
  // V33: FIX gap #2 — PIX merchants com MED 0 ou <0.1 recebem o redutor
  addVar('V33', -30, 'MED PIX < 0,1%', isPix && medRate >= 0 && medRate < 0.1);
  addVar('V34', 60, 'Volume > limite porte', 
    answerContains(responses, ['volume', 'faturamento', 'desproporcional'], ['alto', 'desproporcional']));
  addVar('V35', 80, 'Conta encerrada', contaEncerrada && !encerradaPLD);
  addVar('V36', 200, 'Conta encerrada por PLD', encerradaPLD);
  addVar('V37', 200, 'Notificado COAF', isPix && notificadoCOAF);
  addVar('V38', 30, 'Sem antifraude + vol alto', 
    !temAntifraude && ['dropshipping', 'infoprodutos', 'ecommerce'].includes(segmento));
  addVar('V39', 80, 'NFs divergentes', 
    answerContains(responses, ['nota fiscal', 'nf', 'divergen'], ['divergente', 'inconsist']));
  addVar('V40', -60, 'Volume consistente com NFs', 
    answerContains(responses, ['nota fiscal', 'nf'], ['consistente', 'bate', 'compatível']));
  // V41: FIX gap #8 — only activate if cbRate was actually reported (not just default 0)
  const cbWasAnswered = getNumericAnswer(responses, ['chargeback', 'cb', 'taxa de contestação']) != null;
  addVar('V41', -50, 'CB=0% + >2 anos', cbRate === 0 && cbWasAnswered && idadeEmpresa > 2);

  // ── Dimensão 4: Compliance & Governança (Intermediários) ──
  addVar('V42', 150, 'Sem BCB/BaaS', isIntermed && !temBCB);
  addVar('V43', 80, 'Sem política PLD/FT', isIntermed && !temPLD);
  addVar('V44', 100, 'Sem KYC de merchants', isIntermed && !temKYC);
  addVar('V45', 60, 'Sem monitoramento de transações', isIntermed && !temTM);
  addVar('V46', 80, 'Sem anti-bolção (Res.518)', segmento === 'pix_intermediario' && !temAntibolcao);
  addVar('V47', 80, 'Split não validado', segmento === 'pix_intermediario' && !splitValidado);
  addVar('V48', 60, 'Merchants transferem terceiros', segmento === 'pix_intermediario' && merchantsTransferem);
  addVar('V49', 40, 'Repasse >D+14', 
    isIntermed && answerContains(responses, ['repasse', 'prazo', 'liquidação'], ['d+14', 'd+15', 'd+30', 'longo']));
  addVar('V52', -100, 'Todos controles OK', isIntermed && temBCB && temPLD && temKYC && temTM && temCO);
  addVar('V53', -30, 'Compliance Officer nomeado', isIntermed && temCO);

  // ── Dimensão 5: Específico do Segmento ──
  addVar('V54', 60, 'Afiliados sem supervisão', segmento === 'infoprodutos' && !afiliadosSupervisionados);
  addVar('V55', 60, 'Regulado sem credencial', segmento === 'infoprodutos' && !reguladoCredencial);
  addVar('V56', 40, 'Fornecedor sem contrato', segmento === 'dropshipping' && !fornecedorContrato);
  addVar('V58', 100, 'SaaS processa pgto terceiros', 
    segmento === 'saas' && answerContains(responses, ['pagamento de terceiro', 'processa pagamento'], ['sim', 'yes']));
  addVar('V59', 60, 'Negativada + PIX', isPix && negativada);
  addVar('V60', 80, 'Dívida ativa + PIX vol alto', isPix && segmento === 'pix_intermediario' && dividaAtiva);

  // ── Soma C2 ──
  let c2 = 0;
  const varsPositivas = [];
  const varsNegativas = [];
  for (const [id, info] of Object.entries(vars)) {
    if (info.ativa) {
      c2 += info.pontos;
      if (info.pontos < 0) varsPositivas.push(id);
      else if (info.pontos > 0) varsNegativas.push(id);
    }
  }

  // ══ CAMADA 3: Enriquecimento E01-E11 (spec Parte 5) ══
  // CRUZA questionário × dados reais BDC/CAF (FIX gap #6)
  let c3 = 0;
  const enrichVars = {};
  const addE = (id, pts, desc, ativa) => {
    enrichVars[id] = { pontos: ativa ? pts : 0, ativa: !!ativa, desc };
    if (ativa) {
      c3 += pts;
      if (pts < 0) varsPositivas.push(id);
      else if (pts > 0) varsNegativas.push(id);
    }
  };

  // E01: PEP divergente — declarou NÃO, BDC diz SIM (FIX gap #4)
  addE('E01', 100, 'PEP divergente (enriquecimento)', pepDivergente);
  
  // E02: Processos divergentes — declarou NÃO, BDC encontrou (FIX gap #5)
  addE('E02', 80, 'Processos divergentes', processosDivergentes);
  
  // E03: Volume declarado >> NFs (BDC)
  const volDeclared = volumeDeclarado;
  const volNF = enrichData.volumeNFs;
  addE('E03', 80, 'Volume >> NFs', volDeclared > 0 && volNF != null && volDeclared > volNF * 3);
  
  // E04: Volume alto + 0 empregados (BDC)
  addE('E04', 50, 'Volume alto + 0 empregados', 
    enrichData.empregados === 0 && volDeclared > 50000);
  
  // E05: BCB declarado mas BDC não confirma
  addE('E05', 200, 'BCB declarado não confirmado', 
    temBCBDeclarado && enrichData.bdcAvailable && !enrichData.bcbConfirmadoBDC);
  
  // E06: Site declarado mas BDC mostra offline
  addE('E06', 30, 'Site declarado mas offline', 
    temSite && enrichData.bdcAvailable && !enrichData.siteOnlineBDC && enrichData.temSiteBDC === false);
  
  // E07: Negativação não mencionada mas BDC detecta
  addE('E07', 60, 'Negativação não mencionada', negativadaOculta);
  
  // E08-E10: CAF (handled by bloqueios, score contribution = 0 here)
  addE('E08', 0, 'CAF Liveness deepfake', false);
  addE('E09', 0, 'CAF Face Match <50%', false);
  addE('E10', 0, 'CAF Doc falsificado', false);
  
  // E11: TUDO CONFIRMA BDC+CAF — o MAIOR REDUTOR (-150)
  // Condições: checks limpos (V26) + sem divergências de enriquecimento (E01-E07 TODAS inativas)
  const noEnrichIssues = !enrichVars['E01']?.ativa && !enrichVars['E02']?.ativa && 
    !enrichVars['E03']?.ativa && !enrichVars['E04']?.ativa && !enrichVars['E05']?.ativa && 
    !enrichVars['E06']?.ativa && !enrichVars['E07']?.ativa;
  addE('E11', -150, 'Tudo confirma BDC+CAF', noEnrichIssues && vars['V26']?.ativa);

  // Merge all vars
  const allVars = { ...vars, ...enrichVars };

  // ══ SCORE FINAL (spec: max(0, min(849, C1+C2+C3))) ══
  const scoreFinal = Math.max(0, Math.min(849, c1 + c2 + c3));
  const subfaixa = getSubfaixa(scoreFinal);

  // ══ CONDIÇÕES AUTOMÁTICAS ══
  const condicoes = [];
  if (vars['V28']?.ativa) condicoes.push('RR 5% mínimo por CB > 2%');
  if (vars['V44']?.ativa) condicoes.push('Implementar KYC merchants em 60 dias');
  if (vars['V43']?.ativa) condicoes.push('Implementar PLD em 90 dias');
  if (vars['V45']?.ativa) condicoes.push('Implementar TM em 90 dias');
  if (vars['V46']?.ativa) condicoes.push('Implementar anti-bolção em 90 dias');
  if (vars['V47']?.ativa) condicoes.push('Validar contas split em 30 dias');
  if (vars['V48']?.ativa) condicoes.push('Desabilitar transferências a terceiros');
  if (vars['V42']?.ativa) condicoes.push('Formalizar arranjo BaaS');
  if (vars['V35']?.ativa) condicoes.push('Investigar encerramento de conta');
  if (vars['V55']?.ativa) condicoes.push('Obter credencial regulatória em 30 dias');
  if (vars['V54']?.ativa) condicoes.push('Implementar supervisão de afiliados em 60 dias');
  if (vars['V56']?.ativa) condicoes.push('Formalizar contrato com fornecedor');
  if (vars['V23']?.ativa) condicoes.push('Regularizar CPF em 30 dias');
  if (vars['V58']?.ativa) condicoes.push('Reclassificar para Gateway no próximo ciclo de revisão');

  // RR override: CB>2% = RR mínimo 5% mesmo em VERDE (spec regra especial)
  let rrFinal = subfaixa.rr;
  if (vars['V28']?.ativa && rrFinal < 5) rrFinal = 5;

  // ══ MONITORAMENTO DETALHADO (spec Parte 3) ══
  const monitoramentoDetalhes = buildMonitoramentoDetalhes(subfaixa);

  // ══ PROMOÇÃO AUTOMÁTICA (spec Parte 3 — caminho de promoção) ══
  const promocao = buildPromocao(subfaixa);

  return {
    c1, c2, c3, scoreFinal,
    subfaixa: { ...subfaixa, rr: rrFinal },
    bloqueios: [], isPix,
    varsPositivas, varsNegativas, varsAplicadas: allVars,
    condicoes,
    monitoramentoDetalhes,
    promocaoProximaData: promocao.proximaData,
    promocaoDestino: promocao.destino,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ENDPOINT
// ══════════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    // Load all data in parallel
    const [cases, allScores, allResponses, allValidations, allMerchants, complianceConfigs] = await Promise.all([
      base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1000),
      base44.asServiceRole.entities.ComplianceScore.list('-created_date', 1000),
      base44.asServiceRole.entities.QuestionnaireResponse.list('-created_date', 5000),
      base44.asServiceRole.entities.ExternalValidationResult.list('-created_date', 2000),
      base44.asServiceRole.entities.Merchant.list('-created_date', 1000),
      base44.asServiceRole.entities.ComplianceConfig.filter({ isActive: true }).catch(() => []),
    ]);

    // Read configurable face match threshold
    const fmtConfig = complianceConfigs.find(c => c.configKey === 'face_match_threshold');
    const faceMatchThreshold = fmtConfig ? Number(fmtConfig.configValue) : 50;

    // Index by case
    const scoresByCase = {};
    const duplicatesToDelete = [];
    allScores.forEach(s => {
      const caseId = s.onboarding_case_id;
      if (!caseId) return;
      if (scoresByCase[caseId]) {
        const existing = scoresByCase[caseId];
        const existingHasV4 = existing.score_final != null && existing.score_variaveis != null;
        const newHasV4 = s.score_final != null && s.score_variaveis != null;
        if (newHasV4 && !existingHasV4) {
          duplicatesToDelete.push(existing.id);
          scoresByCase[caseId] = s;
        } else {
          duplicatesToDelete.push(s.id);
        }
      } else {
        scoresByCase[caseId] = s;
      }
    });

    const responsesByCase = {};
    allResponses.forEach(r => {
      if (!responsesByCase[r.onboardingCaseId]) responsesByCase[r.onboardingCaseId] = [];
      responsesByCase[r.onboardingCaseId].push(r);
    });

    const validationsByCase = {};
    allValidations.forEach(v => {
      if (!validationsByCase[v.onboardingCaseId]) validationsByCase[v.onboardingCaseId] = [];
      validationsByCase[v.onboardingCaseId].push(v);
    });

    const merchantsById = {};
    allMerchants.forEach(m => { merchantsById[m.id] = m; });

    // Delete duplicates
    let duplicatesDeleted = 0;
    if (!dryRun) {
      for (const dupId of duplicatesToDelete) {
        try { await base44.asServiceRole.entities.ComplianceScore.delete(dupId); duplicatesDeleted++; } catch {}
      }
    }

    const results = [];
    let processed = 0, updated = 0, created = 0, errors = 0;

    for (const caseItem of cases) {
      try {
        const caseId = caseItem.id;
        const existingScore = scoresByCase[caseId];
        const caseResponses = responsesByCase[caseId] || [];
        const caseValidations = validationsByCase[caseId] || [];
        const merchant = merchantsById[caseItem.merchantId];
        const segmento = inferSegment(existingScore, caseResponses);

        // Extract real enrichment data from BDC/CAF
        const enrichData = extractEnrichmentData(existingScore, caseValidations, merchant);
        enrichData._faceMatchThreshold = faceMatchThreshold;

        const result = calculateFullScore(segmento, caseResponses, existingScore, enrichData);

        // Decision mapping (spec Parte 3)
        const recomendacao = result.bloqueios.length > 0 ? 'Recusado'
          : result.subfaixa.auto ? (result.condicoes.length > 0 ? 'Aprovado com Condições' : 'Aprovado')
          : 'Revisão Manual';

        const scoreData = {
          onboarding_case_id: caseId,
          framework_version: 'v4.0',
          segmento,
          is_pix: result.isPix,
          score_base_segmento: result.c1,
          score_variaveis: result.c2,
          score_enriquecimento: result.c3,
          score_final: result.scoreFinal,
          subfaixa: result.subfaixa.id,
          subfaixa_nome: result.subfaixa.nome,
          rolling_reserve_percent: result.subfaixa.rr,
          decisao_automatica: result.subfaixa.auto,
          monitoramento_nivel: result.subfaixa.mon,
          bloqueios_ativos: result.bloqueios,
          variaveis_aplicadas: result.varsAplicadas,
          variaveis_positivas: result.varsPositivas,
          variaveis_negativas: result.varsNegativas,
          condicoes_automaticas: result.condicoes,
          recomendacao_final: recomendacao,
          monitoramento_detalhes: result.monitoramentoDetalhes,
          promocao_proxima_data: result.promocaoProximaData,
          promocao_destino: result.promocaoDestino,
          // Clear legacy SENTINEL fields to avoid confusion
          classificacao_questionario: null,
          classificacao_geral: null,
          classificacao_validacao_externa: null,
          score_questionario: null,
          score_geral_composto: null,
          bonus_consistencia: null,
        };

        const caseStatusMap = {
          'Aprovado': 'Aprovado',
          'Aprovado com Condições': 'Aprovado',
          'Revisão Manual': 'Manual',
          'Recusado': 'Recusado',
        };

        const caseUpdate = {
          riskScoreV4: result.scoreFinal,
          subfaixa: result.subfaixa.id,
          subfaixaNome: result.subfaixa.nome,
          rollingReservePercent: result.subfaixa.rr,
          monitoramentoNivel: result.subfaixa.mon,
          bloqueiosAtivos: result.bloqueios,
          condicoesAutomaticas: result.condicoes,
          status: caseStatusMap[recomendacao] || 'Manual',
          iaDecision: recomendacao,
        };

        if (!dryRun) {
          if (existingScore) {
            await base44.asServiceRole.entities.ComplianceScore.update(existingScore.id, scoreData);
            updated++;
          } else {
            await base44.asServiceRole.entities.ComplianceScore.create(scoreData);
            created++;
          }
          await base44.asServiceRole.entities.OnboardingCase.update(caseId, caseUpdate);
        }

        results.push({
          caseId, merchantId: caseItem.merchantId, segmento,
          c1: result.c1, c2: result.c2, c3: result.c3,
          scoreFinal: result.scoreFinal,
          subfaixa: result.subfaixa.id, subfaixaNome: result.subfaixa.nome,
          rr: result.subfaixa.rr, bloqueios: result.bloqueios.length,
          varsPositivas: result.varsPositivas.length,
          varsNegativas: result.varsNegativas.length,
          condicoes: result.condicoes.length,
          recomendacao,
          action: existingScore ? 'updated' : 'created',
        });
        processed++;
      } catch (err) {
        errors++;
        results.push({ caseId: caseItem.id, error: err.message });
      }
    }

    return Response.json({
      success: true, dryRun,
      summary: {
        totalCases: cases.length, processed,
        scoresUpdated: updated, scoresCreated: created,
        errors, duplicatesDeleted, duplicatesFound: duplicatesToDelete.length,
      },
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});