import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * SENTINEL - Agente de Análise de Compliance
 * 
 * Esta função realiza a análise completa de um caso de onboarding utilizando IA.
 * Segue as 3 fases: Análise do Questionário, Validações Externas e Consolidação.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Extrair ID do caso (pode vir direto ou via evento de automação)
    let caseId = payload.onboardingCaseId;
    
    // Se é um evento de automação de entidade
    if (!caseId && payload.event?.entity_id) {
      caseId = payload.event.entity_id;
    }
    
    // Se é evento de criação de QuestionnaireResponse, buscar o caseId
    if (!caseId && payload.data?.onboardingCaseId) {
      caseId = payload.data.onboardingCaseId;
    }
    
    if (!caseId) {
      return Response.json({ error: "ID do caso não fornecido" }, { status: 400 });
    }
    
    console.log(`[SENTINEL] Iniciando análise do caso: ${caseId}`);
    
    // ═══════════════════════════════════════════════════════════
    // ETAPA 1: CARREGAMENTO DE DADOS
    // ═══════════════════════════════════════════════════════════
    
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    
    if (!onboardingCase) {
      return Response.json({ error: "Caso não encontrado" }, { status: 404 });
    }
    
    // Verificar se já existe score completo recente (evitar reprocessamento)
    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({
      onboarding_case_id: caseId
    });
    
    const existingScore = existingScores[0];
    
    // Se já tem análise completa (fase 3) feita nas últimas 24h, pular
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const lastAnalysis = new Date(existingScore.data_analise_fase_3);
      const hoursSinceAnalysis = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60);
      if (hoursSinceAnalysis < 24) {
        console.log(`[SENTINEL] Análise recente encontrada (${hoursSinceAnalysis.toFixed(1)}h atrás). Pulando.`);
        return Response.json({ 
          success: true, 
          message: "Análise recente já existe",
          score_id: existingScore.id
        });
      }
    }
    
    // Buscar merchant
    const [merchant] = await base44.asServiceRole.entities.Merchant.filter({ 
      id: onboardingCase.merchantId 
    });
    
    // Buscar todas as respostas do questionário
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({
      onboardingCaseId: caseId
    });
    
    // Buscar validações externas (se disponíveis)
    const externalValidations = await base44.asServiceRole.entities.ExternalValidationResult.filter({
      onboardingCaseId: caseId
    });
    
    // Buscar documentos enviados
    const documents = await base44.asServiceRole.entities.DocumentUpload.filter({
      onboardingCaseId: caseId
    });
    
    console.log(`[SENTINEL] Dados carregados: ${responses.length} respostas, ${externalValidations.length} validações, ${documents.length} documentos`);
    
    // ═══════════════════════════════════════════════════════════
    // ETAPA 2: PREPARAR CONTEXTO PARA A IA
    // ═══════════════════════════════════════════════════════════
    
    // Formatar respostas por seção para melhor análise
    const formattedResponses = responses.map(r => ({
      pergunta: r.questionText || `Pergunta ${r.questionId}`,
      tipo: r.questionType,
      resposta: r.valueText || r.valueNumber || r.valueBoolean || r.valueArray?.join(', ') || 'Não respondido'
    }));
    
    // Formatar validações externas
    const formattedValidations = externalValidations.map(v => ({
      provedor: v.provider,
      tipo: v.validationType,
      status: v.status,
      score: v.score,
      dados: v.resultData,
      erro: v.errorMessage
    }));
    
    // Formatar documentos
    const formattedDocuments = documents.map(d => ({
      tipo: d.documentName,
      status: d.validationStatus,
      notas: d.validationNotes
    }));
    
    // ═══════════════════════════════════════════════════════════
    // ETAPA 3: ANÁLISE VIA LLM
    // ═══════════════════════════════════════════════════════════
    
    const hasExternalValidations = externalValidations.length > 0;
    
    const analysisPrompt = `Você é o SENTINEL, o analista de compliance e risco mais rigoroso e experiente do mercado financeiro brasileiro.

Sua tarefa é analisar o caso de onboarding abaixo e produzir uma avaliação completa de risco.

═══════════════════════════════════════════════════════════
DADOS DO CASO
═══════════════════════════════════════════════════════════

**Merchant:**
- ID: ${merchant?.id || 'N/A'}
- Tipo: ${merchant?.type || 'N/A'} (PF = Pessoa Física, PJ = Pessoa Jurídica)
- CPF/CNPJ: ${merchant?.cpfCnpj || 'N/A'}
- Nome/Razão Social: ${merchant?.fullName || 'N/A'}
- Nome Fantasia: ${merchant?.companyName || 'N/A'}
- Email: ${merchant?.email || 'N/A'}
- Telefone: ${merchant?.phone || 'N/A'}
- Serviços Solicitados: ${merchant?.paymentServices?.join(', ') || 'N/A'}
- Data Cadastro: ${merchant?.created_date || 'N/A'}

**Respostas do Questionário (${responses.length} respostas):**
${JSON.stringify(formattedResponses, null, 2)}

**Documentos Enviados (${documents.length}):**
${JSON.stringify(formattedDocuments, null, 2)}

${hasExternalValidations ? `**Validações Externas (${externalValidations.length}):**
${JSON.stringify(formattedValidations, null, 2)}` : '**Validações Externas:** Ainda não disponíveis - executar apenas Fase 1'}

═══════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE
═══════════════════════════════════════════════════════════

${hasExternalValidations ? 'Execute as 3 FASES de análise:' : 'Execute apenas a FASE 1 (questionário):'}

**FASE 1 - Análise do Questionário (Peso 45%):**
- Verifique completude e validade dos dados
- Identifique inconsistências e contradições
- Avalie qualidade das justificativas textuais
- Detecte red flags regulatórios (PEP, sanções, atividades de risco)
- Gere Score do Questionário (SQ): 0-1000

${hasExternalValidations ? `**FASE 2 - Validações Externas (Peso 35%):**
- Analise resultados da Big Data Corp e CAF
- Compare dados declarados vs confirmados
- Verifique situação cadastral, score de crédito, processos
- Valide biometria e documentos
- Gere Score de Validação Externa (SVE): 0-1000

**FASE 3 - Consolidação:**
- Calcule Bônus de Consistência (0-1000)
- Calcule Score Geral Composto (SGC)
- Aplique regras de override se necessário
- Determine recomendação final` : ''}

**Escala de Scores (0-1000):**
- 850-1000: BAIXO RISCO → Aprovado
- 650-849: MÉDIO RISCO → Aprovado com Condições  
- 400-649: ALTO RISCO → Revisão Manual
- 200-399: CRÍTICO → Revisão Manual Urgente
- 0-199: BLOQUEANTE → Recusado

**Severidades de Findings:**
INFO, LOW, MEDIUM, HIGH, CRITICAL, BLOQUEANTE

Seja rigoroso mas justo. Documente cada finding com evidências claras.`;

    const responseSchema = {
      type: "object",
      properties: {
        // Scores
        score_questionario: {
          type: "number",
          description: "Score da Fase 1 - Questionário (0-1000)"
        },
        classificacao_questionario: {
          type: "string",
          description: "Classificação da Fase 1"
        },
        score_validacao_externa: {
          type: "number",
          description: "Score da Fase 2 - Validações Externas (0-1000). 0 se não disponível."
        },
        classificacao_validacao_externa: {
          type: "string",
          description: "Classificação da Fase 2 ou 'Pendente'"
        },
        bonus_consistencia: {
          type: "number",
          description: "Bônus de consistência entre questionário e validações (0-1000)"
        },
        score_geral_composto: {
          type: "number",
          description: "Score Geral Final (0-1000)"
        },
        classificacao_geral: {
          type: "string",
          enum: ["Baixo Risco", "Médio Risco", "Alto Risco", "Crítico", "Bloqueante"]
        },
        recomendacao_final: {
          type: "string",
          enum: ["Aprovado", "Aprovado com Condições", "Revisão Manual", "Recusado"]
        },
        
        // Análise detalhada
        sumario_executivo: {
          type: "string",
          description: "Resumo de 2-3 linhas sobre o caso"
        },
        analise_completa_ia: {
          type: "string",
          description: "Análise completa e detalhada do caso, incluindo todos os pontos avaliados, findings identificados, justificativas e evidências. Seja extenso e detalhado."
        },
        parecer_final: {
          type: "string",
          description: "Parecer conclusivo de 3-5 linhas para registro em dossiê"
        },
        
        // Listas de pontos
        pontos_positivos: {
          type: "array",
          items: { type: "string" },
          description: "Lista de pontos positivos identificados"
        },
        pontos_atencao: {
          type: "array",
          items: { type: "string" },
          description: "Lista de pontos de atenção (não críticos)"
        },
        red_flags: {
          type: "array",
          items: { type: "string" },
          description: "Lista de red flags críticos identificados"
        },
        
        // Para revisão manual
        recomendacoes_revisao_manual: {
          type: "string",
          description: "Recomendações detalhadas para o analista se o caso cair em revisão manual. O que investigar, quais documentos solicitar, quais perguntas fazer."
        },
        perguntas_sugeridas: {
          type: "array",
          items: { type: "string" },
          description: "Lista de perguntas sugeridas para o analista fazer ao merchant"
        },
        documentos_adicionais_sugeridos: {
          type: "array",
          items: { type: "string" },
          description: "Lista de documentos adicionais que devem ser solicitados"
        },
        
        // Metadados
        nivel_confianca_ia: {
          type: "number",
          description: "Nível de confiança da IA nesta análise (0-100)"
        },
        total_findings: {
          type: "number",
          description: "Total de findings identificados"
        },
        findings_por_severidade: {
          type: "object",
          description: "Contagem de findings por severidade (ex: {CRITICAL: 2, HIGH: 3, MEDIUM: 5})"
        },
        overrides_aplicados: {
          type: "array",
          items: { type: "string" },
          description: "Lista de overrides aplicados (ex: 'Override Bloqueante: documento fraudulento')"
        },
        condicoes_aprovacao: {
          type: "string",
          description: "Se aprovado com condições, quais são as condições"
        }
      },
      required: [
        "score_questionario",
        "classificacao_questionario", 
        "score_geral_composto",
        "classificacao_geral",
        "recomendacao_final",
        "sumario_executivo",
        "analise_completa_ia",
        "parecer_final",
        "pontos_positivos",
        "pontos_atencao",
        "red_flags",
        "nivel_confianca_ia",
        "total_findings"
      ]
    };
    
    console.log(`[SENTINEL] Invocando LLM para análise...`);
    
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema
    });
    
    console.log(`[SENTINEL] Resposta da LLM recebida`);
    
    // ═══════════════════════════════════════════════════════════
    // ETAPA 4: SALVAR RESULTADOS
    // ═══════════════════════════════════════════════════════════
    
    const now = new Date().toISOString();
    
    const scoreData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v2.0",
      
      // Scores
      score_questionario: llmResponse.score_questionario,
      classificacao_questionario: llmResponse.classificacao_questionario,
      score_validacao_externa: llmResponse.score_validacao_externa || 0,
      classificacao_validacao_externa: llmResponse.classificacao_validacao_externa || "Pendente",
      bonus_consistencia: llmResponse.bonus_consistencia || 1000,
      score_geral_composto: llmResponse.score_geral_composto,
      classificacao_geral: llmResponse.classificacao_geral,
      recomendacao_final: llmResponse.recomendacao_final,
      
      // Análise detalhada
      sumario_executivo: llmResponse.sumario_executivo,
      analise_completa_ia: llmResponse.analise_completa_ia,
      parecer_final: llmResponse.parecer_final,
      
      // Listas
      pontos_positivos: llmResponse.pontos_positivos || [],
      pontos_atencao: llmResponse.pontos_atencao || [],
      red_flags: llmResponse.red_flags || [],
      
      // Revisão manual
      recomendacoes_revisao_manual: llmResponse.recomendacoes_revisao_manual || "",
      perguntas_sugeridas: llmResponse.perguntas_sugeridas || [],
      documentos_adicionais_sugeridos: llmResponse.documentos_adicionais_sugeridos || [],
      
      // Metadados
      nivel_confianca_ia: llmResponse.nivel_confianca_ia,
      total_findings: llmResponse.total_findings || 0,
      findings_por_severidade: llmResponse.findings_por_severidade || {},
      overrides_aplicados: llmResponse.overrides_aplicados || [],
      condicoes_aprovacao: llmResponse.condicoes_aprovacao || "",
      
      // Controle de fases
      fase_1_completa: true,
      data_analise_fase_1: now,
      fase_2_completa: hasExternalValidations,
      data_analise_fase_2: hasExternalValidations ? now : null,
      fase_3_completa: hasExternalValidations,
      data_analise_fase_3: hasExternalValidations ? now : null
    };
    
    let savedScore;
    
    if (existingScore) {
      // Atualizar score existente
      savedScore = await base44.asServiceRole.entities.ComplianceScore.update(
        existingScore.id, 
        scoreData
      );
      console.log(`[SENTINEL] Score atualizado: ${existingScore.id}`);
    } else {
      // Criar novo score
      savedScore = await base44.asServiceRole.entities.ComplianceScore.create(scoreData);
      console.log(`[SENTINEL] Score criado: ${savedScore.id}`);
    }
    
    // ═══════════════════════════════════════════════════════════
    // ETAPA 5: ATUALIZAR ONBOARDING CASE
    // ═══════════════════════════════════════════════════════════
    
    // Mapear recomendação para status
    let newStatus = onboardingCase.status;
    if (onboardingCase.status === 'Pendente' || onboardingCase.status === 'Em Processamento') {
      switch (llmResponse.recomendacao_final) {
        case 'Aprovado':
          newStatus = 'Aprovado';
          break;
        case 'Aprovado com Condições':
          newStatus = 'Manual'; // Requer revisão para confirmar condições
          break;
        case 'Revisão Manual':
          newStatus = 'Manual';
          break;
        case 'Recusado':
          newStatus = 'Recusado';
          break;
      }
    }
    
    // Converter score para escala 0-100 para campo legado
    const riskScore100 = Math.round(llmResponse.score_geral_composto / 10);
    
    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      status: newStatus,
      riskScore: riskScore100,
      iaDecision: llmResponse.recomendacao_final,
      iaExplanation: llmResponse.sumario_executivo,
      redFlags: llmResponse.red_flags || []
    });
    
    // Atualizar merchant também
    if (merchant) {
      await base44.asServiceRole.entities.Merchant.update(merchant.id, {
        onboardingStatus: newStatus,
        riskScore: riskScore100
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SENTINEL] Análise concluída em ${duration}ms. Recomendação: ${llmResponse.recomendacao_final}`);
    
    return Response.json({
      success: true,
      message: "Análise concluída com sucesso",
      case_id: caseId,
      score_id: savedScore?.id || existingScore?.id,
      recomendacao: llmResponse.recomendacao_final,
      score_geral: llmResponse.score_geral_composto,
      classificacao: llmResponse.classificacao_geral,
      duration_ms: duration
    });
    
  } catch (error) {
    console.error(`[SENTINEL] Erro:`, error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});