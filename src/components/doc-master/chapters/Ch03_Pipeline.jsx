import React from 'react';
import { Sec, H1, H2, H3, P, Li, B, C, CodeBlock, Table, Note, Pipeline, Endpoint, Source } from '../DocPrimitives';

/**
 * Capítulo 3 — Pipeline autoEnrichOnboarding (microscópico)
 * Cada step com: linha de código, condicionais, decisões, fallbacks.
 */
export default function Ch03_Pipeline() {
  return (
    <Sec id="ch-03">
      <H1 num="03">Pipeline autoEnrichOnboarding — Microscopia Linha-por-Linha</H1>

      <P>O orquestrador <C>autoEnrichOnboarding</C> é a função coração do compliance. É disparada por <B>entity automation</B> quando um <C>OnboardingCase</C> é criado ou atualizado para status que indica conclusão do cliente. Este capítulo descreve cada um dos <B>11 steps</B> com profundidade absoluta — cada condição, cada fallback, cada efeito colateral.</P>

      <H2 num="3.1">Trigger e Carga Inicial</H2>

      <H3 num="3.1.1">Como o pipeline é acionado</H3>
      <CodeBlock language="js">{`// Extracted from autoEnrichOnboarding.js (linhas 44-50)
let caseId = body.onboardingCaseId;
if (!caseId && body.event?.entity_id) caseId = body.event.entity_id;
if (!caseId && body.data?.id) caseId = body.data.id;

if (!caseId) {
  console.log('[AutoEnrich] No caseId found in payload, skipping.');
  return Response.json({ skipped: true, reason: 'no_case_id' });
}`}</CodeBlock>

      <P>3 fontes possíveis para o caseId:</P>
      <ul className="list-disc ml-5">
        <Li><C>body.onboardingCaseId</C> — chamada manual ou síncrona (ex: bulkReprocessCompliance).</Li>
        <Li><C>body.event.entity_id</C> — entity automation gerada pelo sistema. <C>event</C> tem shape <C>{`{ type: 'create'|'update'|'delete', entity_name, entity_id }`}</C>.</Li>
        <Li><C>body.data.id</C> — payload completo da entidade quando o sistema entrega <C>data</C> direto.</Li>
      </ul>

      <H3 num="3.1.2">Idempotência: NÃO re-processar</H3>
      <CodeBlock language="js">{`if (onboardingCase.bigDataCorpCompleted && onboardingCase.validationsCompleted) {
  console.log(\`[AutoEnrich] Case \${caseId} already fully enriched. Skipping.\`);
  return Response.json({ skipped: true, reason: 'already_enriched' });
}`}</CodeBlock>
      <P>Tanto <C>bigDataCorpCompleted</C> quanto <C>validationsCompleted</C> precisam ser <B>true</B> para considerar "já enriquecido". <C>bigDataCorpCompleted</C> é setado pelo bdcEnrichCase ao final. <C>validationsCompleted</C> é setado pelo Step 4.</P>

      <H3 num="3.1.3">Pré-extração do Representante Legal (Cadeia de Prioridade P1→P5)</H3>

      <P>Antes de qualquer chamada externa, o pipeline tenta identificar o <B>CPF e nome do representante legal</B> da empresa (PJ). Isso é necessário porque vários steps subsequentes (CAF Profile, Credit Analysis, Screening Internacional, CPF Cross-Validation) operam sobre o representante, não a empresa. Cadeia de prioridade ascendente:</P>

      <Table headers={['Prioridade', 'Fonte', 'Condição exata']} rows={[
        ['P1', 'Qualquer CPF de 11 dígitos no questionário', 'Pergunta tem "cpf" no texto, valueText limpo tem 11 dígitos. Source: response com qualquer pergunta CPF.'],
        ['P2', 'ComplianceSession.formData.socios', 'Primeiro sócio com cpf 11 dígitos. Lido por linkCode quando session.status === "completed".'],
        ['P3', 'CPF/Nome do Responsável Legal', 'Pergunta com "cpf" + "responsável" (sem til e com til) no texto.'],
        ['P4', 'CPF/Nome do Representante Legal', 'Pergunta com "cpf" + "representante" + "legal" no texto. Tem maior prioridade ANTES da BDC.'],
        ['P5', 'BDC Relationships QSA', 'PÓS-Step 1 BDC. Primeiro sócio do dataset Relationships oficial Receita Federal. Sobrescreve P1-P4.'],
      ]} />

      <CodeBlock language="js">{`// autoEnrichOnboarding.js linhas 90-148 (P1-P4)
let representanteCpf = null;
let representanteNome = null;
let repCpfPriority = 0;
let repNamePriority = 0;

if (merchant?.type === 'PJ' || (merchantCpf && merchantCpf.length === 14)) {
  const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId });
  for (const r of responses) {
    const t = (r.questionText || '').toLowerCase();
    const val = r.valueText || '';
    const cleanVal = val.replace(/\\D/g, '');

    // P4 — CPF/Nome Representante Legal
    if (cleanVal.length === 11 && t.includes('cpf') && t.includes('representante') && t.includes('legal') && repCpfPriority < 4) {
      representanteCpf = cleanVal; repCpfPriority = 4;
    }
    // P3 — CPF/Nome Responsável (com ou sem til)
    if (cleanVal.length === 11 && t.includes('cpf') && (t.includes('responsável') || t.includes('responsavel')) && repCpfPriority < 3) {
      representanteCpf = cleanVal; repCpfPriority = 3;
    }
    // P1 — qualquer CPF
    if (cleanVal.length === 11 && repCpfPriority < 1) {
      representanteCpf = cleanVal; repCpfPriority = 1;
    }
    // P4/P3/P1 espelhado para nome (matching textual)
  }
}`}</CodeBlock>

      <P>Após o Step 1 BDC, <B>P5 sobrescreve tudo</B> usando dados oficiais Receita Federal:</P>
      <CodeBlock language="js">{`// autoEnrichOnboarding.js linhas 273-334 (P5 pós-BDC)
if (bdcSuccess && (merchant?.type === 'PJ' || ...)) {
  const bdcResults = await base44.asServiceRole.entities.ExternalValidationResult.filter({ onboardingCaseId: caseId, provider: 'BigDataCorp' });
  const bdcResult = bdcResults.find(r => r.validationType?.includes('PJ'))?.resultData;
  if (bdcResult) {
    const rels = bdcResult?.Relationships;
    const relEntries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    const bdcSocios = [];
    for (const e of relEntries) {
      const doc = (e.RelatedEntityTaxIdNumber || e.TaxIdNumber || '').replace(/\\D/g, '');
      const name = e.RelatedEntityName || e.Name || '';
      if (doc.length === 11 && name.length > 3) {
        bdcSocios.push({ cpf: doc, nome: name, cargo: e.RelationshipName || e.Qualification });
      }
    }
    if (bdcSocios.length > 0) {
      const firstSocio = bdcSocios[0];
      if (firstSocio.cpf && repCpfPriority < 5) { representanteCpf = firstSocio.cpf; repCpfPriority = 5; }
      if (firstSocio.nome && repNamePriority < 5) { representanteNome = firstSocio.nome; repNamePriority = 5; }
    }
  }
}`}</CodeBlock>

      <H2 num="3.2">Os 11 Steps em Sequência</H2>

      <Pipeline steps={[
        { id: 'Step 0', name: 'cafPostCaptureAnalysis', duration: '3-8s', blocking: false, desc: 'Análise pós-captura completa: OCR síncrono (extrai nome, CPF, RG, nascimento, mãe, expedição, órgão emissor) + análise assíncrona (documentscopy, document_liveness, deepfake_detection, official_biometrics, private_faceset, shared_faceset, face_authentication, face_liveness). Roda APENAS se docCompleted=true OU cafCompleted=true.', source: 'autoEnrichOnboarding.js linhas 150-166' },
        { id: 'Step 0.5', name: 'cafCheckProfile', duration: '1-3s', blocking: false, desc: 'Verifica histórico cross-merchant CAF. Para PJ: usa representanteCpf (se identificado) E o CNPJ. Detecta se a pessoa já abriu conta em outro cliente CAF.', source: 'autoEnrichOnboarding.js linhas 168-195' },
        { id: 'Step 1', name: 'bdcEnrichCase (FONTE ÚNICA Score V4)', duration: '2-5s (cache hit) ou 30-90s (full)', blocking: 'sim quando lotes CRITICAL falham (HTTP 202)', desc: 'Consulta entre 22 e 39 datasets BDC em 7 lotes paralelos. Calcula Score V4 (3 camadas: base segmento + 13 dimensões + enriquecimento). Verifica 10 bloqueios B01-B10. Persiste em ComplianceScore + OnboardingCase. Se subfaixa=5 OU lotes críticos falham → BLOQUEIA pipeline e enfileira BdcRetryQueue.', source: 'autoEnrichOnboarding.js linhas 197-271, bdcEnrichCase.js completo' },
        { id: 'Step 1.5', name: 'cafFullEnrichment', duration: 'N/A', blocking: false, desc: '⚠️ DESABILITADO em prod. Flag local cafEnrichEnabled = false. Razão: Core API CAF exige templateId que não temos. KYB/KYC vem 100% do BDC. Para reativar: setar variável + configurar templateIds.', source: 'autoEnrichOnboarding.js linhas 336-371' },
        { id: 'Step 1.7', name: 'cafCreditAnalysis', duration: '1-3s', blocking: false, desc: 'Segunda fonte de crédito (cross-validation com BDC credit_risk/credit_score). Para PJ: usa CPF do representante. Cria IntegrationLog com service_type=pj_credit_profile ou pf_credit_profile.', source: 'autoEnrichOnboarding.js linhas 373-399' },
        { id: 'Step 2', name: 'cafScreeningInternacional', duration: '2-4s', blocking: false, desc: 'Screening completo: PEP internacional, sanções (OFAC/UN/EU), Interpol Red Notices. Cruza com BDC kyc/owners_kyc. Hits geram red flags.', source: 'autoEnrichOnboarding.js linhas 401-410' },
        { id: 'Step 2.5', name: 'cafCpfValidation', duration: '1-2s', blocking: false, desc: 'Apenas se cpfToValidate existe (PF ou rep. legal PJ). Cross-check CPF × nome × nascimento × nome da mãe contra base oficial CAF. Detecta divergências.', source: 'autoEnrichOnboarding.js linhas 412-425' },
        { id: 'Step 2.7', name: 'cafVerifaiDocs (loop sobre docs pendentes)', duration: '1-5s/doc', blocking: false, desc: 'Itera DocumentUpload com validationStatus="Pendente" e !documentTypeId.startsWith("caf_"). Para cada: invoca cafVerifaiDocs (analisa autenticidade, legibilidade, manipulação digital). Atualiza validationStatus. Continua mesmo se um doc falhar.', source: 'autoEnrichOnboarding.js linhas 427-453' },
        { id: 'Step 3', name: 'analyzeOnboarding (SENTINEL — RELATOR)', duration: '15-30s', blocking: false, desc: 'IA gemini_3_1_pro executa 4 chamadas paralelas: análise questionário, BDC, CAF, consolidação. Output: narrativa, dimensional, cross-validation, red flags qualitativos. NUNCA muda status — só popula campos do ComplianceScore.', source: 'autoEnrichOnboarding.js linhas 455-464, functions/analyzeOnboarding.js' },
        { id: 'Step 4', name: 'Decisão Determinística (V4 + Veto Biométrico CAF + Safety Net)', duration: '<1s', blocking: false, desc: 'Lê subfaixa V4 → aplica tabela: 1A/1B=Aprovado, 2A=Aprovado c/ Cond. Leves, 2B/3A/3B=Aprovado c/ Cond., 4=Manual, 5=Recusado. Aplica VETO BIOMÉTRICO CAF (subfaixas 1A/1B/2A exigem 2 sinais; demais 1 sinal). Safety Net: Recusado sem bloqueio + sem fraude → Manual. Atualiza OnboardingCase, ComplianceScore, Merchant.', source: 'autoEnrichOnboarding.js linhas 466-673 (a parte mais densa)' },
        { id: 'Step 5', name: 'Slack Notification', duration: '<1s', blocking: false, desc: 'Envia mensagem formatada ao canal #compliance via slackbot connector. Inclui empresa, CNPJ, score V4, subfaixa com emoji, decisão, rolling reserve, top 4 red flags, link direto para dossiê em /CadastroDetalhe.', source: 'autoEnrichOnboarding.js linhas 675-712' },
      ]} />

      <H2 num="3.3">Step 1 BDC — Lógica de Skip Inteligente (3 caminhos)</H2>

      <P>O Step 1 tem lógica complexa para evitar re-consumo de créditos BDC. 3 caminhos possíveis:</P>

      <H3 num="3.3.1">Caminho A — BDC já completo, NENHUMA queue pendente</H3>
      <CodeBlock language="js">{`// linhas 213-220
if (onboardingCase.bigDataCorpCompleted === true && onboardingCase.riskScoreV4 != null) {
  const queues = await base44.asServiceRole.entities.BdcRetryQueue.filter({ onboarding_case_id: caseId });
  if (queues.length === 0) {
    // Estado residual de run antigo (clean via bulkReprocessCompliance)
    console.log('[AutoEnrich] Step 1: No BdcRetryQueue found — treating as fresh run, BDC will re-execute');
    shouldSkipBdc = false;
  }`}</CodeBlock>
      <P><B>Decisão:</B> Re-executar BDC. Razão: estado residual após bulk reprocess clean.</P>

      <H3 num="3.3.2">Caminho B — BDC completo, queue existe mas COMPLETOU APÓS último score</H3>
      <CodeBlock language="js">{`// linhas 221-230
const queue = queues[0];
const existingScore = (await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: caseId }))[0];
const queueSuccessAt = queue?.last_success_at ? new Date(queue.last_success_at).getTime() : 0;
const lastScoreAt = existingScore?.data_analise_fase_2 ? new Date(existingScore.data_analise_fase_2).getTime() : 0;
const queueCompletedAfterScore = queueSuccessAt > 0 && queueSuccessAt > lastScoreAt;
if (!queueCompletedAfterScore) shouldSkipBdc = true;
else console.log('[AutoEnrich] Step 1: Re-running BDC — queue completed after last score');`}</CodeBlock>
      <P><B>Decisão:</B> Re-executar BDC. Razão: bdcRetryWorker completou lotes non-critical depois do último cálculo do score — queremos recalcular com TODOS os 13 analyzers populados.</P>

      <H3 num="3.3.3">Caminho C — BDC completo, queue existe E completou ANTES do score</H3>
      <P><B>Decisão:</B> SKIP (shouldSkipBdc = true). Razão: nada novo aconteceu desde o último cálculo. Score atual já reflete todos os dados disponíveis.</P>

      <H3 num="3.3.4">Recovery em caso de erro</H3>
      <CodeBlock language="js">{`// linhas 258-269
} catch (bdcErr) {
  console.error(\`[AutoEnrich] Step 1 ERROR (non-blocking): \${bdcErr.message}\`);
  // v9: Falha NÃO bloqueia mais o pipeline
  const [recheckCase] = await base44.asServiceRole.entities.OnboardingCase.filter({ id: caseId });
  if (recheckCase?.bigDataCorpCompleted === true && recheckCase?.riskScoreV4 != null) {
    console.log('[AutoEnrich] Step 1: Recovered — BDC completou por outra rota');
    bdcSuccess = true; bdcSkipped = true;
  }
}`}</CodeBlock>
      <P>Se o invoke do bdcEnrichCase falhar (timeout, 403 chained-call bug), o pipeline RECHECA o estado do caso. Se BDC completou via webhook BDC ou admin manual, o pipeline continua. Senão segue degradado — SENTINEL roda sem dados BDC frescos.</P>

      <H2 num="3.4">Step 4 — Tabela de Decisão Determinística (Microscopia)</H2>

      <H3 num="3.4.1">Maps por Subfaixa</H3>
      <CodeBlock language="js">{`// linhas 494-504
const rollingReserveMap = {
  '1A': 0, '1B': 0, '2A': 5, '2B': 10,
  '3A': 15, '3B': 20, '4': 20, '5': 20
};
const monitoringMap = {
  '1A': 'PADRAO',         '1B': 'PADRAO',
  '2A': 'REFORÇADO_LEVE', '2B': 'REFORÇADO',
  '3A': 'INTENSO',        '3B': 'INTENSO_PLUS',
  '4':  'MAXIMO',         '5':  'MAXIMO'
};
const conditionsMap = {
  '2A': ['KYC completo dos merchants em até 60 dias', 'PLD trimestral'],
  '2B': ['KYC completo em 45 dias', 'PLD mensal', 'Monitoramento de chargeback semanal'],
  '3A': ['KYC completo em 30 dias', 'PLD quinzenal', 'Limite de TPV de R$500k/mês', 'Revisão a cada 90 dias'],
  '3B': ['KYC completo em 15 dias', 'PLD semanal', 'Limite de TPV de R$200k/mês', 'Revisão a cada 60 dias', 'Antecipação bloqueada'],
};`}</CodeBlock>

      <H3 num="3.4.2">Tabela de Decisão V4 (sem CAF)</H3>
      <Table headers={['Subfaixa', 'Status', 'iaDecision', 'isAuto']} rows={[
        ['1A', 'Aprovado', 'Aprovado', 'true'],
        ['1B', 'Aprovado', 'Aprovado', 'true'],
        ['2A', 'Aprovado', 'Aprovado com Condições Leves', 'true'],
        ['2B', 'Aprovado', 'Aprovado com Condições', 'true'],
        ['3A', 'Aprovado', 'Aprovado com Condições', 'true'],
        ['3B', 'Aprovado', 'Aprovado com Condições', 'true'],
        ['4',  'Manual',   'Revisão Manual',           'false'],
        ['5',  'Recusado', 'Recusado',                  'true'],
      ]} />

      <H3 num="3.4.3">Veto Biométrico CAF — Classificação Inteligente v8</H3>

      <P>O Step 4 NÃO trata todo CAF REPROVED como fraude. Aplica classificação:</P>

      <Table headers={['Service', 'Tipo', 'Threshold de fraude', 'Zona cinza']} rows={[
        ['deepfake_detection', 'Binary', '— (REPROVED = fraude)', 'N/A'],
        ['liveness', 'Quality-scored', 'score < 40', '40-70'],
        ['face_liveness', 'Quality-scored', 'score < 40', '40-70'],
        ['face_authentication', 'Quality-scored', 'score < 40', '40-70'],
        ['documentscopy', 'Quality-scored', 'score < 30', '30-70'],
        ['document_liveness', 'Quality-scored', 'score < 30', '30-70'],
      ]} />

      <CodeBlock language="js">{`// linhas 540-543
const BINARY_FRAUD_SERVICES = new Set(['deepfake_detection']);
const QUALITY_SCORED_SERVICES = new Set(['liveness', 'face_liveness', 'face_authentication', 'documentscopy', 'document_liveness']);
const FRAUD_SCORE_THRESHOLDS = { liveness: 40, face_liveness: 40, face_authentication: 40, documentscopy: 30, document_liveness: 30 };
const QUALITY_ZONE_MAX = 70;
const LOW_RISK_SUBFAIXAS = new Set(['1A', '1B', '2A']);`}</CodeBlock>

      <H3 num="3.4.4">Hierarquia de Sinais por Subfaixa</H3>
      <CodeBlock language="js">{`// linhas 576-578
const uniqueConfirmedServices = new Set(confirmedFrauds.map(f => f.svc));
const requiredSignals = LOW_RISK_SUBFAIXAS.has(subfaixa) ? 2 : 1;
const cafFraudDetected = uniqueConfirmedServices.size >= requiredSignals;`}</CodeBlock>

      <Note title="Lógica do gate de fraude" kind="rule">
        Para subfaixas <B>1A, 1B, 2A</B> (baixo risco V4): exige <B>2 sinais distintos</B> de fraude CAF para escalar. Filosofia: se V4 está limpo, não escalamos por 1 falha CAF que pode ser ruído.
        <br/>Para demais subfaixas (2B, 3A, 3B): <B>1 sinal basta</B>. Cliente já tem perfil mais arriscado, qualquer fraude CAF confirma.
      </Note>

      <H3 num="3.4.5">Recaptura recomendada (não escalação)</H3>
      <CodeBlock language="js">{`// linha 579
const recaptureRecommended = !cafFraudDetected
  && qualityIssues.length > 0
  && (freshCase.cafRecaptureAttempts || 0) < 2;`}</CodeBlock>
      <P>Quando há <B>quality issues</B> (score em zona cinza) MAS não fraude confirmada E o cliente ainda não tentou 2 recapturas: <C>cafRecaptureRequested = true</C>. Cliente recebe e-mail com novo token CAF. Pipeline NÃO escala.</P>

      <H3 num="3.4.6">Safety Net</H3>
      <CodeBlock language="js">{`// linhas 654-669
const hasObjectiveBlocks = (freshCase.bloqueiosAtivos || []).length > 0;
if (finalDecision === 'Recusado' && !hasObjectiveBlocks && !cafFraudDetected) {
  console.warn('[AutoEnrich] SAFETY NET: "Recusado" without V4 blocks or CAF fraud → downgrading to "Revisão Manual".');
  finalDecision = 'Revisão Manual';
  finalStatus = 'Manual';
  autoDecisionApplied = false;
  await base44.asServiceRole.entities.OnboardingCase.update(caseId, {
    status: 'Manual', iaDecision: 'Revisão Manual',
    escalationSource: 'SAFETY_NET',
    escalationReason: 'Rebaixamento automático: decisão "Recusado" sem bloqueio V4 nem fraude CAF confirmada. Casos assim devem passar por análise humana.',
  });
}`}</CodeBlock>
      <P>O Safety Net é a <B>última barreira de segurança</B>. Filosofia explícita: <em>"na dúvida, mande para humano — nunca recuse sem certeza"</em>.</P>

      <H2 num="3.5">Merge de Red Flags Unificados</H2>
      <CodeBlock language="js">{`// linhas 605-609
const v4RedFlags = (freshCase.redFlags || []).map(f =>
  f.startsWith('V4:') || f.startsWith('SENTINEL:') || f.startsWith('CAF:')
    ? f : \`V4: \${f}\`
);
const sentinelRedFlags = (latestScore?.sentinel_red_flags || []).map(f =>
  f.startsWith('SENTINEL:') ? f : \`SENTINEL: \${f}\`
);
const cafFlags = cafFraudDetected
  ? ['CAF: Fraude biométrica/documental detectada — liveness ou documentoscopia reprovada']
  : [];
const mergedRedFlags = [...new Set([...v4RedFlags, ...sentinelRedFlags, ...cafFlags])];`}</CodeBlock>

      <P>Red flags são <B>prefixados pela origem</B> e <B>deduplicados via Set</B>. Persistidos em <C>OnboardingCase.redFlags[]</C> como fonte unificada para o dossiê.</P>

      <H2 num="3.6">Atualizações Persistidas no Step 4</H2>

      <Endpoint
        method="UPDATE"
        path="OnboardingCase.{caseId}"
        auth="asServiceRole"
        description="Update final do Step 4. Persiste decisão completa unificada."
        params={[
          { name: 'status', type: 'enum', required: true, desc: '"Aprovado" | "Manual" | "Recusado"' },
          { name: 'iaDecision', type: 'string', required: true, desc: 'Texto humano da decisão' },
          { name: 'iaExplanation', type: 'string', required: false, desc: 'Sumário do SENTINEL (read-only)' },
          { name: 'rollingReservePercent', type: 'number', required: true, desc: '0-20 conforme rollingReserveMap' },
          { name: 'monitoramentoNivel', type: 'enum', required: true, desc: 'PADRAO|REFORÇADO_LEVE|REFORÇADO|INTENSO|INTENSO_PLUS|MAXIMO' },
          { name: 'condicoesAutomaticas', type: 'string[]', required: false, desc: 'Lista de conditionsMap[subfaixa]' },
          { name: 'redFlags', type: 'string[]', required: false, desc: 'mergedRedFlags com prefixos' },
          { name: 'validationsCompleted', type: 'boolean', required: true, desc: 'true marca pipeline finalizado' },
          { name: 'finalDecisionDate', type: 'datetime', required: true, desc: 'now ISO' },
          { name: 'escalationSource', type: 'enum', required: true, desc: 'NONE|V4_BLOCK|V4_SUBFAIXA_4|CAF_FRAUD|CAF_QUALITY|SAFETY_NET' },
          { name: 'escalationReason', type: 'string', required: false, desc: 'Texto explicativo da escalação' },
          { name: 'cafRecaptureRequested', type: 'boolean', required: false, desc: 'Apenas se recaptureRecommended' },
          { name: 'cafRecaptureReason', type: 'string', required: false, desc: 'Quality issues concatenadas' },
          { name: 'cafRecaptureRequestedAt', type: 'datetime', required: false, desc: 'now ISO' },
        ]}
        source="autoEnrichOnboarding.js linhas 612-630"
      />

      <Endpoint
        method="UPDATE"
        path="ComplianceScore.{latestScore.id}"
        auth="asServiceRole"
        description="Atualiza score com decisão final e overrides do SENTINEL (sempre false em v7)."
        params={[
          { name: 'decisao_automatica', type: 'boolean', required: true, desc: 'autoDecisionApplied' },
          { name: 'rolling_reserve_percent', type: 'number', required: true, desc: 'Mesmo do OnboardingCase' },
          { name: 'monitoramento_nivel', type: 'enum', required: true, desc: 'Mesmo do OnboardingCase' },
          { name: 'condicoes_automaticas', type: 'string[]', required: false, desc: 'conditionsMap[subfaixa]' },
          { name: 'recomendacao_final', type: 'string', required: true, desc: 'finalDecision' },
          { name: 'red_flags', type: 'string[]', required: false, desc: 'mergedRedFlags' },
          { name: 'decisao_escalada_sentinel', type: 'boolean', required: true, desc: 'SEMPRE FALSE em v7 (SENTINEL nunca escala)' },
        ]}
        source="autoEnrichOnboarding.js linhas 633-643"
      />

      <Endpoint
        method="UPDATE"
        path="Merchant.{merchantId}"
        auth="asServiceRole"
        description="Atualiza visão consolidada do merchant."
        params={[
          { name: 'onboardingStatus', type: 'enum', required: true, desc: 'Aprovado|Manual|Recusado' },
          { name: 'riskScore', type: 'number', required: true, desc: 'Math.round(v4Score / 10) — escala 0-85 para legacy UI' },
        ]}
        source="autoEnrichOnboarding.js linhas 646-651"
      />

      <H2 num="3.7">Step 5 — Slack: Formato Exato da Mensagem</H2>

      <CodeBlock language="js">{`// linhas 690-708
const slackMessage = [
  \`\${emoji} *Pipeline de Compliance v7.0 — DATA-FIRST*\`,
  \`\`,
  \`*Empresa:* \${notifyMerchant?.fullName || 'N/D'} (\${notifyMerchant?.cpfCnpj || 'N/D'})\`,
  \`*Score V4:* \${notifyCase?.riskScoreV4 ?? 'N/D'}/849 \${sfEmoji} Subfaixa \${notifyCase?.subfaixa || 'N/D'} — \${notifyCase?.subfaixaNome || ''}\`,
  \`*Decisão:* \${notifyCase?.iaDecision || notifyCase?.status || 'N/D'}\${autoDecisionApplied ? ' ⚡ AUTOMÁTICA (determinística)' : ' 🔍 Manual (subfaixa 4+)'}\`,
  notifyCase?.rollingReservePercent > 0 ? \`*Rolling Reserve:* \${notifyCase.rollingReservePercent}%\` : '',
  notifyCase?.monitoramentoNivel ? \`*Monitoramento:* \${notifyCase.monitoramentoNivel.replace(/_/g, ' ')}\` : '',
  topRedFlags.length > 0 ? \`\\n🚩 *Red Flags V4/CAF (\${notifyCase.redFlags.length} total):*\\n\${topRedFlags.map(f => \`  • \${f}\`).join('\\n')}\` : '',
  \`\`,
  \`📊 <https://app.base44.com/CadastroDetalhe?id=\${notifyMerchant?.id}|Ver Dossiê Completo>\`,
].filter(Boolean).join('\\n');`}</CodeBlock>

      <Table dense headers={['Status', 'Emoji']} rows={[
        ['Aprovado', '✅'], ['Manual', '⚠️'], ['Recusado', '🚫'], ['Em Processamento', '⏳']
      ]} />
      <Table dense headers={['Subfaixa', 'Emoji']} rows={[
        ['1A', '🟢'], ['1B', '🟢'], ['2A', '🔵'], ['2B', '🔵'], ['3A', '🟡'], ['3B', '🟠'], ['4', '🔴'], ['5', '⛔']
      ]} />

      <P>Top 4 red flags são incluídos via <C>(notifyCase?.redFlags || []).slice(0, 4)</C>. Restante fica omitido — analista vê todos no dossiê.</P>

      <Source files={[
        'functions/autoEnrichOnboarding.js (731 linhas)',
        'functions/bdcEnrichCase.js (1172 linhas)',
        'functions/cafPostCaptureAnalysis.js',
        'functions/cafCheckProfile.js',
        'functions/cafCreditAnalysis.js',
        'functions/cafScreeningInternacional.js',
        'functions/cafCpfValidation.js',
        'functions/cafVerifaiDocs.js',
        'functions/analyzeOnboarding.js',
      ]} />
    </Sec>
  );
}