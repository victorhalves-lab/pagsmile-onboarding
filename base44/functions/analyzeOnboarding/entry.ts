import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SENTINEL — Agente de Análise QUALITATIVA de Compliance
 *
 * PAPEL NO PIPELINE UNIFICADO:
 * - SENTINEL é a camada QUALITATIVA. Ele NÃO gera score numérico autoritativo.
 * - O score V4 (de bdcEnrichCase) é a FONTE ÚNICA para: score_final, subfaixa, bloqueios.
 * - SENTINEL RECEBE o score V4 como contexto e produz:
 *   1. Análise dimensional (7 dimensões com veredicto)
 *   2. Cross-validation declarado vs confirmado
 *   3. Parecer narrativo e sumário executivo
 *   4. Pontos positivos, atenção, red flags QUALITATIVOS
 *   5. Recomendações para revisão manual
 *   6. Uma "sentinel_recommendation" que pode ESCALAR a decisão V4 (nunca rebaixar)
 *
 * CAMPOS QUE SENTINEL ESCREVE no ComplianceScore:
 *   sentinel_recommendation, sumario_executivo, analise_completa_ia, parecer_final,
 *   pontos_positivos, pontos_atencao, sentinel_red_flags, recomendacoes_revisao_manual,
 *   perguntas_sugeridas, documentos_adicionais_sugeridos, nivel_confianca_ia,
 *   analise_dimensional, cross_validation, total_findings, findings_por_severidade
 *
 * CAMPOS QUE SENTINEL NUNCA SOBRESCREVE:
 *   score_final, score_base_segmento, score_variaveis, score_enriquecimento,
 *   subfaixa, subfaixa_nome, bloqueios_ativos, variaveis_aplicadas,
 *   decisao_automatica, rolling_reserve_percent, monitoramento_nivel,
 *   condicoes_automaticas, recomendacao_final (set by orchestrator)
 */

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

    console.log(`[SENTINEL] Iniciando análise qualitativa do caso: ${caseId}`);

    // ═══ LOAD ALL DATA ═══
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    // Check for recent analysis (< 24h)
    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const existingScore = existingScores[0];
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const hours = (Date.now() - new Date(existingScore.data_analise_fase_3).getTime()) / 3600000;
      if (hours < 24) {
        console.log(`[SENTINEL] Análise recente (${hours.toFixed(1)}h). Pulando.`);
        return Response.json({ success: true, message: "Análise recente existe", score_id: existingScore.id });
      }
    }

    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });
    const externalValidations = await base44.asServiceRole.entities.ExternalValidationResult.filter({ onboardingCaseId: caseId });
    const documents = await base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId: caseId });

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
    } : null;

    console.log(`[SENTINEL] V4 context: score=${v4Data?.score_final}, subfaixa=${v4Data?.subfaixa}`);

    // ═══ EXTRACT BDC SUMMARY ═══
    const bdcValidations = externalValidations.filter(v => v.provider === 'BigDataCorp' && v.resultData).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latestBdc = bdcValidations[0];
    let bdcRawSummary = null;
    if (latestBdc?.resultData) {
      try {
        const rd = latestBdc.resultData;
        const extractArr = (key) => { const val = rd[key]; return !val ? [] : Array.isArray(val) ? val : [val]; };
        const bdBasic = extractArr('BasicData')[0] || extractArr('basic_data')[0] || {};
        const bdKyc = extractArr('Kyc')[0] || extractArr('kyc')[0] || {};
        const bdOwnersKyc = extractArr('OwnersKyc') || extractArr('owners_kyc') || [];
        const bdProcesses = extractArr('Processes') || extractArr('processes') || [];
        const bdCollections = extractArr('Collections') || extractArr('collections') || [];
        const bdMedia = extractArr('MediaProfileAndExposure') || extractArr('media_profile_and_exposure') || [];
        const bdDomains = extractArr('Domains') || extractArr('domains') || [];
        const bdActivity = extractArr('ActivityIndicators') || extractArr('activity_indicators') || [];
        const bdDebtors = extractArr('GovernmentDebtors') || extractArr('government_debtors') || [];
        const bdFinancial = extractArr('FinancialMarket') || extractArr('financial_market') || [];
        const bdRels = rd.Relationships?.Relationships || extractArr('relationships') || [];

        bdcRawSummary = {
          basicData: {
            officialName: bdBasic.OfficialName || bdBasic.CompanyName || bdBasic.Name || '',
            tradeName: bdBasic.TradeName || bdBasic.FantasyName || '',
            status: bdBasic.TaxIdStatus || bdBasic.TaxIdStatusDescription || '',
            foundedDate: bdBasic.FoundedDate || bdBasic.Age?.FoundedDate || '',
            capital: bdBasic.ShareCapital || bdBasic.Capital || 0,
            mainCnae: bdBasic.MainEconomicActivity || '',
            cnaeDesc: bdBasic.MainEconomicActivityDescription || '',
            legalNature: bdBasic.LegalNatureDescription || bdBasic.LegalNature || '',
            companySize: bdBasic.CompanySize || '',
            employees: bdBasic.NumberOfEmployees || bdBasic.EmployeesCount || 'N/D',
          },
          kyc: { isPep: bdKyc.IsPEP || bdKyc.IsPep || false, hasSanctions: (bdKyc.Sanctions || []).length > 0 },
          ownersCount: bdOwnersKyc.length,
          ownersPep: bdOwnersKyc.filter(o => o?.IsPEP || o?.IsPep).map(o => o?.Name || 'N/I'),
          ownersSanctioned: bdOwnersKyc.filter(o => (o?.Sanctions || []).length > 0).map(o => o?.Name || 'N/I'),
          processesCount: bdProcesses.reduce((s, p) => s + (p?.TotalLawsuits || p?.NumberOfLawsuits || 0), 0),
          hasCriminalProcesses: bdProcesses.some(p => /criminal|penal|crime/i.test(JSON.stringify(p?.LawsuitTypes || p?.Categories || []))),
          collectionsCount: bdCollections.reduce((s, c) => s + (c?.TotalRecords || 0), 0),
          mediaNegative: bdMedia.filter(m => /NEGATIVE/i.test(m?.Sentiment || m?.OverallSentiment || '')).length,
          domainsCount: bdDomains.length,
          activityLevel: bdActivity[0]?.ActivityLevel ?? bdActivity[0]?.Level ?? 'N/D',
          shellCompanyScore: bdActivity[0]?.ShellCompanyLikelyhood ?? bdActivity[0]?.ShellCompanyLikelihood ?? 'N/D',
          governmentDebtTotal: bdDebtors.reduce((s, d) => s + (Number(d?.TotalValue || d?.Value || 0)), 0),
          qsaCount: Array.isArray(bdRels) ? bdRels.length : 0,
        };
      } catch (e) { console.warn(`[SENTINEL] BDC summary extraction failed: ${e.message}`); }
    }

    // ═══ EXTRACT CAF SUMMARY ═══
    const cafValidations = externalValidations.filter(v => v.provider === 'CAF');
    let cafSummary = null;
    if (cafValidations.length > 0) {
      const liveness = cafValidations.find(v => v.validationType?.includes('Liveness'));
      const docFront = cafValidations.find(v => v.validationType?.includes('Frente'));
      cafSummary = {
        totalVerifications: cafValidations.length,
        allApproved: cafValidations.every(v => v.status === 'Sucesso'),
        liveness: liveness ? { isAlive: liveness.resultData?.isAlive, isMatch: liveness.resultData?.isMatch, similarity: liveness.resultData?.similarity } : null,
        docFront: docFront ? { valid: docFront.resultData?.isCaptureValid } : null,
      };
    }

    // ═══ BUILD PROMPT ═══
    const formattedResponses = responses.map(r => ({
      pergunta: r.questionText || `Pergunta ${r.questionId}`,
      resposta: r.valueText || r.valueNumber || r.valueBoolean || r.valueArray?.join(', ') || 'Não respondido'
    }));
    const formattedDocuments = documents.map(d => ({ tipo: d.documentName, status: d.validationStatus }));
    const hasExternalData = externalValidations.length > 0;

    const analysisPrompt = `Você é o SENTINEL, analista de compliance e risco do mercado financeiro brasileiro.

═══ SEU PAPEL ═══
Você é a CAMADA QUALITATIVA do pipeline. O score numérico V4 já foi calculado deterministicamente.
Seu trabalho é: analisar contexto, correlacionar dados, identificar padrões sutis, e produzir narrativa.
Você NÃO produz score numérico — apenas análise qualitativa e uma recomendação que pode ESCALAR a decisão V4.

═══ SCORE V4 (DETERMINÍSTICO — JÁ CALCULADO) ═══
${v4Data ? `- Score Final: ${v4Data.score_final}/849
- Subfaixa: ${v4Data.subfaixa} (${v4Data.subfaixa_nome})
- Composição: Base=${v4Data.score_base} + Variáveis=${v4Data.score_variaveis} + Enriquecimento=${v4Data.score_enriquecimento}
- Bloqueios: ${v4Data.bloqueios.length > 0 ? v4Data.bloqueios.join(', ') : 'Nenhum'}
- Red Flags V4: ${v4Data.v4_red_flags.length > 0 ? v4Data.v4_red_flags.join('; ') : 'Nenhum'}
- Recomendação V4: ${v4Data.v4_recomendacao}
- Segmento: ${v4Data.segmento}` : 'V4 não disponível — forneça análise independente'}

═══ DADOS DO MERCHANT ═══
- Tipo: ${merchant?.type || 'N/A'} | CPF/CNPJ: ${merchant?.cpfCnpj || 'N/A'}
- Razão Social: ${merchant?.fullName || 'N/A'} | Nome Fantasia: ${merchant?.companyName || 'N/A'}
- Email: ${merchant?.email || 'N/A'} | Telefone: ${merchant?.phone || 'N/A'}
- Serviços: ${merchant?.paymentServices?.join(', ') || 'N/A'}

═══ QUESTIONÁRIO (${responses.length} respostas) ═══
${JSON.stringify(formattedResponses, null, 2)}

═══ DOCUMENTOS (${documents.length}) ═══
${JSON.stringify(formattedDocuments, null, 2)}

${bdcRawSummary ? `═══ DADOS BDC (Big Data Corp) ═══
- Razão Social: ${bdcRawSummary.basicData.officialName}
- CNPJ Status: ${bdcRawSummary.basicData.status}
- Fundação: ${bdcRawSummary.basicData.foundedDate}
- Capital: R$ ${Number(bdcRawSummary.basicData.capital || 0).toLocaleString('pt-BR')}
- CNAE: ${bdcRawSummary.basicData.mainCnae} — ${bdcRawSummary.basicData.cnaeDesc}
- Porte: ${bdcRawSummary.basicData.companySize}
- Empregados: ${bdcRawSummary.basicData.employees}
- PEP: ${bdcRawSummary.kyc.isPep ? 'SIM' : 'Não'} | Sanções: ${bdcRawSummary.kyc.hasSanctions ? 'SIM' : 'Não'}
- QSA: ${bdcRawSummary.qsaCount} sócios | PEP: ${bdcRawSummary.ownersPep.join(', ') || 'Nenhum'}
- Processos: ${bdcRawSummary.processesCount}${bdcRawSummary.hasCriminalProcesses ? ' (CRIMINAL)' : ''}
- Negativação: ${bdcRawSummary.collectionsCount} | Dívida Ativa: R$ ${Number(bdcRawSummary.governmentDebtTotal || 0).toLocaleString('pt-BR')}
- Mídia Negativa: ${bdcRawSummary.mediaNegative} | Domínios: ${bdcRawSummary.domainsCount}
- Atividade: ${bdcRawSummary.activityLevel} | Shell: ${bdcRawSummary.shellCompanyScore}` : ''}

${cafSummary ? `═══ CAF (Verificação de Identidade) ═══
- ${cafSummary.totalVerifications} verificações | Todas aprovadas: ${cafSummary.allApproved ? 'SIM' : 'NÃO'}
${cafSummary.liveness ? `- Liveness: ${cafSummary.liveness.isAlive ? 'VIVO' : 'FALHOU'} | FaceMatch: ${cafSummary.liveness.isMatch ? 'OK' : 'FALHOU'} | Similaridade: ${cafSummary.liveness.similarity ? (cafSummary.liveness.similarity * 100).toFixed(0) + '%' : 'N/D'}` : '- Liveness: Não realizado'}` : ''}

═══ INSTRUÇÕES ═══

1. **ANÁLISE DIMENSIONAL** — Avalie cada uma das 7 dimensões:
   IDENTIDADE, SÓCIOS/QSA, COMPLIANCE/REGULATÓRIO, PEGADA DIGITAL, REPUTAÇÃO, FINANCEIRO, BIOMETRIA

2. **CROSS-VALIDATION** — Compare declarado (questionário) vs confirmado (BDC/CAF):
   Razão Social, Endereço, CNAE, Sócios, TPV vs porte, Email vs domínio

3. **RECOMENDAÇÃO SENTINEL** — Pode ser: Aprovado, Aprovado com Condições, Revisão Manual, Recusado.
   REGRA: Se V4 diz "Aprovado" mas você identifica red flags qualitativos graves, ESCALE para "Revisão Manual".
   Nunca rebaixe (se V4 diz "Recusado", não sugira "Aprovado").

4. **PARECER** — Narrativa detalhada para dossiê de compliance.

Seja rigoroso, detalhado, e documente com evidências.`;

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
          description: "Se a recomendação difere do V4, explique POR QUÊ. Vazio se não escalou."
        },
        sumario_executivo: { type: "string", description: "Resumo de 2-3 linhas" },
        analise_completa_ia: { type: "string", description: "Análise completa e detalhada" },
        parecer_final: { type: "string", description: "Parecer conclusivo para dossiê" },
        pontos_positivos: { type: "array", items: { type: "string" } },
        pontos_atencao: { type: "array", items: { type: "string" } },
        red_flags: { type: "array", items: { type: "string" }, description: "Red flags QUALITATIVOS (sem repetir os V4)" },
        recomendacoes_revisao_manual: { type: "string" },
        perguntas_sugeridas: { type: "array", items: { type: "string" } },
        documentos_adicionais_sugeridos: { type: "array", items: { type: "string" } },
        nivel_confianca_ia: { type: "number", description: "0-100" },
        total_findings: { type: "number" },
        findings_por_severidade: { type: "object" },
        overrides_aplicados: { type: "array", items: { type: "string" } },
        condicoes_aprovacao: { type: "string" },
        analise_dimensional: {
          type: "object",
          properties: {
            identidade: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
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
              valor_declarado: { type: "string" },
              valor_confirmado: { type: "string" },
              consistente: { type: "boolean" },
              severidade: { type: "string", enum: ["INFO","LOW","MEDIUM","HIGH","CRITICAL"] },
              observacao: { type: "string" }
            }
          }
        }
      },
      required: ["sentinel_recommendation","sumario_executivo","analise_completa_ia","parecer_final","pontos_positivos","pontos_atencao","red_flags","nivel_confianca_ia","total_findings"]
    };

    console.log(`[SENTINEL] Invocando LLM (claude_sonnet_4_6)...`);
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
      model: 'claude_sonnet_4_6'
    });
    console.log(`[SENTINEL] LLM respondeu. Recommendation=${llmResponse.sentinel_recommendation}`);

    // ═══ SAVE SENTINEL QUALITATIVE DATA ═══
    // NEVER overwrite V4 deterministic fields
    const now = new Date().toISOString();
    const sentinelData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v3.0",
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
      console.log(`[SENTINEL] Score updated (qualitative only): ${existingScore.id}`);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(sentinelData);
      console.log(`[SENTINEL] Score created (no V4 data yet)`);
    }

    // Update OnboardingCase with SENTINEL narrative (NOT status/decision — that's for the orchestrator)
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      iaExplanation: llmResponse.sumario_executivo,
    });

    const duration = Date.now() - startTime;
    console.log(`[SENTINEL] Concluído em ${duration}ms`);

    return Response.json({
      success: true,
      case_id: caseId,
      score_id: existingScore?.id,
      sentinel_recommendation: llmResponse.sentinel_recommendation,
      escalation_justification: llmResponse.escalation_justification || null,
      nivel_confianca: llmResponse.nivel_confianca_ia,
      duration_ms: duration
    });

  } catch (error) {
    console.error(`[SENTINEL] Erro:`, error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});