import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Utility (admin only):
 * Adiciona o documento obrigatório "Selfie segurando o documento de identidade"
 * em todos os templates de Compliance V4 + PIX que ainda não possuem.
 *
 * Idempotente: roda quantas vezes for necessário, não duplica.
 */

const SELFIE_DOC = {
  documentTypeId: 'doc_selfie_segurando_documento',
  label: 'Selfie segurando o documento de identidade',
  description: 'Envie uma foto (selfie) sua segurando o seu documento de identidade (RG ou CNH) aberto ao lado do rosto. O rosto e os dados do documento devem estar nítidos e legíveis. OBRIGATÓRIO por exigência regulatória (Circ. BCB 3.978/2020).',
  required: true,
  allowedFormats: ['JPG', 'JPEG', 'PNG'],
  maxSizeMB: 10
};

// Prefixos/strings que identificam templates alvo (Compliance V4 + PIX)
const MODEL_TARGETS = [
  // PIX
  'pix_merchant', 'pix_intermediario', 'pix_api_enterprise',
  'CompliancePixMerchantV4', 'CompliancePixIntermediarioV4', 'CompliancePixApiEnterpriseV4',
  // V4 segmentos
  'ecommerce_v4', 'saas_v4', 'educacao_v4', 'infoprodutos_v4',
  'gateway_v4', 'marketplace_v4', 'dropshipping_v4', 'mpe_v4',
  'link_pagamento_v4', 'plataformas_verticais_v4',
  'ComplianceEcommerceV4', 'ComplianceSaaSV4', 'ComplianceEducacaoV4',
  'ComplianceInfoprodutosV4', 'ComplianceGatewayV4', 'ComplianceMarketplaceV4',
  'ComplianceDropshippingV4', 'ComplianceMPEV4', 'ComplianceLinkPagamentoV4',
  'CompliancePlataformasVerticaisV4'
];

function isTargetModel(model) {
  if (!model) return false;
  // Match exato ou parte do nome
  const m = String(model).toLowerCase();
  return MODEL_TARGETS.some(t => m === t.toLowerCase() || m.includes(t.toLowerCase().replace('compliance', '')));
}

function hasSelfieDoc(template) {
  const docs = template.requiredDocuments || [];
  return docs.some(d =>
    d.documentTypeId === SELFIE_DOC.documentTypeId ||
    /selfie.*(segurando|com).*(documento|identidade|rg|cnh)/i.test(d.label || '')
  );
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    const { dryRun = false } = await req.json().catch(() => ({}));

    const templates = await base44.asServiceRole.entities.QuestionnaireTemplate.filter({
      category: 'COMPLIANCE',
      isActive: true,
      isArchived: false
    }, '-updated_date', 200);

    const results = { updated: [], skipped: [], notTarget: [], total: templates.length };

    for (const tpl of templates) {
      if (!isTargetModel(tpl.model)) {
        results.notTarget.push({ id: tpl.id, name: tpl.name, model: tpl.model });
        continue;
      }
      if (hasSelfieDoc(tpl)) {
        results.skipped.push({ id: tpl.id, name: tpl.name, model: tpl.model, reason: 'already has selfie doc' });
        continue;
      }

      const newDocs = [...(tpl.requiredDocuments || []), SELFIE_DOC];

      if (!dryRun) {
        await base44.asServiceRole.entities.QuestionnaireTemplate.update(tpl.id, {
          requiredDocuments: newDocs
        });
      }
      results.updated.push({ id: tpl.id, name: tpl.name, model: tpl.model });
    }

    return Response.json({ success: true, dryRun, results });
  } catch (error) {
    console.error('addSelfieWithDocumentToTemplates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});