import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * BDC BigID Fallback — Documentoscopia + Facematch + Liveness
 * Called when CAF SDK fails to load or user can't complete CAF flow.
 * 
 * Endpoints:
 *  - Documentoscopia: POST https://app.bigdatacorp.com.br/bigid/documentoscopia/checar
 *  - Facematch 1:1:   POST https://app.bigdatacorp.com.br/bigid/biometrias/facematch
 * 
 * Both use the same AccessToken/TokenId as the plataforma API.
 */

const BDC_BIGID_URL = 'https://app.bigdatacorp.com.br';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Auth: allow both logged-in users and service-role calls
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user) isAuthorized = true;
    } catch (e) { /* service-role calls */ }
    try { await base44.asServiceRole.entities.OnboardingCase.list('-created_date', 1); isAuthorized = true; } catch(e) {}
    if (!isAuthorized) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = Deno.env.get('BDC_ACCESS_TOKEN');
    const tokenId = Deno.env.get('BDC_TOKEN_ID');
    if (!accessToken || !tokenId) return Response.json({ error: 'BDC tokens not configured' }, { status: 500 });

    const body = await req.json();
    const { action, onboardingCaseId, documentImageBase64, selfieImageBase64, documentImageUrl, selfieImageUrl } = body;

    if (!action) return Response.json({ error: 'action is required (documentoscopia | facematch | full_verification)' }, { status: 400 });

    const headers = {
      'AccessToken': accessToken,
      'TokenId': tokenId,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const results = { action, success: false };
    const startTime = Date.now();

    // ═══════════════════════════════════════════════════════
    // ACTION: documentoscopia — OCR + forensic validation
    // ═══════════════════════════════════════════════════════
    if (action === 'documentoscopia' || action === 'full_verification') {
      if (!documentImageBase64 && !documentImageUrl) {
        return Response.json({ error: 'documentImageBase64 or documentImageUrl is required for documentoscopia' }, { status: 400 });
      }

      // Build parameters — supports both base64 and URL
      const docParams = [];
      if (documentImageBase64) {
        // Strip data URI prefix if present
        const cleanBase64 = documentImageBase64.replace(/^data:image\/\w+;base64,/, '');
        docParams.push(`DOC_IMG=${cleanBase64}`);
      } else if (documentImageUrl) {
        docParams.push(`DOC_IMG_URL=${documentImageUrl}`);
      }

      const docPayload = {
        Parameters: docParams.join(','),
        ForensicValidations: true,
        SearchFace: true,
      };

      console.log('[BDC-BigID] Documentoscopia request starting...');
      const docResponse = await fetch(`${BDC_BIGID_URL}/bigid/documentoscopia/checar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(docPayload),
      });

      const docText = await docResponse.text();
      let docData;
      try { docData = JSON.parse(docText); } catch (e) {
        console.error('[BDC-BigID] Documentoscopia parse error:', docText.substring(0, 300));
        results.documentoscopia = { error: 'Parse error', raw: docText.substring(0, 300) };
        if (action === 'documentoscopia') return Response.json(results, { status: 500 });
      }

      if (docData) {
        results.documentoscopia = {
          success: docData.ResultCode >= 0,
          resultCode: docData.ResultCode,
          resultMessage: docData.ResultMessage,
          ticketId: docData.TicketId,
          docInfo: docData.DocInfo || {},
          officialInfo: docData.OfficialInfo || {},
          forensicValidations: docData.ForensicValidations || {},
          estimatedInfo: docData.EstimatedInfo || {},
        };

        // Extract key identity data
        const di = docData.DocInfo || {};
        results.extractedData = {
          docType: di.DOCTYPE,
          side: di.SIDE,
          name: di.NAME,
          cpf: di.CPF,
          birthDate: di.BIRTHDATE,
          motherName: di.MOTHERNAME,
          fatherName: di.FATHERNAME,
          idNumber: di.IDENTIFICATIONNUMBER,
          cnhNumber: di.CNHNUMBER,
          category: di.CATEGORY,
          expirationDate: di.VALIDATE,
          uf: di.IDENTIFICATIONUF,
        };

        // Check forensic alerts
        const forensicAlerts = Object.entries(docData.ForensicValidations || {}).map(([code, desc]) => ({
          code, description: desc,
          isSuspicious: Number(code) < 0,
        }));
        results.forensicAlerts = forensicAlerts;
        results.hasSuspiciousFindings = forensicAlerts.some(a => a.isSuspicious);

        // Official data cross-validation
        const oi = docData.OfficialInfo || {};
        results.officialValidation = {
          nameMatch: oi.NAMEMATCHPERCENTAGE ? Number(oi.NAMEMATCHPERCENTAGE) * 100 : null,
          nameMatchV2: oi.NAMEMATCHPERCENTAGE_V2 ? Number(oi.NAMEMATCHPERCENTAGE_V2) * 100 : null,
          motherNameMatch: oi.MOTHERNAMEMATCHPERCENTAGE ? Number(oi.MOTHERNAMEMATCHPERCENTAGE) * 100 : null,
          birthDateMatch: oi.BIRTHDATEMATCH === '1',
          officialName: oi.OFFICIALNAME,
          officialBirthDate: oi.OFFICIALBIRTHDATE,
          officialMotherName: oi.OFFICIALMOTHERNAME,
        };

        console.log(`[BDC-BigID] Documentoscopia done: code=${docData.ResultCode}, type=${di.DOCTYPE}, forensicAlerts=${forensicAlerts.length}`);
      }

      if (action === 'documentoscopia') {
        results.success = results.documentoscopia?.success || false;
        results.durationMs = Date.now() - startTime;
        
        // Save IntegrationLog
        if (onboardingCaseId) {
          try {
            await base44.asServiceRole.entities.IntegrationLog.create({
              onboarding_case_id: onboardingCaseId,
              provider: 'BigDataCorp',
              service_type: 'verifai_docs',
              status: results.success ? 'success' : 'failed',
              result_status: results.hasSuspiciousFindings ? 'PENDING_REVIEW' : 'APPROVED',
              response_payload: results,
              duration_ms: results.durationMs,
              red_flags: results.forensicAlerts?.filter(a => a.isSuspicious).map(a => `BDC_FORENSIC: ${a.code} - ${a.description}`) || [],
            });
          } catch (e) { console.warn('[BDC-BigID] Log save error:', e.message); }
        }

        return Response.json(results);
      }
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: facematch — Compare document face vs selfie
    // ═══════════════════════════════════════════════════════
    if (action === 'facematch' || action === 'full_verification') {
      if (!selfieImageBase64 && !selfieImageUrl) {
        if (action === 'facematch') return Response.json({ error: 'selfieImageBase64 or selfieImageUrl required' }, { status: 400 });
        // For full_verification without selfie, skip facematch
        results.facematch = { skipped: true, reason: 'No selfie provided' };
      } else {
        // Need both document and selfie images
        const fmParams = [];

        // Base face = document image
        if (documentImageBase64) {
          const cleanDocB64 = documentImageBase64.replace(/^data:image\/\w+;base64,/, '');
          fmParams.push(`BASE_FACE_IMG=${cleanDocB64}`);
        } else if (documentImageUrl) {
          fmParams.push(`BASE_FACE_IMG_URL=${documentImageUrl}`);
        }

        // Match image = selfie
        if (selfieImageBase64) {
          const cleanSelfieB64 = selfieImageBase64.replace(/^data:image\/\w+;base64,/, '');
          fmParams.push(`MATCH_IMG=${cleanSelfieB64}`);
        } else if (selfieImageUrl) {
          fmParams.push(`MATCH_IMG_URL=${selfieImageUrl}`);
        }

        const fmPayload = {
          Parameters: fmParams,
          ThresholdComparationPercent: 80,
        };

        // If URLs are private (base44 storage), flag them
        if (documentImageUrl && documentImageUrl.includes('supabase')) {
          fmPayload.PrivateBaseFaceUrl = false;
        }
        if (selfieImageUrl && selfieImageUrl.includes('supabase')) {
          fmPayload.PrivateMatchImgUrl = false;
        }

        console.log('[BDC-BigID] Facematch request starting...');
        const fmResponse = await fetch(`${BDC_BIGID_URL}/bigid/biometrias/facematch`, {
          method: 'POST',
          headers,
          body: JSON.stringify(fmPayload),
        });

        const fmText = await fmResponse.text();
        let fmData;
        try { fmData = JSON.parse(fmText); } catch (e) {
          console.error('[BDC-BigID] Facematch parse error:', fmText.substring(0, 300));
          results.facematch = { error: 'Parse error', raw: fmText.substring(0, 300) };
        }

        if (fmData) {
          const similarity = fmData.EstimatedInfo?.Similarity ? Number(fmData.EstimatedInfo.Similarity) : null;
          const isMatch = similarity !== null && similarity >= 80;

          results.facematch = {
            success: fmData.ResultCode >= 0,
            resultCode: fmData.ResultCode,
            resultMessage: fmData.ResultMessage,
            ticketId: fmData.TicketId,
            similarity,
            isMatch,
            threshold: 80,
          };

          console.log(`[BDC-BigID] Facematch done: code=${fmData.ResultCode}, similarity=${similarity}%, match=${isMatch}`);
        }
      }

      if (action === 'facematch') {
        results.success = results.facematch?.success || false;
        results.durationMs = Date.now() - startTime;

        if (onboardingCaseId) {
          try {
            await base44.asServiceRole.entities.IntegrationLog.create({
              onboarding_case_id: onboardingCaseId,
              provider: 'BigDataCorp',
              service_type: 'biometria_facial',
              status: results.success ? 'success' : 'failed',
              result_status: results.facematch?.isMatch ? 'APPROVED' : 'REPROVED',
              similarity: results.facematch?.similarity || null,
              response_payload: results,
              duration_ms: results.durationMs,
              red_flags: results.facematch?.isMatch === false ? ['BDC_FACEMATCH_FAILED: Similaridade abaixo do threshold'] : [],
            });
          } catch (e) { console.warn('[BDC-BigID] Log save error:', e.message); }
        }

        return Response.json(results);
      }
    }

    // ═══════════════════════════════════════════════════════
    // ACTION: full_verification — Documentoscopia + Facematch combined
    // ═══════════════════════════════════════════════════════
    if (action === 'full_verification') {
      const docOk = results.documentoscopia?.success;
      const fmOk = results.facematch?.success || results.facematch?.skipped;
      const isMatch = results.facematch?.isMatch !== false;
      const noSuspicious = !results.hasSuspiciousFindings;

      results.success = docOk && fmOk;
      results.overallDecision = (docOk && isMatch && noSuspicious) ? 'APPROVED' 
        : (docOk && !noSuspicious) ? 'PENDING_REVIEW' 
        : 'REPROVED';
      results.durationMs = Date.now() - startTime;

      // Save comprehensive IntegrationLog
      if (onboardingCaseId) {
        try {
          const allFlags = [
            ...(results.forensicAlerts?.filter(a => a.isSuspicious).map(a => `BDC_FORENSIC: ${a.code} - ${a.description}`) || []),
            ...(results.facematch?.isMatch === false ? ['BDC_FACEMATCH_FAILED'] : []),
          ];

          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'BigDataCorp',
            service_type: 'verifai_docs',
            status: results.success ? 'success' : 'failed',
            result_status: results.overallDecision,
            similarity: results.facematch?.similarity || null,
            response_payload: {
              documentoscopia: results.documentoscopia,
              facematch: results.facematch,
              extractedData: results.extractedData,
              officialValidation: results.officialValidation,
              overallDecision: results.overallDecision,
            },
            duration_ms: results.durationMs,
            red_flags: allFlags,
          });

          // Also save ExternalValidationResult for dashboard visibility
          await base44.asServiceRole.entities.ExternalValidationResult.create({
            onboardingCaseId,
            provider: 'BigDataCorp',
            validationType: 'BigID Full Verification (Documentoscopia + Facematch)',
            endpoint: `${BDC_BIGID_URL}/bigid`,
            resultData: {
              documentoscopia: results.documentoscopia,
              facematch: results.facematch,
              extractedData: results.extractedData,
              officialValidation: results.officialValidation,
              forensicAlerts: results.forensicAlerts,
            },
            score: results.facematch?.similarity || 0,
            status: results.success ? 'Sucesso' : 'Falha',
            timestamp: new Date().toISOString(),
            responseTime: results.durationMs,
          });
        } catch (e) { console.warn('[BDC-BigID] Log save error:', e.message); }
      }

      return Response.json(results);
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('[BDC-BigID] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});