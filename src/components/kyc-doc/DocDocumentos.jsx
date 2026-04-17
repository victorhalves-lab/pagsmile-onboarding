import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocDocumentos({ templates }) {
  // Separate base docs from conditional docs
  const allDocs = [];
  const seenBase = new Set();
  const conditionalBySegment = {};

  templates.forEach(t => {
    (t.requiredDocuments || []).forEach(doc => {
      if (doc.conditionalLogic) {
        const seg = doc.conditionalLogic.value || 'Todos';
        if (!conditionalBySegment[seg]) conditionalBySegment[seg] = [];
        conditionalBySegment[seg].push({ ...doc, templateModel: t.model, templateName: t.name });
      } else {
        const key = doc.documentTypeId || doc.label;
        if (!seenBase.has(key + '_' + t.model)) {
          seenBase.add(key + '_' + t.model);
          allDocs.push({ ...doc, templateModel: t.model, templateName: t.name });
        }
      }
    });
  });

  // Group base docs by template
  const docsByTemplate = {};
  allDocs.forEach(d => {
    const key = d.templateModel;
    if (!docsByTemplate[key]) docsByTemplate[key] = { name: d.templateName, model: d.templateModel, docs: [] };
    docsByTemplate[key].docs.push(d);
  });

  return (
    <S>
      <H1>4. Documentos Solicitados — Base e por Segmento</H1>

      <P>Os documentos são divididos em dois grupos: <strong>documentos base</strong> (obrigatórios para todos os clientes de um determinado modelo de questionário) e <strong>documentos condicionais</strong> (solicitados apenas quando o cliente pertence a um sub-segmento específico, como Dropshipping ou Infoprodutos).</P>

      <H2>4.1. Documentos Base por Modelo de Questionário</H2>
      <P>Cada modelo de questionário define seu próprio conjunto de documentos base. Abaixo está a lista completa de cada documento, com sua descrição, formatos aceitos e tamanho máximo:</P>

      {Object.values(docsByTemplate).map(group => (
        <div key={group.model} className="mt-4 print-avoid-break">
          <H3>Modelo: {group.name} ({group.model})</H3>
          <Table
            headers={['Documento', 'Descrição Detalhada', 'Formatos', 'Tamanho Máx.', 'Obrigatório', 'Usa SDK CAF']}
            rows={group.docs.map(d => [
              d.label || d.name || d.documentTypeId,
              d.description || '—',
              (d.allowedFormats || []).join(', ') || 'Qualquer',
              d.maxSizeMB ? `${d.maxSizeMB} MB` : '10 MB',
              d.required ? '✅ Sim' : 'Não',
              d.cafSdk ? `✅ ${d.cafSdk}` : 'Não',
            ])}
          />
        </div>
      ))}

      {Object.keys(conditionalBySegment).length > 0 && (
        <>
          <H2>4.2. Documentos Condicionais por Sub-Segmento</H2>
          <P>Estes documentos só são solicitados quando o cliente seleciona um sub-segmento específico no questionário. Eles são fundamentais para validar que o negócio é real e opera conforme declarado.</P>

          {Object.entries(conditionalBySegment).map(([segment, docs]) => (
            <div key={segment} className="mt-4 print-avoid-break">
              <H3>Sub-segmento: {segment}</H3>
              <P>Quando o cliente informa que seu segmento é "{segment}", os seguintes documentos adicionais passam a ser obrigatórios:</P>
              <Table
                headers={['Documento', 'Descrição Detalhada', 'Por que é pedido', 'Formatos']}
                rows={docs.map(d => [
                  d.label || d.name,
                  d.description || '—',
                  getDocReason(d.documentTypeId, segment),
                  (d.allowedFormats || []).join(', ') || 'Qualquer',
                ])}
              />
            </div>
          ))}
        </>
      )}

      <InfoBox title="Verificação Automática de Documentos (VerifAI)" color="purple">
        <p>Após o upload, cada documento pendente é automaticamente analisado pela IA da CAF (serviço VerifAI Docs) que verifica: autenticidade, legibilidade, conformidade com o tipo esperado, e sinais de adulteração digital. O resultado é registrado no <code>IntegrationLog</code> com status APPROVED ou PENDING_REVIEW.</p>
      </InfoBox>
    </S>
  );
}

function getDocReason(docTypeId, segment) {
  const reasons = {
    doc_dropshipping_rastreamento: 'Comprova que o modelo de dropshipping está operacional com entregas reais rastreáveis. Sem rastreamento = alto risco de fraude.',
    doc_dropshipping_loja_oferta: 'Comprova existência de uma vitrine digital ativa com produtos listados e preços visíveis.',
    doc_dropshipping_politica_reembolso: 'Obrigatório por lei (CDC). Política visível ao consumidor reduz chargebacks e demonstra maturidade operacional.',
    doc_infoprodutos_entrega: 'Comprova que o produto digital é entregue de fato ao comprador (área de membros, e-mail de acesso, link de download).',
    doc_infoprodutos_pagina_vendas: 'Comprova que o produto é comercializado publicamente com informações claras sobre o que está sendo vendido.',
    doc_infoprodutos_politica_garantia: 'Demonstra existência de política de reembolso/garantia publicada, reduzindo risco de chargeback.',
    doc_ecommerce_loja_online: 'Comprova existência da loja virtual com produtos reais, preços e informações de contato.',
    doc_ecommerce_comprovante_envio: 'Comprova que a empresa efetivamente envia mercadorias — não é apenas uma fachada.',
    doc_ecommerce_nota_fiscal: 'Comprova que a empresa adquire mercadorias legalmente via nota fiscal, não opera com contrabando.',
    doc_saas_painel_dashboard: 'Comprova que a plataforma SaaS existe e está operacional, com gestão real de assinantes/clientes.',
    doc_saas_termos_uso: 'Comprova que o serviço tem termos de uso publicados, cumprindo requisitos legais de transparência.',
    doc_saas_comprovante_entrega: 'Comprova como o cliente final acessa o serviço contratado e como as assinaturas são gerenciadas.',
  };
  return reasons[docTypeId] || 'Documento de verificação específica do segmento.';
}