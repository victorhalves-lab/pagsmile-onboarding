import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ══════════════════════════════════════════════════════════════════════
// MOTOR DE RISK SCORING — FRAMEWORK COMPLETO
// 3 Camadas | 60 Variáveis | 10 Bloqueios | 8 Subfaixas
// ══════════════════════════════════════════════════════════════════════

const SEGMENTS_BASE = {
  gateway: 175, marketplace: 150, plataforma_vertical: 140,
  dropshipping: 125, infoprodutos: 110, pix_intermediario: 205,
  ecommerce: 75, link_pagamento: 65, pix_merchant: 80,
  saas: 50, foodtech: 50, educacao: 40, mpe: 35,
};
const PIX_ADDON = 30;
const INTERMEDIARIOS = ['gateway', 'marketplace', 'plataforma_vertical', 'pix_intermediario'];
const PIX_SEGS = ['pix_merchant', 'pix_intermediario'];

const SUBFAIXAS = [
  { id: '1A', nome: 'VERDE EXPRESS', min: 0, max: 99, rr: 0, auto: true, mon: 'PADRAO' },
  { id: '1B', nome: 'VERDE', min: 100, max: 199, rr: 0, auto: true, mon: 'PADRAO' },
  { id: '2A', nome: 'AZUL LEVE', min: 200, max: 299, rr: 0, auto: true, mon: 'REFORÇADO_LEVE' },
  { id: '2B', nome: 'AZUL', min: 300, max: 399, rr: 5, auto: true, mon: 'REFORÇADO' },
  { id: '3A', nome: 'AMARELO', min: 400, max: 499, rr: 10, auto: true, mon: 'INTENSO' },
  { id: '3B', nome: 'AMARELO INTENSO', min: 500, max: 599, rr: 15, auto: true, mon: 'INTENSO_PLUS' },
  { id: '4', nome: 'LARANJA', min: 600, max: 849, rr: 15, auto: false, mon: 'MAXIMO' },
  { id: '5', nome: 'VERMELHO', min: 850, max: 1000, rr: 20, auto: false, mon: 'MAXIMO' },
];

function getSubfaixa(score) {
  for (const sf of SUBFAIXAS) { if (score >= sf.min && score <= sf.max) return sf; }
  return SUBFAIXAS[SUBFAIXAS.length - 1];
}

// ── Helper: buscar valor em respostas ──
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
function hasAnswer(responses, keywords) { return getAnswer(responses, keywords) !== null; }
function answerContains(responses, qKeywords, vKeywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    const v = String(r.valueText || r.valueNumber || '').toLowerCase();
    if (qKeywords.some(kw => q.includes(kw)) && vKeywords.some(kw => v.includes(kw))) return true;
  }
  return false;
}
function getNumericAnswer(responses, keywords) {
  for (const r of responses) {
    const q = (r.questionText || '').toLowerCase();
    if (keywords.some(kw => q.includes(kw)) && r.valueNumber != null) return r.valueNumber;
  }
  return null;
}

// ── Inferir segmento ──
function inferSegment(existingScore, responses, template) {
  if (existingScore?.segmento) return existingScore.segmento;
  const texts = responses.map(r => (r.valueText || '').toLowerCase());
  const all = texts.join(' ');
  if (all.includes('gateway') || all.includes('psp')) return 'gateway';
  if (all.includes('marketplace')) return 'marketplace';
  if (all.includes('plataforma vertical')) return 'plataforma_vertical';
  if (all.includes('dropshipping')) return 'dropshipping';
  if (all.includes('infoproduto')) return 'infoprodutos';
  if (all.includes('e-commerce') || all.includes('ecommerce')) return 'ecommerce';
  if (all.includes('saas')) return 'saas';
  if (all.includes('educação') || all.includes('educacao')) return 'educacao';
  if (all.includes('foodtech') || all.includes('food')) return 'foodtech';
  if (all.includes('pix') && (all.includes('intermediário') || all.includes('intermediario'))) return 'pix_intermediario';
  if (all.includes('link de pagamento') || all.includes('link pagamento')) return 'link_pagamento';
  if (all.includes('pix')) return 'pix_merchant';
  return 'mpe';
}

// ══════════════════════════════════════════════════════════════════════
// MOTOR COMPLETO DE 60 VARIÁVEIS + 10 BLOQUEIOS
// ══════════════════════════════════════════════════════════════════════
function calculateFullScore(segmento, responses, existingScore, merchant) {
  const isPix = PIX_SEGS.includes(segmento) || (existingScore?.is_pix === true);
  const isIntermed = INTERMEDIARIOS.includes(segmento);
  
  // ── CAMADA 1: Score Base ──
  const baseCartao = SEGMENTS_BASE[segmento] || 50;
  const c1 = (isPix && !PIX_SEGS.includes(segmento)) ? baseCartao + PIX_ADDON : baseCartao;

  // ── Dados auxiliares ──
  const cnpjStatus = getAnswer(responses, ['situação cadastral', 'situacao_cadastral', 'cnpj']) || '';
  const idadeEmpresa = getNumericAnswer(responses, ['idade', 'anos', 'tempo de empresa', 'data início']) || 
    (existingScore?.variaveis_aplicadas?.V15?.ativa ? 6 : existingScore?.variaveis_aplicadas?.V06?.ativa ? 0.3 : 2);
  const capitalSocial = getNumericAnswer(responses, ['capital social', 'capital']) || 0;
  const isMEI = answerContains(responses, ['mei', 'microempreendedor', 'porte'], ['mei', 'sim', 'microempreendedor']);
  const emailGratuito = answerContains(responses, ['email', 'e-mail'], ['gmail', 'hotmail', 'outlook', 'yahoo']);
  const temSite = answerContains(responses, ['site', 'url', 'website'], ['http', 'www', '.com', '.br']);
  const temMaps = answerContains(responses, ['maps', 'google maps', 'avaliações'], ['sim', 'yes', '50', '100']);
  const temSede = answerContains(responses, ['sede', 'ponto físico', 'endereço comercial'], ['sim', 'yes']);
  const isPEP = answerContains(responses, ['pep', 'pessoa exposta', 'politicamente'], ['sim', 'yes']);
  const pepDeclarado = answerContains(responses, ['pep', 'pessoa exposta'], ['não', 'no', 'nao']);
  const temProcessos = answerContains(responses, ['processo', 'judicial', 'criminal'], ['sim', 'yes']);
  const cbRate = getNumericAnswer(responses, ['chargeback', 'cb', 'taxa de contestação']) || 0;
  const medRate = getNumericAnswer(responses, ['med', 'mecanismo especial']) || 0;
  const temPLD = answerContains(responses, ['pld', 'lavagem', 'prevenção'], ['sim', 'yes', 'implementad']);
  const temKYC = answerContains(responses, ['kyc', 'know your', 'conheça seu'], ['sim', 'yes', 'implementad']);
  const temTM = answerContains(responses, ['monitoramento de transações', 'transaction monitoring'], ['sim', 'yes']);
  const temBCB = answerContains(responses, ['bcb', 'banco central', 'autorização', 'baas'], ['sim', 'yes', 'autorizado', 'baas']);
  const temCO = answerContains(responses, ['compliance officer', 'encarregado'], ['sim', 'yes']);
  const temAntifraude = answerContains(responses, ['antifraude', 'anti-fraude', 'fraud'], ['sim', 'yes']);
  const temAntibolcao = answerContains(responses, ['bolção', 'resolução 518', '518'], ['sim', 'yes']);
  const splitValidado = answerContains(responses, ['split', 'divisão'], ['validado', 'sim', 'yes']);
  const merchantsTransferem = answerContains(responses, ['transfere', 'terceiros', 'repasse'], ['sim', 'yes']);
  const afiliadosSupervisionados = answerContains(responses, ['afiliado', 'supervisão'], ['sim', 'yes']);
  const reguladoCredencial = answerContains(responses, ['credencial', 'crm', 'crefito', 'registro'], ['sim', 'yes']);
  const fornecedorContrato = answerContains(responses, ['fornecedor', 'contrato'], ['sim', 'yes']);
  const contaEncerrada = answerContains(responses, ['conta encerrada', 'conta cancelada'], ['sim', 'yes']);
  const encerradaPLD = answerContains(responses, ['encerrada', 'pld', 'lavagem'], ['sim', 'pld']);
  const notificadoCOAF = answerContains(responses, ['coaf', 'notificação'], ['sim', 'yes']);
  const negativada = answerContains(responses, ['negativação', 'negativada', 'serasa', 'spc'], ['sim', 'yes']);
  const dividaAtiva = answerContains(responses, ['dívida ativa', 'divida ativa'], ['sim', 'yes']);

  // ── BLOQUEIOS B01-B10 ──
  const bloqueios = [];
  // B01: CNPJ inativo
  if (cnpjStatus && !cnpjStatus.includes('ativ') && cnpjStatus.length > 0 && 
      (cnpjStatus.includes('inati') || cnpjStatus.includes('suspens') || cnpjStatus.includes('baixa') || cnpjStatus.includes('nul'))) {
    bloqueios.push('B01_CNPJ_INATIVO');
  }
  // B02: Situação especial / RJ
  if (answerContains(responses, ['recuperação judicial', 'situação especial', 'liquidação'], ['sim', 'yes'])) {
    bloqueios.push('B02_SITUACAO_ESPECIAL');
  }
  // B03: Atividade proibida
  if (answerContains(responses, ['atividade proibida', 'cnae vedado', 'armas', 'jogos de azar', 'criptomoeda'], ['sim', 'yes', 'vedado', 'proibid'])) {
    bloqueios.push('B03_ATIVIDADE_PROIBIDA');
  }
  // B04: OFAC/Sanções (from enrichment)
  if (existingScore?.bloqueios_ativos?.includes('B04_SANCAO_OFAC') || 
      answerContains(responses, ['sanção', 'ofac', 'onu'], ['sim', 'yes', 'positivo'])) {
    bloqueios.push('B04_SANCAO_OFAC');
  }
  // B05: CPF óbito
  if (existingScore?.bloqueios_ativos?.includes('B05_CPF_OBITO') ||
      answerContains(responses, ['óbito', 'falecido'], ['sim', 'yes'])) {
    bloqueios.push('B05_CPF_OBITO');
  }
  // B06-B08: CAF (from enrichment data)
  if (existingScore?.bloqueios_ativos?.includes('B06_DEEPFAKE')) bloqueios.push('B06_DEEPFAKE');
  if (existingScore?.bloqueios_ativos?.includes('B07_DOC_FALSIFICADO')) bloqueios.push('B07_DOC_FALSIFICADO');
  if (existingScore?.bloqueios_ativos?.includes('B08_FACEMATCH_LOW')) bloqueios.push('B08_FACEMATCH_LOW');
  // B09: MEI como intermediário
  if (isMEI && isIntermed) { bloqueios.push('B09_MEI_INTERMEDIARIO'); }
  // B10: RJ + PIX intermediário
  if (answerContains(responses, ['recuperação judicial'], ['sim', 'yes']) && segmento === 'pix_intermediario') {
    bloqueios.push('B10_RJ_PIX_INTERMEDIARIO');
  }

  // Se bloqueio → score 1000
  if (bloqueios.length > 0) {
    return {
      c1, c2: 0, c3: 0, scoreFinal: 1000,
      subfaixa: SUBFAIXAS[7], // Faixa 5
      bloqueios, isPix,
      varsPositivas: [], varsNegativas: [], varsAplicadas: {},
      condicoes: [],
    };
  }

  // ── CAMADA 2: 53 Variáveis (V01-V53 + V54-V60) ──
  const vars = {};
  const addVar = (id, pts, desc, ativa) => {
    vars[id] = { pontos: ativa ? pts : 0, ativa, desc };
  };

  // Dimensão 1: Identidade & Presença Digital
  addVar('V04', 40, 'CNAE vs Segmento incoerente', answerContains(responses, ['cnae', 'incoerên'], ['sim', 'incoerente', 'divergente']));
  addVar('V05', 100, 'Setor regulado sem licença', isIntermed && answerContains(responses, ['regulado', 'financeiro'], ['sim']) && !temBCB);
  addVar('V06', 30, 'Empresa < 6 meses', idadeEmpresa < 0.5);
  addVar('V07', 15, 'Empresa 6-12 meses', idadeEmpresa >= 0.5 && idadeEmpresa < 1);
  addVar('V08', 20, 'Capital desproporcional', capitalSocial > 0 && capitalSocial < 10000 && !['mpe', 'link_pagamento'].includes(segmento));
  addVar('V10', 20, 'E-mail domínio gratuito (intermediário)', isIntermed && emailGratuito);
  addVar('V11', 40, 'Zero presença digital', !temSite && !temMaps);
  addVar('V12', -100, 'Google Maps ≥50 avaliações ≥4★', temMaps);
  addVar('V13', -80, 'Sede física verificada', temSede);
  addVar('V14', -60, 'Site ativo + SSL + plataforma', temSite && ['ecommerce', 'dropshipping', 'infoprodutos', 'saas', 'foodtech'].includes(segmento));
  addVar('V15', -40, 'Empresa > 5 anos', idadeEmpresa > 5);

  // Dimensão 2: PEP & Sanções
  addVar('V16', 80, 'PEP direto', isPEP);
  addVar('V17', 30, 'PEP parente/associado', answerContains(responses, ['pep parente', 'associado pep'], ['sim', 'yes']));
  addVar('V19', 60, 'CEIS / CNEP', answerContains(responses, ['ceis', 'cnep', 'inidône'], ['sim', 'yes']));
  addVar('V20', 120, 'Processos crimes financeiros', temProcessos);
  addVar('V21', 200, 'Crimes contra sistema financeiro', isIntermed && answerContains(responses, ['lei 7492', 'crimes financeiros', 'gestão fraudulenta'], ['sim', 'yes']));
  addVar('V23', 100, 'CPF cancelado/irregular', answerContains(responses, ['cpf irregular', 'cpf cancelado', 'cpf pendente'], ['sim', 'irregular', 'cancelado']));
  addVar('V24', 80, 'Adverse media', answerContains(responses, ['mídia adversa', 'adverse media', 'notícia negativa'], ['sim', 'yes', 'positivo']));
  addVar('V25', 100, 'PEP divergente', pepDeclarado && isPEP);
  addVar('V26', -50, 'Todos checks PEP/sanções limpos', !isPEP && !temProcessos && !negativada);
  addVar('V27', -80, 'Empresa >10 anos + limpa', idadeEmpresa > 10 && vars['V26']?.ativa);

  // Dimensão 3: Transacional
  addVar('V28', 100, 'Chargeback > 2%', cbRate > 2);
  addVar('V29', 50, 'Chargeback 1-2%', cbRate >= 1 && cbRate <= 2);
  addVar('V30', -30, 'Chargeback < 0,5%', cbRate > 0 && cbRate < 0.5);
  addVar('V31', 100, 'MED PIX > 1%', isPix && medRate > 1);
  addVar('V32', 50, 'MED PIX 0,5-1%', isPix && medRate >= 0.5 && medRate <= 1);
  addVar('V33', -30, 'MED PIX < 0,1%', isPix && medRate >= 0 && medRate < 0.1);
  addVar('V34', 60, 'Volume > limite porte', answerContains(responses, ['volume', 'faturamento', 'desproporcional'], ['alto', 'desproporcional']));
  addVar('V35', 80, 'Conta encerrada', contaEncerrada && !encerradaPLD);
  addVar('V36', 200, 'Conta encerrada por PLD', encerradaPLD);
  addVar('V37', 200, 'Notificado COAF', isPix && notificadoCOAF);
  addVar('V38', 30, 'Sem antifraude + vol alto', !temAntifraude && ['dropshipping', 'infoprodutos', 'ecommerce'].includes(segmento));
  addVar('V39', 80, 'NFs divergentes', answerContains(responses, ['nota fiscal', 'nf', 'divergen'], ['divergente', 'inconsist']));
  addVar('V40', -60, 'Volume consistente com NFs', answerContains(responses, ['nota fiscal', 'nf'], ['consistente', 'bate', 'compatível']));
  addVar('V41', -50, 'CB=0% + >2 anos', cbRate === 0 && idadeEmpresa > 2);

  // Dimensão 4: Compliance & Governança (Intermediários)
  addVar('V42', 150, 'Sem BCB/BaaS', isIntermed && !temBCB);
  addVar('V43', 80, 'Sem política PLD/FT', isIntermed && !temPLD);
  addVar('V44', 100, 'Sem KYC de merchants', isIntermed && !temKYC);
  addVar('V45', 60, 'Sem monitoramento de transações', isIntermed && !temTM);
  addVar('V46', 80, 'Sem anti-bolção (Res.518)', segmento === 'pix_intermediario' && !temAntibolcao);
  addVar('V47', 80, 'Split não validado', segmento === 'pix_intermediario' && !splitValidado);
  addVar('V48', 60, 'Merchants transferem terceiros', segmento === 'pix_intermediario' && merchantsTransferem);
  addVar('V49', 40, 'Repasse >D+14', isIntermed && answerContains(responses, ['repasse', 'prazo', 'liquidação'], ['d+14', 'd+15', 'd+30', 'longo']));
  addVar('V52', -100, 'Todos controles OK', isIntermed && temBCB && temPLD && temKYC && temTM && temCO);
  addVar('V53', -30, 'Compliance Officer nomeado', isIntermed && temCO);

  // Dimensão 5: Específico do Segmento
  addVar('V54', 60, 'Afiliados sem supervisão', segmento === 'infoprodutos' && !afiliadosSupervisionados);
  addVar('V55', 60, 'Regulado sem credencial', segmento === 'infoprodutos' && !reguladoCredencial);
  addVar('V56', 40, 'Fornecedor sem contrato', segmento === 'dropshipping' && !fornecedorContrato);
  addVar('V58', 100, 'SaaS processa pgto terceiros', segmento === 'saas' && answerContains(responses, ['pagamento de terceiro', 'processa pagamento'], ['sim', 'yes']));
  addVar('V59', 60, 'Negativada + PIX', isPix && negativada);
  addVar('V60', 80, 'Dívida ativa + PIX vol alto', isPix && segmento === 'pix_intermediario' && dividaAtiva);

  // Soma C2
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

  // ── CAMADA 3: Enriquecimento E01-E11 ──
  let c3 = 0;
  const enrichVars = {};
  const addE = (id, pts, desc, ativa) => {
    enrichVars[id] = { pontos: ativa ? pts : 0, ativa, desc };
    if (ativa) {
      c3 += pts;
      if (pts < 0) varsPositivas.push(id);
      else if (pts > 0) varsNegativas.push(id);
    }
  };

  // Use existing enrichment if available, otherwise infer
  const hasExistingEnrich = existingScore?.variaveis_aplicadas;
  addE('E01', 100, 'PEP divergente (enriquecimento)', pepDeclarado && isPEP);
  addE('E02', 80, 'Processos divergentes', answerContains(responses, ['processo'], ['não']) && temProcessos);
  addE('E03', 80, 'Volume >> NFs', answerContains(responses, ['volume', 'nf'], ['divergente', 'desproporcional']));
  addE('E04', 50, 'Volume alto + 0 empregados', answerContains(responses, ['empregados', 'funcionários'], ['0', 'zero', 'nenhum']));
  addE('E05', 200, 'BCB declarado não confirmado', answerContains(responses, ['bcb'], ['sim']) && !temBCB);
  addE('E06', 30, 'Site declarado mas offline', false); // Would need BDC check
  addE('E07', 60, 'Negativação não mencionada', !answerContains(responses, ['negativação'], ['sim']) && negativada);
  // E08-E10 handled by bloqueios
  addE('E08', 0, 'CAF Liveness deepfake', false);
  addE('E09', 0, 'CAF Face Match <50%', false);
  addE('E10', 0, 'CAF Doc falsificado', false);
  // E11: Tudo confirma
  const noEnrichIssues = !enrichVars['E01']?.ativa && !enrichVars['E02']?.ativa && !enrichVars['E05']?.ativa && !enrichVars['E07']?.ativa;
  addE('E11', -150, 'Tudo confirma BDC+CAF', noEnrichIssues && vars['V26']?.ativa);

  // Merge all vars
  const allVars = { ...vars, ...enrichVars };

  // ── SCORE FINAL ──
  const scoreFinal = Math.max(0, Math.min(849, c1 + c2 + c3));
  const subfaixa = getSubfaixa(scoreFinal);

  // ── CONDIÇÕES AUTOMÁTICAS ──
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

  // RR override for CB>2% even in green
  let rrFinal = subfaixa.rr;
  if (vars['V28']?.ativa && rrFinal < 5) rrFinal = 5;

  return {
    c1, c2, c3, scoreFinal, subfaixa: { ...subfaixa, rr: rrFinal },
    bloqueios: [], isPix,
    varsPositivas, varsNegativas, varsAplicadas: allVars,
    condicoes,
  };
}

// ══════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const cases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1000);
    const existingScores = await base44.asServiceRole.entities.ComplianceScore.list('-created_date', 1000);
    const scoresByCase = {};
    existingScores.forEach(s => { scoresByCase[s.onboarding_case_id] = s; });
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.list('-created_date', 5000);
    const responsesByCase = {};
    responses.forEach(r => {
      if (!responsesByCase[r.onboardingCaseId]) responsesByCase[r.onboardingCaseId] = [];
      responsesByCase[r.onboardingCaseId].push(r);
    });

    const results = [];
    let processed = 0, updated = 0, created = 0, errors = 0;

    for (const caseItem of cases) {
      try {
        const caseId = caseItem.id;
        const existingScore = scoresByCase[caseId];
        const caseResponses = responsesByCase[caseId] || [];
        const segmento = inferSegment(existingScore, caseResponses);

        const result = calculateFullScore(segmento, caseResponses, existingScore);

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
        };

        const caseUpdate = {
          riskScoreV4: result.scoreFinal,
          subfaixa: result.subfaixa.id,
          subfaixaNome: result.subfaixa.nome,
          rollingReservePercent: result.subfaixa.rr,
          monitoramentoNivel: result.subfaixa.mon,
          bloqueiosAtivos: result.bloqueios,
          condicoesAutomaticas: result.condicoes,
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
      summary: { totalCases: cases.length, processed, scoresUpdated: updated, scoresCreated: created, errors },
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});