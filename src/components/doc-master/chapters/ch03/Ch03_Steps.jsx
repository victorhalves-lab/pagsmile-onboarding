import React from 'react';
import { H2, H3, P, B, C, Table, CodeBlock, Note, Pipeline } from '../../DocPrimitives';

/**
 * §3.3 Os 11 steps do pipeline (linha por linha)
 */
export default function Ch03_Steps() {
  const steps = [
    {
      id: 'STEP 0',
      name: 'cafPostCaptureAnalysis (não-bloqueante)',
      duration: '~3s',
      blocking: false,
      source: 'autoEnrichOnboarding.js → cafPostCaptureAnalysis()',
      desc: 'Análise pós-captura: lê eventos cafLogSdkEvent recentes do caso (selfie qualidade, documento qualidade, browser, latency). Gera relatório técnico que NÃO influencia decisão mas alimenta o painel de diagnóstico (cafDiagnoseCase) e o cafReconcileOrphans. Skip silencioso se não houver eventos SDK.'
    },
    {
      id: 'STEP 1',
      name: 'bdcEnrichCase — BIGDATACORP + SCORE V4',
      duration: '~25–60s',
      blocking: 'BLOCKING',
      source: 'bdcEnrichCase.js (Cap. 5)',
      desc: 'Coração do pipeline. Executa em paralelo: lote CRITICAL (basic_data + kyc + relationships) que bloqueia se falhar; lotes IMPORTANT (lawsuits, government_debtors, esg, scr_positive_score) em paralelo; lotes COMPLEMENTARY (addresses, phones, emails, domains, activity_indicators) em paralelo. Computa imediatamente o score V4 final (3 camadas — Cap. 4) + bloqueios B01–B10. Persiste em ComplianceScore. Se lote CRITICAL falhar > N tentativas, enfileira em BdcRetryQueue e retorna HTTP 202.'
    },
    {
      id: 'STEP 2',
      name: 'bdcDeepDueLead (apenas se Lead existe)',
      duration: '~8s',
      blocking: false,
      source: 'bdcDeepDueLead.js',
      desc: 'Análise narrativa adicional do BDC focada em PEP+Sanctions+Processos profundos. Roda em paralelo ao Step 1 quando o caso tem leadId. Atualiza Lead.bdcDueReport e Lead.bdcFlags.'
    },
    {
      id: 'STEP 3',
      name: 'brasilApiCnpj — fallback de cadastro',
      duration: '~1s',
      blocking: false,
      source: 'brasilApiCnpj.js',
      desc: 'Backup gratuito da Receita via brasilapi.com.br. Usado quando BDC basic_data está stale ou ausente. Resultado vai para OnboardingCase.cnpjData e cross-checa com BDC; divergências viram red flag BDC_DESATUALIZADO.'
    },
    {
      id: 'STEP 4',
      name: 'cafFullEnrichment — 8 análises CAF em paralelo',
      duration: '~12–40s',
      blocking: false,
      source: 'cafFullEnrichment.js (Cap. 6)',
      desc: 'Dispara em paralelo: face_liveness, facematch, document_detector_front, document_detector_back, document_ocr, deepfake_detection, official_biometrics, document_liveness. Cada análise gera um IntegrationLog. NÃO bloqueia o pipeline — resultados negativos viram red flags CAF: prefixados em red_flags. Veto biométrico real é avaliado no Step 8 da decisão.'
    },
    {
      id: 'STEP 5',
      name: 'cafCpfValidation + cafKybSearch',
      duration: '~3–6s',
      blocking: false,
      source: 'cafCpfValidation.js / cafKybSearch.js',
      desc: 'Cross-check Receita Federal: CPF do representante legal vs base CAF Receita; CNPJ do Merchant (KYB) — situação cadastral, capital, atividade. Divergências viram red flags. CPF inativo/cancelado força status=Manual no Step 8.'
    },
    {
      id: 'STEP 6',
      name: 'cafScreeningInternacional',
      duration: '~2–4s',
      blocking: false,
      source: 'cafScreeningInternacional.js',
      desc: 'Triplet de listas internacionais: PEP_INTERNATIONAL + SANCTIONS_INTERNATIONAL + WARNINGS_INTERPOL. Hits geram red flag prefixado "CAF: ..." e podem disparar bloqueio B02 no Step 8 (Sanctions hit = recusa imediata).'
    },
    {
      id: 'STEP 7',
      name: 'analyzeOnboarding (SENTINEL — relator)',
      duration: '~10–25s',
      blocking: false,
      source: 'analyzeOnboarding.js (Cap. 7)',
      desc: 'Roda APÓS Steps 1–6 (precisa de BDC + CAF prontos). 4 chamadas InvokeLLM paralelas (gemini_3_1_pro, temp ~0.2): sumário executivo + análise dimensional 7D; cross-validation declarado vs confirmado; red flags qualitativas + perguntas para analista; parecer narrativo final (não-decisório). Skip se skipSentinel=true. Resultado consolidado em ComplianceScore (campos sentinel_*).'
    },
    {
      id: 'STEP 8',
      name: 'Decisão Determinística (matriz V4 + CAF)',
      duration: '<1s',
      blocking: 'BLOCKING',
      source: 'autoEnrichOnboarding.js → applyDecisionMatrix()',
      desc: 'Aplica a matriz determinística (§3.4): consome score_final V4, bloqueios ativos B01-B10 e veto biométrico CAF. Output: { status, recomendacao_final, subfaixa, rollingReservePercent, monitoramentoNivel, escalationSource }. Esta é a ÚNICA função que tem direito de gravar status final.'
    },
    {
      id: 'STEP 9',
      name: 'Safety Net — anti-rejeição-frágil',
      duration: '<1s',
      blocking: false,
      source: 'autoEnrichOnboarding.js → applySafetyNet()',
      desc: 'Avalia se a decisão "Recusado" é frágil (§3.5). Critérios: score_final entre 750–799 + ausência de bloqueios B01-B04/B07-B09 + nenhum veto CAF FRAUD. Se frágil → downgrade para "Manual" com escalationSource="SAFETY_NET". Único caminho que melhora a decisão da matriz.'
    },
    {
      id: 'STEP 10',
      name: 'Persistência final + Slack notify',
      duration: '~1s',
      blocking: 'BLOCKING',
      source: 'notifyComplianceCompleted.js',
      desc: 'Atualiza OnboardingCase e ComplianceScore. Atualiza Merchant.onboardingStatus e Merchant.riskScore. Dispara webhook Slack via slackbot connector com formatação rica: subfaixa, rolling reserve, top-3 red flags, link direto AnaliseDeCasos. Detalhe completo em §3.6.'
    },
  ];

  return (
    <>
      <H2 num="3.3">Os 11 Steps do Pipeline</H2>

      <P>Pipeline é executado <B>sequencialmente</B>, mas alguns steps disparam workers <B>paralelos</B> internamente (Step 4 CAF, Step 1 BDC). Cada step lê do banco, chama provider externo (ou IA), persiste log/resultado e decide se vai bloquear ou só avisar.</P>

      <Pipeline steps={steps} />

      <H3 num="3.3.1">Visualização do diagrama de dependências</H3>
      <CodeBlock language="text">{`Step 0  cafPostCapture   ──┐
Step 1  BDC + V4         ──┼─ paralelo entre si ──┐
Step 2  bdcDeepDueLead   ──┤                       │
Step 3  brasilApiCnpj    ──┤                       ├──▶ Step 4 CAF (paralelo) ─┐
Step 5  cafCpfValidation ──┤                       │                            │
Step 6  cafScreening     ──┘                       │                            │
                                                    └────────────────────────────┴─▶ Step 7 SENTINEL ─▶ Step 8 Decisão ─▶ Step 9 Safety Net ─▶ Step 10 Persiste + Slack`}</CodeBlock>

      <Note title="Step 1 é o gatekeeper" kind="warn">
        Se o lote CRITICAL do BDC falha em todas as tentativas (3 retries com backoff), o pipeline <B>aborta antes do Step 4</B> e enfileira em <C>BdcRetryQueue</C>. O <C>bdcRetryWorker</C> (cron a cada 5min) tenta novamente; quando suceder, dispara <C>autoEnrichOnboarding</C> com <C>bdcOnly=true</C> + <C>forceReprocess=true</C> para retomar.
      </Note>
    </>
  );
}