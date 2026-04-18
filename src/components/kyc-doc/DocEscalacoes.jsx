import React from 'react';
import { S, H1, H2, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocEscalacoes() {
  return (
    <S>
      <H1>15. Escalações Questionáveis — Monitoramento de Qualidade da Decisão</H1>

      <P>A arquitetura Data-First v7 promete que a decisão é 100% determinística (V4 + veto CAF). Mas existem caminhos pelos quais um caso de baixo risco (subfaixa 1A, 1B, 2A, 2B, 3A, 3B) pode acabar em "Revisão Manual" — e esses caminhos precisam ser auditados continuamente para garantir que não estão escalando casos desnecessariamente. A tela <strong>Escalações Questionáveis</strong> (<code>/EscalationsReview</code>) é a ferramenta de governança que o time de compliance usa para monitorar a qualidade das regras de escalação.</P>

      <H2>15.1. O que é uma "Escalação Questionável"</H2>
      <P>Uma escalação é considerada questionável quando:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>O caso está com <code>status = "Manual"</code>, e</Li>
        <Li>A subfaixa V4 calculada é de baixo ou médio risco (<strong>1A, 1B, 2A, 2B, 3A, 3B</strong>).</Li>
      </ul>
      <P>Casos legítimos em Manual são os da subfaixa 4 (601-700) e alguns da 5 (quando CAF detectou fraude). Tudo abaixo de subfaixa 4 em Manual é um sinal para investigar por que escalou.</P>

      <H2>15.2. Campos de Rastreabilidade no OnboardingCase</H2>
      <P>Quando um caso é escalado, o sistema grava a justificativa técnica em dois campos da entidade <code>OnboardingCase</code>:</P>

      <Table headers={['Campo', 'Tipo', 'O que registra']} rows={[
        ['escalationSource', 'enum', 'Classificação técnica da origem da escalação. Valores possíveis: V4_BLOCK, V4_SUBFAIXA_4, CAF_FRAUD, CAF_QUALITY, SAFETY_NET, NONE.'],
        ['escalationReason', 'texto', 'Motivo legível em linguagem natural (ex: "CAF liveness REPROVED score 58; recapture falhou" ou "Safety Net acionado: score 720 sem bloqueios ativos").'],
      ]} />

      <H2>15.3. Taxonomia Completa de Origens</H2>
      <Table headers={['escalationSource', 'Legitimidade', 'O que significa', 'Ação recomendada se aparecer muito']} rows={[
        ['V4_BLOCK', '✅ Legítimo', 'Bloqueio V4 (B01-B10) ativado. Subfaixa real = 5, mas sistema configurou Manual por estar em lista de revisão humana prévia ao bloqueio automático. Raríssimo.', 'Nenhuma — é o comportamento esperado.'],
        ['V4_SUBFAIXA_4', '✅ Legítimo', 'Subfaixa 4 (601-700) — regra Data-First v7 define Manual para essa faixa.', 'Nenhuma — é o comportamento esperado. Não aparece na tela de escalações questionáveis.'],
        ['CAF_FRAUD', '✅ Legítimo', 'CAF detectou fraude biométrica CONFIRMADA (liveness REPROVED, deepfake DETECTED, documentoscopia REPROVED). Veto biométrico ativo.', 'Nenhuma — é a única exceção prevista pela arquitetura Data-First.'],
        ['CAF_QUALITY', '⚠️ Revisar', 'CAF rejeitou a captura por qualidade insuficiente (selfie borrada, score liveness baixo mas não zero, iluminação ruim). NÃO é fraude confirmada — é captura ruim.', 'Se > 30% das escalações são CAF_QUALITY, revisar: (a) thresholds de liveness, (b) instruções do cliente durante captura, (c) políticas de recaptura automática (cafRecaptureRequested/cafRecaptureAttempts).'],
        ['SAFETY_NET', '⚠️ Revisar', 'Safety Net acionado: decisão seria "Recusado" mas não há bloqueio V4 ativo nem fraude CAF confirmada. Sistema rebaixou para Manual por cautela ("na dúvida, mande para humano").', 'Se > 10% das escalações são SAFETY_NET, revisar a distribuição de pontos nas dimensões V4 — pode haver acúmulo de pontos menores causando score > 700 sem justificativa.'],
        ['NONE', '🔴 Investigar', 'Caso legado escalado antes da taxonomia existir, ou bug no pipeline (não registrou a origem).', 'Se aparecer em casos recentes, investigar logs do orquestrador autoEnrichOnboarding.'],
      ]} />

      <H2>15.4. Dashboard de Escalações Questionáveis</H2>
      <P>A tela <code>/EscalationsReview</code> apresenta:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>4 KPIs topo:</Bold> Total escalado (baseline), Por qualidade CAF (falsos positivos prováveis), Por fraude CAF confirmada (escalações legítimas), Sem motivo técnico (casos legados).</Li>
        <Li><Bold>Distribuição por Subfaixa:</Bold> Grid 6 colunas mostrando quantos casos de cada subfaixa (1A até 3B) foram escalados e o percentual do total.</Li>
        <Li><Bold>Lista detalhada:</Bold> Cada caso com badge da subfaixa, badge da origem (colorido por severidade), flag "Recaptura solicitada" quando aplicável, razão técnica em texto, score V4 exato e data da decisão. Clique abre o dossiê completo em <code>/CadastroDetalhe</code>.</Li>
      </ul>

      <H2>15.5. Fluxo de Recaptura Automática (CAF)</H2>
      <P>Quando a CAF retorna qualidade baixa (não fraude), o sistema oferece uma segunda chance ao cliente antes de escalar:</P>
      <ol className="list-decimal ml-6 space-y-1.5 mb-4">
        <Li>Pipeline detecta score de liveness &lt; threshold mínimo (ex: 70) mas &gt; threshold de fraude (ex: 30).</Li>
        <Li>Sistema grava <code>cafRecaptureRequested = true</code>, <code>cafRecaptureReason</code> (ex: "liveness com score 58 — selfie pouco nítida") e <code>cafRecaptureRequestedAt</code>.</Li>
        <Li>E-mail é enviado ao cliente com link de recaptura (novo token CAF gerado).</Li>
        <Li>Cliente faz nova captura. <code>cafRecaptureAttempts</code> é incrementado.</Li>
        <Li>Se nova captura passar, pipeline continua normalmente. Se falhar novamente (ou cliente não retornar em 48h), caso escala com <code>escalationSource = CAF_QUALITY</code>.</Li>
      </ol>

      <InfoBox title="Governança: por que monitorar escalações?" color="green">
        <p>Escalações desnecessárias têm dois custos: <strong>(1) carga operacional</strong> — cada caso manual consome 15-30 minutos de um analista sênior; <strong>(2) fricção com o cliente</strong> — o onboarding que deveria ser instantâneo vira 24-48h de espera. A meta é manter escalações CAF_QUALITY &lt; 5% do total, escalações SAFETY_NET &lt; 2% e escalações NONE = 0. Revisão semanal desta tela faz parte do ritual de governança do time.</p>
      </InfoBox>
    </S>
  );
}