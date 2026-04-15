import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SENTINEL v6.0 — Agente de Análise QUALITATIVA de Compliance
 *
 * PIPELINE: 4 chamadas LLM paralelas + consolidação
 *   1. Análise do QUESTIONÁRIO (respostas, documentos, declarações)
 *   2. Análise do BDC (Big Data Corp — dados cadastrais, processos, sócios, etc.)
 *   3. Análise da CAF (biometria, liveness, facematch, screening PEP/sanções)
 *   4. CONSOLIDAÇÃO final (merge das 3 análises + V4 score + TABELA DE DECISÃO)
 *
 * v6.0 CHANGES vs v5.1:
 * - TABELA DE DECISÃO QUANTITATIVA no prompt de consolidação (elimina subjetividade)
 * - Ausência de dados NÃO é red flag (corrige viés catastrofista)
 * - Dados BDC/CAF objetivos pesam 80%, questionário pesa 20%
 * - V4 recomendacao usa decisão V4 PURA (não recomendacao_final anterior)
 * - Prompt CAF sem viés catastrofista sobre dados ausentes
 * - Prompt consolidação com regras de proporcionalidade
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

// FIX #5: Build V4 context from PURE V4 decision, not recomendacao_final
function buildV4Context(v4Data) {
  if (!v4Data) return 'V4 NÃO DISPONÍVEL — BDC não executou para este caso.';
  return `═══ SCORE V4 (DETERMINÍSTICO — JÁ CALCULADO) ═══
- Score Final: ${v4Data.score_final}/849
- Subfaixa: ${v4Data.subfaixa} (${v4Data.subfaixa_nome})
- Composição: Base=${v4Data.score_base} + Variáveis=${v4Data.score_variaveis} + Enriquecimento=${v4Data.score_enriquecimento}
- Bloqueios: ${v4Data.bloqueios.length > 0 ? v4Data.bloqueios.join(', ') : 'Nenhum'}
- Red Flags V4: ${v4Data.v4_red_flags.length > 0 ? v4Data.v4_red_flags.join('; ') : 'Nenhum'}
- Decisão V4 Pura: ${v4Data.v4_decisao_pura}
- Segmento: ${v4Data.segmento}
- Rolling Reserve: ${v4Data.rolling_reserve}%
- Monitoramento: ${v4Data.monitoramento}
- Condições: ${v4Data.condicoes.length > 0 ? v4Data.condicoes.join('; ') : 'Nenhuma'}

IMPORTANTE: A Decisão V4 Pura é a decisão OBJETIVA baseada em dados. Se V4 diz "Aprovado" (subfaixa 1A/1B), isso significa que os dados BDC NÃO encontraram problemas graves.`;
}

const SENTINEL_RULES = `═══════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: VOCÊ NÃO INVENTA INFORMAÇÃO
═══════════════════════════════════════════════════════════════════

REGRAS INVIOLÁVEIS:
1. NUNCA afirme algo que não esteja explicitamente nos dados fornecidos.
2. Cada afirmação DEVE citar a FONTE EXATA (ex: "BDC BasicData.TaxIdStatus", "CAF screening hitsCount", "Questionário pergunta X").
3. Se um dado não está disponível, diga "DADO NÃO DISPONÍVEL" — isso NÃO é um red flag, é apenas informação ausente.
4. Red flags devem ter formato: "[FONTE: campo.específico] Descrição detalhada com valores encontrados".
5. SOMENTE classifique como red flag quando houver EVIDÊNCIA CONCRETA de problema (ex: sanção confirmada, processo criminal, fraude biométrica).
6. Inconsistências no questionário são "pontos_de_atencao", NÃO red flags (merchants erram ao preencher formulários).
7. Ausência de dados (sem website, sem CAF, profileExists=false) NÃO é red flag — muitas empresas legítimas não têm esses registros.
8. Se BDC diz "IsCurrentlySanctioned: false" e CAF screening "hitsCount: 0", isso é POSITIVO — registre como ponto positivo.

Seja factual, equilibrado, e documente com evidências específicas. EQUILIBRE pontos positivos e negativos.`;

const PARTIAL_SCHEMA = {
  type: "object",
  properties: {
    analise_detalhada: { type: "string", description: "Análise completa e detalhada deste bloco de dados. Cite dados relevantes com fontes específicas." },
    red_flags: { type: "array", items: { type: "string" }, description: "Red flags APENAS com evidência concreta de problema real (fraude, sanção, processo criminal). NÃO inclua ausência de dados ou inconsistências de preenchimento." },
    pontos_positivos: { type: "array", items: { type: "string" }, description: "Pontos positivos com evidência específica. Inclua TODOS os dados limpos/aprovados." },
    pontos_atencao: { type: "array", items: { type: "string" }, description: "Pontos de atenção (inconsistências, dados incompletos) — NÃO são red flags" },
    cross_validations: { type: "array", items: { type: "object", properties: {
      campo: { type: "string" }, declarado: { type: "string" }, confirmado: { type: "string" },
      fonte: { type: "string" }, consistente: { type: "boolean" }, severidade: { type: "string" }, obs: { type: "string" }
    }}},
    dimensoes: { type: "object", description: "Análise por dimensão aplicável: { nome_dimensao: { veredicto, confianca, resumo, findings[] } }" }
  },
  required: ["analise_detalhada", "red_flags", "pontos_positivos", "pontos_atencao"]
};

const FINAL_SCHEMA = {
  type: "object",
  properties: {
    sentinel_recommendation: { type: "string", enum: ["Aprovado", "Aprovado com Condições Leves", "Aprovado com Condições", "Revisão Manual"] },
    escalation_justification: { type: "string" },
    sumario_executivo: { type: "string", description: "4-8 linhas com fontes citadas" },
    analise_completa_ia: { type: "string", description: "Análise consolidada COMPLETA com detalhes das 3 análises." },
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

// ═══ FORMAT QUESTIONNAIRE RESPONSES ═══

function formatQuestionnaireResponses(responses) {
  return responses.map(r => {
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
        if (isNeg) resposta_semantica = `NÃO — NEGA esta condição de risco. Resposta POSITIVA para compliance.`;
        else if (isPEP) resposta_semantica = `NÃO — Declara AUSÊNCIA de PEPs. Cross-validar com BDC/CAF.`;
        else if (isPos) resposta_semantica = `NÃO — Declara NÃO possuir este controle/programa. Ponto de atenção legítimo.`;
        else resposta_semantica = `NÃO — Resposta negativa.`;
      } else {
        if (isNeg) resposta_semantica = `SIM — CONFIRMA condição de risco. Ponto de atenção.`;
        else if (isPEP) resposta_semantica = `SIM — Declara existência de PEP. Verificar com BDC/CAF.`;
        else if (isPos) resposta_semantica = `SIM — Confirma possuir controle/programa. Ponto POSITIVO.`;
        else resposta_semantica = `SIM — Resposta afirmativa.`;
      }
    } else if (tipo === 'NUMBER') {
      valor_bruto = String(r.valueNumber);
      resposta_semantica = `Valor: ${r.valueNumber}.`;
    } else if (tipo === 'SELECT') {
      valor_bruto = r.valueText || '';
      resposta_semantica = `Opção: "${valor_bruto}".`;
    } else if (tipo === 'MULTI_SELECT') {
      valor_bruto = r.valueArray?.join(', ') || r.valueText || '';
      resposta_semantica = `${r.valueArray?.length || 0} opções: [${valor_bruto}].`;
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
        resposta_semantica = `Texto: "${valor_bruto}".`;
      }
    }
    return { pergunta, tipo, status: 'RESPONDIDA', resposta_semantica, valor_bruto };
  });
}

// ═══ PROMPT BUILDERS ═══

function buildQuestionnairePrompt(merchantCtx, formattedResponses, formattedDocuments) {
  const stats = {
    total: formattedResponses.length,
    respondidas: formattedResponses.filter(r => r.status === 'RESPONDIDA').length,
    naoRespondidas: formattedResponses.filter(r => r.status === 'NÃO RESPONDIDA').length,
  };
  stats.completude = stats.total > 0 ? ((stats.respondidas / stats.total) * 100).toFixed(1) : '0';

  return `Você é o SENTINEL v6, analista sênior de compliance EQUILIBRADO e JUSTO. Analise EXCLUSIVAMENTE o QUESTIONÁRIO preenchido pelo merchant.
NÃO analise dados BDC nem CAF — isso será feito em análises separadas.

${SENTINEL_RULES}

${merchantCtx}

═══ QUESTIONÁRIO (${stats.total} perguntas) ═══
REGRAS DE INTERPRETAÇÃO:
1. "status: RESPONDIDA" = resposta COMPLETA. NÃO trate como lacuna.
2. "NÃO" em perguntas sobre riscos/proibições/cripto/jogos/PEP = resposta DESEJADA e POSITIVA.
3. "SIM" em perguntas sobre compliance/PLD/monitoramento = resposta DESEJADA e POSITIVA.
4. Somente "NÃO RESPONDIDA" = informação realmente ausente.
5. Inconsistências numéricas (TPV, ticket, transações) são ERROS DE PREENCHIMENTO comuns — registre como "ponto_de_atencao", NÃO como red flag.

ESTATÍSTICAS: Total=${stats.total} | Respondidas=${stats.respondidas} | Não Respondidas=${stats.naoRespondidas} | Completude=${stats.completude}%

RESPOSTAS COMPLETAS:
${serializeFullData(formattedResponses.map(r => `[${r.status}][${r.tipo}] "${r.pergunta}" → ${r.resposta_semantica} | Valor: ${r.valor_bruto || 'N/A'}`))}

═══ DOCUMENTOS ENVIADOS (${formattedDocuments.length}) ═══
${serializeFullData(formattedDocuments)}

═══ INSTRUÇÕES ═══
Produza uma análise EQUILIBRADA do QUESTIONÁRIO:
1. PERFIL DECLARADO: modelo de negócio, segmento, volume, estrutura societária.
2. PONTOS POSITIVOS: respostas que demonstram compliance, controles, transparência. Seja GENEROSO em reconhecer pontos positivos.
3. PONTOS DE ATENÇÃO: inconsistências numéricas, lacunas. Lembre: merchants frequentemente erram ao preencher (ex: confundem faturamento com TPV).
4. RED FLAGS (APENAS): declarações que indicam ATIVIDADE PROIBIDA ou FRAUDE EVIDENTE (ex: "SIM" para atividades proibidas, dados fictícios óbvios como nome="teste").

IMPORTANTE: Um questionário com inconsistências numéricas NÃO é motivo para recusar. É apenas um ponto para esclarecer.`;
}

function buildBdcPrompt(merchantCtx, v4Ctx, bdcDataString, v4VariablesString) {
  const rawBdcSection = bdcDataString && bdcDataString.length < 50000
    ? `\n\n═══ DADOS RAW BDC (complementar) ═══\n${bdcDataString}`
    : bdcDataString
    ? `\n\n═══ NOTA: Dados raw BDC disponíveis (${(bdcDataString.length/1000).toFixed(0)}k chars) mas omitidos por tamanho. Variáveis V4 acima contêm dados processados. ═══`
    : '';

  return `Você é o SENTINEL v6, analista sênior de compliance EQUILIBRADO e JUSTO. Analise EXCLUSIVAMENTE os DADOS BDC (Big Data Corp) e o Score V4 deste merchant.
NÃO analise questionário nem CAF — isso será feito em análises separadas.

${SENTINEL_RULES}

${merchantCtx}

${v4Ctx}

${v4VariablesString ? `═══ VARIÁVEIS V4 PROCESSADAS (DADOS BDC ESTRUTURADOS — FONTE PRIMÁRIA) ═══
Estes são os dados BDC processados pelo framework V4, organizados por dimensão.
CADA item tem: label, value (dados reais), risk (nível), points (impacto no score).

${v4VariablesString}` : '═══ DADOS BDC ═══\nNÃO DISPONÍVEL — Não faça afirmações sobre dados BDC. Ausência de BDC NÃO é um problema — apenas significa que a consulta não foi realizada ainda.'}
${rawBdcSection}

═══ INSTRUÇÕES ═══
Produza análise EQUILIBRADA cobrindo as dimensões disponíveis nos dados.

REGRA CRÍTICA: Dados BDC são OBJETIVOS e de ALTÍSSIMA CONFIABILIDADE. Se BDC mostra:
- CPF/CNPJ ativo e regular → FORTE POSITIVO
- Sem processos criminais → FORTE POSITIVO
- Sem sanções → FORTE POSITIVO
- Sem dívida ativa → FORTE POSITIVO
- Sem negativação → FORTE POSITIVO

NÃO transforme dados neutros em negativos:
- "Shell Company score: 50%" → NEUTRO (50% é baixo risco, não alto)
- "Faixa de receita: ATE 50K" → INFO (empresas pequenas são legítimas)
- "SEM VINCULOS de empregados" → INFO (muitas empresas digitais têm isso)
- "Nível de atividade: 25%" → INFO (normal para empresas menores)

Para CADA dimensão: cite dados EXATOS. NÃO invente. EQUILIBRE positivos e negativos.`;
}

// FIX #2: CAF prompt without catastrophism bias
function buildCafPrompt(merchantCtx, cafDataString, cafValidationsString) {
  const hasCafData = cafDataString || cafValidationsString;

  return `Você é o SENTINEL v6, analista sênior de compliance EQUILIBRADO e JUSTO. Analise EXCLUSIVAMENTE os DADOS CAF (Combate à Fraude) deste merchant.
NÃO analise questionário nem BDC — isso será feito em análises separadas.

${SENTINEL_RULES}

${merchantCtx}

${cafDataString ? `═══ LOGS COMPLETOS CAF (Combate à Fraude) ═══
TODOS os serviços CAF executados com respostas COMPLETAS.

${cafDataString}` : '═══ LOGS CAF ═══\nNÃO DISPONÍVEL — Nenhum serviço CAF executado ainda.'}

${cafValidationsString ? `═══ VALIDAÇÕES CAF (External Results) ═══
${cafValidationsString}` : ''}

═══ INSTRUÇÕES ═══
${hasCafData ? `Produza análise EQUILIBRADA de TODOS os serviços CAF:
1. BIOMETRIA: Liveness, facematch, face_authentication. Resultado, probabilidade.
2. DOCUMENTOSCOPIA: Document OCR, document detector, documentscopy, VerifAI Docs.
3. SCREENING: PEP, Sanções (OFAC, EU, UN, COAF, CEIS, CNEP), Interpol.
4. VALIDAÇÃO CPF: Cross-validation, biometria oficial.
5. STATUS GERAL: Quantos serviços executados, quantos aprovados, quantos reprovados.

REGRA CRÍTICA PARA RED FLAGS CAF:
- Screening APPROVED (hitsCount=0) → FORTE POSITIVO, NÃO é red flag
- profileExists=false → NEUTRO (muitas empresas legítimas não têm perfil CAF)
- Liveness APPROVED → FORTE POSITIVO
- Facematch APPROVED → FORTE POSITIVO
- SOMENTE classifique como red flag: liveness REPROVED, facematch REPROVED, deepfake DETECTED, documentscopy REPROVED, sanções com hits CONFIRMADOS` :
`NÃO há dados CAF disponíveis para este caso.
Registre que os serviços CAF ainda não foram executados.
IMPORTANTE: Ausência de CAF NÃO é um red flag. NÃO classifique como "lacuna significativa".
Simplesmente note que biometria e screening ainda não foram realizados.
NÃO gere red flags a partir de dados ausentes.`}`;
}

// FIX #1, #3, #4: Consolidation prompt with DECISION TABLE
function buildConsolidationPrompt(merchantCtx, v4Ctx, qstAnalysis, bdcAnalysis, cafAnalysis) {
  function formatPartial(label, analysis) {
    return `═══ ${label} ═══
${analysis.analise_detalhada}

RED FLAGS ${label}:
${(analysis.red_flags || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

PONTOS POSITIVOS ${label}:
${(analysis.pontos_positivos || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

PONTOS DE ATENÇÃO ${label}:
${(analysis.pontos_atencao || []).map((f, i) => `${i+1}. ${f}`).join('\n') || 'Nenhum'}

CROSS-VALIDATIONS ${label}:
${serializeFullData(analysis.cross_validations || [])}

DIMENSÕES ${label}:
${serializeFullData(analysis.dimensoes || {})}`;
  }

  return `Você é o SENTINEL v6.0, analista sênior de compliance. Recebeu TRÊS análises parciais independentes sobre o mesmo merchant.
Sua tarefa é CONSOLIDAR em uma análise FINAL única, EQUILIBRADA e ASSERTIVA.

${merchantCtx}

${v4Ctx}

${formatPartial('ANÁLISE 1: QUESTIONÁRIO', qstAnalysis)}

${formatPartial('ANÁLISE 2: BDC (Big Data Corp)', bdcAnalysis)}

${formatPartial('ANÁLISE 3: CAF (Combate à Fraude)', cafAnalysis)}

═══════════════════════════════════════════════════════════════════
TABELA DE DECISÃO QUANTITATIVA — SIGA RIGOROSAMENTE
═══════════════════════════════════════════════════════════════════

PASSO 1: Verifique DADOS OBJETIVOS (peso 80%):
┌────────────────────────────────────────────────────────────────┐
│ BDC: CNPJ/CPF ativo?              SIM=OK  NÃO=BLOQUEIO       │
│ BDC: Sanções ativas?              NÃO=OK  SIM=BLOQUEIO        │
│ BDC: Processos criminais?         NÃO=OK  SIM=ATENÇÃO         │
│ BDC: Negativação/Cobrança?        NÃO=OK  SIM=ATENÇÃO         │
│ BDC: PEP confirmado?              NÃO=OK  SIM=ATENÇÃO         │
│ BDC: Dívida ativa gov?            NÃO=OK  SIM=ATENÇÃO         │
│ CAF: Liveness reprovado?          NÃO=OK  SIM=BLOQUEIO        │
│ CAF: Deepfake detectado?          NÃO=OK  SIM=BLOQUEIO        │
│ CAF: Documentoscopia reprovada?   NÃO=OK  SIM=BLOQUEIO        │
│ CAF: Sanções com hits?            NÃO=OK  SIM=BLOQUEIO        │
│ V4: Bloqueios ativos (B01-B10)?   NÃO=OK  SIM=BLOQUEIO        │
└────────────────────────────────────────────────────────────────┘

PASSO 2: Verifique QUESTIONÁRIO (peso 20%):
┌────────────────────────────────────────────────────────────────┐
│ Dados fictícios óbvios (nome="teste", data futura)?   →ATENÇÃO│
│ Atividade proibida declarada?                         →ATENÇÃO│
│ Inconsistência numérica (TPV vs ticket)?     →INFO (erro form)│
│ Falta de controles PLD?                      →ATENÇÃO menor   │
│ Sem website?                                 →INFO (normal)   │
│ Email genérico (@gmail)?                     →INFO (normal)   │
└────────────────────────────────────────────────────────────────┘

PASSO 3: TABELA DE DECISÃO FINAL:
┌─────────────────────────────────────────────────────────────────────────────┐
│ V4 = 1A/1B (VERDE) + BDC sem BLOQUEIOS + CAF sem BLOQUEIOS                │
│   → "Aprovado" (mesmo com pontos de atenção no questionário)               │
│   EXCEÇÃO: escalar para "Aprovado com Condições Leves" SOMENTE se houver   │
│   processos cíveis significativos OU PEP confirmado.                       │
│                                                                             │
│ V4 = 1A/1B (VERDE) + BDC sem BLOQUEIOS + CAF NÃO DISPONÍVEL               │
│   → "Aprovado com Condições Leves" (condição: completar CAF)               │
│                                                                             │
│ V4 = 2A/2B (AZUL/AMARELO) + BDC sem BLOQUEIOS + CAF sem BLOQUEIOS         │
│   → "Aprovado com Condições" (Rolling Reserve, monitoramento)              │
│                                                                             │
│ V4 = 3A/3B/4 (LARANJA/VERMELHO) + BDC sem BLOQUEIOS                       │
│   → "Aprovado com Condições" (condições rigorosas)                          │
│   EXCEÇÃO: escalar para "Revisão Manual" SOMENTE se houver processos        │
│   criminais ativos OU PEP com conflito de interesse.                        │
│                                                                             │
│ Qualquer BLOQUEIO V4 ativo OU CAF fraude confirmada                        │
│   → "Revisão Manual" (MÁXIMO que você pode recomendar)                     │
│                                                                             │
│ V4 NÃO DISPONÍVEL (BDC não executou)                                       │
│   → "Aprovado com Condições Leves" (condição: executar BDC)                │
│   NÃO escalar para "Revisão Manual" por falta de dados.                    │
└─────────────────────────────────────────────────────────────────────────────┘

═══ REGRAS ABSOLUTAS ═══

1. VOCÊ NÃO TEM PODER DE RECUSAR. "Revisão Manual" é o MÁXIMO.
2. "Revisão Manual" SOMENTE quando há BLOQUEIOS V4 ou FRAUDE CAF CONFIRMADA.
3. Inconsistências de questionário NUNCA justificam "Revisão Manual" sozinhas.
4. Ausência de dados NUNCA justifica "Revisão Manual".
5. Se V4 é VERDE (1A/1B) e BDC não tem bloqueios → PRESUMA que a empresa é boa.
6. EQUILIBRE pontos positivos e negativos. Se há 5 pontos positivos e 2 de atenção, a decisão deve refletir maioria positiva.
7. Red flags são SOMENTE: fraude biométrica, sanções confirmadas, processos criminais, dados fictícios óbvios, bloqueios V4 ativos.

═══ INSTRUÇÕES DE OUTPUT ═══

1. SUMÁRIO EXECUTIVO: 4-8 linhas. COMECE com a decisão. Cite dados positivos primeiro, depois atenções.
2. ANÁLISE COMPLETA: Consolide as 3 análises com EQUILÍBRIO.
3. PARECER FINAL: Narrativa autocontida. Inclua dados positivos E negativos proporcionalmente.
4. RED FLAGS: SOMENTE problemas com evidência concreta (fraude, sanção, processo criminal). NÃO inclua inconsistências de formulário.
5. CROSS-VALIDATION: Cruze questionário vs BDC vs CAF.
6. CONDIÇÕES: Se recomendar condições, detalhe O QUE, POR QUÊ, DURAÇÃO.

Produza análise EQUILIBRADA, ASSERTIVA, que reflita os dados objetivos.`;
}

// ═══ MAIN HANDLER ═══

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

    console.log(`[SENTINEL v6.0] Iniciando análise: ${caseId}`);

    // ═══ LOAD ALL DATA ═══
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const existingScore = existingScores[0];
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const hours = (Date.now() - new Date(existingScore.data_analise_fase_3).getTime()) / 3600000;
      if (hours < 24 && !payload.force) {
        console.log(`[SENTINEL v6.0] Análise recente (${hours.toFixed(1)}h). Pulando.`);
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
    // FIX #5: Use PURE V4 decision based on subfaixa, NOT recomendacao_final (which may contain old SENTINEL decision)
    const subfaixa = existingScore?.subfaixa;
    let v4DecisaoPura = 'N/D';
    if (subfaixa === '1A' || subfaixa === '1B') v4DecisaoPura = 'Aprovado (VERDE)';
    else if (subfaixa === '2A') v4DecisaoPura = 'Aprovado com Condições Leves (AZUL)';
    else if (subfaixa === '2B') v4DecisaoPura = 'Aprovado com Condições (AMARELO)';
    else if (subfaixa === '3A' || subfaixa === '3B') v4DecisaoPura = 'Revisão Manual (LARANJA)';
    else if (subfaixa === '4') v4DecisaoPura = 'Revisão Manual (VERMELHO)';
    else if (subfaixa === '5') v4DecisaoPura = 'Recusado (PRETO) — Bloqueios V4 ativos';

    const v4Data = existingScore ? {
      score_final: existingScore.score_final,
      subfaixa: existingScore.subfaixa,
      subfaixa_nome: existingScore.subfaixa_nome,
      score_base: existingScore.score_base_segmento,
      score_variaveis: existingScore.score_variaveis,
      score_enriquecimento: existingScore.score_enriquecimento,
      bloqueios: existingScore.bloqueios_ativos || [],
      v4_red_flags: existingScore.red_flags || [],
      v4_decisao_pura: v4DecisaoPura,
      segmento: existingScore.segmento,
      rolling_reserve: existingScore.rolling_reserve_percent,
      monitoramento: existingScore.monitoramento_nivel,
      condicoes: existingScore.condicoes_automaticas || [],
    } : null;

    console.log(`[SENTINEL v6.0] V4: score=${v4Data?.score_final}, subfaixa=${v4Data?.subfaixa}, decisaoPura=${v4DecisaoPura}`);

    // ═══ EXTRACT DATA ═══
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

    // ═══ FORMAT DATA ═══
    const formattedResponses = formatQuestionnaireResponses(responses);
    const formattedDocuments = documents.map(d => ({
      tipo: d.documentName, status: d.validationStatus, arquivo: d.fileName,
      tamanho: d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB` : 'N/D',
      data_upload: d.uploadDate || d.created_date,
    }));

    const merchantCtx = buildMerchantContext(merchant);
    const v4Ctx = buildV4Context(v4Data);

    // ═══ BUILD PROMPTS ═══
    const v4VariablesString = existingScore?.variaveis_aplicadas 
      ? serializeFullData(existingScore.variaveis_aplicadas) 
      : null;

    const qstPrompt = buildQuestionnairePrompt(merchantCtx, formattedResponses, formattedDocuments);
    const bdcPrompt = buildBdcPrompt(merchantCtx, v4Ctx, bdcDataString, v4VariablesString);
    const cafPrompt = buildCafPrompt(merchantCtx, cafDataString, cafValidationsString);

    console.log(`[SENTINEL v6.0] Lançando 3 LLM calls paralelas: QST(${(qstPrompt.length/1000).toFixed(0)}k) | BDC(${(bdcPrompt.length/1000).toFixed(0)}k) | CAF(${(cafPrompt.length/1000).toFixed(0)}k)`);

    // ═══ PARALLEL EXECUTION ═══
    const EMPTY_PARTIAL = { analise_detalhada: 'Análise não disponível — falha na execução do LLM.', red_flags: [], pontos_positivos: [], pontos_atencao: [], cross_validations: [], dimensoes: {} };

    const results = await Promise.allSettled([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: qstPrompt,
        response_json_schema: PARTIAL_SCHEMA,
        model: 'gemini_3_1_pro'
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: bdcPrompt,
        response_json_schema: PARTIAL_SCHEMA,
        model: 'gemini_3_1_pro'
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: cafPrompt,
        response_json_schema: PARTIAL_SCHEMA,
        model: 'gemini_3_1_pro'
      })
    ]);

    const qstAnalysis = results[0].status === 'fulfilled' ? results[0].value : EMPTY_PARTIAL;
    const bdcAnalysis = results[1].status === 'fulfilled' ? results[1].value : EMPTY_PARTIAL;
    const cafAnalysis = results[2].status === 'fulfilled' ? results[2].value : EMPTY_PARTIAL;

    if (results[0].status === 'rejected') console.warn(`[SENTINEL v6.0] QST LLM failed: ${results[0].reason?.message}`);
    if (results[1].status === 'rejected') console.warn(`[SENTINEL v6.0] BDC LLM failed: ${results[1].reason?.message}`);
    if (results[2].status === 'rejected') console.warn(`[SENTINEL v6.0] CAF LLM failed: ${results[2].reason?.message}`);

    console.log(`[SENTINEL v6.0] Parciais prontas. QST flags=${qstAnalysis.red_flags?.length}, BDC flags=${bdcAnalysis.red_flags?.length}, CAF flags=${cafAnalysis.red_flags?.length}. Consolidando...`);

    // ═══ CONSOLIDATION ═══
    const consolidationPrompt = buildConsolidationPrompt(merchantCtx, v4Ctx, qstAnalysis, bdcAnalysis, cafAnalysis);

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: consolidationPrompt,
      response_json_schema: FINAL_SCHEMA,
      model: 'gemini_3_1_pro'
    });

    console.log(`[SENTINEL v6.0] Consolidação pronta. Recommendation=${llmResponse.sentinel_recommendation}, RedFlags=${(llmResponse.red_flags || []).length}, Confiança=${llmResponse.nivel_confianca_ia}%`);

    // ═══ SAVE ═══
    const now = new Date().toISOString();
    // Safety cap: even if LLM somehow returns "Recusado" despite schema enum, cap to "Revisão Manual"
    const cappedRecommendation = (llmResponse.sentinel_recommendation === 'Recusado') ? 'Revisão Manual' : llmResponse.sentinel_recommendation;
    if (cappedRecommendation !== llmResponse.sentinel_recommendation) {
      console.warn(`[SENTINEL v6.0] SAFETY CAP: LLM returned "Recusado", capped to "Revisão Manual".`);
    }

    const sentinelData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v6.0",
      sentinel_recommendation: cappedRecommendation,
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
      console.log(`[SENTINEL v6.0] Score updated: ${existingScore.id}`);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(sentinelData);
      console.log(`[SENTINEL v6.0] Score created`);
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      iaExplanation: llmResponse.sumario_executivo,
    });

    const duration = Date.now() - startTime;
    console.log(`[SENTINEL v6.0] Concluído em ${duration}ms`);

    return Response.json({
      success: true,
      case_id: caseId,
      score_id: existingScore?.id,
      sentinel_recommendation: cappedRecommendation,
      escalation_justification: llmResponse.escalation_justification || null,
      nivel_confianca: llmResponse.nivel_confianca_ia,
      red_flags_count: (llmResponse.red_flags || []).length,
      duration_ms: duration,
      architecture: "v6.0 — 3 parallel analyses + DECISION TABLE. Balanced, assertive, objective-data-first."
    });

  } catch (error) {
    console.error(`[SENTINEL v6.0] Erro:`, error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});