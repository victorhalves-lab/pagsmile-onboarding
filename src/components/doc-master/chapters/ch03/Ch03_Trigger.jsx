import React from 'react';
import { H2, H3, P, B, C, Table, CodeBlock, Note } from '../../DocPrimitives';

/**
 * §3.1 Trigger e idempotência do pipeline
 */
export default function Ch03_Trigger() {
  return (
    <>
      <H2 num="3.1">Trigger e Idempotência</H2>

      <H3 num="3.1.1">Como o pipeline é disparado</H3>
      <Table headers={['Origem do trigger', 'Quando dispara', 'Quem invoca']} rows={[
        ['Submissão pública do questionário', 'Cliente clica "Finalizar" em ComplianceDinamico ou OnboardingCompletion', 'publicComplianceSubmit / publicOnboardingFinalize → invoke autoEnrichOnboarding'],
        ['Reprocessamento manual (admin)', 'Admin clica "Reprocessar" em AnaliseDeCasos / AnaliseCompleta', 'Frontend → base44.functions.invoke("autoEnrichOnboarding", { onboardingCaseId })'],
        ['Bulk reprocess', 'Admin processa lote em /BulkReprocess', 'bulkReprocessCompliance loop sequencial'],
        ['Webhook CAF (resultado tardio)', 'CAF entrega resultado biométrico async', 'cafWebhookHandler dispara reprocesso quando todos os service_types completam'],
        ['Retry BDC', 'Lotes BDC pendentes voltam', 'bdcRetryWorker (cron) → reentra na pipeline com flag bdcOnly'],
      ]} />

      <H3 num="3.1.2">Argumentos aceitos</H3>
      <CodeBlock language="js">{`// invoke autoEnrichOnboarding
{
  onboardingCaseId: string,    // OBRIGATÓRIO — qual caso processar
  forceReprocess?: boolean,    // ignora idempotência (default: false)
  skipSentinel?: boolean,      // pula análise SENTINEL (Step 7)
  skipCaf?: boolean,           // pula cafFullEnrichment (Step 4)
  bdcOnly?: boolean,           // só re-roda BDC + decisão (chamado pelo retry worker)
  triggerSource?: string,      // string livre para auditoria
}`}</CodeBlock>

      <H3 num="3.1.3">Idempotência (anti-double-processing)</H3>
      <P>Antes de executar qualquer step, o orquestrador faz <B>4 verificações</B>:</P>
      <Table dense headers={['Check', 'Campo lido', 'Comportamento se positivo']} rows={[
        ['Caso já está aprovado/recusado', 'OnboardingCase.status', 'Skip pipeline (a menos que forceReprocess=true)'],
        ['Pipeline rodando agora', 'OnboardingCase.processingLockUntil', 'Aborta com erro 409 PROCESSING_IN_PROGRESS'],
        ['BDC já completo', 'OnboardingCase.bigDataCorpCompleted', 'Skip Step 1 (a menos que forceReprocess)'],
        ['CAF já completo', 'OnboardingCase.cafCompleted', 'Skip Step 4 (a menos que forceReprocess ou skipCaf=false explícito)'],
      ]} />

      <H3 num="3.1.4">Lock concorrente (mutex de pipeline)</H3>
      <CodeBlock language="js">{`// autoEnrichOnboarding — lock por TTL
const lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 min
await base44.entities.OnboardingCase.update(caseId, {
  processingLockUntil: lockUntil.toISOString(),
});
// ... pipeline executa ...
// no finally:
await base44.entities.OnboardingCase.update(caseId, {
  processingLockUntil: null,
});`}</CodeBlock>

      <Note title="Por que 5 minutos?" kind="info">
        Pipeline P95 = 90s, P99 = 3min. TTL de 5min cobre o pior caso e garante que se um deploy reciclar a função no meio do pipeline, o lock <B>expira sozinho</B> em vez de travar o caso para sempre. Não há lock-renewal — pipeline curto bastante.
      </Note>

      <H3 num="3.1.5">Erros estruturados</H3>
      <Table dense headers={['Código', 'Quando', 'HTTP']} rows={[
        ['CASE_NOT_FOUND', 'caseId inválido', '404'],
        ['PROCESSING_IN_PROGRESS', 'Lock ativo de outra invocação', '409'],
        ['ALREADY_FINALIZED', 'Caso já tem decisão final e forceReprocess=false', '409'],
        ['BDC_BLOCKING_FAILURE', 'Lotes CRITICAL falharam — manda para retry queue', '202'],
        ['MERCHANT_NOT_FOUND', 'OnboardingCase.merchantId aponta para Merchant inexistente', '500'],
        ['INTERNAL_ERROR', 'Exceção genérica', '500'],
      ]} />
    </>
  );
}