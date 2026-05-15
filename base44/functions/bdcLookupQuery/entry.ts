import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ══════════════════════════════════════════════════════════════════════════════
// BDC Lookup — consulta manual de CNPJ/CPF feita por admin via página BdcLookup.
// Sem cache (sempre dado fresco). Audit log obrigatório.
// ══════════════════════════════════════════════════════════════════════════════

const BDC_BASE_URL = 'https://plataforma.bigdatacorp.com.br';

// Presets de datasets por modo. Os nomes técnicos vêm de bdcQueryCompany/Person.
const COMPANY_PRESETS = {
  quick: ['basic_data', 'registration_data', 'kyc', 'activity_indicators', 'merchant_category_data'],
  kyc_pld_full: [
    'basic_data', 'registration_data', 'kyc', 'owners_kyc', 'economic_group_kyc',
    'political_involvement', 'government_debtors', 'processes', 'owners_lawsuits',
    'media_profile_and_exposure', 'relationships', 'corporate_chain',
    'economic_group', 'financial_data', 'default_business_data',
    'activity_indicators', 'digital_attributes', 'esg_and_compliance',
    'reputations_and_reviews',
  ],
  due_diligence_deep: [
    'basic_data', 'registration_data', 'history_basic_data', 'company_evolution',
    'phones_extended', 'emails_extended', 'addresses_extended',
    'relationships', 'owners_kyc', 'owners_lawsuits', 'owners_influence',
    'owners_electoral_donors', 'owners_industrial_property',
    'related_people_phones', 'related_people_emails', 'related_people_addresses',
    'kyc', 'political_involvement', 'government_debtors', 'economic_group_kyc',
    'processes', 'domains', 'online_ads', 'passages',
    'media_profile_and_exposure', 'reputations_and_reviews', 'awards_and_certifications',
    'activity_indicators', 'marketplace_data', 'collections', 'merchant_category_data',
    'financial_market', 'economic_group', 'industrial_property', 'licenses_and_authorizations',
    'financial_data', 'default_business_data', 'corporate_chain', 'digital_attributes',
    'esg_and_compliance',
  ],
};

const PERSON_PRESETS = {
  quick: ['basic_data', 'kyc', 'pep'],
  kyc_pld_full: [
    'basic_data', 'kyc', 'pep', 'processes', 'collections',
    'government_debtors', 'judicial_assets', 'entrepreneur_quality',
    'media_profile_and_exposure', 'relationships', 'first_level_family_kyc',
    'financial_data', 'electoral_donors', 'public_servants', 'risk_data',
  ],
  due_diligence_deep: [
    'basic_data', 'kyc', 'pep', 'processes', 'collections',
    'government_debtors', 'judicial_assets', 'entrepreneur_quality',
    'media_profile_and_exposure', 'online_presence', 'relationships',
    'first_level_family_kyc', 'personal_relationships',
    'financial_data', 'presumed_income', 'financial_interests',
    'scr_positive_score', 'simples_nacional_collection',
    'electoral_donors', 'public_servants', 'social_assistance', 'risk_data',
    'phones_extended', 'emails_extended', 'addresses_extended',
    'related_people_phones', 'related_people_emails', 'related_people_addresses',
  ],
};

function maskDoc(doc, type) {
  if (type === 'cnpj') return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.***`;
  return `${doc.slice(0, 3)}.***`;
}

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { document, mode = 'kyc_pld_full', customDatasets, purpose } = await req.json();
    if (!document) return Response.json({ error: 'document é obrigatório' }, { status: 400 });

    const cleanDoc = String(document).replace(/\D/g, '');
    const isPF = cleanDoc.length === 11;
    const isPJ = cleanDoc.length === 14;
    if (!isPF && !isPJ) return Response.json({ error: 'Documento inválido (use CPF ou CNPJ)' }, { status: 400 });

    const endpoint = isPF ? '/pessoas' : '/empresas';
    const docType = isPF ? 'cpf' : 'cnpj';
    const presets = isPF ? PERSON_PRESETS : COMPANY_PRESETS;

    let datasets;
    if (mode === 'custom' && Array.isArray(customDatasets) && customDatasets.length > 0) {
      datasets = customDatasets;
    } else {
      datasets = presets[mode] || presets.kyc_pld_full;
    }

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) {
      return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });
    }

    const t0 = Date.now();
    const response = await fetch(`${BDC_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'AccessToken': accessToken, 'TokenId': tokenId,
        'Accept': 'application/json', 'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Datasets: datasets.join(','), q: `doc{${cleanDoc}}`, Limit: 1 }),
    });

    const rawText = await response.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch (e) {
      return Response.json({ error: 'Failed to parse BDC response', raw: rawText.substring(0, 500) }, { status: 500 });
    }

    const elapsedMs = Date.now() - t0;

    // Separa OK vs erros
    const datasetsOk = [], datasetsError = [];
    if (data.Status) {
      for (const [ds, statuses] of Object.entries(data.Status)) {
        if (Array.isArray(statuses) && statuses.some(s => s.Code !== 0)) datasetsError.push(ds);
        else datasetsOk.push(ds);
      }
    }

    // Audit log (LGPD): nunca grava CPF/CNPJ em claro
    try {
      const docHash = await sha256Hex(cleanDoc);
      await base44.asServiceRole.entities.BdcLookupQueryLog.create({
        queriedBy: user.email,
        documentType: docType,
        documentMasked: maskDoc(cleanDoc, docType),
        documentHash: docHash,
        mode,
        datasetsRequested: datasets,
        datasetsOk,
        datasetsError,
        elapsedMs,
        bdcQueryId: data.QueryId || '',
        purpose: purpose || '',
      });
    } catch (e) {
      console.warn('Audit log failed (non-blocking):', e.message);
    }

    return Response.json({
      success: true,
      docType,
      mode,
      datasetsRequested: datasets,
      datasetsOk,
      datasetsError,
      elapsedMs,
      queryId: data.QueryId,
      queryDate: data.QueryDate,
      status: data.Status,
      result: data.Result?.[0] || null,
      evidences: data.Evidences,
    });

  } catch (error) {
    console.error('bdcLookupQuery error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});