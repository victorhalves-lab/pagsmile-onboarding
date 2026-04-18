import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafResolvePersonData — Resolve CPF + Nome do representante legal em cascata, 
 * com LASTRO de todas as fontes disponíveis no backend.
 * 
 * Ordem de prioridade (melhor → fallback):
 *  P5: QuestionnaireResponse campos explícitos "CPF/Nome do Representante Legal" 
 *  P4: QuestionnaireResponse campos "CPF/Nome do Responsável" 
 *  P3: BDC enrichment (bdcEnrichmentData) do Lead vinculado — socios/QSA com CPF
 *  P2: QuestionnaireResponse — primeiro CPF válido (11 dígitos) 
 *  P1: Lead.cpfCnpj (se for CPF PF)
 *  P0: Sem dados — retorna vazio + flag canUseFaceAuth=false
 * 
 * Retorna:
 *  {
 *    cpf: string | null,
 *    name: string | null,
 *    source: 'questionnaire_explicit' | 'bdc_enrichment' | 'questionnaire_any' | 'lead_pf' | 'none',
 *    canUseFaceAuth: boolean,   // true se tem CPF válido
 *    evidenceChain: [...],       // lastro de onde tentamos e o que achamos
 *  }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { onboardingCaseId, docLinkToken } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId required' }, { status: 400 });
    }

    // ── Auth: valida docLinkToken quando disponível ──
    const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
    const theCase = cases[0];
    if (!theCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }
    if (theCase.docLinkToken && theCase.docLinkToken !== docLinkToken) {
      return Response.json({ error: 'Invalid token' }, { status: 403 });
    }

    const evidenceChain = [];
    let cpf = null;
    let name = null;
    let source = 'none';

    // ── P5/P4/P2: QuestionnaireResponse ──
    const responses = await base44.asServiceRole.entities.QuestionnaireResponse.filter({
      onboardingCaseId
    });
    evidenceChain.push({ step: 'questionnaire', responsesCount: responses.length });

    const cpfRegex = /\D/g;
    const isValidCpf = (s) => {
      if (!s) return false;
      const clean = String(s).replace(cpfRegex, '');
      return clean.length === 11;
    };
    const isValidName = (s) => {
      if (typeof s !== 'string') return false;
      const clean = s.trim();
      // Aceita nome simples (>=3 chars alfabéticos) OU nome completo com espaço
      return clean.length >= 3 && /[a-zA-ZÀ-ÿ]{3,}/.test(clean);
    };

    // P5 — Representante Legal explícito
    for (const r of responses) {
      const t = (r.questionText || '').toLowerCase();
      const v = r.valueText;
      if (!v) continue;
      if (t.includes('cpf') && t.includes('representante') && t.includes('legal') && isValidCpf(v)) {
        cpf = v; source = 'questionnaire_explicit';
        evidenceChain.push({ step: 'P5_cpf_representante', questionText: r.questionText, matched: true });
      }
      if (t.includes('nome') && t.includes('representante') && t.includes('legal') && isValidName(v)) {
        name = v; if (source === 'none') source = 'questionnaire_explicit';
        evidenceChain.push({ step: 'P5_nome_representante', questionText: r.questionText, matched: true });
      }
    }

    // P4 — Responsável Compliance/PLD como backup (presente no caso OMEGPAY)
    if (!cpf || !name) {
      for (const r of responses) {
        const t = (r.questionText || '').toLowerCase();
        const v = r.valueText;
        if (!v) continue;
        if (!cpf && t.includes('cpf') && (t.includes('responsável') || t.includes('responsavel') || t.includes('compliance')) && isValidCpf(v)) {
          cpf = v; source = source === 'none' ? 'questionnaire_explicit' : source;
          evidenceChain.push({ step: 'P4_cpf_responsavel', questionText: r.questionText, matched: true });
        }
        if (!name && t.includes('nome') && (t.includes('responsável') || t.includes('responsavel') || t.includes('compliance')) && isValidName(v)) {
          name = v.trim(); if (source === 'none') source = 'questionnaire_explicit';
          evidenceChain.push({ step: 'P4_nome_responsavel', questionText: r.questionText, matched: true });
        }
      }
    }

    // P3 — BDC Enrichment (sócios/QSA)
    if (!cpf || !name) {
      try {
        const leads = await base44.asServiceRole.entities.Lead.filter({ onboardingCaseId });
        const lead = leads[0];
        if (lead?.bdcEnrichmentData) {
          const enriched = lead.bdcEnrichmentData;
          evidenceChain.push({ step: 'P3_bdc_enrichment', hasData: true });
          
          // Procura em várias estruturas possíveis da BDC
          const candidates = [];
          // Estrutura 1: RelationshipsData.Relationships (CompanyData)
          if (enriched?.RelationshipsData?.Relationships) {
            enriched.RelationshipsData.Relationships.forEach(rel => {
              if (rel.RelatedEntityName && rel.RelatedEntityTaxIdNumber) {
                candidates.push({ 
                  cpf: rel.RelatedEntityTaxIdNumber, 
                  nome: rel.RelatedEntityName,
                  tipo: rel.RelationshipType || 'SOCIO'
                });
              }
            });
          }
          // Estrutura 2: OwnersData / Partners
          if (enriched?.OwnersData?.Owners) {
            enriched.OwnersData.Owners.forEach(o => {
              if (o.OwnerName && o.OwnerTaxIdNumber) {
                candidates.push({ cpf: o.OwnerTaxIdNumber, nome: o.OwnerName, tipo: 'OWNER' });
              }
            });
          }
          // Estrutura 3: QSA direto
          if (Array.isArray(enriched?.QSA)) {
            enriched.QSA.forEach(q => {
              if (q.cpf && q.nome) candidates.push({ cpf: q.cpf, nome: q.nome, tipo: 'QSA' });
            });
          }
          // Estrutura 4: socios array
          if (Array.isArray(enriched?.socios)) {
            enriched.socios.forEach(s => {
              if (s.cpf && s.nome) candidates.push({ cpf: s.cpf, nome: s.nome, tipo: 'SOCIO' });
            });
          }

          evidenceChain.push({ step: 'P3_bdc_candidates', count: candidates.length });

          // Pega primeiro candidato com CPF válido
          for (const c of candidates) {
            if (isValidCpf(c.cpf)) {
              if (!cpf) { cpf = c.cpf; source = source === 'none' ? 'bdc_enrichment' : source; }
              if (!name && isValidName(c.nome)) { name = c.nome; if (source === 'none') source = 'bdc_enrichment'; }
              evidenceChain.push({ step: 'P3_bdc_matched', tipo: c.tipo });
              break;
            }
          }
        } else {
          evidenceChain.push({ step: 'P3_bdc_enrichment', hasData: false });
        }
      } catch (bdcErr) {
        evidenceChain.push({ step: 'P3_bdc_error', error: bdcErr.message });
      }
    }

    // P2 — Any CPF válido no questionário (última chance dentro do quest)
    if (!cpf) {
      for (const r of responses) {
        if (r.valueText && isValidCpf(r.valueText) && r.questionType === 'CPF_CNPJ') {
          cpf = r.valueText;
          source = source === 'none' ? 'questionnaire_any' : source;
          evidenceChain.push({ step: 'P2_any_cpf', questionText: r.questionText });
          break;
        }
      }
    }

    // P1 — Lead.cpfCnpj se for PF (tem 11 dígitos)
    if (!cpf) {
      try {
        const leads = await base44.asServiceRole.entities.Lead.filter({ onboardingCaseId });
        const lead = leads[0];
        if (lead?.cpfCnpj && isValidCpf(lead.cpfCnpj)) {
          cpf = lead.cpfCnpj;
          name = name || lead.fullName || lead.contactName || null;
          source = source === 'none' ? 'lead_pf' : source;
          evidenceChain.push({ step: 'P1_lead_pf', matched: true });
        }
      } catch {}
    }

    // Normaliza CPF
    if (cpf) cpf = String(cpf).replace(/\D/g, '');
    if (name) name = String(name).trim();

    const canUseFaceAuth = !!(cpf && cpf.length === 11);

    // Log de lastro (vira auditoria — e permite dashboard monitorar fontes)
    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId,
        provider: 'CAF',
        service_type: 'sdk_token_generation',
        status: canUseFaceAuth ? 'success' : 'failed',
        result_status: canUseFaceAuth ? 'APPROVED' : 'PENDING_REVIEW',
        request_payload: { action: 'resolve_person_data' },
        response_payload: {
          action: 'resolve_person_data',
          hasCpf: !!cpf,
          hasName: !!name,
          source,
          evidenceChain,
          canUseFaceAuth,
        },
        duration_ms: 0,
      });
    } catch {}

    return Response.json({
      success: true,
      cpf,
      name,
      source,
      canUseFaceAuth,
      evidenceChain,
    });
  } catch (error) {
    console.error('[cafResolvePersonData] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});