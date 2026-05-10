import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Schema, Source } from '../DocPrimitives';

/**
 * Capítulo 9 — Modelo de Dados Microscópico (entidades centrais com schema completo)
 */
export default function Ch09_ModeloDados() {
  return (
    <Sec id="ch-09">
      <H1 num="09">Modelo de Dados — Entidades Centrais Schema-by-Schema</H1>

      <P>Schema completo das 8 entidades mais importantes. Cada campo: tipo, default, descrição, constraint. Auditoria, governança e parceiros têm capítulo dedicado (Ch10, Ch11).</P>

      <H2 num="9.1">OnboardingCase — Registro Raiz do Ciclo KYC</H2>

      <Schema name="OnboardingCase" fields={[
        { name: 'merchantId', type: 'string (FK)', required: true, desc: 'FK para Merchant. Imutável após criação.' },
        { name: 'questionnaireTemplateId', type: 'string (FK)', required: true, desc: 'FK para QuestionnaireTemplate. Determina template_model usado em toda a cadeia.' },
        { name: 'submissionDate', type: 'datetime', desc: 'Quando o cliente submeteu o questionário público (ComplianceDinamico).' },
        { name: 'status', type: 'enum', default: 'Pendente', desc: '"Pendente" | "Em Processamento" | "Aprovado" | "Manual" | "Recusado" | "Docs Solicitados". Setado pelo pipeline Step 4.' },
        { name: 'riskScore', type: 'number', desc: 'Legacy 0-100 — derivado do V4 / 10 para compatibilidade UI antiga.' },
        { name: 'riskScoreV4', type: 'number', desc: 'V4 0-849. 850 = bloqueio. PERSISTIDO PELO bdcEnrichCase.' },
        { name: 'subfaixa', type: 'enum', desc: '1A|1B|2A|2B|3A|3B|4|5. Calculada de riskScoreV4.' },
        { name: 'subfaixaNome', type: 'string', desc: 'VERDE EXPRESS|VERDE|AZUL LEVE|AZUL|AMARELO|LARANJA|VERMELHO|BLOQUEIO.' },
        { name: 'rollingReservePercent', type: 'number', default: 0, desc: '0-20%. Mapeado por subfaixa (rollingReserveMap em autoEnrichOnboarding).' },
        { name: 'monitoramentoNivel', type: 'enum', desc: 'PADRAO|REFORÇADO_LEVE|REFORÇADO|INTENSO|INTENSO_PLUS|MAXIMO.' },
        { name: 'condicoesAutomaticas', type: 'string[]', desc: 'Lista de conditionsMap[subfaixa]. Ex: ["KYC completo em 30 dias", "PLD quinzenal"].' },
        { name: 'bloqueiosAtivos', type: 'string[]', desc: 'Códigos B01-B10 ativos. Formato: "B03_Sócio em sanções".' },
        { name: 'iaDecision', type: 'enum', desc: 'Aprovado|Manual|Recusado|"Aprovado com Condições..."—decisão textual final.' },
        { name: 'iaExplanation', type: 'string', desc: 'Sumário executivo do SENTINEL ou explicação BDC quando aplicável.' },
        { name: 'manualReviewerId', type: 'string', desc: 'FK User do analista que assumiu (claim).' },
        { name: 'manualReviewComments', type: 'string', desc: 'Comentário final do analista.' },
        { name: 'manualReviewDate', type: 'datetime' },
        { name: 'finalDecisionDate', type: 'datetime', desc: 'Setado quando status sai de Em Processamento.' },
        { name: 'validationsCompleted', type: 'boolean', default: false, desc: 'Setado true pelo Step 4 do pipeline.' },
        { name: 'bigDataCorpCompleted', type: 'boolean', default: false, desc: 'Setado true por bdcEnrichCase.' },
        { name: 'cafCompleted', type: 'boolean', default: false, desc: 'Setado quando captura SDK CAF concluída.' },
        { name: 'docCompleted', type: 'boolean', default: false, desc: 'Setado quando docs obrigatórios uploaded.' },
        { name: 'assignedAnalystId', type: 'string', desc: 'FK User. Designação por bulk ou auto-assign.' },
        { name: 'assignedAnalystName', type: 'string', desc: 'Cache do nome do analista.' },
        { name: 'commercialAgentId', type: 'string', desc: 'FK User do vendedor que originou.' },
        { name: 'commercialAgentName', type: 'string', desc: 'Cache.' },
        { name: 'priority', type: 'enum', default: 'medium', desc: 'low|medium|high|critical.' },
        { name: 'slaDeadline', type: 'datetime', desc: 'Cliente espera resposta até esta data.' },
        { name: 'redFlags', type: 'string[]', desc: 'UNIFICADOS V4: + SENTINEL: + CAF: prefixados.' },
        { name: 'onboardingLinkId', type: 'string', desc: 'FK OnboardingLink que originou o caso.' },
        { name: 'onboardingLinkCode', type: 'string', desc: 'Cache do código (busca rápida).' },
        { name: 'parentMerchantId', type: 'string', desc: 'Subseller: FK do merchant principal.' },
        { name: 'isSubsellerCase', type: 'boolean', default: false },
        { name: 'docLinkToken', type: 'string', desc: 'Token 32 hex para link público de upload Doc-Only + CAF.' },
        { name: 'cafRecaptureRequested', type: 'boolean', default: false, desc: 'true quando CAF score zona cinza (não fraude).' },
        { name: 'cafRecaptureReason', type: 'string', desc: 'Motivo: "liveness score 58 — selfie pouco nítida".' },
        { name: 'cafRecaptureRequestedAt', type: 'datetime' },
        { name: 'cafRecaptureAttempts', type: 'number', default: 0, desc: 'Limite máximo: 2.' },
        { name: 'escalationReason', type: 'string', desc: 'Motivo técnico da escalação para Manual.' },
        { name: 'escalationSource', type: 'enum', desc: 'NONE|V4_BLOCK|V4_SUBFAIXA_4|CAF_FRAUD|CAF_QUALITY|SAFETY_NET.' },
      ]} />

      <H2 num="9.2">ComplianceScore — Resultado V4 + SENTINEL</H2>

      <Schema name="ComplianceScore" fields={[
        { name: 'onboarding_case_id', type: 'string (FK)', required: true, desc: 'snake_case (legacy) — FK para OnboardingCase.' },
        { name: 'versao_agente', type: 'string', desc: 'Versão do agent SENTINEL (ex: "v7.0").' },
        { name: 'framework_version', type: 'string', default: 'v4.0', desc: 'Identifica score gerado pelo motor v4 atual.' },
        { name: 'segmento', type: 'enum', desc: 'gateway|marketplace|plataforma_vertical|dropshipping|infoprodutos|ecommerce|link_pagamento|foodtech|saas|educacao|mpe|pix_merchant|pix_intermediario.' },
        { name: 'questionario_id', type: 'string', desc: 'FK QuestionnaireTemplate.' },
        { name: 'is_pix', type: 'boolean', default: false },
        { name: 'score_base_segmento', type: 'number', desc: 'Camada 1 V4: SEGMENT_BASE_SCORES[templateModel].' },
        { name: 'score_variaveis', type: 'number', desc: 'Camada 2 V4: 60% do weightedTotal.' },
        { name: 'score_enriquecimento', type: 'number', desc: 'Camada 3 V4: 40% do weightedTotal.' },
        { name: 'score_final', type: 'number', desc: 'PERSISTIDO 0-849, ou 850 se hasBlock. FONTE ÚNICA.' },
        { name: 'subfaixa', type: 'enum', desc: '1A|1B|2A|2B|3A|3B|4|5.' },
        { name: 'subfaixa_nome', type: 'string' },
        { name: 'rolling_reserve_percent', type: 'number', default: 0 },
        { name: 'decisao_automatica', type: 'boolean', default: false, desc: 'true quando subfaixa ∈ {1A,1B,2A,2B,3A,3B,5} sem fraude CAF.' },
        { name: 'monitoramento_nivel', type: 'enum' },
        { name: 'condicoes_automaticas', type: 'string[]' },
        { name: 'bloqueios_ativos', type: 'string[]' },
        { name: 'variaveis_aplicadas', type: 'object', desc: 'analysis.sections — 13 dimensões com items detalhados.' },
        { name: 'variaveis_positivas', type: 'string[]' },
        { name: 'variaveis_negativas', type: 'string[]' },
        { name: 'recomendacao_final', type: 'enum', desc: 'Aprovado|Aprovado com Condições|Revisão Manual|Recusado.' },
        { name: 'sentinel_recommendation', type: 'enum', desc: 'Recomendação do SENTINEL — pode escalar V4, NUNCA rebaixar.' },
        { name: 'decisao_escalada_sentinel', type: 'boolean', default: false, desc: 'SEMPRE FALSE em v7.' },
        { name: 'escalation_justification', type: 'string', desc: 'Vazio se não escalou.' },
        { name: 'sumario_executivo', type: 'string', desc: 'SENTINEL — resumo 3-4 parágrafos.' },
        { name: 'analise_completa_ia', type: 'string', desc: 'SENTINEL — markdown longo com seções.' },
        { name: 'parecer_final', type: 'string', desc: 'SENTINEL — veredito qualitativo.' },
        { name: 'pontos_positivos', type: 'string[]' },
        { name: 'pontos_atencao', type: 'string[]' },
        { name: 'red_flags', type: 'string[]', desc: 'UNIFICADOS pelo orquestrador (V4: + SENTINEL: + CAF:).' },
        { name: 'sentinel_red_flags', type: 'string[]', desc: 'Apenas qualitativos do SENTINEL (sem prefixo).' },
        { name: 'recomendacoes_revisao_manual', type: 'string', desc: 'SENTINEL — quando subfaixa=4.' },
        { name: 'perguntas_sugeridas', type: 'string[]' },
        { name: 'documentos_adicionais_sugeridos', type: 'string[]' },
        { name: 'nivel_confianca_ia', type: 'number', desc: 'SENTINEL 0-100. < 60 = baixa confiança.' },
        { name: 'analise_dimensional', type: 'object', desc: '7 dimensões SENTINEL.' },
        { name: 'cross_validation', type: 'array<object>', desc: 'Items {campo, declarado, verificado, fonte_verificacao, status, severidade}.' },
        { name: 'total_findings', type: 'number', default: 0 },
        { name: 'findings_por_severidade', type: 'object' },
        { name: 'overrides_aplicados', type: 'string[]' },
        { name: 'condicoes_aprovacao', type: 'string', desc: 'Texto livre quando aprovado com ressalvas.' },
        { name: 'fase_2_completa', type: 'boolean', default: false, desc: 'BDC concluído.' },
        { name: 'fase_3_completa', type: 'boolean', default: false, desc: 'SENTINEL concluído.' },
        { name: 'data_analise_fase_2', type: 'datetime' },
        { name: 'data_analise_fase_3', type: 'datetime' },
      ]} />

      <Note title="Por que campos legacy fase_*_completa permanecem" kind="info">
        Antes do framework V4, o sistema usava nomenclatura "Fase 1 (questionário) / Fase 2 (validação externa) / Fase 3 (SENTINEL)". V4 manteve <C>fase_2_completa</C> e <C>fase_3_completa</C> como flags de execução técnica. <C>fase_1_completa</C> foi descontinuado mas o campo persiste na schema para retrocompatibilidade de queries antigas.
      </Note>

      <H2 num="9.3">IntegrationLog — Log Técnico de Cada API Call</H2>

      <Schema name="IntegrationLog" fields={[
        { name: 'onboarding_case_id', type: 'string (FK)', desc: '— (snake_case legacy)' },
        { name: 'merchant_id', type: 'string (FK)' },
        { name: 'provider', type: 'enum', required: true, desc: 'CAF | BigDataCorp.' },
        { name: 'service_type', type: 'enum', required: true, desc: '~50 valores possíveis (ver Cap. 2 §2.3.3 + 5).' },
        { name: 'request_id', type: 'string', desc: 'ID da request no provedor (CAF / BDC).' },
        { name: 'transaction_id', type: 'string', desc: 'ID da transação CAF.' },
        { name: 'onboarding_id', type: 'string', desc: 'ID do onboarding no provedor.' },
        { name: 'status', type: 'enum', default: 'pending', desc: 'pending|processing|success|failed|timeout|cancelled.' },
        { name: 'result_status', type: 'enum', desc: 'APPROVED|REPROVED|PENDING_REVIEW|NOT_APPLICABLE.' },
        { name: 'request_payload', type: 'object', desc: 'Body enviado.' },
        { name: 'response_payload', type: 'object', desc: 'Body recebido (parsed JSON).' },
        { name: 'score', type: 'number', desc: '0-100 quando service quality-scored.' },
        { name: 'similarity', type: 'number', desc: 'Facematch (0-1).' },
        { name: 'is_alive', type: 'boolean', desc: 'Liveness.' },
        { name: 'probability', type: 'number', desc: 'Confidence 0-1.' },
        { name: 'red_flags', type: 'string[]' },
        { name: 'error_message', type: 'string' },
        { name: 'error_code', type: 'string' },
        { name: 'duration_ms', type: 'number' },
        { name: 'image_urls', type: 'string[]', desc: 'URLs das imagens salvas (privadas — exigem signed URL).' },
        { name: 'callback_received_at', type: 'datetime', desc: 'Quando webhook foi recebido (para análises async).' },
        { name: 'callback_payload', type: 'object', desc: 'Payload do webhook (independente da response_payload da request inicial).' },
      ]} />

      <H2 num="9.4">DocumentUpload — Arquivos Privados (LGPD)</H2>

      <Schema name="DocumentUpload" fields={[
        { name: 'onboardingCaseId', type: 'string (FK)', required: true },
        { name: 'documentTypeId', type: 'string (FK)', required: true, desc: 'FK DocumentType.' },
        { name: 'documentName', type: 'string', desc: 'Cache do DocumentType.name no momento.' },
        { name: 'fileUrl', type: 'string', desc: 'URL legacy. Hoje vazia para docs privados — usa fileUri.' },
        { name: 'fileUri', type: 'string', desc: 'URI privado quando isPrivate=true. Use getPrivateDocumentUrl para signed URL.' },
        { name: 'isPrivate', type: 'boolean', default: false, desc: 'true para docs KYC. Storage privado, signed URL TTL 5min.' },
        { name: 'fileName', type: 'string' },
        { name: 'fileSize', type: 'number', desc: 'bytes.' },
        { name: 'fileType', type: 'string', desc: 'MIME.' },
        { name: 'uploadDate', type: 'datetime' },
        { name: 'validationStatus', type: 'enum', default: 'Pendente', desc: 'Pendente|Validado|Rejeitado|Erro. Atualizado por cafVerifaiDocs.' },
        { name: 'validationNotes', type: 'string', desc: 'Notas humanas + output VerifAI quando aplicável.' },
        { name: 'notAvailable', type: 'boolean', default: false, desc: 'Cliente declarou que não possui. fileUrl/Uri vazio.' },
        { name: 'notAvailableReason', type: 'string', desc: 'Justificativa OBRIGATÓRIA quando notAvailable=true.' },
        { name: 'notAvailableReviewStatus', type: 'enum', default: 'Pendente', desc: 'Pendente|Aceito|Rejeitado. Analista decide.' },
        { name: 'notAvailableReviewedBy', type: 'string', desc: 'Email do analista.' },
        { name: 'notAvailableReviewedAt', type: 'datetime' },
        { name: 'notAvailableReviewNotes', type: 'string' },
      ]} />

      <H2 num="9.5">QuestionnaireTemplate, Question, QuestionnaireResponse</H2>

      <Schema name="QuestionnaireTemplate" fields={[
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string' },
        { name: 'merchantType', type: 'enum', required: true, desc: 'PF | PJ.' },
        { name: 'category', type: 'enum', required: true, desc: 'LEAD_GENERATION | COMPLIANCE.' },
        { name: 'subCategory', type: 'enum', default: 'GENERAL', desc: 'MERCHAN | GATEWAY | MARKETPLACE | GENERAL.' },
        { name: 'linkedComplianceTemplateId', type: 'string', desc: 'FK para template de compliance vinculado (só em LEAD).' },
        { name: 'model', type: 'string', desc: 'String identificadora — chave do complianceModelRegistry. Ex: ComplianceEcommerceV4.' },
        { name: 'isActive', type: 'boolean', default: true },
        { name: 'isArchived', type: 'boolean', default: false },
        { name: 'version', type: 'number', default: 1 },
        { name: 'previousVersionId', type: 'string', desc: 'Encadeamento de versões.' },
        { name: 'usageCount', type: 'number', default: 0 },
        { name: 'riskThresholds', type: 'object', desc: '{ autoApproveAbove, autoRejectBelow, manualReviewMin, manualReviewMax } — legacy não usado em V4.' },
        { name: 'requiredDocuments', type: 'array<object>', desc: 'Items: { documentTypeId, label, required, conditionalLogic }.' },
      ]} />

      <Schema name="Question" fields={[
        { name: 'questionnaireTemplateId', type: 'string (FK)', required: true },
        { name: 'order', type: 'number', required: true },
        { name: 'text', type: 'string', required: true },
        { name: 'type', type: 'enum', required: true, desc: '10 valores: TEXT|NUMBER|DATE|SELECT|MULTI_SELECT|FILE_UPLOAD|BOOLEAN|EMAIL|PHONE|CPF_CNPJ.' },
        { name: 'options', type: 'string[]', desc: 'Para SELECT/MULTI_SELECT.' },
        { name: 'isRequired', type: 'boolean', default: false },
        { name: 'isLibraryQuestion', type: 'boolean', default: false, desc: 'Pergunta da biblioteca reutilizável.' },
        { name: 'conditionalLogic', type: 'object', desc: '{ dependsOn, operator (equals|not_equals|contains|gt|lt|in), value }.' },
        { name: 'helpText', type: 'string' },
        { name: 'placeholder', type: 'string' },
        { name: 'riskWeight', type: 'number', default: 0, desc: 'Legacy — não usado em V4.' },
        { name: 'riskValues', type: 'object', desc: 'Map de valores → pontos. Legacy.' },
        { name: 'validationRules', type: 'object', desc: '{ minLength, maxLength, minValue, maxValue, pattern (regex) }.' },
        { name: 'sourceEntityPath', type: 'string', desc: 'Caminho dot-notation para pré-preenchimento. Ex: "merchant.fullName".' },
      ]} />

      <Schema name="QuestionnaireResponse" fields={[
        { name: 'onboardingCaseId', type: 'string (FK)', required: true },
        { name: 'questionId', type: 'string (FK)', required: true },
        { name: 'valueText', type: 'string' },
        { name: 'valueNumber', type: 'number' },
        { name: 'valueBoolean', type: 'boolean' },
        { name: 'valueArray', type: 'string[]' },
        { name: 'questionText', type: 'string', desc: 'Cache do texto da pergunta no momento (auditoria histórica).' },
        { name: 'questionType', type: 'string', desc: 'Cache do tipo.' },
      ]} />

      <Note title="Por que cache (questionText, questionType)" kind="info">
        Templates podem ser editados após casos antigos terem usado uma versão prévia. Cache em <C>QuestionnaireResponse</C> garante que o registro histórico faz sentido mesmo se o template foi alterado/deletado. <B>Auditoria regulatória de 5 anos exige isso.</B>
      </Note>

      <Source files={[
        'entities/OnboardingCase.json',
        'entities/ComplianceScore.json',
        'entities/IntegrationLog.json',
        'entities/DocumentUpload.json',
        'entities/QuestionnaireTemplate.json',
        'entities/Question.json',
        'entities/QuestionnaireResponse.json',
      ]} />
    </Sec>
  );
}