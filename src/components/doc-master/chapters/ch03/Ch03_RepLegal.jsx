import React from 'react';
import { H2, H3, P, B, C, Table, CodeBlock, Note } from '../../DocPrimitives';

/**
 * §3.2 Identificação do representante legal (P1-P5)
 */
export default function Ch03_RepLegal() {
  return (
    <>
      <H2 num="3.2">Identificação do Representante Legal — Cascata P1→P5</H2>

      <P>Antes de rodar qualquer cross-validation, o pipeline precisa saber <B>quem é a pessoa física</B> que representa legalmente o Merchant. Esta identificação não é trivial — é uma cascata de prioridades porque diferentes funis preenchem dados em pontos diferentes.</P>

      <H3 num="3.2.1">Tabela mestre de prioridades</H3>
      <Table headers={['Prioridade', 'Origem', 'Quando ganha', 'Confiança']} rows={[
        ['P1', 'OnboardingCase.legalRepresentative (manual)', 'Analista preencheu manualmente em revisão', '★★★★★'],
        ['P2', 'QuestionnaireResponse — pergunta "responsável legal" do compliance', 'Cliente respondeu o passo "Responsáveis"', '★★★★'],
        ['P3', 'Step de PF do compliance V4 (subseller/PF)', 'Merchant.type === "PF" → o próprio é o representante', '★★★★'],
        ['P4', 'Lead.questionnaireData["responsavel.cpf"] (lead V5/PIX V4)', 'Lead trouxe dado preenchido na captação', '★★★'],
        ['P5', 'BDC relationships (QSA) — sócio com maior participação', 'Pós-BDC enriquece QSA — fallback automático', '★★'],
      ]} />

      <H3 num="3.2.2">Implementação em código</H3>
      <CodeBlock language="js">{`// autoEnrichOnboarding.js — resolveLegalRepresentative()
async function resolveLegalRepresentative(caseRecord, merchant, qsaData) {
  // P1 — manual
  if (caseRecord.legalRepresentative?.cpf) {
    return { ...caseRecord.legalRepresentative, source: 'P1_MANUAL' };
  }

  // P2 — questionnaire response
  const responses = await base44.entities.QuestionnaireResponse
    .filter({ onboardingCaseId: caseRecord.id });
  const respByQuestionId = Object.fromEntries(responses.map(r => [r.questionId, r]));
  // perguntas "responsavel_legal_cpf", "responsavel_legal_nome" são padrão
  // ... lookup ...

  // P3 — PF é o próprio merchant
  if (merchant.type === 'PF') {
    return {
      cpf: merchant.cpfCnpj,
      name: merchant.fullName,
      dateOfBirth: merchant.dateOfBirth,
      source: 'P3_MERCHANT_PF'
    };
  }

  // P4 — lead questionnaireData
  const lead = caseRecord.leadId ? await base44.entities.Lead.get(caseRecord.leadId) : null;
  if (lead?.questionnaireData?.responsavel?.cpf) {
    return { ...lead.questionnaireData.responsavel, source: 'P4_LEAD' };
  }

  // P5 — QSA (sócio com maior participação)
  if (qsaData?.relationships?.length) {
    const top = [...qsaData.relationships].sort((a,b) => 
      (b.participationPercent || 0) - (a.participationPercent || 0)
    )[0];
    return { cpf: top.cpf, name: top.name, source: 'P5_QSA' };
  }

  return null; // pipeline força status="Manual" com red flag
}`}</CodeBlock>

      <H3 num="3.2.3">Persistência da decisão</H3>
      <P>O resultado da resolução é gravado em <C>OnboardingCase.legalRepresentative</C> com <C>source</C> incluído — para auditoria. Ex:</P>
      <CodeBlock language="json">{`{
  "legalRepresentative": {
    "cpf": "12345678900",
    "name": "João da Silva",
    "dateOfBirth": "1980-05-12",
    "source": "P5_QSA",
    "resolvedAt": "2026-05-10T14:23:11.000Z"
  }
}`}</CodeBlock>

      <Note title="Por que QSA é o ÚLTIMO fallback (P5)" kind="warn">
        QSA da BDC reflete a Receita Federal mas pode estar <B>desatualizada</B> (até 90 dias). Quando o cliente declara responsável diferente do QSA, o cliente ganha (P2 &gt; P5) — e o SENTINEL detecta a divergência como red flag qualitativa <C>"Sócio responsável não está no QSA"</C>. Se nem QSA nem cliente preencheram, o caso vira Manual obrigatório com red flag <C>NO_LEGAL_REP</C>.
      </Note>

      <H3 num="3.2.4">Por que isso importa para o resto do pipeline</H3>
      <Table dense headers={['Step que depende', 'Como usa']} rows={[
        ['Step 4 cafFullEnrichment', 'Envia CPF do representante para CAF facematch + liveness + screening internacional'],
        ['Step 5 cafCpfValidation', 'Cross-check Receita do CPF do representante'],
        ['Step 6 cafScreeningInternacional', 'PEP/Sanctions/Interpol contra o CPF/Nome'],
        ['Step 7 SENTINEL', 'Cross-validation: declarado vs QSA do BDC'],
        ['Step 8 score V4 analyzeOwners', '+40pts se representante é PEP'],
      ]} />
    </>
  );
}