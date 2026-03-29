import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Automation handler: triggered when a Lead is created.
 * Extracts CNPJ, email, site, and QSA from the lead data,
 * then calls enrichLeadData to run all 7 enrichment sources.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data } = body;
    
    if (!data || !event?.entity_id) {
      console.log('No data in automation payload, skipping');
      return Response.json({ skipped: true });
    }
    
    const leadId = event.entity_id;
    const cnpj = data.cpfCnpj;
    
    if (!cnpj || cnpj.length < 14) {
      console.log(`Lead ${leadId}: No valid CNPJ, skipping enrichment`);
      return Response.json({ skipped: true, reason: 'No CNPJ' });
    }
    
    // Only enrich leads from PagSmile v5 questionnaire
    const origem = data.questionnaireData?.origem;
    if (origem !== 'questionario_leads_pagsmile_v5') {
      console.log(`Lead ${leadId}: Not a v5 questionnaire (${origem}), skipping`);
      return Response.json({ skipped: true, reason: `Origin: ${origem}` });
    }
    
    console.log(`Lead ${leadId}: Starting enrichment (CNPJ: ${cnpj})`);
    
    // Call enrichLeadData
    const result = await base44.asServiceRole.functions.invoke('enrichLeadData', {
      leadId,
      cnpj,
      email: data.email,
      site: data.website,
      qsa: data.questionnaireData?._cnpjEnrichment?.qsa || []
    });
    
    console.log(`Lead ${leadId}: Enrichment complete`);
    return Response.json({ success: true, leadId });
  } catch (error) {
    console.error('onLeadCreatedEnrich error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});