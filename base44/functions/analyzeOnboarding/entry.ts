import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SENTINEL v4.1 — Agente de Análise QUALITATIVA de Compliance
 *
 * PIPELINE: camada qualitativa. Score V4 numérico vem de bdcEnrichCase.
 * SENTINEL analisa contexto, correlaciona dados BDC/CAF/Questionário,
 * identifica padrões e produz narrativa factual detalhada.
 *
 * v4.1: Pré-processamento inteligente de dados para evitar timeout.
 * Em vez de enviar raw data truncado, extrai campos decisórios estruturados.
 */

// ═══ HELPERS ═══

function truncate(str, max = 8000) {
  if (!str || str.length <= max) return str;
  return str.substring(0, max) + '…[truncado]';
}

/**
 * Extrai campos decisórios do BDC raw data em formato compacto e estruturado.
 * Isso reduz ~50KB de raw data para ~4KB de dados relevantes para compliance.
 */
function extractBdcDecisionFields(resultData) {
  if (!resultData) return null;
  const d = {};

  // BasicData
  const basic = resultData.BasicData || resultData.basicData;
  if (basic) {
    d.basicData = {
      officialName: basic.OfficialName || basic.officialName,
      taxIdStatus: basic.TaxIdStatus || basic.taxIdStatus,
      taxIdOrigin: basic.TaxIdOrigin || basic.taxIdOrigin,
      age: basic.Age || basic.age,
      foundedDate: basic.FoundedDate || basic.foundedDate,
      isHeadquarter: basic.IsHeadquarter ?? basic.isHeadquarter,
      isMatrix: basic.IsMatrix ?? basic.isMatrix,
      mainActivity: basic.MainActivity || basic.mainActivity,
      mainActivityCode: basic.MainActivityCode || basic.mainActivityCode,
      shareCapital: basic.ShareCapital || basic.shareCapital,
      employeeCount: basic.EmployeeCount || basic.employeeCount,
      companySize: basic.Size || basic.size || basic.CompanySize,
      status: basic.RegistrationStatus || basic.registrationStatus || basic.Status,
      naturezaJuridica: basic.LegalNature || basic.legalNature || basic.NaturezaJuridica,
      phoneList: basic.PhoneList || basic.Phones || [],
      emailList: basic.EmailList || basic.Emails || [],
      addressList: basic.AddressList || basic.Addresses || [],
    };
  }

  // KYC Data
  const kyc = resultData.KycData || resultData.kycData || resultData.OnlinePrescenceData;
  if (kyc) {
    d.kycData = {
      isPEP: kyc.IsPEP ?? kyc.isPEP,
      hasSanctions: kyc.IsCurrentlySanctioned ?? kyc.isCurrentlySanctioned ?? kyc.HasSanctions,
      sanctionsSources: kyc.SanctionsSources || kyc.sanctionsSources || [],
      hasMediaExposure: kyc.HasMediaExposure ?? kyc.hasMediaExposure,
      riskLevel: kyc.RiskLevel || kyc.riskLevel,
      hasAlerts: kyc.HasAlerts ?? kyc.hasAlerts,
      alerts: kyc.Alerts || kyc.alerts || [],
    };
  }

  // Owners / QSA
  const owners = resultData.Owners || resultData.owners || resultData.OwnershipData;
  if (owners) {
    const ownerList = Array.isArray(owners) ? owners : (owners.OwnersList || owners.ownersList || []);
    d.owners = ownerList.slice(0, 10).map(o => ({
      name: o.Name || o.name,
      taxId: o.TaxId || o.taxId,
      role: o.Role || o.role || o.Qualification,
      participation: o.Participation || o.participation,
      isPEP: o.IsPEP ?? o.isPEP,
      hasSanctions: o.IsCurrentlySanctioned ?? o.isCurrentlySanctioned,
      hasNegative: o.HasNegativeMedia ?? o.hasNegativeMedia,
      age: o.Age || o.age,
    }));
  }

  // Lawsuits / Processes
  const proc = resultData.Processes || resultData.processes || resultData.LawsuitsData;
  if (proc) {
    const lawsuits = proc.Lawsuits || proc.lawsuits || (Array.isArray(proc) ? proc : []);
    d.processes = {
      totalCount: proc.TotalCount || proc.totalCount || lawsuits.length,
      totalValue: proc.TotalValue || proc.totalValue,
      asAuthor: proc.AsAuthor || proc.asAuthor || 0,
      asDefendant: proc.AsDefendant || proc.asDefendant || 0,
      lawsuits: lawsuits.slice(0, 8).map(l => ({
        number: l.Number || l.number,
        type: l.Type || l.type,
        court: l.Court || l.court,
        subject: l.Subject || l.subject,
        value: l.Value || l.value,
        status: l.Status || l.status,
        parties: l.Parties || l.parties || l.MainParties,
        date: l.Date || l.date || l.FilingDate,
      })),
    };
  }

  // Collections / Negativação
  const col = resultData.Collections || resultData.collections;
  if (col) {
    d.collections = {
      isOnCollection: col.IsCurrentlyOnCollection ?? col.isCurrentlyOnCollection,
      currentCount: col.CurrentCount || col.currentCount || 0,
      currentTotal: col.CurrentTotal || col.currentTotal || 0,
      historicCount: col.HistoricCount || col.historicCount || 0,
    };
  }

  // Activity Indicators
  const act = resultData.ActivityIndicators || resultData.activityIndicators;
  if (act) {
    d.activityIndicators = {
      hasRecentActivity: act.HasRecentActivity ?? act.hasRecentActivity,
      lastActivityDate: act.LastActivityDate || act.lastActivityDate,
      isActive: act.IsActive ?? act.isActive,
      monthsSinceLastActivity: act.MonthsSinceLastActivity || act.monthsSinceLastActivity,
    };
  }

  // Domains / Digital Footprint
  const dom = resultData.Domains || resultData.domains;
  if (dom) {
    const domList = Array.isArray(dom) ? dom : (dom.DomainsList || dom.domainsList || []);
    d.domains = domList.slice(0, 5).map(dd => ({
      domain: dd.Domain || dd.domain || dd.Name,
      status: dd.Status || dd.status,
      createdDate: dd.CreatedDate || dd.createdDate,
    }));
  }

  // Relationships / Related companies
  const rel = resultData.Relationships || resultData.relationships;
  if (rel) {
    const relList = Array.isArray(rel) ? rel : (rel.RelationshipsList || []);
    d.relationships = {
      totalRelated: relList.length,
      list: relList.slice(0, 5).map(r => ({
        name: r.RelatedEntityName || r.Name || r.name,
        taxId: r.RelatedEntityTaxId || r.TaxId,
        type: r.RelationshipType || r.Type,
      })),
    };
  }

  // MCC
  const mcc = resultData.MCC || resultData.Mcc;
  if (mcc) {
    d.mcc = {
      code: mcc.Code || mcc.code || mcc.MccCode,
      description: mcc.Description || mcc.description,
      riskLevel: mcc.RiskLevel || mcc.riskLevel,
    };
  }

  // Credit Score / Financial
  const credit = resultData.CreditScore || resultData.creditScore || resultData.FinancialData;
  if (credit) {
    d.creditScore = {
      score: credit.Score || credit.score,
      rating: credit.Rating || credit.rating,
      probability: credit.DefaultProbability || credit.defaultProbability,
    };
  }

  return d;
}

function formatCafLogsSummary(logs) {
  if (!logs || logs.length === 0) return null;
  return logs.map(log => {
    const entry = {
      servico: log.service_type,
      status: log.status,
      resultado: log.result_status,
      data: log.created_date,
    };
    if (log.red_flags?.length > 0) entry.red_flags = log.red_flags;
    if (log.is_alive != null) entry.is_alive = log.is_alive;
    if (log.similarity != null) entry.similarity = log.similarity;
    if (log.score != null) entry.score = log.score;
    if (log.error_message) entry.erro = log.error_message;
    // Extract key fields from response payload without sending the whole thing
    const rp = log.response_payload;
    if (rp) {
      const extracted = {};
      // CAF screening results
      if (rp.hitsCount != null) extracted.hitsCount = rp.hitsCount;
      if (rp.hits) extracted.hits = Array.isArray(rp.hits) ? rp.hits.slice(0, 3) : rp.hits;
      if (rp.result) extracted.result = rp.result;
      if (rp.status) extracted.resultStatus = rp.status;
      // Liveness / facematch
      if (rp.isAlive != null) extracted.isAlive = rp.isAlive;
      if (rp.score != null) extracted.score = rp.score;
      if (rp.similarity != null) extracted.similarity = rp.similarity;
      // Doc results
      if (rp.documentType) extracted.documentType = rp.documentType;
      if (rp.fraud != null) extracted.fraud = rp.fraud;
      // CPF validation
      if (rp.cpfData) extracted.cpfData = rp.cpfData;
      if (rp.regularSituation != null) extracted.regularSituation = rp.regularSituation;
      if (Object.keys(extracted).length > 0) entry.detalhes = extracted;
    }
    return entry;
  });
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

    console.log(`[SENTINEL v4.1] Iniciando análise: ${caseId}`);

    // ═══ LOAD ALL DATA ═══
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const existingScore = existingScores[0];
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const hours = (Date.now() - new Date(existingScore.data_analise_fase_3).getTime()) / 3600000;
      if (hours < 24 && !payload.force) {
        console.log(`[SENTINEL v4.1] Análise recente (${hours.toFixed(1)}h). Pulando.`);
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

    // ═══ V4 SCORE (authoritative numeric) ═══
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

    // ═══ EXTRACT BDC STRUCTURED DECISION FIELDS ═══
    const bdcValidations = externalValidations
      .filter(v => v.provider === 'BigDataCorp' && v.resultData)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const bdcDecision = bdcValidations[0]?.resultData ? extractBdcDecisionFields(bdcValidations[0].resultData) : null;

    // ═══ EXTRACT CAF SUMMARY ═══
    const cafLogs = cafIntegrationLogs.filter(l => l.provider === 'CAF');
    const cafSummary = formatCafLogsSummary(cafLogs);

    const cafValidations = externalValidations.filter(v => v.provider === 'CAF');
    const cafValSummary = cafValidations.length > 0
      ? cafValidations.map(v => ({ tipo: v.validationType, status: v.status, score: v.score, data: v.timestamp || v.created_date }))
      : null;

    const hasExternalData = externalValidations.length > 0;

    // ═══ FORMAT QUESTIONNAIRE RESPONSES (semantic) ═══
    const fmtResponses = responses.map(r => {
      const tipo = r.questionType || 'TEXT';
      const pergunta = r.questionText || `Pergunta ${r.questionId}`;
      const hasVal = (r.valueText != null && r.valueText !== '' && r.valueText !== 'N/A') ||
                     r.valueNumber != null || r.valueBoolean != null ||
                     (r.valueArray && r.valueArray.length > 0);

      if (!hasVal) return `[NÃO RESPONDIDA][${tipo}] "${pergunta}" → Lacuna real`;

      if (tipo === 'BOOLEAN') {
        const v = r.valueBoolean ? 'SIM' : 'NÃO';
        const pL = pergunta.toLowerCase();
        const isRisk = /restrit|proibid|cripto|jogos|aposta|sancion|pendência|judicial|litígio|irregularidade|infração|processo|condenação|bloqueio/.test(pL);
        const isControl = /compliance|pld|monitora|política|programa|certificação|segurança|auditor|controle/.test(pL);
        const isPEP = /pep|pessoa exposta|politicamente/.test(pL);

        let ctx = '';
        if (!r.valueBoolean && isRisk) ctx = '(POSITIVO: nega condição de risco)';
        else if (r.valueBoolean && isRisk) ctx = '(ATENÇÃO: confirma condição de risco)';
        else if (r.valueBoolean && isControl) ctx = '(POSITIVO: possui controle)';
        else if (!r.valueBoolean && isControl) ctx = '(ATENÇÃO: não possui controle)';
        else if (isPEP) ctx = r.valueBoolean ? '(PEP declarado — cross-validar)' : '(Declara não-PEP — cross-validar)';

        return `[RESPONDIDA][BOOLEAN] "${pergunta}" → ${v} ${ctx}`;
      }

      if (tipo === 'NUMBER') return `[RESPONDIDA][NUMBER] "${pergunta}" → ${r.valueNumber}`;
      if (tipo === 'SELECT') return `[RESPONDIDA][SELECT] "${pergunta}" → "${r.valueText}"`;
      if (tipo === 'MULTI_SELECT') return `[RESPONDIDA][MULTI_SELECT] "${pergunta}" → [${(r.valueArray || []).join(', ')}]`;

      const vt = r.valueText || '';
      if (vt.trim().length < 3 || ['n/a','na','-','.','...'].includes(vt.trim().toLowerCase())) {
        return `[PARCIAL][${tipo}] "${pergunta}" → "${vt}" (resposta genérica/vazia)`;
      }
      return `[RESPONDIDA][${tipo}] "${pergunta}" → "${vt}"`;
    });

    const respondidas = fmtResponses.filter(r => r.startsWith('[RESPONDIDA]')).length;
    const naoResp = fmtResponses.filter(r => r.startsWith('[NÃO RESPONDIDA]')).length;
    const parciais = fmtResponses.filter(r => r.startsWith('[PARCIAL]')).length;
    const completude = fmtResponses.length > 0 ? ((respondidas / fmtResponses.length) * 100).toFixed(1) : 0;

    const fmtDocs = documents.map(d => `${d.documentName || 'Doc'}: ${d.validationStatus} (${d.fileName})`);

    // ═══ BUILD OPTIMIZED PROMPT ═══
    const prompt = `Você é o SENTINEL v4.1, analista sênior de compliance e risco do mercado financeiro brasileiro.

## REGRAS INVIOLÁVEIS
1. NUNCA afirme algo sem dado nos blocos abaixo. Cada afirmação DEVE citar [FONTE: campo].
2. Red flag sem evidência = PROIBIDO. Se BDC KycData.hasSanctions=false e CAF hitsCount=0, NÃO reporte sanções.
3. Resposta BOOLEAN "NÃO" em pergunta sobre risco (cripto/jogos/sanções) = POSITIVO, não lacuna.
4. Pergunta com status [RESPONDIDA] = COMPLETA. Só [NÃO RESPONDIDA] ou [PARCIAL] são lacunas.
5. Para discrepância declarado vs confirmado: use cross_validation, não "lacuna".
6. Processos judiciais: detalhe número, tribunal, tipo, assunto, valor, partes, status.

## SEU PAPEL
Camada QUALITATIVA. Score V4 já calculado. Analise contexto, correlacione, identifique padrões, produza narrativa FACTUAL.
Pode ESCALAR decisão V4 (nunca rebaixar).

## SCORE V4
${v4Data ? `Score=${v4Data.score_final}/849 | Subfaixa=${v4Data.subfaixa} (${v4Data.subfaixa_nome})
Composição: Base=${v4Data.score_base} + Var=${v4Data.score_variaveis} + Enriq=${v4Data.score_enriquecimento}
Bloqueios: ${v4Data.bloqueios.length > 0 ? v4Data.bloqueios.join(', ') : 'Nenhum'}
Red Flags V4: ${v4Data.v4_red_flags.length > 0 ? v4Data.v4_red_flags.join('; ') : 'Nenhum'}
Recomendação V4: ${v4Data.v4_recomendacao} | Segmento: ${v4Data.segmento}
RR: ${v4Data.rolling_reserve}% | Monitoramento: ${v4Data.monitoramento}
${v4Data.condicoes.length > 0 ? 'Condições: ' + v4Data.condicoes.join('; ') : ''}` : 'V4 NÃO DISPONÍVEL'}

## MERCHANT
Tipo: ${merchant?.type || 'N/A'} | Doc: ${merchant?.cpfCnpj || 'N/A'} | Razão: ${merchant?.fullName || 'N/A'}
Fantasia: ${merchant?.companyName || 'N/A'} | Email: ${merchant?.email || 'N/A'} | Tel: ${merchant?.phone || 'N/A'}
Serviços: ${merchant?.paymentServices?.join(', ') || 'N/A'} | Subseller: ${merchant?.isSubseller ? 'SIM' : 'NÃO'}

## QUESTIONÁRIO (${fmtResponses.length} perguntas — ${completude}% completo — ${respondidas} respondidas, ${naoResp} não respondidas, ${parciais} parciais)
${fmtResponses.join('\n')}

## DOCUMENTOS (${documents.length})
${fmtDocs.length > 0 ? fmtDocs.join('\n') : 'Nenhum documento enviado'}

${bdcDecision ? `## DADOS BDC (Big Data Corp) — CAMPOS DECISÓRIOS ESTRUTURADOS
${JSON.stringify(bdcDecision, null, 2)}` : '## DADOS BDC\nNÃO DISPONÍVEL'}

${cafSummary ? `## CAF — SERVIÇOS EXECUTADOS
${JSON.stringify(cafSummary, null, 2)}` : '## CAF\nNÃO DISPONÍVEL'}

${cafValSummary ? `## CAF — VALIDAÇÕES
${JSON.stringify(cafValSummary, null, 2)}` : ''}

## INSTRUÇÕES
Produza análise EXTREMAMENTE detalhada, precisa, factual. Para cada achado cite [FONTE: campo_específico].
Na analise_completa_ia, organize por dimensão e detalhe cada achado com dados específicos. Mínimo 15 linhas.
No parecer_final, escreva como se fosse dossiê oficial de compliance — autocontido e completo.
Em pontos_positivos e pontos_atencao, cite evidências específicas com valores.
Red flags: SOMENTE com evidência. Formato "[FONTE: campo] Descrição com valores encontrados".
Cross-validation: compare declarado (questionário) vs confirmado (BDC/CAF) com detalhes.
Análise dimensional: 7 dimensões (identidade, sócios, compliance, digital, reputação, financeiro, biometria).
Se dados insuficientes para uma dimensão, marque veredicto e explique o que falta.
Qualidade > brevidade. Seja exhaustivo.`;

    const responseSchema = {
      type: "object",
      properties: {
        sentinel_recommendation: { type: "string", enum: ["Aprovado", "Aprovado com Condições", "Revisão Manual", "Recusado"] },
        escalation_justification: { type: "string" },
        sumario_executivo: { type: "string", description: "4-6 linhas, cite fontes [BDC], [CAF], [Questionário]" },
        analise_completa_ia: { type: "string", description: "Análise detalhada por dimensão. Mínimo 15 linhas. Cite fonte e dado exato para cada achado." },
        parecer_final: { type: "string", description: "Parecer autocontido para dossiê. Cite dados, fontes, valores." },
        pontos_positivos: { type: "array", items: { type: "string" }, description: "Cada item com [FONTE] e evidência" },
        pontos_atencao: { type: "array", items: { type: "string" }, description: "Cada item com O QUE, POR QUÊ e evidência" },
        red_flags: { type: "array", items: { type: "string" }, description: "SOMENTE com evidência. Formato: [FONTE: campo] Descrição" },
        recomendacoes_revisao_manual: { type: "string" },
        perguntas_sugeridas: { type: "array", items: { type: "string" } },
        documentos_adicionais_sugeridos: { type: "array", items: { type: "string" } },
        nivel_confianca_ia: { type: "number" },
        total_findings: { type: "number" },
        findings_por_severidade: {
          type: "object",
          properties: { critico: { type: "number" }, alto: { type: "number" }, medio: { type: "number" }, baixo: { type: "number" }, info: { type: "number" } }
        },
        overrides_aplicados: { type: "array", items: { type: "string" } },
        condicoes_aprovacao: { type: "string" },
        analise_dimensional: {
          type: "object",
          properties: {
            identidade: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            socios: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            compliance: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            digital: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            reputacao: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
            financeiro: { type: "object", properties: { veredicto: { type: "string", enum: ["APROVADO","ATENCAO","REPROVADO","NAO_DISPONIVEL"] }, confianca: { type: "number" }, resumo: { type: "string" }, findings: { type: "array", items: { type: "string" } } } },
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
              fonte_declarado: { type: "string" },
              valor_confirmado: { type: "string" },
              fonte_confirmado: { type: "string" },
              consistente: { type: "boolean" },
              severidade: { type: "string", enum: ["INFO","LOW","MEDIUM","HIGH","CRITICAL"] },
              observacao: { type: "string" }
            }
          }
        }
      },
      required: ["sentinel_recommendation","sumario_executivo","analise_completa_ia","parecer_final","pontos_positivos","pontos_atencao","red_flags","nivel_confianca_ia","total_findings"]
    };

    console.log(`[SENTINEL v4.1] LLM call: BDC=${bdcDecision ? 'SIM' : 'NÃO'}, CAF=${cafSummary ? cafSummary.length + ' logs' : 'NÃO'}, Respostas=${responses.length}, Docs=${documents.length}`);

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema,
      model: 'gemini_3_flash'
    });

    console.log(`[SENTINEL v4.1] LLM OK. Rec=${llmResponse.sentinel_recommendation}, RedFlags=${(llmResponse.red_flags || []).length}, Confiança=${llmResponse.nivel_confianca_ia}%`);

    // ═══ SAVE ═══
    const now = new Date().toISOString();
    const sentinelData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v4.1",
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
      console.log(`[SENTINEL v4.1] Score updated: ${existingScore.id}`);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(sentinelData);
      console.log(`[SENTINEL v4.1] Score created`);
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      iaExplanation: llmResponse.sumario_executivo,
    });

    const duration = Date.now() - startTime;
    console.log(`[SENTINEL v4.1] Concluído em ${duration}ms`);

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
    console.error(`[SENTINEL v4.1] Erro:`, error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});