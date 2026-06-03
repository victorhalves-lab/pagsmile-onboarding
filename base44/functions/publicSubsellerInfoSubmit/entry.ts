import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Recebe uma submissão pública de um Gateway preenchendo a lista de subsellers
 * via SubsellerInfoCollection (link).
 *
 * Body esperado:
 *  {
 *    token: string,
 *    submitter_name?: string,
 *    submitter_email?: string,
 *    subsellers: [{...}]
 *  }
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const body = await req.json();
    const { token, submitter_name, submitter_email, subsellers } = body || {};

    if (!token) {
      return Response.json({ error: 'Token obrigatório' }, { status: 400 });
    }
    if (!Array.isArray(subsellers) || subsellers.length === 0) {
      return Response.json({ error: 'Envie ao menos 1 subseller' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Localiza a collection
    const collections = await base44.asServiceRole.entities.SubsellerInfoCollection.filter({ unique_token: token });
    if (!collections || collections.length === 0) {
      return Response.json({ error: 'Link inválido ou expirado' }, { status: 404 });
    }
    const collection = collections[0];

    if (collection.is_active === false) {
      return Response.json({ error: 'Este link foi desativado' }, { status: 403 });
    }
    if (collection.expires_at && new Date(collection.expires_at) < new Date()) {
      return Response.json({ error: 'Este link expirou' }, { status: 403 });
    }

    const isSimpleMode = (collection.collection_mode || 'full') === 'simple';

    // No modo simples: valida que cada subseller tem URL válida em offer_url
    if (isSimpleMode) {
      const urlRegex = /^https?:\/\/.+\..+/i;
      for (let i = 0; i < subsellers.length; i++) {
        const s = subsellers[i] || {};
        if (!s.offer_url || !urlRegex.test(String(s.offer_url).trim())) {
          return Response.json({
            error: `Subseller #${i + 1}: link da oferta é obrigatório e deve ser uma URL válida (começando com http:// ou https://).`
          }, { status: 400 });
        }
      }
    }

    // Sanitiza subsellers (mantém só campos do schema)
    const allowedKeys = new Set([
      'person_type','company_name','cnpj','cpf','rg','cnae','business_model','business_model_other',
      'what_they_sell','offer_url','offer_explanation',
      'monthly_tpv','average_ticket','bank_name','bank_agency','bank_account',
      'bank_account_type','bank_holder_name','bank_holder_document','documents'
    ]);
    const cleaned = subsellers
      .map(s => {
        const out = {};
        for (const [k, v] of Object.entries(s || {})) {
          if (!allowedKeys.has(k)) continue;
          if (v === undefined || v === null || v === '') continue;
          out[k] = v;
        }
        if (!out.person_type) out.person_type = 'PJ';
        return out;
      })
      // Aceita PJ com nome ou CNPJ, PF com nome ou CPF
      .filter(s => s.company_name || s.cnpj || s.cpf);

    if (cleaned.length === 0) {
      return Response.json({ error: 'Preencha ao menos Nome ou CNPJ em cada subseller' }, { status: 400 });
    }

    // Cria a submissão
    const submission = await base44.asServiceRole.entities.SubsellerInfoSubmission.create({
      collection_id: collection.id,
      gateway_name: collection.gateway_name,
      submitter_name: submitter_name || '',
      submitter_email: submitter_email || '',
      subsellers: cleaned,
      subsellers_count: cleaned.length,
      status: 'pending',
    });

    // Atualiza contadores na collection
    const newSubmissionsCount = (collection.submissions_count || 0) + 1;
    const newTotalSubsellers = (collection.total_subsellers_count || 0) + cleaned.length;
    await base44.asServiceRole.entities.SubsellerInfoCollection.update(collection.id, {
      submissions_count: newSubmissionsCount,
      total_subsellers_count: newTotalSubsellers,
      last_submission_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      submission_id: submission.id,
      subsellers_count: cleaned.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});