import React from 'react';
import { H2, H3, P, B, C, Table, CodeBlock, Note } from '../../DocPrimitives';

/**
 * §3.6 Persistência final + notificações Slack
 */
export default function Ch03_Persistencia() {
  return (
    <>
      <H2 num="3.6">Persistência Final + Notificação Slack (Step 10)</H2>

      <H3 num="3.6.1">Atualizações de banco — ordem e atomicidade</H3>
      <P>Step 10 atualiza <B>4 entidades</B> em sequência, com try/catch isolado por entidade para não bloquear notificação:</P>
      <Table headers={['Ordem', 'Entidade', 'Campos atualizados']} rows={[
        ['1', 'OnboardingCase', 'status, subfaixa, subfaixaNome, rollingReservePercent, monitoramentoNivel, condicoesAutomaticas, bloqueiosAtivos, redFlags, escalationSource, escalationReason, finalDecisionDate, validationsCompleted=true, processingLockUntil=null'],
        ['2', 'ComplianceScore', 'recomendacao_final, score_final, subfaixa, monitoramento_nivel, condicoes_automaticas, red_flags (V4 + SENTINEL: + CAF: prefixados), variaveis_aplicadas, fase_3_completa=true, data_analise_fase_3'],
        ['3', 'Merchant', 'onboardingStatus, riskScore (legado 0-100 derivado da subfaixa)'],
        ['4', 'Lead (se existe)', 'status (kyc_aprovado | kyc_revisao_manual | perdido), lastInteractionDate'],
      ]} />

      <H3 num="3.6.2">Mapeamento subfaixa → riskScore legado</H3>
      <P>Sistemas legados (dashboards CEO, antigos relatórios) ainda consomem <C>riskScore 0-100</C>. Mantemos cálculo derivado:</P>
      <CodeBlock language="js">{`// autoEnrichOnboarding.js — legacy bridge
const subfaixaToLegacyScore = {
  '1A': 95, '1B': 85, '2A': 75, '2B': 65,
  '3A': 55, '3B': 45, '4': 25, '5': 10
};
await base44.entities.Merchant.update(merchant.id, {
  riskScore: subfaixaToLegacyScore[subfaixa] || 50,
  onboardingStatus: mapStatusForMerchant(decision.status)
});`}</CodeBlock>

      <H3 num="3.6.3">Notificação Slack — formato Block Kit</H3>
      <P>Após persistência, dispara <C>notifyComplianceCompleted</C> que usa o connector autorizado <B>slackbot</B> com escopos <C>chat:write</C>, <C>chat:write.public</C>, <C>channels:read</C>. Canal alvo: <C>SLACK_COMPLIANCE_CHANNEL</C> (secret).</P>

      <CodeBlock language="json">{`{
  "channel": "C0XXXXX",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "🟢 Caso Aprovado — Empresa XYZ" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Subfaixa:* 2A (AZUL CLARO)" },
        { "type": "mrkdwn", "text": "*Score:* 245 / 849" },
        { "type": "mrkdwn", "text": "*Rolling Reserve:* 2%" },
        { "type": "mrkdwn", "text": "*Monitoramento:* REFORÇADO_LEVE" }
      ]
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*Top Red Flags:*\\n• CAPITAL_BAIXO\\n• HIGH_RISK_CNAE\\n• SENTINEL: Site não responde" }
    },
    {
      "type": "actions",
      "elements": [
        { "type": "button", "text": { "type": "plain_text", "text": "Abrir dossiê" }, "url": "https://app.../AnaliseCompleta?id=..." }
      ]
    }
  ]
}`}</CodeBlock>

      <H3 num="3.6.4">Códigos de cor por decisão</H3>
      <Table dense headers={['Decisão', 'Emoji', 'Cor visual Slack']} rows={[
        ['Aprovado', '🟢', 'Verde — atachment color #1356E2'],
        ['Aprovado com Condições', '🟡', 'Amarelo — #f4b400'],
        ['Manual', '🔵', 'Azul — #3b82f6'],
        ['Manual (Safety Net)', '🟠', 'Laranja — #f97316 (destaque visual diferenciado)'],
        ['Recusado', '🔴', 'Vermelho — #ef4444'],
      ]} />

      <H3 num="3.6.5">Falhas e retentativa</H3>
      <Table dense headers={['Falha', 'Comportamento']} rows={[
        ['DB update OnboardingCase falha', 'PIPELINE FALHA — aborta e marca processingLockUntil=null. Status fica como estava (não corrompe)'],
        ['DB update Merchant falha', 'Apenas warn no log — não rollback. Caso fica decidido, Merchant fica com status legacy stale (rate-limited fix em próximo run)'],
        ['Slack falha (4xx/5xx)', 'Apenas warn — decisão é a fonte da verdade. Não há retry para evitar duplicação de notificação'],
      ]} />

      <Note title="Idempotência da notificação Slack" kind="info">
        Slack <B>NÃO</B> tem idempotência key. Se um caso for reprocessado manualmente (forceReprocess=true), nova notificação é enviada — analista pode receber 2 alertas para o mesmo caso. Por design: queremos avisar quando decisão muda, e o canal mostra timeline temporal correta. Para silenciar reprocessamento, use <C>triggerSource="silent_reprocess"</C> que <C>notifyComplianceCompleted</C> respeita.
      </Note>

      <H3 num="3.6.6">O que NÃO acontece em Step 10</H3>
      <Table dense headers={['Não-evento', 'Razão']} rows={[
        ['Email para o cliente', 'Disparado por automation entity-update separada (notifyMerchantDecision) — desacoplado do pipeline para permitir batching'],
        ['Geração de contrato', 'Manual — vendedor inicia em /CriarContrato após análise de aprovação'],
        ['Habilitação de processamento real', 'Sistema externo Pin Bank (fora do scope desta plataforma) consome via API'],
      ]} />
    </>
  );
}