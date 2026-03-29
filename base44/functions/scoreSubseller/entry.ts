import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ══════════════════════════════════════════════════════════════════════════════
// MOTOR DE RISK SCORING SUBCONTAS v1.0
// Baseado no framework v4.0 do Risk Scoring principal, adaptado para subcontas
// ══════════════════════════════════════════════════════════════════════════════

const SEGMENTS_BASE = {
  gateway: 175, marketplace: 150, plataforma_vertical: 140,
  dropshipping: 125, infoprodutos: 110, ecommerce: 75,
  link_pagamento: 65, foodtech: 50, saas: 50, educacao: 40,
};

const SUBFAIXAS = [
  { id: '1A', nome: 'VERDE EXPRESS',   min: 0,   max: 99,  rr: 0,  auto: true,  mon: 'PADRAO' },
  { id: '1B', nome: 'VERDE',           min: 100, max: 199, rr: 0,  auto: true,  mon: 'PADRAO' },
  { id: '2A', nome: 'AZUL LEVE',       min: 200, max: 299, rr: 0,  auto: true,  mon: 'REFORÇADO_LEVE' },
  { id: '2B', nome: 'AZUL',            min: 300, max: 399, rr: 5,  auto: true,  mon: 'REFORÇADO' },
  { id: '3A', nome: 'AMARELO',         min: 400, max: 499, rr: 10, auto: true,  mon: 'INTENSO' },
  { id: '3B', nome: 'AMARELO INTENSO', min: 500, max: 599, rr: 15, auto: true,  mon: 'INTENSO_PLUS' },
  { id: '4',  nome: 'LARANJA',         min: 600, max: 849, rr: 15, auto: false, mon: 'MAXIMO' },
  { id: '5',  nome: 'VERMELHO',        min: 850, max: 1000,rr: 20, auto: false, mon: 'MAXIMO' },
];

function getSubfaixa(score) {
  for (const sf of SUBFAIXAS) { if (score >= sf.min && score <= sf.max) return sf; }
  return SUBFAIXAS[SUBFAIXAS.length - 1];
}

function getAnswer(responses, keywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const v = String(r.valueText || r.valueNumber || '').toLowerCase();
    for (const kw of keywords) {
      if (q.includes(kw) || v.includes(kw)) return v;
    }
  }
  return null;
}

function answerContains(responses, qKeywords, vKeywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const v = String(r.valueText || r.valueNumber || '').toLowerCase();
    const arr = (r.valueArray || []).map(x => x.toLowerCase());
    const matchQ = qKeywords.some(kw => q.includes(kw));
    if (!matchQ) continue;
    if (vKeywords.some(kw => v.includes(kw) || arr.some(a => a.includes(kw)))) return true;
  }
  return false;
}

function getNumericAnswer(responses, keywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    if (keywords.some(kw => q.includes(kw))) {
      if (r.valueNumber != null) return r.valueNumber;
      const parsed = parseFloat(String(r.valueText || '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function inferSegment(responses) {
  const texts = responses.map(r => (r.valueText || '').toLowerCase()).join(' ');
  if (texts.includes('dropshipping')) return 'dropshipping';
  if (texts.includes('infoproduto')) return 'infoprodutos';
  if (texts.includes('e-commerce') || texts.includes('ecommerce') || texts.includes('loja virtual')) return 'ecommerce';
  if (texts.includes('gateway') || texts.includes('psp') || texts.includes('subadquirente')) return 'gateway';
  if (texts.includes('marketplace')) return 'marketplace';
  if (texts.includes('plataforma vertical')) return 'plataforma_vertical';
  if (texts.includes('saas') || texts.includes('software')) return 'saas';
  if (texts.includes('educação') || texts.includes('educacao') || texts.includes('curso')) return 'educacao';
  if (texts.includes('foodtech') || texts.includes('food') || texts.includes('alimentação')) return 'foodtech';
  if (texts.includes('link de pagamento') || texts.includes('link pagamento')) return 'link_pagamento';
  return 'ecommerce'; // default for subsellers
}

function calculateSubsellerScore(segmento, responses) {
  const c1 = SEGMENTS_BASE[segmento] || 75;

  // Extract answers
  const pepDeclared = answerContains(responses, ['pep', 'pessoa exposta', 'politicamente'], ['sim', 'yes']);
  const sancoesDeclared = answerContains(responses, ['sanção', 'sanções', 'ofac', 'onu'], ['sim', 'yes']);
  const contaSuspensa = answerContains(responses, ['conta suspensa', 'conta cancelada', 'conta encerrada'], ['sim', 'yes']);
  const cbAlto = answerContains(responses, ['chargeback', 'cb'], ['sim', 'yes']);
  const medAlto = answerContains(responses, ['med', 'mecanismo especial', 'méd'], ['sim', 'yes']);
  const temSite = answerContains(responses, ['site', 'url', 'website'], ['http', 'www', '.com', '.br']);
  const tpv = getNumericAnswer(responses, ['volume mensal', 'tpv']) || 0;
  const ticketMedio = getNumericAnswer(responses, ['ticket médio', 'ticket medio']) || 0;

  // Bloqueios
  const bloqueios = [];
  if (sancoesDeclared) bloqueios.push('B04_SANCAO_OFAC');
  
  const cnpjStatus = getAnswer(responses, ['situação cadastral', 'situacao_cadastral']) || '';
  if (cnpjStatus && !cnpjStatus.includes('ativ') && (cnpjStatus.includes('inati') || cnpjStatus.includes('suspens') || cnpjStatus.includes('baixa'))) {
    bloqueios.push('B01_CNPJ_INATIVO');
  }

  if (bloqueios.length > 0) {
    return {
      c1, c2: 0, scoreFinal: 1000, subfaixa: SUBFAIXAS[7],
      bloqueios, varsPositivas: [], varsNegativas: [], varsAplicadas: {},
      condicoes: [], pontosPositivos: [], pontosAtencao: [], redFlags: bloqueios.map(b => `Bloqueio: ${b}`),
    };
  }

  // Variables
  const vars = {};
  const addVar = (id, pts, desc, ativa) => {
    vars[id] = { pontos: ativa ? pts : 0, ativa: !!ativa, desc };
  };

  // ── Identity & Presence ──
  addVar('SV01', 40, 'Sem site/presença digital', !temSite);
  addVar('SV02', -40, 'Site ativo', temSite);

  // ── PEP & Compliance ──
  addVar('SV03', 80, 'PEP declarado', pepDeclared);
  addVar('SV04', 80, 'Conta suspensa/cancelada', contaSuspensa);
  addVar('SV05', -50, 'Sem flags PEP/sanções', !pepDeclared && !sancoesDeclared && !contaSuspensa);

  // ── Transactional ──
  addVar('SV06', 100, 'Chargeback > 2%', cbAlto);
  addVar('SV07', 100, 'MED > 2%', medAlto);
  addVar('SV08', 40, 'TPV alto sem presença digital', tpv > 100000 && !temSite);

  // ── Segment-specific ──
  // Dropshipping
  const isDropshipping = segmento === 'dropshipping';
  const semRastreamento = isDropshipping && !answerContains(responses, ['rastreamento'], ['sim', 'yes', '100%']);
  const semContratoFornecedor = isDropshipping && !answerContains(responses, ['contrato', 'fornecedor'], ['sim', 'yes']);
  const prazoEntregaAlto = isDropshipping && (getNumericAnswer(responses, ['prazo', 'entrega', 'tempo médio']) || 0) > 30;
  const paisOrigemChina = isDropshipping && answerContains(responses, ['país de origem', 'pais de origem'], ['china']);
  addVar('SV10', 60, 'Dropshipping sem rastreamento', semRastreamento);
  addVar('SV11', 40, 'Dropshipping sem contrato fornecedor', semContratoFornecedor);
  addVar('SV12', 30, 'Dropshipping prazo > 30 dias', prazoEntregaAlto);
  addVar('SV13', 20, 'Dropshipping origem China', paisOrigemChina);
  addVar('SV14', -30, 'Dropshipping com rastreamento 100%', isDropshipping && !semRastreamento);

  // Infoprodutos
  const isInfoprodutos = segmento === 'infoprodutos';
  const afiliadosSemSupervisao = isInfoprodutos && answerContains(responses, ['afiliado'], ['sim', 'yes']) && !answerContains(responses, ['supervisionado', 'supervisão'], ['sim', 'yes']);
  const semPlataformaAcesso = isInfoprodutos && !answerContains(responses, ['plataforma', 'ambiente', 'acesso'], ['sim', 'yes', 'hotmart', 'eduzz', 'kiwify', 'monetizze']);
  addVar('SV15', 60, 'Afiliados sem supervisão', afiliadosSemSupervisao);
  addVar('SV16', 40, 'Sem plataforma de acesso ao conteúdo', semPlataformaAcesso);

  // E-commerce
  const isEcommerce = segmento === 'ecommerce';
  const semEstoque = isEcommerce && !answerContains(responses, ['estoque'], ['sim', 'yes', 'próprio']);
  const produtoRegulado = isEcommerce && answerContains(responses, ['regulado', 'medicamento', 'arma'], ['sim', 'yes']);
  addVar('SV17', 30, 'E-commerce sem estoque próprio', semEstoque);
  addVar('SV18', 60, 'E-commerce produto regulado', produtoRegulado);

  // Gateway/Marketplace
  const isIntermed = ['gateway', 'marketplace', 'plataforma_vertical'].includes(segmento);
  const semKYC = isIntermed && !answerContains(responses, ['kyc', 'know your'], ['sim', 'yes']);
  const semPLD = isIntermed && !answerContains(responses, ['pld', 'lavagem'], ['sim', 'yes']);
  const semBCB = isIntermed && !answerContains(responses, ['bcb', 'banco central', 'baas'], ['sim', 'yes']);
  addVar('SV19', 100, 'Intermediário sem KYC', semKYC);
  addVar('SV20', 80, 'Intermediário sem PLD', semPLD);
  addVar('SV21', 150, 'Intermediário sem BCB/BaaS', semBCB);
  addVar('SV22', -100, 'Intermediário com todos controles', isIntermed && !semKYC && !semPLD && !semBCB);

  // Educação
  const isEducacao = segmento === 'educacao';
  const temMEC = isEducacao && answerContains(responses, ['mec', 'credenciamento'], ['sim', 'yes']);
  addVar('SV23', -30, 'Educação com MEC', temMEC);

  // Foodtech
  const isFoodtech = segmento === 'foodtech';
  const semAlvara = isFoodtech && !answerContains(responses, ['alvará', 'sanitário', 'anvisa'], ['sim', 'yes']);
  addVar('SV24', 40, 'Foodtech sem alvará sanitário', semAlvara);

  // SaaS
  const isSaaS = segmento === 'saas';
  const processaPgtoTerceiros = isSaaS && answerContains(responses, ['pagamento', 'terceiro'], ['sim', 'yes']);
  addVar('SV25', 100, 'SaaS processa pgto terceiros', processaPgtoTerceiros);

  // Sum C2
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

  const scoreFinal = Math.max(0, Math.min(849, c1 + c2));
  const subfaixa = getSubfaixa(scoreFinal);

  // Conditions
  const condicoes = [];
  if (vars['SV06']?.ativa) condicoes.push('RR mínimo 5% por CB alto');
  if (vars['SV10']?.ativa) condicoes.push('Implementar rastreamento de 100% das entregas');
  if (vars['SV11']?.ativa) condicoes.push('Formalizar contrato com fornecedor');
  if (vars['SV15']?.ativa) condicoes.push('Implementar supervisão de afiliados');
  if (vars['SV19']?.ativa) condicoes.push('Implementar KYC em 60 dias');
  if (vars['SV20']?.ativa) condicoes.push('Implementar PLD em 90 dias');
  if (vars['SV21']?.ativa) condicoes.push('Formalizar arranjo BaaS');
  if (vars['SV24']?.ativa) condicoes.push('Obter alvará sanitário');
  if (vars['SV25']?.ativa) condicoes.push('Reclassificar para Gateway');

  // Build human-readable insights
  const pontosPositivos = [];
  const pontosAtencao = [];
  const redFlags = [];

  if (vars['SV02']?.ativa) pontosPositivos.push('Possui site ativo');
  if (vars['SV05']?.ativa) pontosPositivos.push('Sem flags de PEP/sanções');
  if (vars['SV14']?.ativa) pontosPositivos.push('Rastreamento de entregas em 100%');
  if (vars['SV22']?.ativa) pontosPositivos.push('Todos controles de intermediário OK');
  if (vars['SV23']?.ativa) pontosPositivos.push('Credenciado pelo MEC');

  if (vars['SV01']?.ativa) pontosAtencao.push('Sem presença digital');
  if (vars['SV08']?.ativa) pontosAtencao.push('TPV alto sem presença digital');
  if (vars['SV12']?.ativa) pontosAtencao.push('Prazo de entrega acima de 30 dias');
  if (vars['SV13']?.ativa) pontosAtencao.push('Produtos originados da China');
  if (vars['SV17']?.ativa) pontosAtencao.push('E-commerce sem estoque próprio');

  if (vars['SV03']?.ativa) redFlags.push('Sócio/representante PEP');
  if (vars['SV04']?.ativa) redFlags.push('Conta suspensa/cancelada anteriormente');
  if (vars['SV06']?.ativa) redFlags.push('Chargeback acima de 2%');
  if (vars['SV07']?.ativa) redFlags.push('MED acima de 2%');
  if (vars['SV10']?.ativa) redFlags.push('Dropshipping sem rastreamento de entregas');
  if (vars['SV18']?.ativa) redFlags.push('Vende produtos regulados');
  if (vars['SV21']?.ativa) redFlags.push('Intermediário sem autorização BCB');

  let rrFinal = subfaixa.rr;
  if (vars['SV06']?.ativa && rrFinal < 5) rrFinal = 5;

  return {
    c1, c2, scoreFinal,
    subfaixa: { ...subfaixa, rr: rrFinal },
    bloqueios: [], varsPositivas, varsNegativas, varsAplicadas: vars,
    condicoes, pontosPositivos, pontosAtencao, redFlags,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const targetCaseId = body.caseId; // optional: score single case

    // Load data
    const [allCases, allScores, allResponses, allMerchants] = await Promise.all([
      base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1000),
      base44.asServiceRole.entities.SubsellerScore.list('-created_date', 1000),
      base44.asServiceRole.entities.QuestionnaireResponse.list('-created_date', 5000),
      base44.asServiceRole.entities.Merchant.list('-created_date', 1000),
    ]);

    // Filter subseller cases
    const subsellerCases = allCases.filter(c => {
      if (targetCaseId) return c.id === targetCaseId;
      return c.isSubsellerCase === true;
    });

    const scoresByCase = {};
    allScores.forEach(s => { if (s.onboarding_case_id) scoresByCase[s.onboarding_case_id] = s; });

    const responsesByCase = {};
    allResponses.forEach(r => {
      if (!responsesByCase[r.onboardingCaseId]) responsesByCase[r.onboardingCaseId] = [];
      responsesByCase[r.onboardingCaseId].push(r);
    });

    const merchantsById = {};
    allMerchants.forEach(m => { merchantsById[m.id] = m; });

    const results = [];
    let processed = 0, updated = 0, created = 0, errors = 0;

    for (const caseItem of subsellerCases) {
      try {
        const caseId = caseItem.id;
        const caseResponses = responsesByCase[caseId] || [];
        const segmento = inferSegment(caseResponses);
        const result = calculateSubsellerScore(segmento, caseResponses);

        const recomendacao = result.bloqueios.length > 0 ? 'Recusado'
          : result.subfaixa.auto ? (result.condicoes.length > 0 ? 'Aprovado com Condições' : 'Aprovado')
          : 'Revisão Manual';

        const scoreData = {
          onboarding_case_id: caseId,
          parent_merchant_id: caseItem.parentMerchantId || null,
          segmento,
          score_base_segmento: result.c1,
          score_variaveis: result.c2,
          score_final: result.scoreFinal,
          subfaixa: result.subfaixa.id,
          subfaixa_nome: result.subfaixa.nome,
          rolling_reserve_percent: result.subfaixa.rr,
          decisao_automatica: result.subfaixa.auto,
          recomendacao_final: recomendacao,
          bloqueios_ativos: result.bloqueios,
          variaveis_aplicadas: result.varsAplicadas,
          variaveis_positivas: result.varsPositivas,
          variaveis_negativas: result.varsNegativas,
          condicoes_automaticas: result.condicoes,
          monitoramento_nivel: result.subfaixa.mon,
          pontos_positivos: result.pontosPositivos,
          pontos_atencao: result.pontosAtencao,
          red_flags: result.redFlags,
          parecer_final: `Subseller classificado como ${result.subfaixa.nome} (${result.subfaixa.id}) - Score ${result.scoreFinal}/1000 - Segmento: ${segmento}`,
        };

        const caseUpdate = {
          riskScoreV4: result.scoreFinal,
          subfaixa: result.subfaixa.id,
          subfaixaNome: result.subfaixa.nome,
          rollingReservePercent: result.subfaixa.rr,
          monitoramentoNivel: result.subfaixa.mon,
          bloqueiosAtivos: result.bloqueios,
          condicoesAutomaticas: result.condicoes,
          status: result.bloqueios.length > 0 ? 'Recusado' : result.subfaixa.auto ? 'Aprovado' : 'Manual',
          iaDecision: recomendacao,
        };

        if (!dryRun) {
          const existing = scoresByCase[caseId];
          if (existing) {
            await base44.asServiceRole.entities.SubsellerScore.update(existing.id, scoreData);
            updated++;
          } else {
            await base44.asServiceRole.entities.SubsellerScore.create(scoreData);
            created++;
          }
          await base44.asServiceRole.entities.OnboardingCase.update(caseId, caseUpdate);
        }

        results.push({
          caseId, segmento, scoreFinal: result.scoreFinal,
          subfaixa: result.subfaixa.id, recomendacao,
          bloqueios: result.bloqueios.length,
          redFlags: result.redFlags.length,
          action: scoresByCase[caseId] ? 'updated' : 'created',
        });
        processed++;
      } catch (err) {
        errors++;
        results.push({ caseId: caseItem.id, error: err.message });
      }
    }

    return Response.json({
      success: true, dryRun,
      summary: { totalCases: subsellerCases.length, processed, updated, created, errors },
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});