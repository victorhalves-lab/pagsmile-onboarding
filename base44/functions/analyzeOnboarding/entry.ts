import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SENTINEL v4.3 — Agente de Análise QUALITATIVA de Compliance
 *
 * PAPEL NO PIPELINE UNIFICADO:
 * - SENTINEL é a camada QUALITATIVA. Ele NÃO gera score numérico autoritativo.
 * - O score V4 (de bdcEnrichCase) é a FONTE ÚNICA para: score_final, subfaixa, bloqueios.
 * - SENTINEL RECEBE dados COMPLETOS (BDC raw + CAF logs) e produz análise narrativa.
 *
 * v4.3 MUDANÇAS:
 * - ZERO TRUNCAMENTO: Dados BDC, CAF e Questionário enviados INTEGRALMENTE
 * - ESTRATÉGIA PARALELA: 2 chamadas LLM simultâneas (BDC+V4 | Questionário+CAF) + consolidação
 *   Isso elimina timeouts mesmo com payloads gigantes, mantendo TODOS os dados
 * - Modelo Gemini 3.1 Pro com janela de 1M tokens — sem necessidade de cortar dados
 * - Red flags com evidência obrigatória (fonte, detalhe, severidade)
 * - Valores brutos das respostas incluídos para máxima rastreabilidade
 */

// ═══ HELPERS ═══

function serializeFullData(obj) {
  return JSON.stringify(obj, null, 2);
}

function extractBdcFullData(resultData) {
  if (!resultData) return null;
  const cleaned = {};
  for (const [key, value] of Object.entries(resultData)) {
    if (key === 'MatchKeys' || key === 'Status' || key === 'QueryDate' || key === 'ElapsedMilliseconds') continue;
    cleaned[key] = value;
  }
  return cleaned;
}

function formatCafLogs(logs) {
  if (!logs || logs.length === 0) return null;
  return logs.map(log => ({
    servico: log.service_type,
    status: log.status,
    resultado: log.result_status,
    red_flags: log.red_flags || [],
    is_alive: log.is_alive,
    similarity: log.similarity,
    score: log.score,
    erro: log.error_message || null,
    duracao_ms: log.duration_ms,
    data: log.created_date,
    resposta_completa: log.response_payload || null,
    request_id: log.request_id,
    transaction_id: log.transaction_id,
  }));
}

function buildMerchantContext(merchant) {
  return `═══ DADOS DO MERCHANT ═══
- Tipo: ${merchant?.type || 'N/A'} | CPF/CNPJ: ${merchant?.cpfCnpj || 'N/A'}
- Razão Social: ${merchant?.fullName || 'N/A'} | Nome Fantasia: ${merchant?.companyName || 'N/A'}
- Email: ${merchant?.email || 'N/A'} | Telefone: ${merchant?.phone || 'N/A'}
- Serviços: ${merchant?.paymentServices?.join(', ') || 'N/A'}
- É Subseller: ${merchant?.isSubseller ? 'SIM (vinculado a ' + (merchant?.parentMerchantId || 'N/D') + ')' : 'NÃO'}`;
}

function buildV4Context(v4Data) {
  if (!v4Data) return 'V4 NÃO DISPONÍVEL — BDC não executou para este caso.';
  return `═══ SCORE V4 (DETERMINÍSTICO — JÁ CALCULADO) ═══
- Score Final: ${v4Data.score_final}/849
- Subfaixa: ${v4Data.subfaixa} (${v4Data.subfaixa_nome})
- Composição: Base=${v4Data.score_base} + Variáveis=${v4Data.score_variaveis} + Enriquecimento=${v4Data.score_enriquecimento}
- Bloqueios: ${v4Data.bloqueios.length > 0 ? v4Data.bloqueios.join(', ') : 'Nenhum'}
- Red Flags V4: ${v4Data.v4_red_flags.length > 0 ? v4Data.v4_red_flags.join('; ') : 'Nenhum'}
- Recomendação V4: ${v4Data.v4_recomendacao}
- Segmento: ${v4Data.segmento}
- Rolling Reserve: ${v4Data.rolling_reserve}%
- Monitoramento: ${v4Data.monitoramento}
- Condições: ${v4Data.condicoes.length > 0 ? v4Data.condicoes.join('; ') : 'Nenhuma'}`;
}

const SENTINEL_RULES = `═══════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: VOCÊ NÃO INVENTA INFORMAÇÃO
═══════════════════════════════════════════════════════════════════

REGRAS INVIOLÁVEIS:
1. NUNCA afirme algo que não esteja explicitamente nos dados fornecidos.
2. Cada afirmação DEVE citar a FONTE EXATA (ex: "BDC BasicData.TaxIdStatus", "CAF screening hitsCount", "Questionário pergunta X").
3. Se um dado não está disponível, diga "DADO NÃO DISPONÍVEL" em vez de inferir.
4. Red flags devem ter formato: "[FONTE: campo.específico] Descrição detalhada com valores encontrados".
5. Cada ponto de atenção DEVE explicar O QUE, POR QUÊ e ONDE com valores concretos.
6. Cada ponto positivo DEVE citar a evidência específica.
7. Se BDC diz "IsCurrentlySanctioned: false" e CAF screening "hitsCount: 0", NÃO reporte sanções.
8. Se houver processos, detalhe TUDO: número, tribunal, tipo, assunto, valor, partes, status.

Seja EXTREMAMENTE detalhado, factual, e documente com evidências específicas. Qualidade > brevidade.`;

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    let caseId = payload.onboardingCaseId;
    if (!caseId && payload.event?.entity_id) caseId = payload.event.entity_id;
    if (!caseId && payload.data?.onboardingCaseId) caseId = payload.data.onboardingCaseId;

    if (!caseId) {
      return Response.json({ error: "ID do caso não fornecido" }, { status: 400 });
    }

    console.log(`[SENTINEL v4.3] Iniciando análise: ${caseId}`);

    // ═══ LOAD ALL DATA ═══
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const existingScore = existingScores[0];
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const hours = (Date.now() - new Date(existingScore.data_analise_fase_3).getTime()) / 3600000;
      if (hours < 24 && !payload.force) {
        console.log(`[SENTINEL v4.3] Análise recente (${hours.toFixed(1)}h). Pulando.`);
        return Response.json({ success: true, message: "Análise recente existe", score_id: existingScore.id });
      }
    }

    const [merchantArr, responses, externalValidations, documents, cafIntegrationLogs] = await Promise.all([
      base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId }),
      base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
      base44.asServiceRole.entities.ExternalValidationResult.filter({ onboardingCaseId: caseId }),
      base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: caseId }),
      base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: caseId }),
    ]);
    const merchant = merchantArr[0];

    // ═══ V4 SCORE CONTEXT ═══
    const v4Data = existingScore ? {
      score_final: existingScore.score_final,
      subfaixa: existingScore.subfaixa,
      subfaixa_nome: existingScore.subfaixa_nome,
      score_base: existingScore.score_base_segmento,
      score_variaveis: existingScore.score_variaveis,
      score_enriquecimento: existingScore.score_enriquecimento,
      bloqueios: existingScore.bloqueios_ativos || [],
      v4_red_flags: existingScore.red_flags || [],
      v4_recomendacao: existingScore.recomendacao_final,
      segmento: existingScore.segmento,
      rolling_reserve: existingScore.rolling_reserve_percent,
      monitoramento: existingScore.monitoramento_nivel,
      condicoes: existingScore.condicoes_automaticas || [],
    } : null;

    console.log(`[SENTINEL v4.3] V4: score=${v4Data?.score_final}, subfaixa=${v4Data?.subfaixa}`);

    // ═══ EXTRACT ALL DATA — ZERO TRUNCATION ═══
    const bdcValidations = externalValidations
      .filter(v => v.provider === 'BigDataCorp' && v.resultData)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const bdcFullData = bdcValidations[0]?.resultData ? extractBdcFullData(bdcValidations[0].resultData) : null;
    const bdcDataString = bdcFullData ? serializeFullData(bdcFullData) : null;

    const cafLogs = cafIntegrationLogs.filter(l => l.provider === 'CAF');
    const cafFullData = formatCafLogs(cafLogs);
    const cafDataString = cafFullData ? serializeFullData(cafFullData) : null;

    const cafValidations = externalValidations.filter(v => v.provider === 'CAF');
    const cafValidationsString = cafValidations.length > 0 
      ? serializeFullData(cafValidations.map(v => ({
          tipo: v.validationType, status: v.status, score: v.score,
          resultado: v.resultData, data: v.timestamp || v.created_date,
        })))
      : null;

    const hasExternalData = externalValidations.length > 0;

    // ═══ FORMAT QUESTIONNAIRE — SEMANTIC RESPONSES ═══
    const formattedResponses = responses.map(r => {
      const tipo = r.questionType || 'TEXT';
      const pergunta = r.questionText || `Pergunta ${r.questionId}`;
      const hasText = r.valueText != null && r.valueText !== '' && r.valueText !== 'N/A';
      const hasNumber = r.valueNumber != null;
      const hasBoolean = r.valueBoolean != null;
      const hasArray = r.valueArray && r.valueArray.length > 0;
      const respondido = hasText || hasNumber || hasBoolean || hasArray;

      if (!respondido) {
        return { pergunta, tipo, status: 'NÃO RESPONDIDA', resposta_semantica: 'Pergunta não foi respondida pelo merchant — lacuna real.', valor_bruto: null };
      }

      let resposta_semantica = '';
      let valor_bruto = '';

      if (tipo === 'BOOLEAN') {
        valor_bruto = r.valueBoolean ? 'SIM' : 'NÃO';
        const pl = pergunta.toLowerCase();
        const isNeg = pl.includes('restrit') || pl.includes('proibid') || pl.includes('criptomoeda') || pl.includes('jogos') || pl.includes('apostas') ||
          pl.includes('sancion') || pl.includes('pendência') || pl.includes('judicial') || pl.includes('litígio') || pl.includes('irregularidade') ||
          pl.includes('infração') || pl.includes('processos') || pl.includes('condenação') || pl.includes('bloqueio');
        const isPos = pl.includes('compliance') || pl.includes('pld') || pl.includes('monitora') || pl.includes('política') || pl.includes('programa') ||
          (pl.includes('possui') && (pl.includes('certificação') || pl.includes('segurança'))) || pl.includes('auditor') || pl.includes('controle');
        const isPEP = pl.includes('pep') || pl.includes('pessoa exposta') || pl.includes('politicamente');

        if (!r.valueBoolean) {
          if (isNeg) resposta_semantica = `NÃO — NEGA esta condição de risco. Resposta POSITIVA para compliance. Pergunta RESPONDIDA.`;
          else if (isPEP) resposta_semantica = `NÃO — Declara AUSÊNCIA de PEPs. Cross-validar com BDC/CAF. Pergunta RESPONDIDA.`;
          else if (isPos) resposta_semantica = `NÃO — Declara NÃO possuir este controle/programa. Ponto de atenção legítimo. Pergunta RESPONDIDA.`;
          else resposta_semantica = `NÃO — Resposta negativa. Pergunta RESPONDIDA.`;
        } else {
          if (isNeg) resposta_semantica = `SIM — CONFIRMA condição de risco. RED FLAG potencial. Pergunta RESPONDIDA.`;
          else if (isPEP) resposta_semantica = `SIM — Declara existência de PEP. Verificar com BDC/CAF. Pergunta RESPONDIDA.`;
          else if (isPos) resposta_semantica = `SIM — Confirma possuir controle/programa. Ponto POSITIVO. Pergunta RESPONDIDA.`;
          else resposta_semantica = `SIM — Resposta afirmativa. Pergunta RESPONDIDA.`;
        }
      } else if (tipo === 'NUMBER') {
        valor_bruto = String(r.valueNumber);
        resposta_semantica = `Valor: ${r.valueNumber}. Respondida.`;
      } else if (tipo === 'SELECT') {
        valor_bruto = r.valueText || '';
        resposta_semantica = `Opção: "${valor_bruto}". Respondida.`;
      } else if (tipo === 'MULTI_SELECT') {
        valor_bruto = r.valueArray?.join(', ') || r.valueText || '';
        resposta_semantica = `${r.valueArray?.length || 0} opções: [${valor_bruto}]. Respondida.`;
      } else if (tipo === 'CPF_CNPJ') {
        valor_bruto = r.valueText || '';
        resposta_semantica = `Documento: ${valor_bruto}. Cross-validar com BDC.`;
      } else if (tipo === 'EMAIL') {
        valor_bruto = r.valueText || '';
        resposta_semantica = `Email: ${valor_bruto}. Cross-validar com BDC.`;
      } else if (tipo === 'PHONE') {
        valor_bruto = r.valueText || '';
        resposta_semantica = `Telefone: ${valor_bruto}. Cross-validar com BDC.`;
      } else {
        valor_bruto = r.valueText || '';
        if (valor_bruto.trim().length < 3 || ['n/a', 'na', '-', '.', '...'].includes(valor_bruto.trim().toLowerCase())) {
          resposta_semantica = `Resposta vazia/genérica: "${valor_bruto}" — lacuna parcial.`;
        } else {
          resposta_semantica = `Texto: "${valor_bruto}". Respondida.`;
        }
      }
      return { pergunta, tipo, status: 'RESPONDIDA', resposta_semantica, valor_bruto };
    });

    const formattedDocuments = documents.map(d => ({
      tipo: d.documentName, status: d.validationStatus, arquivo: d.fileName,
      tamanho: d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB` : 'N/D',
      data_upload: d.uploadDate || d.created_date,
    }));

    const merchantCtx = buildMerchantContext(merchant);
    const v4Ctx = buildV4Context(v4Data);

    // ═══ PARALLEL LLM STRATEGY ═══
    // Two parallel calls: one for BDC+V4 deep dive, one for Questionnaire+CAF deep dive
    // Then a fast consolidation call merges both into the final output

    const bdcAnalysisPrompt = `Você é o SENTINEL v4, analista sênior de compliance. Analise os DADOS BDC E V4 deste merchant.

${SENTINEL_RULES}

${merchantCtx}

${v4Ctx}

${bdcDataString ? `═══ DADOS COMPLETOS BDC (Big Data Corp) — ANÁLISE INTEGRAL ═══
ATENÇÃO: Analise TODOS os campos com cuidado. Estes são os dados REAIS e COMPLETOS retornados pela API BDC.
Cite campos específicos ao fazer qualquer afirmação (ex: "BasicData.TaxIdStatus", "Processes.Lawsuits[0].Number").
Detalhe CADA processo judicial encontrado com: número, tribunal, tipo, assunto, valor, partes, status.
Detalhe CADA sócio encontrado com: nome, CPF, participação, cargo.
Detalhe CADA endereço, telefone, email encontrado.
Detalhe CADA indicador de atividade com: receita presumida, porte, MEI, empregados.
Detalhe CADA domínio e presença digital encontrada.
NÃO resuma — detalhe TUDO que encontrar nos dados.

${bdcDataString}` : '═══ DADOS BDC ═══\nNÃO DISPONÍVEL — Não faça afirmações sobre dados BDC.'}

═══ INSTRUÇÕES ═══
Produza uma análise EXTREMAMENTE detalhada e completa cobrindo:
1. IDENTIDADE E CADASTRO: Status CNPJ/CPF, data fundação, porte, capital social, endereço, atividade econômica (CNAE), etc.
2. SÓCIOS E QSA: Todos os sócios, participações, CPFs, situações cadastrais, relacionamentos.
3. COMPLIANCE E REGULATÓRIO: Sanções (CEIS/CNEP/Interpol), PEP, processos, restrições, lista negativa.
4. REPUTAÇÃO: Protestos, negativações, processos judiciais (detalhar CADA um), cobranças.
5. FINANCEIRO: Receita presumida, porte x capital social x volume declarado, indicadores de atividade.
6. PEGADA DIGITAL: Domínios registrados, presença online, emails/telefones verificados.

Para CADA dimensão: cite dados exatos, valores, campos específicos do BDC. NÃO seja genérico.
Se houver bloqueios V4, explique a relação com os dados BDC observados.`;

    const questionnaireAnalysisPrompt = `Você é o SENTINEL v4, analista sênior de compliance. Analise o QUESTIONÁRIO E DADOS CAF deste merchant.

${SENTINEL_RULES}

${merchantCtx}

${v4Ctx}

═══ QUESTIONÁRIO (${responses.length} respostas) ═══
REGRAS OBRIGATÓRIAS DE INTERPRETAÇÃO:
1. "status: RESPONDIDA" = resposta COMPLETA. NÃO trate como lacuna.
2. "NÃO" em perguntas sobre riscos/proibições/cripto/jogos/PEP = resposta DESEJADA e POSITIVA.
3. "SIM" em perguntas sobre compliance/PLD/monitoramento = resposta DESEJADA e POSITIVA.
4. Somente "NÃO RESPONDIDA" ou "lacuna" = informação realmente ausente.
5. Para questionar veracidade (declarou NÃO PEP mas CAF diz SIM), use CROSS-VALIDATION, não "lacuna".

ESTATÍSTICAS:
- Total: ${formattedResponses.length} | Respondidas: ${formattedResponses.filter(r => r.status === 'RESPONDIDA').length} | Não respondidas: ${formattedResponses.filter(r => r.status === 'NÃO RESPONDIDA').length}
- Completude: ${formattedResponses.length > 0 ? ((formattedResponses.filter(r => r.status === 'RESPONDIDA').length / formattedResponses.length) * 100).toFixed(1) : 0}%

RESPOSTAS COMPLETAS (todas as perguntas e respostas integrais):
${serializeFullData(formattedResponses.map(r => `[${r.status}][${r.tipo}] "${r.pergunta}" → ${r.resposta_semantica} | Valor: ${r.valor_bruto || 'N/A'}`))}

═══ DOCUMENTOS ENVIADOS (${documents.length}) ═══
${serializeFullData(formattedDocuments)}

${cafDataString ? `═══ LOGS COMPLETOS CAF (Combate à Fraude) ═══
TODOS os serviços CAF executados, com respostas COMPLETAS (screening PEP/Sanções/Interpol, CPF, liveness, facematch, documentoscopy, VerifAI).
Detalhe CADA serviço: resultado, score, red flags, detalhes do hit, etc.

${cafDataString}` : '═══ DADOS CAF ═══\nNÃO DISPONÍVEL — Nenhum serviço CAF executado.'}

${cafValidationsString ? `═══ VALIDAÇÕES CAF (External Results) ═══
${cafValidationsString}` : ''}

═══ INSTRUÇÕES ═══
Produza uma análise EXTREMAMENTE detalhada:
1. ANÁLISE DO QUESTIONÁRIO: Liste TODAS as respostas relevantes como FATOS DECLARADOS. Identifique apenas lacunas REAIS.
2. PERFIL DO MERCHANT: modelo de negócio, segmento, volume, estrutura societária, conforme declarado.
3. CONTROLES DECLARADOS: compliance, PLD, monitoramento, KYC — o que o merchant diz ter e não ter.
4. BIOMETRIA E DOCUMENTOS CAF: resultado de cada serviço CAF executado, com detalhes completos.
5. SCREENING CAF: resultados de PEP, sanções, Interpol — detalhe cada hit ou ausência de hit.
6. LACUNAS REAIS: apenas perguntas NÃO RESPONDIDAS ou documentos faltantes.

NÃO seja genérico. Cite perguntas específicas, valores, serviços CAF. Detalhe TUDO.`;

    const partialSchema = {
      type: "object",
      properties: {
        analise_detalhada: { type: "string", description: "Análise completa e detalhada deste bloco de dados. Mínimo 15 linhas. Cite TODOS os dados relevantes com fontes específicas." },
        red_flags: { type: "array", items: { type: "string" }, description: "Red flags com evidência. Formato: '[FONTE: campo] Descrição com dados'" },
        pontos_positivos: { type: "array", items: { type: "string" }, description: "Pontos positivos com evidência específica" },
        pontos_atencao: { type: "array", items: { type: "string" }, description: "Pontos de atenção com O QUE, POR QUÊ e dados" },
        cross_validations: { type: "array", items: { type: "object", properties: {
          campo: { type: "string" }, declarado: { type: "string" }, confirmado: { type: "string" },
          fonte: { type: "string" }, consistente: { type: "boolean" }, severidade: { type: "string" }, obs: { type: "string" }
        }}},
        dimensoes: { type: "object", description: "Análise por dimensão aplicável: { nome_dimensao: { veredicto, confianca, resumo, findings[] } }" }
      },
      required: ["analise_detalhada", "red_flags", "pontos_positivos", "pontos_atencao"]
    };

    console.log(`[SENTINEL v4.3] Lançando 2 LLM calls paralelas: BDC(${(bdcAnalysisPrompt.length/1000).toFixed(0)}k chars) | QST+CAF(${(questionnaireAnalysisPrompt.length/1000).toFixed(0)}k chars)`);

    // ═══ PARALLEL EXECUTION ═══
    const [bdcAnalysis, qstAnalysis] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: bdcAnalysisPrompt,
        response_json_schema: partialSchema,
        model: 'gemini_3_1_pro'
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: questionnaireAnalysisPrompt,
        response_json_schema: partialSchema,
        model: 'gemini_3_1_pro'
      })
    ]);

    console.log(`[SENTINEL v4.3] Análises parciais prontas. BDC flags=${bdcAnalysis.red_flags?.length}, QST flags=${qstAnalysis.red_flags?.length}. Consolidando...`);

    // ═══ CONSOLIDATION CALL — Merge both analyses into final output ═══
    const consolidationPrompt = `Você é o SENTINEL v4, analista sênior de compliance. Recebeu DUAS análises parciais feitas sobre o mesmo merchant.
Sua tarefa é CONSOLIDAR em uma análise FINAL única, completa e robusta.

${merchantCtx}

${v4Ctx}

═══ ANÁLISE 1: DADOS BDC + SCORE V4 ═══
${bdcAnalysis.analise_detalhada}

RED FLAGS BDC:
${(bdcAnalysis.red_flags || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

PONTOS POSITIVOS BDC:
${(bdcAnalysis.pontos_positivos || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

PONTOS DE ATENÇÃO BDC:
${(bdcAnalysis.pontos_atencao || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

CROSS-VALIDATIONS BDC:
${serializeFullData(bdcAnalysis.cross_validations || [])}

DIMENSÕES BDC:
${serializeFullData(bdcAnalysis.dimensoes || {})}

═══ ANÁLISE 2: QUESTIONÁRIO + CAF ═══
${qstAnalysis.analise_detalhada}

RED FLAGS QST/CAF:
${(qstAnalysis.red_flags || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

PONTOS POSITIVOS QST/CAF:
${(qstAnalysis.pontos_positivos || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

PONTOS DE ATENÇÃO QST/CAF:
${(qstAnalysis.pontos_atencao || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

CROSS-VALIDATIONS QST/CAF:
${serializeFullData(qstAnalysis.cross_validations || [])}

DIMENSÕES QST/CAF:
${serializeFullData(qstAnalysis.dimensoes || {})}

═══ INSTRUÇÕES DE CONSOLIDAÇÃO ═══

${SENTINEL_RULES}

1. SUMÁRIO EXECUTIVO: 4-8 linhas com os achados mais importantes de AMBAS as análises.
2. ANÁLISE COMPLETA: Consolide AMBAS as análises em uma narrativa única, organizada por dimensões. NÃO resuma — inclua TODOS os detalhes de ambas. Mínimo 20 linhas.
3. PARECER FINAL: Narrativa autocontida para dossiê. Um analista deve entender TUDO sem consultar outras fontes.
4. RED FLAGS: Consolide de ambas (sem duplicar). Mantenha o formato "[FONTE: campo] Descrição".
5. PONTOS POSITIVOS / ATENÇÃO: Consolide de ambas.
6. CROSS-VALIDATION: Consolide e enriqueça com observações cruzadas.
7. ANÁLISE DIMENSIONAL: Consolide as 7 dimensões (use dados de ambas análises).
8. RECOMENDAÇÃO: Pode ESCALAR decisão V4 se houver red flags FACTUAIS graves, nunca REBAIXAR.

Produza uma análise ROBUSTA, COMPLETA, DETALHADA — com TODOS os dados e insights de ambas as análises.`;

    const finalSchema = {
      type: "object",
      properties: {
        sentinel_recommendation: { type: "string", enum: ["Aprovado", "Aprovado com Condições", "Revisão Manual", "Recusado"] },
        escalation_justification: { type: "string" },
        sumario_executivo: { type: "string", description: "4-8 linhas com fontes citadas" },
        analise_completa_ia: { type: "string", description: "Análise consolidada COMPLETA. Mínimo 20 linhas. TODOS os detalhes de ambas análises." },
        parecer_final: { type: "string", description: "Parecer autocontido para dossiê com todos os dados, fontes e valores." },
        pontos_positivos: { type: "array", items: { type: "string" } },
        pontos_atencao: { type: "array", items: { type: "string" } },
        red_flags: { type: "array", items: { type: "string" } },
        recomendacoes_revisao_manual: { type: "string" },
        perguntas_sugeridas: { type: "array", items: { type: "string" } },
        documentos_adicionais_sugeridos: { type: "array", items: { type: "string" } },
        nivel_confianca_ia: { type: "number" },
        total_findings: { type: "number" },
        findings_por_severidade: { type: "object", properties: {
          critico: { type: "number" }, alto: { type: "number" }, medio: { type: "number" }, baixo: { type: "number" }, info: { type: "number" }
        }},
        overrides_aplicados: { type: "array", items: { type: "string" } },
        condicoes_aprovacao: { type: "string" },
        analise_dimensional: { type: "object", properties: {
          identidade: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
          socios: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
          compliance: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
          digital: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
          reputacao: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
          financeiro: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
          biometria: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } }
        }},
        cross_validation: { type: "array", items: { type: "object", properties: {
          campo: { type: "string" }, valor_declarado: { type: "string" }, fonte_declarado: { type: "string" },
          valor_confirmado: { type: "string" }, fonte_confirmado: { type: "string" },
          consistente: { type: "boolean" }, severidade: { type: "string", enum: ["INFO","LOW","MEDIUM","HIGH","CRITICAL"] },
          observacao: { type: "string" }
        }}}
      },
      required: ["sentinel_recommendation","sumario_executivo","analise_completa_ia","parecer_final","pontos_positivos","pontos_atencao","red_flags","nivel_confianca_ia","total_findings"]
    };

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: consolidationPrompt,
      response_json_schema: finalSchema,
      model: 'gemini_3_1_pro'
    });

    console.log(`[SENTINEL v4.3] Consolidação pronta. Recommendation=${llmResponse.sentinel_recommendation}, RedFlags=${(llmResponse.red_flags || []).length}, Confiança=${llmResponse.nivel_confianca_ia}%`);

    // ═══ SAVE ═══
    const now = new Date().toISOString();
    const sentinelData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v4.3",
      sentinel_recommendation: llmResponse.sentinel_recommendation,
      sumario_executivo: llmResponse.sumario_executivo,
      analise_completa_ia: llmResponse.analise_completa_ia,
      parecer_final: llmResponse.parecer_final,
      pontos_positivos: llmResponse.pontos_positivos || [],
      pontos_atencao: llmResponse.pontos_atencao || [],
      sentinel_red_flags: llmResponse.red_flags || [],
      recomendacoes_revisao_manual: llmResponse.recomendacoes_revisao_manual || "",
      perguntas_sugeridas: llmResponse.perguntas_sugeridas || [],
      documentos_adicionais_sugeridos: llmResponse.documentos_adicionais_sugeridos || [],
      nivel_confianca_ia: llmResponse.nivel_confianca_ia,
      total_findings: llmResponse.total_findings || 0,
      findings_por_severidade: llmResponse.findings_por_severidade || {},
      overrides_aplicados: llmResponse.overrides_aplicados || [],
      condicoes_aprovacao: llmResponse.condicoes_aprovacao || "",
      analise_dimensional: llmResponse.analise_dimensional || null,
      cross_validation: llmResponse.cross_validation || [],
      escalation_justification: llmResponse.escalation_justification || "",
      fase_1_completa: true,
      data_analise_fase_1: now,
      fase_2_completa: hasExternalData || (existingScore?.fase_2_completa || false),
      data_analise_fase_2: hasExternalData ? now : (existingScore?.data_analise_fase_2 || null),
      fase_3_completa: hasExternalData,
      data_analise_fase_3: hasExternalData ? now : null,
    };

    if (existingScore) {
      await base44.asServiceRole.entities.ComplianceScore.update(existingScore.id, sentinelData);
      console.log(`[SENTINEL v4.3] Score updated: ${existingScore.id}`);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(sentinelData);
      console.log(`[SENTINEL v4.3] Score created`);
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      iaExplanation: llmResponse.sumario_executivo,
    });

    const duration = Date.now() - startTime;
    console.log(`[SENTINEL v4.3] Concluído em ${duration}ms`);

    return Response.json({
      success: true,
      case_id: caseId,
      score_id: existingScore?.id,
      sentinel_recommendation: llmResponse.sentinel_recommendation,
      escalation_justification: llmResponse.escalation_justification || null,
      nivel_confianca: llmResponse.nivel_confianca_ia,
      red_flags_count: (llmResponse.red_flags || []).length,
      duration_ms: duration
    });

  } catch (error) {
    console.error(`[SENTINEL v4.3] Erro:`, error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});