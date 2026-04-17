import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, InfoBox, QuestionTable } from './DocHelpers';

// Model name → readable name
const MODEL_NAMES = {
  'ComplianceGatewayV4': 'Gateway / PSP — Cartão (FULL)',
  'ComplianceMarketplaceV4': 'Marketplace — Cartão (FULL)',
  'ComplianceGatewayAutocomplete': 'Gateway Autocomplete — Cartão (FULL)',
  'ComplianceMarketplaceAutocomplete': 'Marketplace Autocomplete — Cartão (FULL)',
  'CompliancePlataformaVerticalV4': 'Plataforma Vertical — Cartão (FULL)',
  'ComplianceEcommerceV4': 'E-commerce — Cartão (STANDARD)',
  'ComplianceSaaSV4': 'SaaS / Recorrência — Cartão (STANDARD)',
  'ComplianceInfoprodutosV4': 'Infoprodutos — Cartão (STANDARD)',
  'ComplianceDropshippingV4': 'Dropshipping — Cartão (STANDARD)',
  'ComplianceEducacaoV4': 'Educação — Cartão (STANDARD)',
  'ComplianceMerchantLinkV4': 'Link de Pagamento — Cartão (STANDARD)',
  'ComplianceMPEV4': 'MPE — Cartão (LITE)',
  'CompliancePixMerchantV4': 'PIX Merchant',
  'pix_merchant_v4': 'PIX Merchant',
  'pix_intermediario_v4': 'PIX Intermediário',
  'subseller_v2': 'Subseller PJ (V2 — Dinâmico por Segmento)',
  'subseller_pf': 'Subseller PF (Pessoa Física)',
  'subseller': 'Subseller PJ (V1 — Legacy)',
};

export default function DocQuestionarios({ templates, questionsByTemplate }) {
  // Sort: main compliance first, then subsellers
  const sorted = [...templates].sort((a, b) => {
    const order = { 'ComplianceGatewayV4': 1, 'ComplianceMarketplaceV4': 2, 'ComplianceEcommerceV4': 3, 'ComplianceSaaSV4': 4, 'ComplianceInfoprodutosV4': 5, 'ComplianceDropshippingV4': 6, 'ComplianceEducacaoV4': 7, 'ComplianceMPEV4': 8, 'ComplianceMerchantLinkV4': 9, 'CompliancePlataformaVerticalV4': 10, 'CompliancePixMerchantV4': 11, 'pix_merchant_v4': 12, 'pix_intermediario_v4': 13, 'subseller_v2': 14, 'subseller_pf': 15, 'subseller': 16 };
    return (order[a.model] || 50) - (order[b.model] || 50);
  });

  return (
    <S>
      <H1>3. Questionários de Compliance — Todas as Perguntas por Modelo</H1>
      
      <P>Abaixo está listada cada pergunta de cada modelo de questionário ativo no sistema. As perguntas são exibidas na ordem exata em que aparecem para o cliente, com todos os seus atributos: tipo de campo, obrigatoriedade, peso de risco, texto de ajuda (que funciona como critério de análise interno), e opções de resposta quando aplicável.</P>

      <InfoBox title="Como interpretar a tabela de perguntas" color="blue">
        <p><strong>Tipo:</strong> Define o formato do campo — "CPF/CNPJ (autocomplete)" significa que ao digitar o número, os dados são preenchidos automaticamente via Receita Federal. "Sim/Não" é uma pergunta booleana. "Seleção única" é um dropdown.</p>
        <p><strong>Peso Risco:</strong> Um multiplicador que indica o quanto essa pergunta contribui para o risk score na Camada 2 do V4. Peso 0 = informativo apenas. Peso 10 = alta relevância para risco.</p>
        <p><strong>Ajuda / Critério de Análise:</strong> Este texto é exibido para o cliente como ajuda, MAS também serve como diretriz interna de compliance — indicando o que deve ser observado naquela resposta e como ela deve ser interpretada pela IA.</p>
      </InfoBox>

      <P>O sistema possui atualmente <strong>{templates.length} modelos de questionário ativos</strong>, totalizando <strong>{Object.values(questionsByTemplate).flat().length} perguntas</strong> no total.</P>

      {sorted.map(template => {
        const questions = questionsByTemplate[template.id] || [];
        if (questions.length === 0) return null;

        const readableName = MODEL_NAMES[template.model] || template.name;
        const conditionalQs = questions.filter(q => q.conditionalLogic);
        const requiredQs = questions.filter(q => q.isRequired);
        const riskQs = questions.filter(q => q.riskWeight > 0);

        return (
          <div key={template.id} className="mt-8 print-avoid-break">
            <H2>Modelo: {readableName}</H2>
            <P>
              <strong>Nome interno:</strong> {template.model} | 
              <strong> Tipo Merchant:</strong> {template.merchantType} | 
              <strong> Total de perguntas:</strong> {questions.length} | 
              <strong> Obrigatórias:</strong> {requiredQs.length} | 
              <strong> Com peso de risco:</strong> {riskQs.length} | 
              <strong> Condicionais:</strong> {conditionalQs.length}
            </P>
            {template.description && <P><em>{template.description}</em></P>}

            <QuestionTable questions={questions} />

            {conditionalQs.length > 0 && (
              <>
                <H3>Perguntas Condicionais deste modelo</H3>
                <P>Estas perguntas só aparecem para o cliente quando uma condição específica é atendida (por exemplo, quando o segmento selecionado é "Dropshipping"):</P>
                <ul className="list-disc ml-6 space-y-1 mb-3">
                  {conditionalQs.map(q => (
                    <Li key={q.id}>
                      <strong>"{q.text}"</strong> — aparece quando a pergunta #{questions.find(x => x.id === q.conditionalLogic.dependsOn)?.order || '?'} 
                      {' '}{q.conditionalLogic.operator === 'equals' ? 'é igual a' : q.conditionalLogic.operator} 
                      {' '}<em>"{q.conditionalLogic.value}"</em>
                    </Li>
                  ))}
                </ul>
              </>
            )}

            {riskQs.length > 0 && (
              <>
                <H3>Perguntas com Peso de Risco</H3>
                <P>Estas perguntas influenciam diretamente o cálculo do Risk Score V4 na Camada 2 (Variáveis Declaradas):</P>
                <ul className="list-disc ml-6 space-y-1 mb-3">
                  {riskQs.map(q => (
                    <Li key={q.id}>
                      <strong>"{q.text}"</strong> — Peso: {q.riskWeight}
                      {q.riskValues && Object.keys(q.riskValues).length > 0 && (
                        <> — Valores: {Object.entries(q.riskValues).map(([k,v]) => `"${k}"=${v}`).join(', ')}</>
                      )}
                    </Li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })}
    </S>
  );
}