import React from 'react';
import {
  FlowchartContainer, TerminalNode, ProcessNode, DecisionNode, DataNode,
  SubProcessNode, ArrowDown, BranchSplit, MicroStep
} from './FlowchartPrimitives';
import { Users } from 'lucide-react';

export default function FlowSubseller() {
  return (
    <FlowchartContainer
      title="Fluxo 10 — Onboarding de Subseller / Subconta"
      description="Seller principal gera links para seus sub-merchants preencherem compliance"
      actor="Comercial → Seller → Subseller → IA"
      icon={Users}
      color="border-pink-200"
    >
      <div className="space-y-1">
        <TerminalNode label="INÍCIO — Seller aprovado precisa cadastrar subcontas (PF ou PJ)" />
        <ArrowDown />

        <ProcessNode label="Admin acessa GerenciarSubsellerLinks" sublabel="Seleciona Merchant principal (seller aprovado)" actor="Comercial" />
        <ArrowDown />

        <ProcessNode label="Gerar link para subseller" sublabel="generateSubsellerLink: cria OnboardingLink (tipo SUBSELLER_COMPLIANCE) com parentMerchantId, branding white-label opcional" actor="Sistema" />
        <MicroStep steps={['Seleciona seller', 'Modo Pin Bank ou White-Label', 'Branding (logo, cores, nome)', 'Slug curto opcional', 'Gera código único']} />
        <ArrowDown />

        <ProcessNode label="Seller envia link para subconta" sublabel="Link: /SubsellerQuestionnaire?ref=xxx ou /s/{slug}" actor="Seller" />
        <ArrowDown />

        <ProcessNode label="Subseller acessa SubsellerQuestionnaire" sublabel="Formulário público com branding do seller (se white-label)" actor="Subseller" />
        <ArrowDown />

        <DecisionNode label="MerchantTypeSelector: Pessoa Física (PF) ou Pessoa Jurídica (PJ)?" />
        <ArrowDown />

        {/* Bifurcação PF / PJ */}
        <div className="grid grid-cols-2 gap-4 mt-1">
          {/* Coluna PF */}
          <div className="space-y-1 border-l-4 border-pink-300 pl-3">
            <ProcessNode label="🧑 Fluxo PF — Pessoa Física" sublabel="Template: subseller_pf (33 perguntas)" actor="Subseller PF" highlight />
            <MicroStep steps={['CPF', 'Nome Completo', 'Data Nascimento', 'Nacionalidade', 'Nome da Mãe', 'E-mail', 'Telefone', 'Endereço (CEP autocomplete)', 'Atividade', 'Renda', 'PEP/Sanções', 'Confirmação']} />
            <ArrowDown />
            <DataNode label="Merchant criado (type=PF, isSubseller=true)" sublabel="dateOfBirth, nationality, motherName + parentMerchantId. IDs salvos em localStorage." />
            <ArrowDown />
            <ProcessNode label="Upload de documentos NA PLATAFORMA" sublabel="Selfie, RG/CNH Frente, RG/CNH Verso, Comprovante Endereço (4 docs). SEM redirect para CAF." actor="Subseller PF" highlight />
            <MicroStep steps={['DocumentUploadFull detecta IDs existentes', 'Não duplica Merchant/Case', 'Cria DocumentUpload[] vinculados ao case', 'Formatos: PDF/JPG/PNG, max 10MB']} />
            <ArrowDown />
            <ProcessNode label="Redirect → OnboardingCompletion" sublabel="Caso criado com documentos. localStorage limpo." actor="Sistema" />
          </div>

          {/* Coluna PJ */}
          <div className="space-y-1 border-l-4 border-blue-300 pl-3">
            <ProcessNode label="🏢 Fluxo PJ — Pessoa Jurídica" sublabel="Template: subseller_v2 (dinâmico)" actor="Subseller PJ" highlight />
            <MicroStep steps={['CNPJ (autocomplete)', 'Razão Social', 'Nome Fantasia', 'Endereço', 'Atividade', 'Volume', 'Responsáveis', 'PLD/Sanções', 'Confirmação']} />
            <ArrowDown />
            <DataNode label="Merchant criado (type=PJ, isSubseller=true)" sublabel="companyName, CNAE + parentMerchantId. IDs salvos em localStorage." />
            <ArrowDown />
            <ProcessNode label="Upload de documentos + Redirect CAF" sublabel="Documentos na plataforma → depois redirect para CAF (Liveness + Facematch)" actor="Subseller PJ" />
            <ArrowDown />
            <ProcessNode label="Biometria CAF concluída → OnboardingCompletion" sublabel="Resultado biometria registrado" actor="Sistema" />
          </div>
        </div>
        <ArrowDown />

        <DataNode label="OnboardingCase criado (isSubsellerCase=true)" sublabel="Vinculado ao parentMerchantId. Respostas e documentos vinculados." />
        <ArrowDown />

        <SubProcessNode label="IA SENTINEL analisa subconta" sublabel="Mesmo fluxo 3 fases (Motor v4 + SENTINEL qualitativo)" />
        <ArrowDown />

        <DecisionNode label="Resultado?" />
        <div className="grid grid-cols-3 gap-2 mt-1">
          <ProcessNode label="✅ Aprovado" sublabel="Subconta ativa sob o seller" actor="Sistema" />
          <ProcessNode label="🔍 Revisão Manual" sublabel="Analista verifica aba 'Subcontas' do caso" actor="Analista" />
          <ProcessNode label="❌ Recusado" sublabel="Subconta rejeitada" actor="Sistema" />
        </div>
        <ArrowDown />

        <ProcessNode label="Admin visualiza subcontas" sublabel="SubsellerCasesTab: sub-abas PF e PJ com badges. PF: SubsellerPFResponsesModal (6 categorias). PJ: ComplianceResponsesPanel. Aba 'Documentos' do caso: todos os uploads com visualização e download ZIP." actor="Admin" />
        <ArrowDown />

        <TerminalNode label="FIM" type="end" />
      </div>
    </FlowchartContainer>
  );
}