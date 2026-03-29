import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ── Configuração do motor de scoring ──
const SEGMENTS_BASE = {
  gateway: 175, marketplace: 150, plataforma_vertical: 140,
  dropshipping: 125, infoprodutos: 110, pix_intermediario: 205,
  ecommerce: 75, link_pagamento: 65, pix_merchant: 80,
  saas: 50, foodtech: 50, educacao: 40, mpe: 35,
};

const PIX_ADDON = 30;

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
  for (const sf of SUBFAIXAS) {
    if (score >= sf.min && score <= sf.max) return sf;
  }
  return SUBFAIXAS[SUBFAIXAS.length - 1];
}

function inferSegment(existingScore, responses) {
  // Use existing segment if available
  if (existingScore?.segmento) return existingScore.segmento;
  
  // Try to infer from responses
  const responseTexts = responses.map(r => (r.valueText || '').toLowerCase());
  if (responseTexts.some(t => t.includes('gateway') || t.includes('psp'))) return 'gateway';
  if (responseTexts.some(t => t.includes('marketplace'))) return 'marketplace';
  if (responseTexts.some(t => t.includes('plataforma'))) return 'plataforma_vertical';
  if (responseTexts.some(t => t.includes('dropshipping'))) return 'dropshipping';
  if (responseTexts.some(t => t.includes('infoproduto'))) return 'infoprodutos';
  if (responseTexts.some(t => t.includes('ecommerce') || t.includes('e-commerce'))) return 'ecommerce';
  if (responseTexts.some(t => t.includes('saas'))) return 'saas';
  if (responseTexts.some(t => t.includes('educação') || t.includes('educacao'))) return 'educacao';
  if (responseTexts.some(t => t.includes('food'))) return 'foodtech';
  if (responseTexts.some(t => t.includes('pix') && t.includes('intermediário'))) return 'pix_intermediario';
  if (responseTexts.some(t => t.includes('pix'))) return 'pix_merchant';
  return 'mpe';
}

function calculateVariables(existingScore, responses) {
  const vars = { positivas: [], negativas: [], total: 0 };
  
  // If the existing score already has variable data, recalculate from that
  if (existingScore?.variaveis_aplicadas && typeof existingScore.variaveis_aplicadas === 'object') {
    const applied = existingScore.variaveis_aplicadas;
    for (const [key, info] of Object.entries(applied)) {
      if (info?.ativa && info?.pontos != null) {
        vars.total += info.pontos;
        if (info.pontos < 0) vars.positivas.push(key);
        else if (info.pontos > 0) vars.negativas.push(key);
      }
    }
    return vars;
  }
  
  // Simple heuristic scoring from response data
  const responseMap = {};
  responses.forEach(r => {
    responseMap[r.questionText?.toLowerCase() || ''] = r.valueText || r.valueNumber || '';
  });
  
  // Check for some common risk indicators from questionnaire responses
  const texts = Object.values(responseMap).map(v => String(v).toLowerCase());
  
  // V06: Company < 6 months
  if (texts.some(t => t.includes('menos de 6 meses') || t.includes('< 6 meses'))) {
    vars.negativas.push('V06'); vars.total += 30;
  }
  // V11: No digital presence
  if (texts.some(t => t.includes('não possui site') || t.includes('sem site'))) {
    vars.negativas.push('V11'); vars.total += 40;
  }
  // V15: Company > 5 years (positive)
  if (texts.some(t => t.includes('mais de 5 anos') || t.includes('> 5 anos') || t.includes('+5 anos'))) {
    vars.positivas.push('V15'); vars.total -= 40;
  }
  // V28: High chargeback
  if (texts.some(t => t.includes('chargeback') && (t.includes('alto') || t.includes('> 2%')))) {
    vars.negativas.push('V28'); vars.total += 100;
  }
  // V43: No PLD policy (intermediaries)
  if (texts.some(t => t.includes('não') && t.includes('pld'))) {
    vars.negativas.push('V43'); vars.total += 80;
  }
  
  return vars;
}

function calculateEnrichment(existingScore) {
  // If existing score has enrichment data, use it
  if (existingScore?.score_enriquecimento != null) {
    return existingScore.score_enriquecimento;
  }
  return 0;
}

function checkBlocks(existingScore) {
  if (existingScore?.bloqueios_ativos && existingScore.bloqueios_ativos.length > 0) {
    return existingScore.bloqueios_ativos;
  }
  return [];
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

    // Fetch all onboarding cases
    const cases = await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1000);
    
    // Fetch all existing compliance scores
    const existingScores = await base44.asServiceRole.entities.ComplianceScore.list('-created_date', 1000);
    const scoresByCase = {};
    existingScores.forEach(s => { scoresByCase[s.onboarding_case_id] = s; });
    
    // Fetch all questionnaire responses
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.list('-created_date', 5000);
    const responsesByCase = {};
    responses.forEach(r => {
      if (!responsesByCase[r.onboardingCaseId]) responsesByCase[r.onboardingCaseId] = [];
      responsesByCase[r.onboardingCaseId].push(r);
    });

    const results = [];
    let processed = 0;
    let updated = 0;
    let created = 0;
    let errors = 0;

    for (const caseItem of cases) {
      try {
        const caseId = caseItem.id;
        const existingScore = scoresByCase[caseId];
        const caseResponses = responsesByCase[caseId] || [];

        // Infer segment
        const segmento = inferSegment(existingScore, caseResponses);
        const isPix = segmento === 'pix_merchant' || segmento === 'pix_intermediario' || (existingScore?.is_pix === true);

        // C1: Base segment score
        const scoreBase = SEGMENTS_BASE[segmento] || 50;
        const c1 = isPix && !['pix_merchant', 'pix_intermediario'].includes(segmento) 
          ? scoreBase + PIX_ADDON 
          : scoreBase;

        // C2: Variables
        const varsResult = calculateVariables(existingScore, caseResponses);
        const c2 = varsResult.total;

        // C3: Enrichment
        const c3 = calculateEnrichment(existingScore);

        // Check blocks
        const bloqueios = checkBlocks(existingScore);

        // Calculate final score
        let scoreFinal;
        let subfaixaResult;
        if (bloqueios.length > 0) {
          scoreFinal = 1000;
          subfaixaResult = SUBFAIXAS[SUBFAIXAS.length - 1];
        } else {
          scoreFinal = Math.max(0, Math.min(849, c1 + c2 + c3));
          subfaixaResult = getSubfaixa(scoreFinal);
        }

        const scoreData = {
          onboarding_case_id: caseId,
          framework_version: 'v4.0',
          segmento,
          is_pix: isPix,
          score_base_segmento: c1,
          score_variaveis: c2,
          score_enriquecimento: c3,
          score_final: scoreFinal,
          subfaixa: subfaixaResult.id,
          subfaixa_nome: subfaixaResult.nome,
          rolling_reserve_percent: subfaixaResult.rr,
          decisao_automatica: subfaixaResult.auto,
          monitoramento_nivel: subfaixaResult.mon,
          bloqueios_ativos: bloqueios,
          variaveis_positivas: varsResult.positivas,
          variaveis_negativas: varsResult.negativas,
          recomendacao_final: bloqueios.length > 0 ? 'Recusado' : subfaixaResult.auto ? 'Aprovado' : 'Revisão Manual',
        };

        const caseUpdate = {
          riskScoreV4: scoreFinal,
          subfaixa: subfaixaResult.id,
          subfaixaNome: subfaixaResult.nome,
          rollingReservePercent: subfaixaResult.rr,
          monitoramentoNivel: subfaixaResult.mon,
          bloqueiosAtivos: bloqueios,
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
          caseId,
          merchantId: caseItem.merchantId,
          segmento,
          scoreFinal,
          subfaixa: subfaixaResult.id,
          subfaixaNome: subfaixaResult.nome,
          rr: subfaixaResult.rr,
          bloqueios: bloqueios.length,
          action: existingScore ? 'updated' : 'created',
        });

        processed++;
      } catch (err) {
        errors++;
        results.push({ caseId: caseItem.id, error: err.message });
      }
    }

    return Response.json({
      success: true,
      dryRun,
      summary: {
        totalCases: cases.length,
        processed,
        scoresUpdated: updated,
        scoresCreated: created,
        errors,
      },
      results: results.slice(0, 50), // Limit response size
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});