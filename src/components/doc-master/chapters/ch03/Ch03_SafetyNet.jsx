import React from 'react';
import { H2, H3, P, B, C, Table, CodeBlock, Note } from '../../DocPrimitives';

/**
 * §3.5 Safety Net — anti-rejeição-frágil
 */
export default function Ch03_SafetyNet() {
  return (
    <>
      <H2 num="3.5">Safety Net (Step 9) — Anti-Rejeição Frágil</H2>

      <P>Existe uma <B>zona cinza</B> em casos cujo <C>score_final</C> está perto da fronteira 750 (limite Recusado/Manual). Por design conservador, o Safety Net <B>downgrada</B> recusas frágeis para Revisão Manual, evitando que casos limítrofes recebam reprovação automática quando há ambiguidade.</P>

      <H3 num="3.5.1">Critérios de "fragilidade"</H3>
      <P>Decisão "Recusado" é considerada <B>FRÁGIL</B> se TODAS as condições abaixo são verdadeiras:</P>
      <Table headers={['Critério', 'Razão']} rows={[
        ['score_final entre 750 e 799', 'Janela mínima da subfaixa 5 — diferença pequena para Manual'],
        ['Nenhum bloqueio CRÍTICO ativo (B01/B02/B03/B04/B07/B08/B09)', 'Vetos regulatórios são "duros" — não devem ser revertidos'],
        ['Nenhum veto CAF FRAUD', 'Fraude biométrica é evidência forte — não desmonta'],
        ['Não é reprocessamento manual com forceReprocess', 'Admin que pediu reprocesso quer ver decisão "limpa"'],
      ]} />

      <H3 num="3.5.2">O que o Safety Net faz</H3>
      <CodeBlock language="js">{`// autoEnrichOnboarding.js → applySafetyNet
function applySafetyNet(decision, { score, blocks, cafVeto, isManualReprocess }) {
  if (decision.status !== 'Recusado') return decision;          // só atua em Recusado
  if (score < 750 || score >= 800) return decision;             // só na zona 750-799
  
  const CRITICAL_BLOCKS = ['B01','B02','B03','B04','B07','B08','B09'];
  if (blocks.some(b => CRITICAL_BLOCKS.includes(b))) return decision;
  if (cafVeto === 'FRAUD') return decision;
  if (isManualReprocess) return decision;

  // FRÁGIL — downgrade para Manual
  return {
    status: 'Manual',
    recomendacao_final: 'Revisão Manual',
    subfaixa: '4',
    rollingReservePercent: 20,
    monitoramentoNivel: 'MAXIMO',
    escalationSource: 'SAFETY_NET',
    safetyNetTriggered: true,        // flag para auditoria
    safetyNetReason: 'score 750-799 sem bloqueios críticos nem CAF FRAUD'
  };
}`}</CodeBlock>

      <H3 num="3.5.3">Persistência do trigger</H3>
      <P>Quando Safety Net atua, persistimos:</P>
      <Table dense headers={['Campo', 'Valor', 'Onde']} rows={[
        ['escalationSource', '"SAFETY_NET"', 'OnboardingCase'],
        ['escalationReason', '"Score 765 sem bloqueios — escalado para análise humana"', 'OnboardingCase'],
        ['decisao_automatica', 'false', 'ComplianceScore'],
        ['red_flags', '+= "SAFETY_NET: Decisão limítrofe escalada"', 'ComplianceScore'],
      ]} />

      <H3 num="3.5.4">Visibilidade na UI</H3>
      <Table dense headers={['Página', 'O que mostra']} rows={[
        ['EscalationsReview', 'Lista filtrada por escalationSource="SAFETY_NET" — fila prioritária para revisão'],
        ['AnaliseCompleta', 'Banner amarelo "⚠ Caso escalado pelo Safety Net" no topo do dossiê'],
        ['Slack notification', 'Cor amarela em vez de vermelha; destaca "Safety Net atuou"'],
      ]} />

      <Note title="Por que NÃO existe Safety Net inverso" kind="warn">
        Não há mecanismo automático que <B>downgrade</B> aprovação para revisão manual fora da matriz. Princípio: a matriz determinística decidiu aprovar com base em score &amp; bloqueios &amp; veto biométrico — promover para Manual sem evidência adicional só geraria fila desnecessária. SENTINEL <B>pode</B> escalar via override (Cap. 7), mas o Safety Net é exclusivo de Recusado→Manual.
      </Note>

      <Note title="Métrica histórica" kind="info">
        Em produção, ~7% das decisões "Recusado" são interceptadas pelo Safety Net. Após revisão humana, ~60% acabam aprovadas com condições — confirmando que a janela 750-799 é genuinamente ambígua.
      </Note>
    </>
  );
}