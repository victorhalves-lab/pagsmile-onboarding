import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox, QuestionTable } from './DocHelpers';

export default function DocSubsellers({ templates, questionsByTemplate }) {
  const subsellerPJ = templates.find(t => t.model === 'subseller_v2');
  const subsellerPF = templates.find(t => t.model === 'subseller_pf');

  return (
    <S>
      <H1>10. Fluxo de Subsellers (PJ e PF) — Perguntas e Documentos Completos</H1>

      <P>O fluxo de subsellers é usado quando um seller principal (marketplace, gateway, plataforma vertical) precisa cadastrar seus sub-merchants. Cada subseller passa por um processo KYC completamente independente, mas o caso fica vinculado ao seller principal. Isso permite que o analista visualize todos os subsellers de um determinado seller em uma aba dedicada ("Subcontas") dentro do painel de análise do seller.</P>

      <H2>10.1. Geração de Links de Onboarding</H2>
      <P>O seller gera links de onboarding tipo <code>SUBSELLER_COMPLIANCE</code> pelo painel administrativo (menu Compliance → Subcontas). Cada link gerado contém: o <code>parentMerchantId</code> (identifica o seller), opções de branding customizado (logo, cores primária e secundária para white-label), código único para rastreamento, e tipo de subseller (PJ ou PF). O link pode ser enviado por e-mail, WhatsApp ou incorporado em um site.</P>

      {subsellerPJ && questionsByTemplate[subsellerPJ.id]?.length > 0 && (
        <>
          <H2>10.2. Subseller PJ (CNPJ) — Questionário Completo</H2>
          <P><strong>Modelo:</strong> {subsellerPJ.model} | <strong>Tipo:</strong> {subsellerPJ.merchantType} | <strong>Total de perguntas:</strong> {questionsByTemplate[subsellerPJ.id].length}</P>
          <P><em>{subsellerPJ.description}</em></P>
          <P>Este questionário é "inteligente" — possui um campo de seleção de segmento que ativa perguntas condicionais específicas para cada sub-segmento (E-commerce, SaaS/Recorrência, Infoprodutos, Dropshipping). A lista completa de TODAS as perguntas é:</P>
          <QuestionTable questions={questionsByTemplate[subsellerPJ.id]} />

          <H3>Documentos Solicitados — Subseller PJ</H3>
          <P><strong>Documentos base (obrigatórios para todos os sub-segmentos):</strong></P>
          <Table headers={['Documento', 'Descrição', 'Formatos', 'Obrigatório']}
            rows={(subsellerPJ.requiredDocuments || []).filter(d => !d.conditionalLogic).map(d => [
              d.label, d.description || '—', (d.allowedFormats || []).join(', '), d.required ? '✅ Sim' : 'Não'
            ])}
          />
          {(subsellerPJ.requiredDocuments || []).filter(d => d.conditionalLogic).length > 0 && (
            <>
              <P><strong>Documentos condicionais por sub-segmento:</strong></P>
              <Table headers={['Documento', 'Descrição', 'Aparece quando segmento =', 'Formatos']}
                rows={(subsellerPJ.requiredDocuments || []).filter(d => d.conditionalLogic).map(d => [
                  d.label, d.description || '—', d.conditionalLogic?.value || '—', (d.allowedFormats || []).join(', ')
                ])}
              />
            </>
          )}
        </>
      )}

      {subsellerPF && questionsByTemplate[subsellerPF.id]?.length > 0 && (
        <>
          <H2>10.3. Subseller PF (CPF) — Questionário Completo</H2>
          <P><strong>Modelo:</strong> {subsellerPF.model} | <strong>Tipo:</strong> {subsellerPF.merchantType} | <strong>Total de perguntas:</strong> {questionsByTemplate[subsellerPF.id].length}</P>
          <P><em>{subsellerPF.description}</em></P>
          <P>A lista completa de TODAS as perguntas do questionário PF:</P>
          <QuestionTable questions={questionsByTemplate[subsellerPF.id]} />

          <H3>Documentos Solicitados — Subseller PF</H3>
          <Table headers={['Documento', 'Descrição', 'Obrigatório']}
            rows={(subsellerPF.requiredDocuments || []).map(d => [
              d.label, d.description || '—', d.required ? '✅ Sim' : 'Não'
            ])}
          />
        </>
      )}

      <H2>10.4. Datasets BDC para Subsellers</H2>
      <P>Os subsellers PJ usam o grupo <code>SUBSELLER_PJ</code> (23 datasets via endpoint /empresas) e os subsellers PF usam o grupo <code>SUBSELLER_PF</code> (23 datasets via endpoint /pessoas). Os datasets PF incluem fontes exclusivas de CPF como SCR Score BCB, KYC Familiar, Renda Presumida, Programas Sociais e Arrecadação Simples/MEI — detalhados na Seção 5.2.</P>
    </S>
  );
}