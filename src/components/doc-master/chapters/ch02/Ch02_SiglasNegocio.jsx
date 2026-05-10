import React from 'react';
import { H2, H3, B, Table, Note } from '../../DocPrimitives';

export default function Ch02_SiglasNegocio() {
  return (
    <>
      <H2 num="2.1">Siglas de Negócio (Compliance e Pagamentos)</H2>

      <H3 num="2.1.1">Compliance e Regulação</H3>
      <Table headers={['Sigla', 'Significado', 'Onde aparece']} rows={[
        ['KYC', 'Know Your Customer — verificar cliente antes de transacionar', 'OnboardingCase, ComplianceScore, /Compliance*'],
        ['KYB', 'Know Your Business — variante PJ: QSA, capital, atividade, sócios', 'bdcEnrichCase analyzeOwners, cafKybSearch'],
        ['UBO', 'Ultimate Beneficial Owner — beneficiário final >25%', 'Step 4 ComplianceDinamico, BDCQSAPanel'],
        ['PEP', 'Politically Exposed Person — cargo público últimos 5 anos', 'BDC kyc.IsPEP, cafScreeningInternacional, +40pts em sócio PEP'],
        ['PLD-FT', 'Prevenção Lavagem Dinheiro + Financ. Terrorismo (Lei 9.613, Circ. BCB 3.978/2020)', 'Steps 8/9/10 ComplianceDinamico, dimensões 8-10 V4'],
        ['CAF', 'Combate à Fraude — provedor exclusivo biometria + documentoscopia', 'Cap. 6, ~25 cafXxx functions'],
        ['BDC', 'BigDataCorp — provedor exclusivo bureau (PJ /empresas, PF /pessoas)', 'Cap. 5, ~15 bdcXxx functions'],
        ['BCB', 'Banco Central do Brasil — regulador IPs', '5 anos retenção logs, 2FA admin'],
        ['BCB Res. 119/2021', 'Segregação de funções e governança IP', 'AccessProfile granular, 2FA admin (Cap. 10)'],
        ['Lei 9.613/1998', 'Lei brasileira PLD', '5 anos retenção AccessAudit/AuditLog/TwoFactorAudit'],
        ['LGPD', 'Lei 13.709/2018 — proteção de dados', 'isPrivate=true em DocumentUpload, signed URLs TTL 5min, ip_hash'],
        ['COAF', 'Conselho Controle Atividades Financeiras', 'BDC kyc — listas COAF'],
        ['CEIS', 'Cadastro Empresas Inidôneas e Suspensas (CGU)', 'BDC kyc.Sanctions'],
        ['CNEP', 'Cadastro Nacional Empresas Punidas (CGU)', 'BDC kyc.Sanctions'],
        ['SCR', 'Sistema Informações de Crédito (BCB)', 'BDC scr_positive_score 0-1000'],
        ['PGFN', 'Procuradoria Fazenda Nacional — dívida ativa', 'BDC government_debtors → B06 se >R$500k'],
        ['ESG', 'Environmental Social Governance', 'BDC esg_and_compliance → B08/B09 (trabalho escravo / IBAMA)'],
      ]} />

      <H3 num="2.1.2">Pagamentos e Modelos Comerciais</H3>
      <Table headers={['Sigla', 'Significado', 'Uso']} rows={[
        ['MCC', 'Merchant Category Code (ISO 18245) — segmento estabelecimento', 'Lead.mcc, partnerCost, BDC merchant_category_data'],
        ['CNAE', 'Classificação Nacional Atividades Econômicas', 'BDC basic_data.MainEconomicActivity. HIGH_RISK_CNAES analyzeIdentity'],
        ['MDR', 'Merchant Discount Rate — taxa cartão por transação', 'Proposal.rates.cartao.{bandeira}.{avista|de2a6x|...}'],
        ['TPV', 'Total Payment Volume — volume mensal/anual', 'Lead.tpvMensal, profitabilityDetails.tpvBase'],
        ['Ticket médio', 'TPV ÷ número de transações', 'Lead.ticketMedio, transacoesMes'],
        ['RAV', 'Recebíveis Antecipados Voluntários', 'Proposal.rates.rav { taxa, prazo: "D+30" }'],
        ['Antifraude', 'Análise risco transacional (não-PLD)', 'Proposal.rates.antifraude (R$/tx)'],
        ['3DS', '3-D Secure — auth adicional do portador', 'Proposal.rates.taxa3ds (R$/tx 3DS)'],
        ['Forex', 'Taxa cambial', 'Proposal.rates.forex (%)'],
        ['Setup', 'Valor fixo único de implantação', 'Proposal.rates.setup'],
        ['Rolling Reserve', 'Reserva % TPV retida contra chargeback', 'OnboardingCase.rollingReservePercent (0-20%), por subfaixa V4'],
        ['Mínimo Garantido', 'Receita mensal mínima contratual', 'Proposal.rates.minimoGarantido { mes1, mes2, mes3 }'],
        ['Subseller', 'Sub-merchant vinculado a Merchant principal', 'Merchant.isSubseller, parentMerchantId'],
        ['MEI', 'Microempreendedor Individual (R$ 81k/ano em 2026)', 'Cross-check BDC simples_nacional vs TPV declarado'],
        ['QSA', 'Quadro Sócios e Administradores (Receita Federal)', 'BDC relationships — fonte P5 representante legal'],
      ]} />

      <H3 num="2.1.3">Atores Internos</H3>
      <Table headers={['Termo', 'Descrição', 'Persistência']} rows={[
        ['Merchant', 'Cliente final PagSmile (PJ/PF)', 'Entity Merchant'],
        ['Lead', 'Pré-comercial (questionário preenchido, sem contrato)', 'Entity Lead + sourceFlow'],
        ['Introducer', 'Parceiro indicação via landing page white-label', 'Entity Introducer + /parceiro/:slug'],
        ['CompliancePartner', 'Bureau externo via portal restrito', 'CompliancePartner + Users + PartnerAssignment'],
        ['Analista', 'Funcionário PagSmile que executa revisão manual', 'User role=admin + AccessProfile compliance-*'],
        ['Vendedor', 'Funcionário comercial (prospect → contrato)', 'User role=admin + AccessProfile comercial-*'],
        ['SENTINEL', 'Agente IA RELATOR (não-decisor) — narrativa qualitativa', 'agents/sentinel.json + analyzeOnboarding.js (Cap. 7)'],
        ['PRISCILA', 'Agente IA específico análise inicial leads', 'analyzePriscila.js (Cap. 8)'],
        ['HELENA', 'Antigo agente pré-V4 (legacy)', 'entity HelenaAnalysis legacy'],
      ]} />

      <Note title="Convenção de busca" kind="info">
        Siglas em <B>UPPERCASE</B> (KYC, BDC, CAF). Conceitos em <B>camelCase</B> (rollingReserve, leadQualifier). Entidades antigas: <B>snake_case</B> (onboarding_case_id). Novas: <B>camelCase</B> (onboardingCaseId).
      </Note>
    </>
  );
}