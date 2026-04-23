import React from 'react';
import { S, H1, H2, P, Table, InfoBox } from './DocHelpers';

export default function DocGlossario() {
  return (
    <S>
      <H1>0. Glossário — Termos Técnicos e Regulatórios</H1>

      <P>Este glossário define, de forma precisa e autocontida, cada sigla e termo técnico usado ao longo do manual. Ele está posicionado na frente do documento para que leitores não-técnicos (executivos, auditores, reguladores) possam consultar a qualquer momento sem ter de inferir o significado pelo contexto.</P>

      <H2>0.1. Siglas Regulatórias e Identificadoras</H2>
      <Table headers={['Sigla', 'Expansão', 'Significado operacional no sistema']} rows={[
        ['KYC', 'Know Your Customer', 'Procedimento de identificação de pessoas físicas (titulares, sócios, representantes legais). Exigido pela Circ. BCB 3.978/2020 Art. 15.'],
        ['KYB', 'Know Your Business', 'Procedimento de identificação de pessoas jurídicas (razão social, CNPJ, QSA, UBO). Exigido pela Circ. BCB 3.978/2020 Art. 16.'],
        ['CDD', 'Customer Due Diligence', 'Diligência padrão aplicada a clientes de risco normal — basic_data, kyc, processes, collections na BDC.'],
        ['EDD', 'Enhanced Due Diligence', 'Diligência reforçada para clientes de alto risco (PEP, sancionados, subfaixas 3A-3B). Inclui owners_kyc, economic_group_kyc, monitoramento reforçado.'],
        ['PEP', 'Pessoa Politicamente Exposta', 'Agente público ou parente de 1º grau. Circ. BCB 3.978/2020 Art. 27-28. Não é impeditivo mas exige EDD.'],
        ['UBO', 'Ultimate Beneficial Owner (Beneficiário Final)', 'Pessoa física que em última instância detém ≥25% da empresa. Exigência Circ. BCB 3.978/2020 Art. 16 + FATF.'],
        ['PLD/FT', 'Prevenção à Lavagem de Dinheiro / Financiamento ao Terrorismo', 'Lei 9.613/1998 + Circ. BCB 3.978/2020. Monitoramento contínuo obrigatório.'],
        ['CNAE', 'Classificação Nacional de Atividades Econômicas', 'Código de 7 dígitos que identifica a atividade da empresa. Alguns CNAEs estão em lista de alto risco no sistema.'],
        ['QSA', 'Quadro de Sócios e Administradores', 'Lista dos sócios/administradores com qualificação e percentual de participação.'],
        ['MCC', 'Merchant Category Code', 'Código de 4 dígitos que identifica o ramo do merchant no sistema de cartões. Cross-validado pela BDC.'],
        ['TPV', 'Total Payment Volume', 'Volume total transacionado pelo merchant — declarado no questionário e validado contra movimentação real.'],
        ['OFAC', 'Office of Foreign Assets Control', 'Órgão dos EUA que mantém a lista SDN (Specially Designated Nationals). Sanções bloqueantes.'],
        ['COAF', 'Conselho de Controle de Atividades Financeiras', 'Unidade de inteligência financeira do Brasil. Recebe comunicação de operações suspeitas.'],
        ['CEIS', 'Cadastro de Empresas Inidôneas e Suspensas', 'Mantido pela CGU. Sanção bloqueante B03.'],
        ['CNEP', 'Cadastro Nacional de Empresas Punidas', 'Mantido pela CGU. Sanção bloqueante B03.'],
        ['MTE', 'Ministério do Trabalho e Emprego', 'Órgão que mantém a "Lista Suja" de trabalho escravo. Bloqueio B08.'],
        ['SCR', 'Sistema de Informações de Crédito', 'Base do Banco Central que consolida operações de crédito acima de R$200. Gold standard para PF.'],
      ]} />

      <H2>0.2. Termos do Framework Interno</H2>
      <Table headers={['Termo', 'Definição precisa']} rows={[
        ['Data-First v7.0', 'Princípio arquitetural vigente desde 2026: decisão baseada EXCLUSIVAMENTE em dados verificados por fontes externas (BDC e CAF), nunca em interpretação subjetiva. SENTINEL é relator, não decisor.'],
        ['Score V4', 'Número de 0 a 850 calculado pela função bdcEnrichCase que sintetiza o risco do cliente. 0 = melhor, 850 = bloqueado. Pivot da decisão.'],
        ['Subfaixa', 'Classificação 1A, 1B, 2A, 2B, 3A, 3B, 4 ou 5 derivada do Score V4. Determina automaticamente a decisão e o nível de monitoramento.'],
        ['Bloqueio V4 (B01-B10)', 'Condição que força o Score V4 para 850 (subfaixa 5, recusado). Exemplos: CNPJ INAPTO (B01), sanção (B03), Shell Company >80% (B05), dívida ativa >R$500k (B06), mídia com fraude (B07), Lista Suja MTE (B08), embargo IBAMA (B09), familiar sancionado PF (B10).'],
        ['Rolling Reserve', 'Percentual retido temporariamente das transações do merchant (0-20%) proporcional à subfaixa. Proteção contra chargeback.'],
        ['Shell Company Score', 'Probabilidade calculada pela BDC (0-100%) de a empresa ser "de fachada" — sem operação real. Combina: zero empregados RAIS + sem domínio + sem passagens web + endereço virtual + capital mínimo + CNAE genérico.'],
        ['Safety Net', 'Trava de segurança no pipeline: se decisão determinística = "Recusado" mas não há bloqueio V4 ativo nem fraude CAF, rebaixa para "Revisão Manual". Filosofia: "na dúvida, mande para humano".'],
        ['Veto Biométrico CAF', 'Única exceção à decisão determinística V4: se a CAF detectar fraude biométrica confirmada (liveness REPROVED, deepfake DETECTED, documentoscopia REPROVED), caso vai para Revisão Manual independentemente do score V4.'],
        ['SENTINEL v7', 'Agente de IA relator que produz o relatório narrativo do dossiê. Roda em 4 chamadas LLM (questionário + BDC + CAF + consolidação). NÃO decide.'],
        ['VerifAI', 'Serviço CAF que analisa documentos enviados para detectar manipulação digital, legibilidade e conformidade. Disparado fire-and-forget em todo upload.'],
        ['BigID', 'API de identidade da BigDataCorp, usada como fallback quando o SDK CAF falha (câmera indisponível, navegador incompatível).'],
        ['Fallback CAF→BDC', 'Quando o SDK da CAF não inicializa, sistema ativa BdcFallbackVerification que faz documentoscopia + facematch + liveness via BigID.'],
        ['Fire-and-forget', 'Padrão de execução onde o front devolve sucesso imediatamente (em <2s) e o processamento pesado roda em background. Usado no VerifAI após upload.'],
        ['Pipeline backend (autoEnrichOnboarding)', 'Função orquestradora que executa em sequência os 11 steps (CAF post-capture, BDC enrichment, CAF full, CAF credit, CAF screening, CAF CPF validation, CAF VerifAI, SENTINEL, decisão, Slack).'],
        ['Data-First v7 — Escalação Questionável', 'Caso em "Revisão Manual" com subfaixa 1A-3B (baixo/médio risco). Indica possível escalação desnecessária — monitorada em /EscalationsReview.'],
      ]} />

      <H2>0.3. Entidades do Sistema (Banco de Dados)</H2>
      <Table headers={['Entidade', 'Para que serve']} rows={[
        ['OnboardingCase', 'Registro raiz de um caso de compliance. Contém status, score, subfaixa, decisão, merchantId, templateId, flags de conclusão (docCompleted, cafCompleted).'],
        ['Merchant', 'Cadastro do cliente final (PJ ou PF). CNPJ/CPF, nome, contato. Quando subseller, aponta para parentMerchantId.'],
        ['QuestionnaireTemplate', 'Template reutilizável de questionário. Contém: model (ex: ComplianceEcommerceV4), merchantType, requiredDocuments, riskThresholds.'],
        ['Question', 'Pergunta individual de um template. Contém: text, type, options, riskWeight, conditionalLogic.'],
        ['QuestionnaireResponse', 'Resposta do cliente a uma pergunta específica de um caso. Chave: onboardingCaseId + questionId.'],
        ['DocumentUpload', 'Arquivo enviado pelo cliente. Contém fileUrl/fileUri (privado para KYC/LGPD), validationStatus, VerifAI notes.'],
        ['DocumentType', 'Catálogo de tipos de documento — nome, formatos, tamanho máx., instruções, CAF SDK vinculado.'],
        ['ComplianceScore', 'Registro do resultado V4: score, subfaixa, variáveis por dimensão, red flags, SENTINEL completo.'],
        ['ExternalValidationResult', 'Resultado bruto de cada dataset BDC/serviço CAF por caso. Auditoria e replay.'],
        ['IntegrationLog', 'Log técnico de cada chamada API (BDC, CAF) — duração, status, payload, resposta.'],
        ['BankDataCollection', 'Registro da coleta de conta bancária do cliente via link público (token). Alimenta o export Pré-KYC para parceiros.'],
        ['PartnerAssignment', 'Atribuição de um caso a um parceiro de compliance externo. SLA, nível de visibilidade, recomendação.'],
        ['CompliancePartner', 'Cadastro de empresas parceiras que recebem casos (bureaus, auditorias, processadoras).'],
        ['AccessProfile', 'Perfil granular de permissões. Define pagePermissions (view/edit por página, aba, sub-aba, ação).'],
        ['AccessAudit', 'Log de navegação e ações administrativas — quem acessou o quê, quando, com qual resultado. Retenção 5 anos.'],
        ['TwoFactorAudit', 'Log específico de eventos 2FA: enroll, totp_success/fail, pin_success/fail, locked_out, admin_reset.'],
        ['BdcRetryQueue', 'Fila persistente de datasets BDC que falharam após retry inline. Prioridades CRITICAL/IMPORTANT/COMPLEMENTARY.'],
      ]} />

      <InfoBox title="Como usar este glossário">
        <p>Sempre que encontrar um termo em negrito ou sigla ao longo do documento, volte aqui para a definição precisa. Termos que aparecem pela primeira vez em cada seção são referenciados por padrão a este glossário — nunca por paráfrase.</p>
      </InfoBox>
    </S>
  );
}