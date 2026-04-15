import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SENTINEL v5.0 — Agente de Análise QUALITATIVA de Compliance
 *
 * PIPELINE: 4 chamadas LLM paralelas + consolidação
 *   1. Análise do QUESTIONÁRIO (respostas, documentos, declarações)
 *   2. Análise do BDC (Big Data Corp — dados cadastrais, processos, sócios, etc.)
 *   3. Análise da CAF (biometria, liveness, facematch, screening PEP/sanções)
 *   4. CONSOLIDAÇÃO final (merge das 3 análises + V4 score + cross-validation)
 *
 * Cada análise é INDEPENDENTE e detalhada. A consolidação cruza todas.
 * Modelo: Gemini 3.1 Pro (1M tokens) — zero truncamento.
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

const PARTIAL_SCHEMA = {
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

const FINAL_SCHEMA = {
  type: "object",
  properties: {
    sentinel_recommendation: { type: "string", enum: ["Aprovado", "Aprovado com Condições Leves", "Aprovado com Condições", "Revisão Manual"] },
    escalation_justification: { type: "string" },
    sumario_executivo: { type: "string", description: "4-8 linhas com fontes citadas" },
    analise_completa_ia: { type: "string", description: "Análise consolidada COMPLETA. Mínimo 25 linhas. TODOS os detalhes das 3 análises." },
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
}

// ═══ PROMPT BUILDERS ═══

function buildQuestionnairePrompt(merchantCtx, formattedResponses, formattedDocuments) {
  const stats = {
    total: formattedResponses.length,
    respondidas: formattedResponses.filter(r => r.status === 'RESPONDIDA').length,
    naoRespondidas: formattedResponses.filter(r => r.status === 'NÃO RESPONDIDA').length,
  };
  stats.completude = stats.total > 0 ? ((stats.respondidas / stats.total) * 100).toFixed(1) : '0';

  return `Você é o SENTINEL v5, analista sênior de compliance. Analise EXCLUSIVAMENTE o QUESTIONÁRIO preenchido pelo merchant.
NÃO analise dados BDC nem CAF — isso será feito em análises separadas.

${SENTINEL_RULES}

${merchantCtx}

═══ QUESTIONÁRIO (${stats.total} perguntas) ═══
REGRAS DE INTERPRETAÇÃO:
1. "status: RESPONDIDA" = resposta COMPLETA. NÃO trate como lacuna.
2. "NÃO" em perguntas sobre riscos/proibições/cripto/jogos/PEP = resposta DESEJADA e POSITIVA.
3. "SIM" em perguntas sobre compliance/PLD/monitoramento = resposta DESEJADA e POSITIVA.
4. Somente "NÃO RESPONDIDA" = informação realmente ausente.

ESTATÍSTICAS: Total=${stats.total} | Respondidas=${stats.respondidas} | Não Respondidas=${stats.naoRespondidas} | Completude=${stats.completude}%

RESPOSTAS COMPLETAS:
${serializeFullData(formattedResponses.map(r => `[${r.status}][${r.tipo}] "${r.pergunta}" → ${r.resposta_semantica} | Valor: ${r.valor_bruto || 'N/A'}`))}

═══ DOCUMENTOS ENVIADOS (${formattedDocuments.length}) ═══
${serializeFullData(formattedDocuments)}

═══ INSTRUÇÕES ═══
Produza uma análise EXTREMAMENTE detalhada do QUESTIONÁRIO:
1. PERFIL DECLARADO: modelo de negócio, segmento, volume, estrutura societária, conforme declarado pelo merchant.
2. ANÁLISE DAS RESPOSTAS: Liste TODAS as respostas relevantes como FATOS DECLARADOS. Cite pergunta e valor exato.
3. CONTROLES DECLARADOS: compliance, PLD, monitoramento, KYC — o que o merchant DIZ ter e não ter.
4. LACUNAS REAIS: apenas perguntas NÃO RESPONDIDAS ou documentos faltantes.
5. PONTOS DE ATENÇÃO: respostas que merecem cross-validation com dados BDC/CAF.
6. RED FLAGS DO QUESTIONÁRIO: declarações contraditórias, respostas evasivas, valores suspeitos.

NÃO seja genérico. Cite perguntas específicas, valores exatos. Detalhe TUDO.`;
}

function buildBdcPrompt(merchantCtx, v4Ctx, bdcDataString, v4VariablesString) {
  // Use V4 processed variables as primary source (structured, complete, smaller).
  // Include raw BDC data only if it fits within a safe size (< 50k chars).
  const rawBdcSection = bdcDataString && bdcDataString.length < 50000
    ? `\n\n═══ DADOS RAW BDC (complementar — use para detalhes adicionais) ═══\n${bdcDataString}`
    : bdcDataString
    ? `\n\n═══ NOTA: Dados raw BDC disponíveis (${(bdcDataString.length/1000).toFixed(0)}k chars) mas omitidos por tamanho. As variáveis V4 acima já contêm TODOS os dados processados. ═══`
    : '';

  return `Você é o SENTINEL v5, analista sênior de compliance. Analise EXCLUSIVAMENTE os DADOS BDC (Big Data Corp) e o Score V4 deste merchant.
NÃO analise questionário nem CAF — isso será feito em análises separadas.

${SENTINEL_RULES}

${merchantCtx}

${v4Ctx}

${v4VariablesString ? `═══ VARIÁVEIS V4 PROCESSADAS (DADOS BDC ESTRUTURADOS — FONTE PRIMÁRIA) ═══
Estes são os dados BDC processados pelo framework V4, organizados por dimensão.
CADA item tem: label, value (dados reais), risk (nível), points (impacto no score).
Analise TODOS os items de TODAS as dimensões.

${v4VariablesString}` : '═══ DADOS BDC ═══\nNÃO DISPONÍVEL — Não faça afirmações sobre dados BDC.'}
${rawBdcSection}

═══ INSTRUÇÕES ═══
Produza análise EXTREMAMENTE detalhada cobrindo TODAS estas dimensões (use as variáveis V4 como fonte):
1. IDENTIDADE E CADASTRO: Status CNPJ/CPF, data fundação, porte, capital social, endereço, CNAE principal e secundários.
2. SÓCIOS E QSA: Todos os sócios, participações, CPFs, situações cadastrais, PEP, sanções, grupo econômico.
3. COMPLIANCE E REGULATÓRIO: Sanções, PEP, processos (detalhe CADA um), restrições, CEIS/CNEP.
4. REPUTAÇÃO: Protestos, negativações, cobranças, mídia, prêmios.
5. FINANCEIRO: Receita presumida, porte x capital, score de crédito, dívida ativa, protestos, assets.
6. PEGADA DIGITAL: Domínios, presença online, emails/telefones, shell company score, atividade web, passagens.
7. ESG: Lista suja MTE, embargo IBAMA, indicadores ambientais/sociais/governança.
8. SETORIAL: MCC, CNAEs financeiros, registros BCB/CVM, marketplaces.
9. FUNCIONÁRIOS: Faixa de empregados RAIS/CAGED.
10. CRÉDITO: Score de crédito PJ, probabilidade de inadimplência, protestos, cheques devolvidos.
11. EVOLUÇÃO: Histórico de alterações cadastrais, evolução de capital, mudanças de CNAE/razão social.

Para CADA dimensão: cite dados EXATOS, valores. NÃO invente dados que não estejam nas variáveis.`;
}

function buildCafPrompt(merchantCtx, cafDataString, cafValidationsString) {
  const hasCafData = cafDataString || cafValidationsString;

  return `Você é o SENTINEL v5, analista sênior de compliance. Analise EXCLUSIVAMENTE os DADOS CAF (Combate à Fraude) deste merchant.
NÃO analise questionário nem BDC — isso será feito em análises separadas.

${SENTINEL_RULES}

${merchantCtx}

${cafDataString ? `═══ LOGS COMPLETOS CAF (Combate à Fraude) ═══
TODOS os serviços CAF executados com respostas COMPLETAS.
Detalhe CADA serviço: resultado, score, red flags, detalhes do hit, etc.

${cafDataString}` : '═══ LOGS CAF ═══\nNÃO DISPONÍVEL — Nenhum serviço CAF executado ainda.'}

${cafValidationsString ? `═══ VALIDAÇÕES CAF (External Results) ═══
${cafValidationsString}` : ''}

═══ INSTRUÇÕES ═══
${hasCafData ? `Produza análise EXTREMAMENTE detalhada de TODOS os serviços CAF:
1. BIOMETRIA: Liveness (prova de vida), facematch (similaridade facial), face_authentication. Resultado, probabilidade, is_alive.
2. DOCUMENTOSCOPIA: Document OCR, document detector (frente/verso), documentscopy, VerifAI Docs, document liveness.
3. SCREENING PEP: Resultado da busca por Pessoas Expostas Politicamente. Hits encontrados, detalhes.
4. SCREENING SANÇÕES: OFAC, EU, UN, COAF, CEIS, CNEP. Hits, similaridades, detalhes de cada match.
5. SCREENING INTERPOL: Resultados de buscas Interpol.
6. VALIDAÇÃO CPF: Cross-validation do CPF, biometria oficial, faceset compartilhado/privado.
7. STATUS GERAL: Quantos serviços executados, quantos aprovados, quantos reprovados/pendentes.

Para CADA serviço: cite o resultado exato, score, flags, detalhes. NÃO resuma.` : 
`NÃO há dados CAF disponíveis para este caso. Registre que:
1. Nenhuma biometria foi realizada (liveness, facematch).
2. Nenhum screening PEP/Sanções/Interpol CAF foi executado.
3. Nenhuma documentoscopia CAF foi realizada.
4. RECOMENDE que estes serviços sejam executados antes de uma decisão final.

Isso é uma LACUNA SIGNIFICATIVA na due diligence — registre como ponto de atenção.`}`;
}

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

  return `Você é o SENTINEL v5.1, analista sênior de compliance. Recebeu TRÊS análises parciais independentes sobre o mesmo merchant.
Sua tarefa é CONSOLIDAR em uma análise FINAL única, completa e robusta.

${merchantCtx}

${v4Ctx}

${formatPartial('ANÁLISE 1: QUESTIONÁRIO', qstAnalysis)}

${formatPartial('ANÁLISE 2: BDC (Big Data Corp)', bdcAnalysis)}

${formatPartial('ANÁLISE 3: CAF (Combate à Fraude)', cafAnalysis)}

═══ INSTRUÇÕES DE CONSOLIDAÇÃO ═══

${SENTINEL_RULES}

═══ REGRA FUNDAMENTAL DE DECISÃO — LEIA COM ATENÇÃO ═══

VOCÊ NÃO TEM PODER DE RECUSAR. Apenas dados objetivos (bloqueios V4 ou fraude CAF confirmada) podem recusar.

Sua recomendação deve ser UMA destas (em ordem crescente de cautela):
1. "Aprovado" — BDC/CAF limpos, questionário sem problemas significativos
2. "Aprovado com Condições Leves" — BDC/CAF limpos, mas há pontos de atenção menores (ex: empresa nova, capital baixo). Sugira 1-3 condições leves como monitoramento trimestral.
3. "Aprovado com Condições" — BDC/CAF limpos, mas há pontos de atenção significativos. Sugira condições mais rigorosas (Rolling Reserve, KYC reforçado, limite de TPV, monitoramento mensal).
4. "Revisão Manual" — Há inconsistências sérias que requerem investigação humana. MÁXIMO que você pode recomendar.

REGRAS DE PESO:
- Os dados OBJETIVOS da BDC e CAF têm PESO MÁXIMO. Se BDC e CAF não encontraram problemas graves (sem bloqueios, sem sanções, sem fraude), a empresa é PRESUMIDAMENTE BOA.
- Inconsistências no questionário são PONTOS DE ATENÇÃO, não motivos de recusa. O merchant pode ter errado no preenchimento (ex: confundir faturamento com volume transacionado).
- Ausência de dados NÃO é evidência negativa. "Sem website" ou "profileExists=false na CAF" NÃO são motivos para recusar — muitas empresas legítimas não têm site ou nunca usaram CAF.
- NUNCA recomende "Recusado" — essa opção não existe para você. Se encontrar algo muito grave que seria motivo de recusa, recomende "Revisão Manual" e justifique detalhadamente POR QUE o analista deve investigar.

COMO DEFINIR CONDIÇÕES:
Quando recomendar "Aprovado com Condições Leves" ou "Aprovado com Condições", DETALHE cada condição:
- O que: descrição clara da condição (ex: "Rolling Reserve de 10%")  
- Por quê: qual achado motivou esta condição (ex: "Capital social de R$25k para volume declarado de R$10M")
- Duração: por quanto tempo (ex: "Primeiros 6 meses, com revisão")
- Critério de remoção: quando a condição pode ser removida (ex: "Após 6 meses sem chargebacks acima de 1%")

FOCO PRINCIPAL: CRUZAR as 3 fontes de dados para identificar DIVERGÊNCIAS.
- O que o merchant DECLAROU no questionário vs o que o BDC CONFIRMOU vs o que a CAF VERIFICOU.
- Cada divergência é uma cross-validation que deve ser documentada com severidade.

1. SUMÁRIO EXECUTIVO: 4-8 linhas com os achados mais importantes de TODAS as 3 análises. Comece com a DECISÃO recomendada.
2. ANÁLISE COMPLETA: Consolide TODAS as análises em narrativa única por dimensões. Mínimo 25 linhas. NÃO resuma — inclua TODOS os detalhes.
3. PARECER FINAL: Narrativa autocontida para dossiê. Um analista deve entender TUDO sem consultar outras fontes.
4. RED FLAGS: Consolide das 3 (sem duplicar). Mantenha formato "[FONTE: campo] Descrição". Lembre: red flags são INFORMATIVOS, não decisórios.
5. PONTOS POSITIVOS / ATENÇÃO: Consolide das 3.
6. CROSS-VALIDATION GLOBAL: Cruze declarações do questionário com dados BDC e CAF. Documente CADA divergência.
7. ANÁLISE DIMENSIONAL (7 dimensões): Use dados das 3 análises para cada dimensão.
8. CONDIÇÕES DETALHADAS: Se recomendar condições, detalhe CADA uma com O QUE, POR QUÊ, DURAÇÃO e CRITÉRIO DE REMOÇÃO.

Produza análise ROBUSTA, COMPLETA, com TODOS os dados e insights das 3 análises.`;
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

    console.log(`[SENTINEL v5.0] Iniciando análise: ${caseId}`);

    // ═══ LOAD ALL DATA ═══
    const [onboardingCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
    if (!onboardingCase) return Response.json({ error: "Caso não encontrado" }, { status: 404 });

    const existingScores = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId });
    const existingScore = existingScores[0];
    if (existingScore?.fase_3_completa && existingScore.data_analise_fase_3) {
      const hours = (Date.now() - new Date(existingScore.data_analise_fase_3).getTime()) / 3600000;
      if (hours < 24 && !payload.force) {
        console.log(`[SENTINEL v5.0] Análise recente (${hours.toFixed(1)}h). Pulando.`);
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

    console.log(`[SENTINEL v5.0] V4: score=${v4Data?.score_final}, subfaixa=${v4Data?.subfaixa}`);

    // ═══ EXTRACT DATA — ZERO TRUNCATION ═══
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
    // V4 variaveis_aplicadas contain ALL BDC data pre-processed by bdcEnrichCase — structured, complete
    const v4VariablesString = existingScore?.variaveis_aplicadas 
      ? serializeFullData(existingScore.variaveis_aplicadas) 
      : null;

    const qstPrompt = buildQuestionnairePrompt(merchantCtx, formattedResponses, formattedDocuments);
    const bdcPrompt = buildBdcPrompt(merchantCtx, v4Ctx, bdcDataString, v4VariablesString);
    const cafPrompt = buildCafPrompt(merchantCtx, cafDataString, cafValidationsString);

    console.log(`[SENTINEL v5.0] Lançando 3 LLM calls paralelas: QST(${(qstPrompt.length/1000).toFixed(0)}k) | BDC(${(bdcPrompt.length/1000).toFixed(0)}k) | CAF(${(cafPrompt.length/1000).toFixed(0)}k)`);

    // ═══ PARALLEL EXECUTION — 3 independent analyses (resilient) ═══
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

    if (results[0].status === 'rejected') console.warn(`[SENTINEL v5.0] QST LLM failed: ${results[0].reason?.message}`);
    if (results[1].status === 'rejected') console.warn(`[SENTINEL v5.0] BDC LLM failed: ${results[1].reason?.message}`);
    if (results[2].status === 'rejected') console.warn(`[SENTINEL v5.0] CAF LLM failed: ${results[2].reason?.message}`);

    console.log(`[SENTINEL v5.0] 3 análises parciais prontas. QST flags=${qstAnalysis.red_flags?.length}, BDC flags=${bdcAnalysis.red_flags?.length}, CAF flags=${cafAnalysis.red_flags?.length}. Consolidando...`);

    // ═══ CONSOLIDATION — Merge all 3 into final output ═══
    const consolidationPrompt = buildConsolidationPrompt(merchantCtx, v4Ctx, qstAnalysis, bdcAnalysis, cafAnalysis);

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: consolidationPrompt,
      response_json_schema: FINAL_SCHEMA,
      model: 'gemini_3_1_pro'
    });

    console.log(`[SENTINEL v5.0] Consolidação pronta. Recommendation=${llmResponse.sentinel_recommendation}, RedFlags=${(llmResponse.red_flags || []).length}, Confiança=${llmResponse.nivel_confianca_ia}%`);

    // ═══ SAVE ═══
    const now = new Date().toISOString();
    const sentinelData = {
      onboarding_case_id: caseId,
      versao_agente: "SENTINEL v5.1",
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
      console.log(`[SENTINEL v5.0] Score updated: ${existingScore.id}`);
    } else {
      await base44.asServiceRole.entities.ComplianceScore.create(sentinelData);
      console.log(`[SENTINEL v5.0] Score created`);
    }

    await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
      iaExplanation: llmResponse.sumario_executivo,
    });

    const duration = Date.now() - startTime;
    console.log(`[SENTINEL v5.0] Concluído em ${duration}ms`);

    return Response.json({
      success: true,
      case_id: caseId,
      score_id: existingScore?.id,
      sentinel_recommendation: llmResponse.sentinel_recommendation,
      escalation_justification: llmResponse.escalation_justification || null,
      nivel_confianca: llmResponse.nivel_confianca_ia,
      red_flags_count: (llmResponse.red_flags || []).length,
      duration_ms: duration,
      architecture: "v5.1 — 3 parallel analyses (QST + BDC + CAF) + consolidation. SENTINEL max=Revisão Manual, never Recusado."
    });

  } catch (error) {
    console.error(`[SENTINEL v5.0] Erro:`, error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});