import React from 'react';
import { Map as MapIcon, FileInput, Package, Gavel } from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   TemplateOperationalBlock — contexto OPERACIONAL do template:
   página renderizadora, fonte de pré-preenchimento, grupo BDC
   associado e base legal declarada na própria description.
   Mapas extraídos de lib/complianceModelRegistry.js.
   ──────────────────────────────────────────────────────────── */
export default function TemplateOperationalBlock({ template }) {
  const renderConfig = MODEL_TO_RENDER[template.model] || null;
  const bdcGroup = MODEL_TO_BDC_GROUP[template.model] || 'STANDARD (default)';
  const prefillSource = MODEL_TO_PREFILL[template.model] || '—';
  const legalBaseMatch = (template.description || '').match(/Base legal:\s*([^.]+\.)/i);
  const legalBase = legalBaseMatch ? legalBaseMatch[1].trim() : null;

  return (
    <div className="bg-[#fafcff] border border-[#e0ebf5] rounded p-3 space-y-2.5 text-[11px]">
      <Row
        icon={MapIcon}
        label="Página que renderiza este template"
        value={renderConfig ? (
          <div>
            <code className="text-[#0A0A0A] font-semibold">/{renderConfig.page}</code>
            <span className="text-[#1a1a1a]/60">
              {' '}— flowType <code>{renderConfig.flowType}</code>, upload em{' '}
              <code>/{renderConfig.uploadPage}</code>
            </span>
          </div>
        ) : <span className="text-[#1a1a1a]/50 italic">Model não mapeado em complianceModelRegistry</span>}
      />
      <Row
        icon={FileInput}
        label="Fonte de pré-preenchimento (autocomplete)"
        value={<span className="text-[#1a1a1a]/70">{prefillSource}</span>}
      />
      <Row
        icon={Package}
        label="Grupo BDC associado (enriquecimento backend)"
        value={<code className="text-[#1356E2] font-semibold">{bdcGroup}</code>}
      />
      {legalBase && (
        <Row
          icon={Gavel}
          label="Base legal declarada no template"
          value={<span className="text-[#1a1a1a]/70 leading-relaxed">{legalBase}</span>}
        />
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-[#1a1a1a]/40 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[#1a1a1a]/50 font-semibold uppercase tracking-wider text-[9px] mb-0.5">
          {label}
        </p>
        {value}
      </div>
    </div>
  );
}

const MODEL_TO_RENDER = {
  ComplianceGatewayV4: { page: 'ComplianceDinamico?model=ComplianceGatewayV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceMarketplaceV4: { page: 'ComplianceDinamico?model=ComplianceMarketplaceV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  CompliancePlataformaVerticalV4: { page: 'ComplianceDinamico?model=CompliancePlataformaVerticalV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceEcommerceV4: { page: 'ComplianceDinamico?model=ComplianceEcommerceV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceSaaSV4: { page: 'ComplianceDinamico?model=ComplianceSaaSV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceInfoprodutosV4: { page: 'ComplianceDinamico?model=ComplianceInfoprodutosV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceDropshippingV4: { page: 'ComplianceDinamico?model=ComplianceDropshippingV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceEducacaoV4: { page: 'ComplianceDinamico?model=ComplianceEducacaoV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceMerchantLinkV4: { page: 'ComplianceDinamico?model=ComplianceMerchantLinkV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  ComplianceMPEV4: { page: 'ComplianceDinamico?model=ComplianceMPEV4', flowType: 'full_kyc', uploadPage: 'DocumentUploadFull' },
  CompliancePixMerchantV4: { page: 'ComplianceDinamico?model=CompliancePixMerchantV4', flowType: 'pix', uploadPage: 'DocumentUploadPix' },
  CompliancePixIntermediarioV4: { page: 'ComplianceDinamico?model=CompliancePixIntermediarioV4', flowType: 'pix', uploadPage: 'DocumentUploadPix' },
  pix_intermediario_v4: { page: 'ComplianceDinamico?model=pix_intermediario_v4', flowType: 'pix', uploadPage: 'DocumentUploadPix' },
  pix_api_enterprise: { page: 'ComplianceDinamico?model=pix_api_enterprise', flowType: 'pix', uploadPage: 'DocumentUploadPix' },
  subseller_v2: { page: 'SubsellerQuestionnaire', flowType: 'subseller', uploadPage: 'DocumentUploadFull' },
  subseller_pf: { page: 'SubsellerQuestionnaire', flowType: 'subseller_pf', uploadPage: 'SubsellerDocUpload' },
};

const MODEL_TO_BDC_GROUP = {
  ComplianceGatewayV4: 'FULL (alto risco regulatório)',
  ComplianceMarketplaceV4: 'FULL (alto risco regulatório)',
  CompliancePlataformaVerticalV4: 'FULL (alto risco regulatório)',
  ComplianceEcommerceV4: 'STANDARD (default)',
  ComplianceSaaSV4: 'STANDARD (default)',
  ComplianceInfoprodutosV4: 'STANDARD + reputation (histórico de reclamações)',
  ComplianceDropshippingV4: 'STANDARD + domains + activity_indicators',
  ComplianceEducacaoV4: 'STANDARD (default)',
  ComplianceMerchantLinkV4: 'LITE (MEI/micro — econômico)',
  ComplianceMPEV4: 'LITE (MEI/ME — econômico)',
  CompliancePixMerchantV4: 'PIX_MERCHANT',
  CompliancePixIntermediarioV4: 'FULL (intermediário = alto risco PLD)',
  pix_intermediario_v4: 'FULL (intermediário = alto risco PLD)',
  pix_api_enterprise: 'FULL (enterprise — máximo enriquecimento)',
  subseller_v2: 'STANDARD (subseller PJ)',
  subseller_pf: 'PF-specific (SCR + pessoas_kyc + owners relationships)',
};

const MODEL_TO_PREFILL = {
  ComplianceGatewayV4: 'Lead Pin Bank v5 → questionnaireData (segmento = gateway)',
  ComplianceMarketplaceV4: 'Lead Pin Bank v5 (segmento = marketplace)',
  CompliancePlataformaVerticalV4: 'Lead Pin Bank v5 (segmento = plataformas_verticais)',
  ComplianceEcommerceV4: 'Lead Pin Bank v5 (segmento = ecommerce) OU Landing Page',
  ComplianceSaaSV4: 'Lead Pin Bank v5 (segmento = saas)',
  ComplianceInfoprodutosV4: 'Lead Pin Bank v5 (segmento = infoprodutos)',
  ComplianceDropshippingV4: 'Lead Pin Bank v5 (segmento = dropshipping)',
  ComplianceEducacaoV4: 'Lead Pin Bank v5 (segmento = educacao)',
  ComplianceMerchantLinkV4: 'Lead Pin Bank v5 (segmento = link_pagamento)',
  ComplianceMPEV4: 'Lead Pin Bank v5 (segmento = mpe)',
  CompliancePixMerchantV4: 'Lead PIX v4 (tipoNegocio = merchant)',
  CompliancePixIntermediarioV4: 'Lead PIX v4 (tipoNegocio = intermediario)',
  pix_intermediario_v4: 'Lead PIX v4 (alias lowercase)',
  pix_api_enterprise: 'BDC autocomplete agressivo (CNPJ) + Lead PIX v4 enterprise',
  subseller_v2: 'Dados do Seller pai (parentMerchantId) + BDC do CNPJ do subseller',
  subseller_pf: 'Dados do Seller pai + CPF autocomplete via BDC pessoas_kyc',
};