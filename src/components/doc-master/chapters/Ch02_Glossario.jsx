import React from 'react';
import { Sec, H1, P, B, Source } from '../DocPrimitives';
import Ch02_SiglasNegocio from './ch02/Ch02_SiglasNegocio';
import Ch02_TermosTecnicos from './ch02/Ch02_TermosTecnicos';
import Ch02_StatusEnums from './ch02/Ch02_StatusEnums';
import Ch02_RedFlags from './ch02/Ch02_RedFlags';
import Ch02_ServiceTypes from './ch02/Ch02_ServiceTypes';
import Ch02_Subfaixas from './ch02/Ch02_Subfaixas';
import Ch02_Bloqueios from './ch02/Ch02_Bloqueios';

/**
 * Capítulo 2 — Glossário Técnico Microscópico
 * Catálogo exaustivo: siglas, termos, enums, red flags, service_types, subfaixas, bloqueios.
 */
export default function Ch02_Glossario() {
  return (
    <Sec id="ch-02">
      <H1 num="02">Glossário Técnico — Termos, Siglas, Enums, Constantes</H1>
      <P>Este capítulo é o <B>dicionário operacional da plataforma</B>. Cada sigla, enum e constante referenciados em outros capítulos têm definição autoritária aqui — com fonte e código real.</P>
      <Ch02_SiglasNegocio />
      <Ch02_TermosTecnicos />
      <Ch02_StatusEnums />
      <Ch02_RedFlags />
      <Ch02_ServiceTypes />
      <Ch02_Subfaixas />
      <Ch02_Bloqueios />
      <Source files={[
        'entities/OnboardingCase.json',
        'entities/ComplianceScore.json',
        'entities/IntegrationLog.json',
        'entities/Lead.json, Proposal.json, Contract.json',
        'entities/AccessAudit.json, TwoFactorAudit.json',
        'functions/bdcEnrichCase.js (B01-B10)',
        'functions/autoEnrichOnboarding.js (rollingReserveMap, FRAUD_SCORE_THRESHOLDS)',
      ]} />
    </Sec>
  );
}