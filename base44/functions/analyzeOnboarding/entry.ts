import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
    
    // Buscar resultado de enriquecimento CNPJ (se já existir no ComplianceScore)
    let cnpjEnrichmentData = null;
    let sanctionsData = null;
    let bdcRawSummary = null;
    if (merchant?.cpfCnpj && merchant.type === 'PJ') {
      const cnpjClean = (merchant.cpfCnpj || '').replace(/\D/g, '');
      if (cnpjClean.length === 14) {
        // Enriquecimento CNPJ + Screening de Sanções em paralelo
        const [enrichPromise, sanctionsPromise] = await Promise.allSettled([
          (async () => {
            const cnpjRes = await base44.asServiceRole.functions.invoke('brasilApiCnpj', { cnpj: cnpjClean });
            if (cnpjRes?.data && !cnpjRes.data.error) {
              const enrichRes = await base44.asServiceRole.functions.invoke('analyzeCnpjEnrichment', {
                cnpjDataArray: { ...cnpjRes.data, cnpj: cnpjClean },
                onboardingCaseId: caseId
              });
              return { cnpjData: cnpjRes.data, enrichment: enrichRes?.data };
            }
            return null;
          })(),
          (async () => {
            const qsa = merchant.qsa || [];
            const screenRes = await base44.asServiceRole.functions.invoke('sanctionsScreening', {
              action: 'fullScreening',
              cnpj: cnpjClean,
              qsa: qsa
            });
            return screenRes?.data;
          })()
        ]);
        
        if (enrichPromise.status === 'fulfilled' && enrichPromise.value) {
          cnpjEnrichmentData = enrichPromise.value.enrichment;
          console.log(`[SENTINEL] Enriquecimento CNPJ: Score ${cnpjEnrichmentData?.consolidated?.averageScore}/100`);
        } else if (enrichPromise.status === 'rejected') {
          console.warn(`[SENTINEL] Enriquecimento CNPJ falhou: ${enrichPromise.reason}`);
        }
        
        if (sanctionsPromise.status === 'fulfilled' && sanctionsPromise.value) {
          sanctionsData = sanctionsPromise.value;
          console.log(`[SENTINEL] Screening sanções: ${sanctionsData?.consolidado?.flags?.length || 0} flags`);
        } else if (sanctionsPromise.status === 'rejected') {
          console.warn(`[SENTINEL] Screening sanções falhou: ${sanctionsPromise.reason}`);
        }
      }
    }

    // ═══ EXTRACT BDC RAW DATA SUMMARY for SENTINEL context ═══
    const bdcValidations = externalValidations
      .filter(v => v.provider === 'BigDataCorp' && v.resultData)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const latestBdc = bdcValidations[0];
    if (latestBdc?.resultData) {
      try {
        const rd = latestBdc.resultData;
        const extractArr = (key) => {
          const val = rd[key];
          if (!val) return [];
          return Array.isArray(val) ? val : [val];
        };
        // Build concise summary of BDC data for IA context
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
          queryDate: latestBdc.created_date,
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
          kyc: {
            isPep: bdKyc.IsPEP || bdKyc.IsPep || false,
            hasSanctions: (bdKyc.Sanctions || []).length > 0,
          },
          ownersCount: bdOwnersKyc.length,
          ownersPep: bdOwnersKyc.filter(o => o?.IsPEP || o?.IsPep).map(o => o?.Name || 'N/I'),
          ownersSanctioned: bdOwnersKyc.filter(o => (o?.Sanctions || []).length > 0).map(o => o?.Name || 'N/I'),
          processesCount: bdProcesses.reduce((s, p) => s + (p?.TotalLawsuits || p?.NumberOfLawsuits || 0), 0),
          hasCriminalProcesses: bdProcesses.some(p => /criminal|penal|crime/i.test(JSON.stringify(p?.LawsuitTypes || p?.Categories || []))),
          collectionsCount: bdCollections.reduce((s, c) => s + (c?.TotalRecords || 0), 0),
          mediaProfileCount: bdMedia.length,
          mediaNegative: bdMedia.filter(m => /NEGATIVE/i.test(m?.Sentiment || m?.OverallSentiment || '')).length,
          domainsCount: bdDomains.length,
          activityLevel: bdActivity[0]?.ActivityLevel ?? bdActivity[0]?.Level ?? 'N/D',
          shellCompanyScore: bdActivity[0]?.ShellCompanyLikelyhood ?? bdActivity[0]?.ShellCompanyLikelihood ?? 'N/D',
          governmentDebtTotal: bdDebtors.reduce((s, d) => s + (Number(d?.TotalValue || d?.Value || 0)), 0),
          financialRegistrations: bdFinancial.map(f => f?.RegistrationType || f?.Entity || '').filter(Boolean),
          qsaCount: Array.isArray(bdRels) ? bdRels.length : 0,
        };
        console.log(`[SENTINEL] BDC raw summary extracted: ${JSON.stringify(bdcRawSummary).length} chars`);
      } catch (bdcExtractErr) {
        console.warn(`[SENTINEL] Failed to extract BDC summary: ${bdcExtractErr.message}`);
      }
    }

    // ═══ EXTRACT CAF RESULTS SUMMARY ═══
    const cafValidations = externalValidations.filter(v => v.provider === 'CAF');
    let cafSummary = null;
    if (cafValidations.length > 0) {
      const liveness = cafValidations.find(v => v.validationType?.includes('Liveness'));
      const docFront = cafValidations.find(v => v.validationType?.includes('Frente'));
      const docBack = cafValidations.find(v => v.validationType?.includes('Verso'));
      cafSummary = {
        totalVerifications: cafValidations.length,
        allApproved: cafValidations.every(v => v.status === 'Sucesso'),
        liveness: liveness ? {
          isAlive: liveness.resultData?.isAlive,
          isMatch: liveness.resultData?.isMatch,
          similarity: liveness.resultData?.similarity,
          probability: liveness.resultData?.probability,
          decision: liveness.resultData?.cafDecision,
        } : null,
        docFront: docFront ? { valid: docFront.resultData?.isCaptureValid, type: docFront.resultData?.documentType } : null,
        docBack: docBack ? { valid: docBack.resultData?.isCaptureValid } : null,
      };
      console.log(`[SENTINEL] CAF summary: ${cafValidations.length} verifications, allApproved=${cafSummary.allApproved}`);
    }

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

${sanctionsData ? `**Screening de Sanções e PEP:**
- CEIS (Empresas Inidôneas): ${sanctionsData.empresa?.ceis?.inCeis ? 'SIM — RED FLAG' : 'Não encontrada'}
- CNEP (Empresas Punidas): ${sanctionsData.empresa?.cnep?.inCnep ? 'SIM — RED FLAG' : 'Não encontrada'}
- Total de Flags: ${sanctionsData.consolidado?.flags?.length || 0}
- Nível de Risco Sanções: ${sanctionsData.consolidado?.riskLevel || 'N/D'}
${sanctionsData.consolidado?.flags?.length > 0 ? '- Flags de Sanções:\n' + sanctionsData.consolidado.flags.map(f => `  • ${f}`).join('\n') : '- Nenhuma flag de sanções identificada'}
${sanctionsData.socios?.length > 0 ? `- Sócios Verificados: ${sanctionsData.socios.length}` : ''}` : '**Screening de Sanções:** Não disponível (PF ou CNPJ não processado)'}

${cnpjEnrichmentData ? `**Enriquecimento CNPJ (Receita Federal):**
- Score de Enriquecimento: ${cnpjEnrichmentData.consolidated?.averageScore}/100 (${cnpjEnrichmentData.consolidated?.riskLevel})
- Flags Identificadas: ${cnpjEnrichmentData.consolidated?.totalFlags || 0}
${cnpjEnrichmentData.consolidated?.flags?.length > 0 ? '- Detalhes das Flags:\n' + cnpjEnrichmentData.consolidated.flags.map(f => `  • ${f}`).join('\n') : '- Nenhuma flag identificada'}
${cnpjEnrichmentData.results?.[0]?.enrichment ? `
- Idade da Empresa: ${cnpjEnrichmentData.results[0].enrichment.companyAge?.anos ?? 'N/D'} anos
- Situação Especial: ${cnpjEnrichmentData.results[0].enrichment.situacaoEspecial?.hasSituacao ? 'SIM' : 'Nenhuma'}
- Simples Nacional: ${cnpjEnrichmentData.results[0].enrichment.simplesNacional?.info || 'N/D'}
- MEI: ${cnpjEnrichmentData.results[0].enrichment.mei?.optante ? 'SIM' : 'NÃO'}
- QSA: ${cnpjEnrichmentData.results[0].enrichment.qsaAnalysis?.totalSocios || 0} sócio(s), ${cnpjEnrichmentData.results[0].enrichment.qsaAnalysis?.crossMatches?.length || 0} na base PagSmile
- E-mail × Site: ${cnpjEnrichmentData.results[0].enrichment.emailDomain?.consistent === true ? 'Consistente' : cnpjEnrichmentData.results[0].enrichment.emailDomain?.consistent === false ? 'INCONSISTENTE' : 'N/A'}
- UF × DDD: ${cnpjEnrichmentData.results[0].enrichment.geoConsistency?.consistent === true ? 'Consistente' : cnpjEnrichmentData.results[0].enrichment.geoConsistency?.consistent === false ? 'INCONSISTENTE' : 'N/A'}
- CNAE Risco: ${cnpjEnrichmentData.results[0].enrichment.cnaeRisk?.flag || 'Normal'}` : ''}` : '**Enriquecimento CNPJ:** Não disponível (PF ou CNPJ não encontrado)'}

${bdcRawSummary ? `**Dados Big Data Corp (BDC) — Resumo dos 34 datasets:**
- Consulta em: ${bdcRawSummary.queryDate || 'N/D'}
- Razão Social: ${bdcRawSummary.basicData.officialName || 'N/D'}
- Nome Fantasia: ${bdcRawSummary.basicData.tradeName || 'N/D'}
- Situação CNPJ: ${bdcRawSummary.basicData.status || 'N/D'}
- Fundação: ${bdcRawSummary.basicData.foundedDate || 'N/D'}
- Capital Social: R$ ${Number(bdcRawSummary.basicData.capital || 0).toLocaleString('pt-BR')}
- CNAE Principal: ${bdcRawSummary.basicData.mainCnae || 'N/D'} — ${bdcRawSummary.basicData.cnaeDesc || ''}
- Natureza Jurídica: ${bdcRawSummary.basicData.legalNature || 'N/D'}
- Porte: ${bdcRawSummary.basicData.companySize || 'N/D'}
- Empregados: ${bdcRawSummary.basicData.employees}
- PEP Empresa: ${bdcRawSummary.kyc.isPep ? 'SIM — RED FLAG' : 'Não'}
- Sanções Empresa: ${bdcRawSummary.kyc.hasSanctions ? 'SIM — BLOQUEIO' : 'Não'}
- QSA: ${bdcRawSummary.qsaCount} sócio(s)
- Sócios PEP: ${bdcRawSummary.ownersPep.length > 0 ? bdcRawSummary.ownersPep.join(', ') : 'Nenhum'}
- Sócios Sancionados: ${bdcRawSummary.ownersSanctioned.length > 0 ? bdcRawSummary.ownersSanctioned.join(', ') : 'Nenhum'}
- Processos Judiciais: ${bdcRawSummary.processesCount}${bdcRawSummary.hasCriminalProcesses ? ' — INCLUI CRIMINAL' : ''}
- Negativação/Cobrança: ${bdcRawSummary.collectionsCount} registro(s)
- Dívida Ativa Governo: R$ ${Number(bdcRawSummary.governmentDebtTotal || 0).toLocaleString('pt-BR')}
- Mídia: ${bdcRawSummary.mediaProfileCount} menção(ões), ${bdcRawSummary.mediaNegative} negativa(s)
- Domínios: ${bdcRawSummary.domainsCount}
- Nível Atividade: ${bdcRawSummary.activityLevel}
- Shell Company Score: ${bdcRawSummary.shellCompanyScore}
- Registros BCB/CVM/SUSEP: ${bdcRawSummary.financialRegistrations.length > 0 ? bdcRawSummary.financialRegistrations.join(', ') : 'Nenhum'}` : '**Big Data Corp:** Não consultado ainda'}

${cafSummary ? `**Resultados CAF (Verificação de Identidade):**
- Total de verificações: ${cafSummary.totalVerifications}
- Todas aprovadas: ${cafSummary.allApproved ? 'SIM' : 'NÃO — ATENÇÃO'}
${cafSummary.liveness ? `- Prova de Vida: ${cafSummary.liveness.isAlive ? 'APROVADA' : 'REPROVADA'}
- Face Match: ${cafSummary.liveness.isMatch ? 'CONFIRMADO' : cafSummary.liveness.isMatch === false ? 'NÃO CORRESPONDEU — RED FLAG' : 'N/D'}
- Similaridade Facial: ${cafSummary.liveness.similarity != null ? (cafSummary.liveness.similarity * 100).toFixed(0) + '%' : 'N/D'}
- Probabilidade Liveness: ${cafSummary.liveness.probability != null ? (cafSummary.liveness.probability * 100).toFixed(0) + '%' : 'N/D'}
- Decisão CAF: ${cafSummary.liveness.decision || 'N/D'}` : '- Prova de Vida: Não realizada'}
${cafSummary.docFront ? `- Documento Frente: ${cafSummary.docFront.valid ? 'Válido' : 'Inválido'}${cafSummary.docFront.type ? ' (' + cafSummary.docFront.type + ')' : ''}` : '- Documento Frente: Não capturado'}
${cafSummary.docBack ? `- Documento Verso: ${cafSummary.docBack.valid ? 'Válido' : 'Inválido'}` : '- Documento Verso: Não capturado'}` : '**CAF (Identidade):** Não realizado'}

═══════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE
═══════════════════════════════════════════════════════════

${hasExternalValidations ? 'Execute as 3 FASES de análise:' : 'Execute apenas a FASE 1 (questionário):'}

**FASE 1 - Análise do Questionário + Enriquecimento CNPJ (Peso 45%):**
- Verifique completude e validade dos dados
- Identifique inconsistências e contradições
- Avalie qualidade das justificativas textuais
- Detecte red flags regulatórios (PEP, sanções, atividades de risco)
- IMPORTANTE: Incorpore as flags do Enriquecimento CNPJ na sua análise (idade da empresa, MEI, QSA, domínio, geo, CNAE)
- Considere o score de enriquecimento como fator ponderador (se disponível)
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

**ANÁLISE POR DIMENSÃO (obrigatório):**
Para cada dimensão abaixo, produza uma análise completa com score de confiança:

1. **IDENTIDADE** — Dados cadastrais, situação CNPJ/CPF, idade da empresa, porte, capital social, CNAE
2. **SÓCIOS/QSA** — Composição societária, PEP, sanções, processos dos sócios, participações cruzadas
3. **COMPLIANCE/REGULATÓRIO** — Sanções, dívida ativa, processos judiciais, negativação, envolvimento político
4. **PEGADA DIGITAL** — Domínios, SSL, passages web, atividade, marketplace, shell company score
5. **REPUTAÇÃO** — Adverse media, Reclame Aqui, prêmios, certificações
6. **FINANCEIRO** — Grupo econômico, MCC real, licenças, registros BCB/CVM
7. **BIOMETRIA/IDENTIDADE VISUAL** — CAF liveness, face match, documentoscopy, deepfake, OCR cross-validation

**CROSS-VALIDATION DECLARADO vs CONFIRMADO:**
Compare CADA campo declarado no questionário com o correspondente confirmado pelo BDC/CAF:
- Razão Social declarada vs BDC
- Endereço declarado vs BDC
- CNAE declarado vs BDC
- Sócios declarados vs QSA real
- Faturamento/TPV declarado vs porte BDC (é coerente um MEI declarar R$5M/mês?)
- E-mail declarado vs domínio do site
- Telefone DDD vs UF do endereço

Documente CADA divergência como um finding com severidade.

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
        },
        
        // Análise dimensional estruturada
        analise_dimensional: {
          type: "object",
          description: "Análise por dimensão com veredicto e confiança",
          properties: {
            identidade: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO"] },
                confianca: { type: "number", description: "0-100" },
                resumo: { type: "string", description: "2-3 linhas sobre esta dimensão" },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            socios: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO"] },
                confianca: { type: "number" },
                resumo: { type: "string" },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            compliance: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO"] },
                confianca: { type: "number" },
                resumo: { type: "string" },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            digital: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO"] },
                confianca: { type: "number" },
                resumo: { type: "string" },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            reputacao: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO"] },
                confianca: { type: "number" },
                resumo: { type: "string" },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            financeiro: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO"] },
                confianca: { type: "number" },
                resumo: { type: "string" },
                findings: { type: "array", items: { type: "string" } }
              }
            },
            biometria: {
              type: "object",
              properties: {
                veredicto: { type: "string", enum: ["APROVADO", "ATENCAO", "REPROVADO", "NAO_DISPONIVEL"] },
                confianca: { type: "number" },
                resumo: { type: "string" },
                findings: { type: "array", items: { type: "string" } }
              }
            }
          }
        },
        
        // Cross-validation declarado vs confirmado
        cross_validation: {
          type: "array",
          items: {
            type: "object",
            properties: {
              campo: { type: "string", description: "Nome do campo (ex: Razão Social, Endereço, CNAE)" },
              valor_declarado: { type: "string" },
              valor_confirmado: { type: "string" },
              consistente: { type: "boolean" },
              severidade: { type: "string", enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              observacao: { type: "string" }
            }
          },
          description: "Lista de campos comparados entre declarado (questionário) e confirmado (BDC/CAF)"
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
      response_json_schema: responseSchema,
      model: 'claude_sonnet_4_6'
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
      analise_dimensional: llmResponse.analise_dimensional || null,
      cross_validation: llmResponse.cross_validation || [],
      
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
      // ── CRITICAL: Never overwrite v4 deterministic fields if they exist ──
      // The v4 engine (revalidateRiskScoring) is the SINGLE SOURCE OF TRUTH for:
      // score_final, subfaixa, recomendacao_final, rolling_reserve_percent, 
      // decisao_automatica, monitoramento_nivel, variaveis_*, bloqueios_ativos, condicoes_automaticas
      const hasV4Data = existingScore.score_final != null && existingScore.score_variaveis != null;
      
      if (hasV4Data) {
        // V4 engine already ran — only update SENTINEL qualitative fields
        // CRITICAL (GAP 7): Do NOT overwrite score_questionario, score_geral_composto,
        // classificacao_questionario, classificacao_geral, bonus_consistencia,
        // recomendacao_final — these are cleared by V4 to avoid confusion.
        // SENTINEL qualitative data goes into analise_completa_ia, parecer_final, etc.
        const qualitativeOnly = {
          onboarding_case_id: caseId,
          versao_agente: scoreData.versao_agente,
          // DO NOT overwrite: score_questionario, score_geral_composto, classificacao_*,
          // bonus_consistencia, recomendacao_final, score_final, subfaixa, etc.
          sumario_executivo: scoreData.sumario_executivo,
          analise_completa_ia: scoreData.analise_completa_ia,
          parecer_final: scoreData.parecer_final,
          pontos_positivos: scoreData.pontos_positivos,
          pontos_atencao: scoreData.pontos_atencao,
          red_flags: scoreData.red_flags,
          recomendacoes_revisao_manual: scoreData.recomendacoes_revisao_manual,
          perguntas_sugeridas: scoreData.perguntas_sugeridas,
          documentos_adicionais_sugeridos: scoreData.documentos_adicionais_sugeridos,
          nivel_confianca_ia: scoreData.nivel_confianca_ia,
          total_findings: scoreData.total_findings,
          findings_por_severidade: scoreData.findings_por_severidade,
          overrides_aplicados: scoreData.overrides_aplicados,
          condicoes_aprovacao: scoreData.condicoes_aprovacao,
          analise_dimensional: scoreData.analise_dimensional,
          cross_validation: scoreData.cross_validation,
          fase_1_completa: scoreData.fase_1_completa,
          data_analise_fase_1: scoreData.data_analise_fase_1,
          fase_2_completa: scoreData.fase_2_completa || existingScore.fase_2_completa,
          data_analise_fase_2: scoreData.data_analise_fase_2 || existingScore.data_analise_fase_2,
          fase_3_completa: scoreData.fase_3_completa || existingScore.fase_3_completa,
          data_analise_fase_3: scoreData.data_analise_fase_3 || existingScore.data_analise_fase_3,
        };
        savedScore = await base44.asServiceRole.entities.ComplianceScore.update(
          existingScore.id, 
          qualitativeOnly
        );
        console.log(`[SENTINEL] Score atualizado (qualitative only, v4 preserved): ${existingScore.id}`);
      } else {
        // No v4 data yet — SENTINEL can write everything
        savedScore = await base44.asServiceRole.entities.ComplianceScore.update(
          existingScore.id, 
          scoreData
        );
        console.log(`[SENTINEL] Score atualizado (full, no v4 data): ${existingScore.id}`);
      }
    } else {
      // Criar novo score
      savedScore = await base44.asServiceRole.entities.ComplianceScore.create(scoreData);
      console.log(`[SENTINEL] Score criado: ${savedScore.id}`);
    }
    
    // ═══════════════════════════════════════════════════════════
    // ETAPA 5: ATUALIZAR ONBOARDING CASE
    // ═══════════════════════════════════════════════════════════
    
    // ── CRITICAL: Check if v4 engine already set the case status ──
    // If v4 has run (riskScoreV4 exists), SENTINEL should NOT overwrite status/decision
    const v4AlreadyRan = onboardingCase.riskScoreV4 != null && onboardingCase.subfaixa != null;
    
    if (v4AlreadyRan) {
      // V4 is authoritative — only update qualitative fields on the case
      console.log(`[SENTINEL] v4 data exists on case. Only updating qualitative fields (iaExplanation, redFlags).`);
      await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
        iaExplanation: llmResponse.sumario_executivo,
        redFlags: llmResponse.red_flags || []
      });
    } else {
      // No v4 data — SENTINEL controls the decision
      let newStatus = onboardingCase.status;
      if (onboardingCase.status === 'Pendente' || onboardingCase.status === 'Em Processamento') {
        switch (llmResponse.recomendacao_final) {
          case 'Aprovado':
            newStatus = 'Aprovado';
            break;
          case 'Aprovado com Condições':
            newStatus = 'Manual';
            break;
          case 'Revisão Manual':
            newStatus = 'Manual';
            break;
          case 'Recusado':
            newStatus = 'Recusado';
            break;
        }
      }
      
      const riskScore100 = Math.round(llmResponse.score_geral_composto / 10);
      
      await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
        status: newStatus,
        riskScore: riskScore100,
        iaDecision: llmResponse.recomendacao_final,
        iaExplanation: llmResponse.sumario_executivo,
        redFlags: llmResponse.red_flags || []
      });
      
      if (merchant) {
        await base44.asServiceRole.entities.Merchant.update(merchant.id, {
          onboardingStatus: newStatus,
          riskScore: riskScore100
        });
      }
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