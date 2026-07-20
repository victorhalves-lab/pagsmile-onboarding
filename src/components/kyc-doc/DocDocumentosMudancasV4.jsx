import React from 'react';
import { H2, H3, P, Bold, Table, InfoBox } from './DocHelpers';

/**
 * Subseção 4.3 — Mudanças nos documentos por segmento V4
 * Extraída literalmente de QuestionnaireTemplate.requiredDocuments[]
 * dos templates ativos em produção.
 */
export default function DocDocumentosMudancasV4({ templates = [] }) {
  const groups = classifyTemplatesByGroup(templates);

  return (
    <div>
      <H2>4.3. Mudanças nos Documentos por Segmento V4 — Estado Atual (fonte: banco)</H2>
      <P>Esta subseção documenta exatamente quais documentos cada template V4 exige, lidos diretamente de <code>QuestionnaireTemplate.requiredDocuments[]</code> no banco de produção. É a fonte da verdade operacional: quando o cliente abre o link e chega à fase de upload, são esses documentos que aparecem.</P>

      <InfoBox title="Os 6 documentos base universais (Cartão V4)">
        <p>Todos os 11 templates V4 de <strong>Cartão</strong> compartilham o mesmo conjunto base obrigatório: (1) RG/CNH Representante Legal Frente, (2) RG/CNH Representante Legal Verso, (3) Selfie segurando o documento, (4) Contrato Social/Estatuto, (5) Comprovante de Endereço da Empresa, (6) Comprovante de Titularidade Bancária. Em cima desse "kit base" cada segmento adiciona documentos próprios.</p>
      </InfoBox>

      <H3>4.3.1. Cartão — Documentos adicionais por segmento (além do kit base)</H3>
      <Table
        headers={['Segmento (model)', 'Documentos específicos adicionados ao kit base']}
        rows={groups.cartao.map(t => [
          <code key={`m-${t.id}`}>{t.model}</code>,
          formatExtraDocs(t, BASE_CARTAO),
        ])}
      />

      <H3>4.3.2. PIX — Documentos por template</H3>
      <Table
        headers={['Template (model)', 'Documentos obrigatórios']}
        rows={groups.pix.map(t => [
          <code key={`p-${t.id}`}>{t.model}</code>,
          formatAllDocs(t),
        ])}
      />

      <H3>4.3.3. Subsellers — Documentos</H3>
      <Table
        headers={['Template (model)', 'Tipo', 'Documentos base + condicionais']}
        rows={groups.subseller.map(t => [
          <code key={`s-${t.id}`}>{t.model}</code>,
          t.merchantType,
          formatAllDocs(t),
        ])}
      />

      <InfoBox title="Documento condicional — padrão de comportamento">
        <p>Documentos com <code>conditionalLogic</code> preenchido só aparecem quando uma pergunta anterior do questionário bate a condição. Exemplo real: no template <code>subseller_pf</code>, o documento <em>"Comprovante de Renda últimos 3 meses"</em> só é pedido se a resposta a <code>renda_mensal</code> estiver em <em>["R$ 10.001 a R$ 30.000", "R$ 30.001 a R$ 100.000", "Acima de R$ 100.000"]</em>. Rendas abaixo de R$ 10k não disparam o pedido — conforme Circ. BCB 3.978/2020 Art. 15, I, "e".</p>
      </InfoBox>

      <H3>4.3.4. Documentos com integração CAF SDK</H3>
      <P>Cada tipo de documento pode declarar um <code>cafSdk</code> associado. Quando presente, o upload não é arquivo livre — é o SDK da CAF que captura com guias e validação em tempo real. Documentos <strong>sem</strong> <code>cafSdk</code> usam upload nativo (<code>&lt;input type="file"&gt;</code>).</P>
      <Table headers={['cafSdk', 'Significado operacional']} rows={[
        ['DocumentDetector', 'Captura assistida (front/back) com OCR em tempo real. RG e CNH.'],
        ['FaceLiveness', 'Selfie + vídeo de prova de vida + comparação facial com documento já uploadado.'],
        ['SelfieWithDocument', 'Selfie estática com documento ao lado do rosto.'],
        ['(vazio)', 'Upload nativo sem fluxo CAF — contrato social, comprovante endereço, balanço.'],
      ]} />
    </div>
  );
}

const BASE_CARTAO = new Set([
  'doc_base_rg_cnh_frente',
  'doc_base_rg_cnh_verso',
  'doc_selfie_segurando_documento',
  'doc_base_contrato_social',
  'doc_base_comprovante_endereco',
  'doc_base_titularidade_bancaria',
]);

function classifyTemplatesByGroup(templates) {
  const CARTAO = new Set([
    'ComplianceGatewayV4','ComplianceMarketplaceV4','CompliancePlataformaVerticalV4',
    'ComplianceEcommerceV4','ComplianceSaaSV4','ComplianceInfoprodutosV4',
    'ComplianceDropshippingV4','ComplianceEducacaoV4',
    'ComplianceMerchantLinkV4','ComplianceMPEV4',
  ]);
  const PIX = new Set([
    'CompliancePixIntermediarioV4','pix_intermediario_v4',
    'CompliancePixMerchantV4','pix_api_enterprise',
  ]);
  const SUB = new Set(['subseller_v2','subseller_pf','subseller']);

  const out = { cartao: [], pix: [], subseller: [] };
  for (const t of templates) {
    if (CARTAO.has(t.model)) out.cartao.push(t);
    else if (PIX.has(t.model)) out.pix.push(t);
    else if (SUB.has(t.model)) out.subseller.push(t);
  }
  return out;
}

function formatExtraDocs(template, baseSet) {
  const docs = (template.requiredDocuments || []).filter(d => !baseSet.has(d.documentTypeId));
  if (docs.length === 0) {
    return <span className="text-[#1a1a1a]/50 italic text-[11px]">Apenas os 6 documentos base.</span>;
  }
  return (
    <ul className="list-disc ml-4 space-y-0.5">
      {docs.map((d, i) => (
        <li key={i} className="text-[11px]">
          <Bold>{d.label || d.documentTypeId}</Bold>
          {d.conditionalLogic && <span className="text-amber-700 text-[10px] ml-1">(condicional)</span>}
          {d.required === false && <span className="text-[#1a1a1a]/50 text-[10px] ml-1">(opcional)</span>}
        </li>
      ))}
    </ul>
  );
}

function formatAllDocs(template) {
  const docs = template.requiredDocuments || [];
  if (docs.length === 0) {
    return <span className="text-[#1a1a1a]/50 italic text-[11px]">Sem documentos (apenas questionário).</span>;
  }
  return (
    <ul className="list-disc ml-4 space-y-0.5">
      {docs.map((d, i) => (
        <li key={i} className="text-[11px]">
          <Bold>{d.label || d.documentTypeId}</Bold>
          {d.conditionalLogic && <span className="text-amber-700 text-[10px] ml-1">(condicional)</span>}
          {d.required === false && <span className="text-[#1a1a1a]/50 text-[10px] ml-1">(opcional)</span>}
          {d.cafSdk && <span className="text-[#1356E2] text-[10px] ml-1">[CAF: {d.cafSdk}]</span>}
        </li>
      ))}
    </ul>
  );
}