import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SENTINEL v4.0 — Agente de Análise QUALITATIVA de Compliance
 *
 * PAPEL NO PIPELINE UNIFICADO:
 * - SENTINEL é a camada QUALITATIVA. Ele NÃO gera score numérico autoritativo.
 * - O score V4 (de bdcEnrichCase) é a FONTE ÚNICA para: score_final, subfaixa, bloqueios.
 * - SENTINEL RECEBE dados COMPLETOS (BDC raw + CAF logs) e produz análise narrativa.
 *
 * v4.0 MUDANÇAS:
 * - Envia dados BDC RAW COMPLETOS ao LLM (não resumo empobrecido)
 * - Envia todos os IntegrationLogs CAF com payloads completos
 * - Prompt reforçado: NUNCA inventar, SEMPRE citar fonte e dado específico
 * - Red flags com evidência obrigatória (fonte, detalhe, severidade)
 * - Pontos de atenção com explicação didática completa
 */

// ═══ HELPERS ═══

function truncateForPrompt(obj, maxChars = 40000) {
  const str = JSON.stringify(obj, null, 2);
  if (str.length <= maxChars) return str;
  return str.substring(0, maxChars) + '\n... [TRUNCADO por tamanho — dados parciais]';
}

function extractBdcFullData(resultData) {
  if (!resultData) return null;
  // Pass the full raw data but clean up MatchKeys repetition
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
    // Include response payload with full details
    resposta_completa: log.response_payload || null,
    // Include request context
    request_id: log.request_id,
    transaction_id: log.transaction_id,
  }));
}

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

    console.log(`[SENTINEL v4] Iniciando análise qualitativa do caso: ${caseId}`);

    // ═══ LOAD ALL DATA ═══
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    // Check for recent analysis (< 24h)
    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const existingScore = existingScores[0];
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const hours = (Date.now() - new Date(existingScore.data_analise_fase_3).getTime()) / 3600000;
      if (hours < 24 && !payload.force) {
        console.log(`[SENTINEL v4] Análise recente (${hours.toFixed(1)}h). Pulando.`);
        return Response.json({ success: true, message: "Análise recente existe", score_id: existingScore.id });
      }
    }

    // Load all related data in parallel
    const [merchantArr, responses, externalValidations, documents, cafIntegrationLogs] = await Promise.all([
      base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId }),
      base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
      base44.asServiceRole.entities.ExternalValidationResult.filter({ onboardingCaseId: caseId }),
      base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: caseId }),
      base44.asServiceRole.entities.IntegrationLog.filter({ onboarding_case_id: caseId }),
    ]);
    const merchant = merchantArr[0];

    // ═══ READ V4 SCORE (the authoritative numeric data) ═══
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

    console.log(`[SENTINEL v4] V4 context: score=${v4Data?.score_final}, subfaixa=${v4Data?.subfaixa}`);

    // ═══ EXTRACT BDC RAW DATA (FULL — not summary) ═══
    const bdcValidations = externalValidations
      .filter(v => v.provider === 'BigDataCorp' && v.resultData)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latestBdc = bdcValidations[0];
    const bdcFullData = latestBdc?.resultData ? extractBdcFullData(latestBdc.resultData) : null;
    const bdcDataString = bdcFullData ? truncateForPrompt(bdcFullData, 45000) : null;

    // ═══ EXTRACT CAF DATA (ALL integration logs with full payloads) ═══
    const cafLogs = cafIntegrationLogs.filter(l => l.provider === 'CAF');
    const cafFullData = formatCafLogs(cafLogs);
    const cafDataString = cafFullData ? truncateForPrompt(cafFullData, 15000) : null;

    // Also get CAF ExternalValidationResults
    const cafValidations = externalValidations.filter(v => v.provider === 'CAF');
    const cafValidationsString = cafValidations.length > 0 
      ? truncateForPrompt(cafValidations.map(v => ({
          tipo: v.validationType,
          status: v.status,
          score: v.score,
          resultado: v.resultData,
          data: v.timestamp || v.created_date,
        })), 10000)
      : null;

    const hasExternalData = externalValidations.length > 0;

    // ═══ BUILD PROMPT WITH FULL DATA ═══
    const formattedResponses = responses.map(r => ({
      pergunta: r.questionText || `Pergunta ${r.questionId}`,
      resposta: r.valueText || (r.valueNumber != null ? String(r.valueNumber) : null) || (r.valueBoolean != null ? String(r.valueBoolean) : null) || r.valueArray?.join(', ') || 'Não respondido'
    }));
    const formattedDocuments = documents.map(d => ({
      tipo: d.documentName,
      status: d.validationStatus,
      arquivo: d.fileName,
      tamanho: d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB` : 'N/D',
      data_upload: d.uploadDate || d.created_date,
    }));

    const analysisPrompt = `Você é o SENTINEL v4, analista sênior de compliance e risco do mercado financeiro brasileiro.

═══════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: VOCÊ NÃO INVENTA INFORMAÇÃO
═══════════════════════════════════════════════════════════════════

REGRAS INVIOLÁVEIS:
1. NUNCA afirme algo que não esteja explicitamente nos dados fornecidos abaixo.
2. Se os dados BDC dizem "IsCurrentlySanctioned: false" e os dados CAF de screening retornaram "hitsCount: 0", NÃO diga que há sanções.
3. Cada red flag DEVE citar a FONTE EXATA (ex: "BDC BasicData.TaxIdStatus", "CAF screening hitsCount", "Questionário pergunta X").
4. Se um dado não está disponível, diga "DADO NÃO DISPONÍVEL — não foi possível verificar" em vez de inferir.
5. Cada ponto de atenção DEVE explicar O QUE especificamente está incompleto/inconsistente, COM o valor encontrado e o valor esperado.
6. Cada ponto positivo DEVE citar a evidência específica (ex: "CPF status REGULAR conforme BDC BasicData.TaxIdStatus").
7. Red flags devem ter formato: "[FONTE] Descrição detalhada com dados específicos". Exemplos:
   - "[BDC Processes] Processo nº 00898959520248172001, Tipo: Procedimento Comum, Tribunal: TJPE, Assunto: Revisão de Contrato Bancário, Status: Em Grau de Recurso, Autor vs Banco Pan S/A"
   - "[CAF Screening] PEP identificado na lista X com detalhes Y"
   - "[BDC KycData] Sanção ativa encontrada: lista Z, data W"
   NUNCA escreva apenas "Sanções no CEIS" sem evidência.

═══ SEU PAPEL ═══
Você é a CAMADA QUALITATIVA do pipeline. O score numérico V4 já foi calculado deterministicamente.
Seu trabalho é: analisar contexto, correlacionar dados, identificar padrões, e produzir narrativa FACTUAL E DETALHADA.
Você NÃO produz score numérico — apenas análise qualitativa e uma recomendação que pode ESCALAR a decisão V4.

═══ SCORE V4 (DETERMINÍSTICO — JÁ CALCULADO) ═══
${v4Data ? `- Score Final: ${v4Data.score_final}/849
- Subfaixa: ${v4Data.subfaixa} (${v4Data.subfaixa_nome})
- Composição: Base=${v4Data.score_base} + Variáveis=${v4Data.score_variaveis} + Enriquecimento=${v4Data.score_enriquecimento}
- Bloqueios: ${v4Data.bloqueios.length > 0 ? v4Data.bloqueios.join(', ') : 'Nenhum'}
- Red Flags V4: ${v4Data.v4_red_flags.length > 0 ? v4Data.v4_red_flags.join('; ') : 'Nenhum'}
- Recomendação V4: ${v4Data.v4_recomendacao}
- Segmento: ${v4Data.segmento}
- Rolling Reserve: ${v4Data.rolling_reserve}%
- Monitoramento: ${v4Data.monitoramento}
- Condições: ${v4Data.condicoes.length > 0 ? v4Data.condicoes.join('; ') : 'Nenhuma'}` : 'V4 NÃO DISPONÍVEL — BDC não executou para este caso. Analise apenas com dados disponíveis.'}

═══ DADOS DO MERCHANT ═══
- Tipo: ${merchant?.type || 'N/A'} | CPF/CNPJ: ${merchant?.cpfCnpj || 'N/A'}
- Razão Social: ${merchant?.fullName || 'N/A'} | Nome Fantasia: ${merchant?.companyName || 'N/A'}
- Email: ${merchant?.email || 'N/A'} | Telefone: ${merchant?.phone || 'N/A'}
- Serviços: ${merchant?.paymentServices?.join(', ') || 'N/A'}
- É Subseller: ${merchant?.isSubseller ? 'SIM (vinculado a ' + (merchant?.parentMerchantId || 'N/D') + ')' : 'NÃO'}

═══ QUESTIONÁRIO (${responses.length} respostas) ═══
${JSON.stringify(formattedResponses, null, 2)}

═══ DOCUMENTOS ENVIADOS (${documents.length}) ═══
${JSON.stringify(formattedDocuments, null, 2)}

${bdcDataString ? `═══ DADOS COMPLETOS BDC (Big Data Corp) — FONTE PRIMÁRIA ═══
ATENÇÃO: Analise TODOS os campos abaixo com cuidado. Estes são os dados REAIS retornados pela API BDC.
Cite campos específicos ao fazer qualquer afirmação (ex: "BasicData.TaxIdStatus", "Processes.Lawsuits[0].Number").

${bdcDataString}` : '═══ DADOS BDC ═══\nNÃO DISPONÍVEL — BigDataCorp não retornou dados para este caso. Não faça afirmações sobre dados BDC.'}

${cafDataString ? `═══ LOGS COMPLETOS CAF (Combate à Fraude) — INTEGRATIONS ═══
Estes são TODOS os serviços CAF executados para este caso, com respostas completas.
Inclui: screening internacional (PEP/Sanções/Interpol), CPF validation, liveness, facematch, documentoscopy, VerifAI.
Cite o serviço específico ao fazer qualquer afirmação.

${cafDataString}` : '═══ DADOS CAF (Integrations) ═══\nNÃO DISPONÍVEL — Nenhum log de integração CAF encontrado.'}

${cafValidationsString ? `═══ VALIDAÇÕES CAF (External Validation Results) ═══
${cafValidationsString}` : ''}

═══════════════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE
═══════════════════════════════════════════════════════════════════

1. **ANÁLISE DIMENSIONAL** — Avalie cada dimensão com EVIDÊNCIAS ESPECÍFICAS dos dados:
   IDENTIDADE, SÓCIOS/QSA, COMPLIANCE/REGULATÓRIO, PEGADA DIGITAL, REPUTAÇÃO, FINANCEIRO, BIOMETRIA
   Para cada dimensão, cite os dados exatos que fundamentam o veredicto.

2. **CROSS-VALIDATION** — Compare declarado (questionário) vs confirmado (BDC/CAF):
   Para cada campo comparado, mostre: valor declarado, valor confirmado, fonte do dado confirmado, e análise da discrepância.

3. **RED FLAGS** — SOMENTE flags baseados em dados REAIS:
   Formato obrigatório: "[FONTE: campo.específico] Descrição detalhada com valores encontrados"
   Se BDC KycData.IsCurrentlySanctioned = false e CAF screening hitsCount = 0, NÃO reporte sanções.
   Se houver processos, detalhe: número, tribunal, tipo, assunto, valor, partes, status atual.

4. **PONTOS DE ATENÇÃO** — Explique COM DETALHES o que precisa de atenção:
   Em vez de "Documentação incompleta", diga: "Faltam os documentos X, Y e Z conforme exigido pelo template. Foram enviados apenas: A, B."
   Em vez de "Inconsistência no histórico", diga: "O questionário declara TPV de R$X/mês, mas o porte BDC é Y com Z empregados, sugerindo capacidade incompatível."

5. **PONTOS POSITIVOS** — Cite a evidência específica para cada ponto positivo.

6. **SUMÁRIO EXECUTIVO** — 4-6 linhas com os achados mais importantes, sempre referenciando fontes.

7. **PARECER FINAL** — Narrativa completa para dossiê de compliance. Deve ser detalhado o suficiente para um analista entender TUDO sem consultar outras fontes.

8. **RECOMENDAÇÃO SENTINEL** — Pode ser: Aprovado, Aprovado com Condições, Revisão Manual, Recusado.
   REGRA: Se V4 diz "Aprovado" mas você identifica red flags FACTUAIS graves, ESCALE para "Revisão Manual".
   Nunca rebaixe (se V4 diz "Recusado", não sugira "Aprovado").
   Se V4 não está disponível, baseie-se apenas nos dados disponíveis.

Seja EXTREMAMENTE detalhado, factual, e documente com evidências específicas. Qualidade > brevidade.`;

    const responseSchema = {
      type: "object",
      properties: {
        sentinel_recommendation: {
          type: "string",
          enum: ["Aprovado", "Aprovado com Condições", "Revisão Manual", "Recusado"],
          description: "Recomendação SENTINEL. Pode ESCALAR a decisão V4 mas nunca REBAIXAR."
        },
        escalation_justification: {
          type: "string",
          description: "Se a recomendação difere do V4, explique POR QUÊ com dados específicos. Vazio se não escalou."
        },
        sumario_executivo: {
          type: "string",
          description: "Resumo executivo de 4-6 linhas. Cite fontes: [BDC], [CAF], [Questionário]. Deve ser informativo e completo."
        },
        analise_completa_ia: {
          type: "string",
          description: "Análise completa, detalhada e didática. Para cada achado, cite a fonte exata e o dado específico. Organize por dimensões. Mínimo 10 linhas."
        },
        parecer_final: {
          type: "string",
          description: "Parecer conclusivo para dossiê. Deve ser autocontido — um analista deve entender tudo lendo apenas este parecer. Cite dados, fontes, valores."
        },
        pontos_positivos: {
          type: "array",
          items: { type: "string" },
          description: "Cada item deve citar a evidência. Ex: '[BDC] CPF status REGULAR (BasicData.TaxIdStatus), sem negativação (Collections.IsCurrentlyOnCollection=false)'"
        },
        pontos_atencao: {
          type: "array",
          items: { type: "string" },
          description: "Cada item deve explicar O QUE, POR QUÊ e ONDE está o problema. Ex: '[Questionário] Pergunta sobre PEP não respondida (pergunta 14), impossibilitando verificação cruzada com dados BDC que indicam IsPEP=false'"
        },
        red_flags: {
          type: "array",
          items: { type: "string" },
          description: "SOMENTE flags com evidência factual. Formato: '[FONTE: campo] Descrição com dados'. NUNCA inventar. Se não há evidência, NÃO inclua."
        },
        recomendacoes_revisao_manual: {
          type: "string",
          description: "Recomendações detalhadas: o que o analista deve verificar, quais documentos pedir, quais perguntas fazer, e por quê."
        },
        perguntas_sugeridas: {
          type: "array",
          items: { type: "string" },
          description: "Perguntas específicas para o merchant, baseadas em lacunas nos dados. Explique por que cada pergunta é necessária."
        },
        documentos_adicionais_sugeridos: {
          type: "array",
          items: { type: "string" },
          description: "Documentos que devem ser solicitados, com justificativa baseada nos dados analisados."
        },
        nivel_confianca_ia: { type: "number", description: "0-100. Reduza se dados BDC/CAF não estão disponíveis." },
        total_findings: { type: "number" },
        findings_por_severidade: {
          type: "object",
          properties: {
            critico: { type: "number" },
            alto: { type: "number" },
            medio: { type: "number" },
            baixo: { type: "number" },
            info: { type: "number" }
          }
        },
        overrides_aplicados: { type: "array", items: { type: "string" } },
        condicoes_aprovacao: { type: "string" },
        analise_dimensional: {
          type: "object",
          properties: {
            identidade: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string", description: "Resumo detalhado com citação de dados específicos BDC/CAF" }, findings: { type: "array", items: { type: "string" }, description: "Cada finding com [FONTE] e dados específicos" } } },
            socios: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            compliance: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            digital: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            reputacao: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            financeiro: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            biometria: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } }
          }
        },
        cross_validation: {
          type: "array",
          items: {
            type: "object",
            properties: {
              campo: { type: "string" },
              valor_declarado: { type: "string", description: "Valor do questionário" },
              fonte_declarado: { type: "string", description: "Qual pergunta do questionário" },
              valor_confirmado: { type: "string", description: "Valor confirmado por BDC/CAF" },
              fonte_confirmado: { type: "string", description: "Ex: BDC BasicData.OfficialName, CAF CPF Validation" },
              consistente: { type: "boolean" },
              severidade: { type: "string", enum: ["INFO","LOW","MEDIUM","HIGH","CRITICAL"] },
              observacao: { type: "string", description: "Análise detalhada da discrepância ou consistência" }
            }
          }
        }
      },
      required: ["sentinel_recommendation","sumario_executivo","analise_completa_ia","parecer_final","pontos_positivos","pontos_atencao","red_flags","nivel_confianca_ia","total_findings"]
    };

    console.log(`[SENTINEL v4] Invocando LLM com dados completos: BDC=${bdcDataString ? 'SIM' : 'NÃO'}, CAF=${cafDataString ? 'SIM' : 'NÃO'}, Respostas=${responses.length}, Docs=${documents.length}`);
    
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
      model: 'claude_sonnet_4_6'
    });
    
    console.log(`[SENTINEL v4] LLM respondeu. Recommendation=${llmResponse.sentinel_recommendation}, RedFlags=${(llmResponse.red_flags || []).length}, Confiança=${llmResponse.nivel_confianca_ia}%`);

    // ═══ SAVE SENTINEL QUALITATIVE DATA ═══
    const now = new Date().toISOString();
    const sentinelData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v4.0",
      // SENTINEL qualitative fields
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
      // Phase tracking
      fase_1_completa: true,
      data_analise_fase_1: now,
      fase_2_completa: hasExternalData || (existingScore?.fase_2_completa || false),
      data_analise_fase_2: hasExternalData ? now : (existingScore?.data_analise_fase_2 || null),
      fase_3_completa: hasExternalData,
      data_analise_fase_3: hasExternalData ? now : null,
    };

    if (existingScore) {
      await base44.asServiceRole.entities.ComplianceScore.update(existingScore.id, sentinelData);
      console.log(`[SENTINEL v4] Score updated: ${existingScore.id}`);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(sentinelData);
      console.log(`[SENTINEL v4] Score created`);
    }

    // Update OnboardingCase with SENTINEL narrative
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      iaExplanation: llmResponse.sumario_executivo,
    });

    const duration = Date.now() - startTime;
    console.log(`[SENTINEL v4] Concluído em ${duration}ms`);

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
    console.error(`[SENTINEL v4] Erro:`, error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});