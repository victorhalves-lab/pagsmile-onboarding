import React from 'react';
import { H2, H3, P, B, C, Table, CodeBlock, Note } from '../../DocPrimitives';

/**
 * §3.4 Matriz de decisão determinística
 */
export default function Ch03_Decisao() {
  return (
    <>
      <H2 num="3.4">Matriz de Decisão Determinística (Step 8)</H2>

      <P>Toda decisão automática nasce desta matriz. Ela combina <B>3 inputs</B> e produz <B>5 outputs</B>. Determinística = mesma entrada sempre dá mesma saída — sem aleatoriedade, sem IA decisória.</P>

      <H3 num="3.4.1">Inputs</H3>
      <Table dense headers={['Input', 'Origem', 'Faixa']} rows={[
        ['score_final V4', 'Step 1 — bdcEnrichCase', '0-849 (maior=pior)'],
        ['bloqueios_ativos', 'Step 1 — analyzeBlocks', 'Array B01-B10'],
        ['caf_biometric_veto', 'Step 4 + Step 8 evaluação', 'NONE | FRAUD | QUALITY'],
      ]} />

      <H3 num="3.4.2">Outputs</H3>
      <Table dense headers={['Output', 'Tipo', 'Persistido em']} rows={[
        ['status', 'enum (Aprovado | Manual | Recusado)', 'OnboardingCase.status'],
        ['recomendacao_final', 'enum 4 valores', 'ComplianceScore.recomendacao_final'],
        ['subfaixa', 'enum 1A | 1B | 2A | 2B | 3A | 3B | 4 | 5', 'OnboardingCase.subfaixa + ComplianceScore.subfaixa'],
        ['rollingReservePercent', '0-20', 'OnboardingCase.rollingReservePercent'],
        ['monitoramentoNivel', 'enum 6 valores', 'OnboardingCase.monitoramentoNivel'],
      ]} />

      <H3 num="3.4.3">Tabela de decisão completa</H3>
      <Table headers={['Condição (em ordem de avaliação)', 'Subfaixa', 'Status', 'Reserve', 'Monitoramento', 'escalationSource']} rows={[
        ['Bloqueio CRÍTICO ativo (B01/B02/B03/B04/B07/B08/B09)', '5', 'Recusado', '—', '—', 'V4_BLOCK'],
        ['CAF veto FRAUD (score &lt;50 OU deepfake hit)', '5', 'Recusado', '—', '—', 'CAF_FRAUD'],
        ['Bloqueio MÉDIO ativo (B05/B06/B10)', '4', 'Manual', '20%', 'MAXIMO', 'V4_BLOCK'],
        ['CAF veto QUALITY (score 50-65) OU recapture &gt;= 2 falhas', '4', 'Manual', '20%', 'MAXIMO', 'CAF_QUALITY'],
        ['score &gt;= 750 (sem bloqueios, sem CAF veto)', '5', 'Recusado', '—', '—', 'V4_SUBFAIXA_5'],
        ['score 600-749', '4', 'Manual', '20%', 'MAXIMO', 'V4_SUBFAIXA_4'],
        ['score 500-599', '3B', 'Aprovado com Condições', '15%', 'INTENSO_PLUS', 'NONE'],
        ['score 400-499', '3A', 'Aprovado com Condições', '10%', 'INTENSO', 'NONE'],
        ['score 300-399', '2B', 'Aprovado com Condições', '5%', 'REFORÇADO', 'NONE'],
        ['score 200-299', '2A', 'Aprovado', '2%', 'REFORÇADO_LEVE', 'NONE'],
        ['score 100-199', '1B', 'Aprovado', '0%', 'PADRÃO', 'NONE'],
        ['score 0-99', '1A', 'Aprovado', '0%', 'PADRÃO', 'NONE'],
      ]} />

      <H3 num="3.4.4">Implementação (resumida)</H3>
      <CodeBlock language="js">{`// autoEnrichOnboarding.js — applyDecisionMatrix
function applyDecisionMatrix({ score, blocks, cafVeto }) {
  const CRITICAL = ['B01','B02','B03','B04','B07','B08','B09'];
  const MEDIUM = ['B05','B06','B10'];

  // 1. Vetos imediatos
  if (blocks.some(b => CRITICAL.includes(b))) {
    return decision('5', 'Recusado', 0, null, 'V4_BLOCK');
  }
  if (cafVeto === 'FRAUD') {
    return decision('5', 'Recusado', 0, null, 'CAF_FRAUD');
  }

  // 2. Escalações obrigatórias (Subfaixa 4)
  if (blocks.some(b => MEDIUM.includes(b))) {
    return decision('4', 'Manual', 20, 'MAXIMO', 'V4_BLOCK');
  }
  if (cafVeto === 'QUALITY') {
    return decision('4', 'Manual', 20, 'MAXIMO', 'CAF_QUALITY');
  }

  // 3. Faixas de score puras
  if (score >= 750) return decision('5', 'Recusado', 0, null, 'V4_SUBFAIXA_5');
  if (score >= 600) return decision('4', 'Manual', 20, 'MAXIMO', 'V4_SUBFAIXA_4');
  if (score >= 500) return decision('3B','Aprovado com Condições', 15, 'INTENSO_PLUS', 'NONE');
  if (score >= 400) return decision('3A','Aprovado com Condições', 10, 'INTENSO', 'NONE');
  if (score >= 300) return decision('2B','Aprovado com Condições', 5,  'REFORCADO', 'NONE');
  if (score >= 200) return decision('2A','Aprovado', 2,  'REFORCADO_LEVE', 'NONE');
  if (score >= 100) return decision('1B','Aprovado', 0,  'PADRAO', 'NONE');
  return                    decision('1A','Aprovado', 0,  'PADRAO', 'NONE');
}`}</CodeBlock>

      <H3 num="3.4.5">Como o veto biométrico CAF é classificado</H3>
      <Table dense headers={['Sinal CAF', 'Threshold', 'Veto']} rows={[
        ['face_liveness.score', '&lt; 50', 'FRAUD'],
        ['face_liveness.score', '50–65', 'QUALITY'],
        ['facematch.similarity', '&lt; 50%', 'FRAUD'],
        ['facematch.similarity', '50–70%', 'QUALITY'],
        ['deepfake_detection.probability', '&gt; 0.8', 'FRAUD'],
        ['document_detector.status', 'REPROVED', 'QUALITY'],
        ['cafVerifaiDocs tampering', 'true', 'FRAUD'],
      ]} />

      <Note title="Princípio: SENTINEL não decide" kind="warn">
        Esta matriz é <B>100% determinística</B>. SENTINEL (Cap. 7) gera narrativa qualitativa mas <B>não tem voto</B> aqui. O único caminho de SENTINEL alterar decisão é via <B>escalation</B> (subir Aprovado→Manual) — nunca rebaixar. Isso garante que: (a) decisões são reproduzíveis; (b) auditoria regulatória pode reconstruir cada caso a partir dos inputs; (c) nenhum drift de modelo IA pode mover linha de aprovação.
      </Note>
    </>
  );
}