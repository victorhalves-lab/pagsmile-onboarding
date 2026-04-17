import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocScoring() {
  return (
    <S>
      <H1>7. Framework de Risk Scoring V4.0 — Fórmula Completa</H1>

      <P>O Risk Score V4 é o núcleo de toda a decisão de compliance. Ele é um modelo 100% determinístico (sem aleatoriedade, sem IA — pura matemática) que transforma os dados brutos da BDC em um número de 0 a 849, onde 0 é o melhor resultado possível e 849 é o pior. Este número determina automaticamente a subfaixa (1A até 5) que por sua vez determina a decisão final.</P>

      <H2>7.1. Camada 1 — Score Base por Segmento</H2>
      <P>Cada segmento de negócio tem um score base que reflete o risco inerente daquela atividade. O score base é o ponto de partida — antes de qualquer dado da BDC ser analisado, a empresa já "carrega" esses pontos apenas por ser do segmento que é. Isso existe porque, estatisticamente, gateways de pagamento têm mais incidência de fraude do que escolas de educação.</P>
      <Table headers={['Segmento', 'Score Base', 'Justificativa do valor']} rows={[
        ['Gateway / PSP', '175', 'Risco máximo — intermediário de pagamentos pode mascarar atividades ilícitas de terceiros. Score base alto exige dados muito limpos para aprovar.'],
        ['PIX Intermediário', '155', 'Segundo maior risco — intermediários PIX podem ser usados para lavagem via transações fracionadas instantâneas.'],
        ['Marketplace', '140', 'Alto risco — presença de sub-merchants não verificados individualmente pelo marketplace.'],
        ['Plataformas Verticais', '120', 'Risco moderado-alto — opera em nichos que podem ser regulados (saúde, educação, finanças).'],
        ['Dropshipping', '110', 'Risco elevado — produto não está em posse do vendedor, alta taxa de chargeback por não entrega.'],
        ['Infoprodutos', '90', 'Risco médio — produto intangível com alta taxa de reembolso e arrependimento.'],
        ['E-commerce', '80', 'Risco médio padrão — loja virtual com estoque próprio, modelo de negócio bem estabelecido.'],
        ['SaaS / Recorrência', '70', 'Risco médio-baixo — receita recorrente previsível reduz volatilidade.'],
        ['PIX Merchant', '65', 'Risco moderado — recebe PIX direto, sem intermediação de terceiros.'],
        ['Link de Pagamento', '60', 'Risco médio-baixo — emissão de links avulsos para cobrança pontual.'],
        ['Educação', '50', 'Baixo risco — setor regulado pelo MEC com baixa incidência de fraude.'],
        ['Subseller PJ', '45', 'Baixo risco — subconta vinculada e monitorada por seller principal.'],
        ['MPE', '35', 'Menor risco — micro/pequenas empresas com volume baixo e análise simplificada.'],
        ['Subseller PF', '30', 'Menor risco base — pessoa física como subconta com análise focada em CPF.'],
      ]} />

      <H2>7.2. Camada 2 — Variáveis por Dimensão (13 dimensões × pesos percentuais)</H2>
      <P>Após definir o score base, cada dataset da BDC alimenta uma das 13 dimensões de análise. Cada dimensão tem um peso percentual que determina o quanto ela influencia o score final. O score bruto de cada dimensão (soma dos pontos de todos os itens daquela dimensão) é multiplicado pelo seu peso percentual. Depois, todos os scores ponderados são somados.</P>
      <P>Concretamente: se a dimensão "Compliance" tem score bruto de 80 e peso de 20%, ela contribui com 80 × 0.20 = 16 pontos para o score final. Se a dimensão "Assets" tem score -15 (positivo, reduz risco) e peso 2%, ela contribui com -15 × 0.02 = -0.3 pontos.</P>

      <Table headers={['Dimensão', 'Peso %', 'Datasets que alimentam', 'O que está dentro — cada item com sua pontuação']} rows={[
        ['Compliance', '20%', 'kyc, government_debtors, processes, lawsuits_distribution, collections, financial_market', 'Sanção empresa: +80. PEP empresa: +40. Dívida ativa > R$500k: +80 (bloqueio B06). Dívida R$100k-500k: +40. Dívida < R$100k: +20. Processo criminal: +50. > 20 processos: +25. 1-20 processos: +10. Negativação: +30. Registro BCB/CVM/SUSEP: -20.'],
        ['Owners (QSA)', '18%', 'relationships, configurable_recency_qsa, owners_kyc, economic_group_kyc, owners_lawsuits, owners_lawsuits_distribution, owners_influence, owners_electoral_donors, political_involvement', 'Zero sócios: +15. Sócio PEP: +40. Sanção sócio: +80. Sanção grupo econômico: +60. PEP grupo: +20. Criminal sócio: +50. > 10 processos sócios: +20. 1-10: +10. Divergência QSA: +5. Envolvimento político: +20. Doações > R$100k: +15. Doações < R$100k: +5.'],
        ['Identity', '10%', 'basic_data, registration_data', 'Idade < 1 ano: +25. 1-2 anos: +15. 2-5 anos: +5. Capital < R$1k: +15. R$1k-10k: +5. CNAE alto risco: +30. CNAE secundário alto risco: +15. Situação especial: +10.'],
        ['Credit Risk', '9%', 'credit_risk, credit_score', 'Score < 300: +40. 300-500: +20. 500-700: +5. > 700: -10. Protestos > 5: +20. 1-5: +10. Cheques devolvidos: +15. Falência: +50.'],
        ['Reputation', '8%', 'media_profile_and_exposure, reputations_and_reviews, awards_and_certifications', 'Mídia VERY_NEG: +80. Mídia negativa: +30. Reclame Aqui < 5: +20. 5-7: +10. ≥ 7: -10. Prêmios: -15.'],
        ['Financial', '8%', 'economic_group, economic_group_relationships, merchant_category_data, industrial_property, licenses_and_authorizations', 'Grupo > 20 empresas: +15. Participação circular: +30. Licenças: -5. Patentes: -5. Marcas: -5.'],
        ['Digital', '7%', 'domains, passages, activity_indicators, marketplace_data, online_ads', 'Sem SSL: +15. Domínio < 1 ano: +10. Zero passagens: +30. < 5 passagens: +15. Atividade < 30%: +20. 30-60%: +10. Shell > 80%: Bloqueio B05. Marketplace: -10.'],
        ['Evolution', '6%', 'history_basic_data, company_evolution', 'Queda capital > 50%: +20. Queda empregados > 80%: +15. > 3 alterações recentes: +15. > 2 mudanças CNAE: +10.'],
        ['ESG', '5%', 'esg_and_compliance', 'Lista Suja MTE: +200 + Bloqueio B08. Embargo IBAMA: +40 + Bloqueio B09. Desmatamento: +10.'],
        ['Contacts', '3%', 'phones_extended, emails_extended, addresses_extended, related_people_*', 'Todos e-mails genéricos: +5.'],
        ['Employees KYC', '2%', 'activity_indicators (empregados), basic_data (RAIS)', 'Zero empregados RAIS: +10.'],
        ['Sectorial', '2%', 'merchant_category_data, activity_indicators, marketplace_data, financial_market', 'CNAEs financeiros secundários: +5. > 16 CNAEs: +5. Marketplace: -5. Registro BCB/CVM: -10.'],
        ['Assets', '2%', 'industrial_property, owners_industrial_property, licenses_and_authorizations, awards_and_certifications', 'Propriedade industrial: -5. Licenças: -5. Prêmios: -10. Capital < R$10k: +15. R$10k-50k: +5.'],
      ]} />

      <H2>7.3. Camada 3 — Fórmula Final e Subfaixas</H2>
      <InfoBox title="Fórmula Matemática do Score V4" color="green">
        <p className="font-mono text-sm"><strong>Score Final = max(0, min(849, Score_Base + Σ(Score_Dimensão_i × Peso_Dimensão_i)))</strong></p>
        <p className="mt-2">Onde:</p>
        <p>• Score_Base = valor fixo do segmento (ex: 175 para Gateway)</p>
        <p>• Score_Dimensão_i = soma de todos os pontos positivos e negativos daquela dimensão</p>
        <p>• Peso_Dimensão_i = peso percentual (ex: 0.20 para Compliance)</p>
        <p>• O resultado é limitado ao intervalo [0, 849]</p>
        <p>• Se QUALQUER bloqueio (B01-B10) estiver ativo → Score = 850, Subfaixa = 5</p>
        <p className="mt-2 font-bold">Nota: pontos negativos (ex: marketplace -10, prêmios -15) REDUZEM o score, ou seja, melhoram a avaliação.</p>
      </InfoBox>

      <P>O score final é convertido em uma subfaixa que determina a decisão automática:</P>
      <Table headers={['Subfaixa', 'Faixa de Score', 'Nome da Subfaixa', 'Decisão Automática', 'Rolling Reserve', 'Nível de Monitoramento']} rows={[
        ['1A', '0 — 100', 'VERDE EXPRESS', 'Aprovado automaticamente, sem condições', '0%', 'PADRÃO (PLD trimestral)'],
        ['1B', '101 — 200', 'VERDE', 'Aprovado automaticamente, sem condições', '0%', 'PADRÃO (PLD trimestral)'],
        ['2A', '201 — 300', 'AZUL LEVE', 'Aprovado com condições leves: KYC completo dos merchants em 60 dias + PLD trimestral', '5%', 'REFORÇADO LEVE'],
        ['2B', '301 — 400', 'AZUL', 'Aprovado com condições: KYC em 45 dias + PLD mensal + monitoramento de chargeback semanal', '10%', 'REFORÇADO'],
        ['3A', '401 — 500', 'AMARELO', 'Aprovado com condições rigorosas: KYC em 30 dias + PLD quinzenal + limite TPV R$500k/mês + revisão a cada 90 dias', '15%', 'INTENSO'],
        ['3B', '501 — 600', 'LARANJA', 'Aprovado com condições rigorosas: KYC em 15 dias + PLD semanal + limite TPV R$200k/mês + revisão a cada 60 dias + antecipação bloqueada', '20%', 'INTENSO PLUS'],
        ['4', '601 — 700', 'VERMELHO', 'Revisão Manual — um analista humano deve revisar o dossiê completo antes de qualquer decisão', '20%', 'MÁXIMO'],
        ['5', '701 — 849 (ou 850)', 'BLOQUEIO', 'Recusado automaticamente — existem bloqueios V4 ativos (B01-B10) que impedem qualquer aprovação', '20%', 'MÁXIMO'],
      ]} />
    </S>
  );
}