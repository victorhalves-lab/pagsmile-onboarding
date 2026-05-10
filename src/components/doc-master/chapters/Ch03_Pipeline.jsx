import React from 'react';
import { Sec, H1, P, B, Source } from '../DocPrimitives';
import Ch03_Trigger from './ch03/Ch03_Trigger';
import Ch03_RepLegal from './ch03/Ch03_RepLegal';
import Ch03_Steps from './ch03/Ch03_Steps';
import Ch03_Decisao from './ch03/Ch03_Decisao';
import Ch03_SafetyNet from './ch03/Ch03_SafetyNet';
import Ch03_Persistencia from './ch03/Ch03_Persistencia';

/**
 * Capítulo 3 — Pipeline autoEnrichOnboarding (microscópico)
 *
 * §3.1 Trigger e idempotência
 * §3.2 Identificação do representante legal (P1-P5)
 * §3.3 Os 11 steps (linha-por-linha)
 * §3.4 Matriz de decisão determinística
 * §3.5 Safety Net (downgrade automático)
 * §3.6 Persistência final + notificações Slack
 */
export default function Ch03_Pipeline() {
  return (
    <Sec id="ch-03">
      <H1 num="03">Pipeline <code>autoEnrichOnboarding</code> — Linha por Linha</H1>

      <P>O <B>autoEnrichOnboarding</B> é a <B>função orquestradora central</B> da plataforma. Toda decisão automática de KYC nasce dela. Este capítulo expõe cada step do pipeline com sua função real, suas dependências, seus thresholds e o que ele persiste no banco. Sem esta função, nenhum caso atinge subfaixa, rolling reserve ou red flags consolidados.</P>

      <Ch03_Trigger />
      <Ch03_RepLegal />
      <Ch03_Steps />
      <Ch03_Decisao />
      <Ch03_SafetyNet />
      <Ch03_Persistencia />

      <Source files={[
        'functions/autoEnrichOnboarding.js (orquestrador principal)',
        'functions/bdcEnrichCase.js (Step 1 — BDC + score V4)',
        'functions/cafFullEnrichment.js (Step 4 — análises CAF assíncronas)',
        'functions/cafPostCaptureAnalysis.js (Step 0 — pós-captura)',
        'functions/cafScreeningInternacional.js (Step 6 — PEP/Sanctions/Interpol)',
        'functions/analyzeOnboarding.js (Step 7 — SENTINEL relator)',
        'functions/notifyComplianceCompleted.js (Slack final)',
        'entities/OnboardingCase.json (status, escalationSource, bloqueiosAtivos)',
        'entities/ComplianceScore.json (recomendacao_final, red_flags unificados)',
      ]} />
    </Sec>
  );
}