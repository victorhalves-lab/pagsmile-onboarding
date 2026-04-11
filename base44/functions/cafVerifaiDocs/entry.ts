import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafVerifaiDocs — Fase 2: Análise de manipulação digital em documentos uploadados
 *
 * Verifica se PDFs, JPGs (contrato social, comprovante de endereço, DAS, DARF)
 * foram adulterados digitalmente usando CAF VerifAI Docs.
 *
 * Trigger: Automação entity em DocumentUpload [create]
 * Também pode ser chamado manualmente com { documentUploadId } ou { fileUrl, cpf/cnpj }
 *
 * Retorno CAF:
 *   score: NORMAL / TRUSTED / WARNING / HIGH_RISK
 *   decision: LOW_RISK / MEDIUM_RISK / HIGH_RISK
 *   indicators[]: tipo RISK/TRUST/INFO com título + descrição
 *   sampleMetadata: producer, creator, creationDate, modDate
 *   documentClass: tipo do documento identificado
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function base64UrlEncode(data) {
  const b64 = encodeBase64(data);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createCafAuthToken() {
  const clientId = Deno.env.get('CAF_CLIENT_ID');
  const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('CAF credentials not configured');

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: clientId, exp: now + 300 };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Can be triggered by automation (event payload) or manual call
    let documentUploadId = body.documentUploadId;
    let fileUrl = body.fileUrl;
    let onboardingCaseId = body.onboardingCaseId;
    let cpf = body.cpf;
    let cnpj = body.cnpj;
    let merchantType = body.merchantType || 'PJ';

    // From automation entity trigger
    if (body.event?.entity_id && body.event?.entity_name === 'DocumentUpload') {
      documentUploadId = body.event.entity_id;
    }
    if (body.data?.id && !documentUploadId) {
      documentUploadId = body.data.id;
    }

    // Load DocumentUpload if ID provided
    let docUpload = null;
    if (documentUploadId) {
      try {
        const docs = await base44.asServiceRole.entities.DocumentUpload.filter({ id: documentUploadId });
        docUpload = docs[0];
        if (docUpload) {
          fileUrl = docUpload.fileUrl;
          onboardingCaseId = docUpload.onboardingCaseId;
        }
      } catch (e) {
        console.warn('[VerifAI] Could not load DocumentUpload:', e.message);
      }
    }

    // Skip CAF-captured documents (SDK captures are already validated)
    if (docUpload?.documentTypeId?.startsWith('caf_')) {
      console.log('[VerifAI] Skipping CAF-captured document:', docUpload.documentTypeId);
      return Response.json({ skipped: true, reason: 'caf_captured_document' });
    }

    // Skip non-analyzable file types
    const fileType = docUpload?.fileType || body.fileType || '';
    const analyzableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (fileType && !analyzableTypes.some(t => fileType.includes(t))) {
      console.log('[VerifAI] Skipping non-analyzable file type:', fileType);
      return Response.json({ skipped: true, reason: 'non_analyzable_file_type', fileType });
    }

    if (!fileUrl) {
      return Response.json({ error: 'No file URL available' }, { status: 400 });
    }

    // Load merchant data for CPF/CNPJ if not provided
    if (!cpf && !cnpj && onboardingCaseId) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]?.merchantId) {
          const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: cases[0].merchantId });
          if (merchants[0]) {
            merchantType = merchants[0].type || 'PJ';
            const doc = merchants[0].cpfCnpj?.replace(/\D/g, '') || '';
            if (merchantType === 'PF' || doc.length === 11) {
              cpf = doc;
            } else {
              cnpj = doc;
            }
          }
        }
      } catch (e) {
        console.warn('[VerifAI] Could not load merchant:', e.message);
      }
    }

    // Determine which VerifAI service to use
    const service = (merchantType === 'PF' || cpf) ? 'pfVerifaiDocs' : 'pjVerifaiDocs';

    console.log(`[VerifAI] Analyzing: ${fileUrl.substring(0, 60)}... service=${service}`);

    // Determine MIME type
    let mimeType = 'application/pdf';
    if (fileUrl.includes('.jpg') || fileUrl.includes('.jpeg') || fileType?.includes('jpeg')) {
      mimeType = 'image/jpeg';
    } else if (fileUrl.includes('.png') || fileType?.includes('png')) {
      mimeType = 'image/png';
    }

    // Build CAF Transaction
    const authToken = await createCafAuthToken();
    const cafPayload = {
      template: { services: [service] },
      files: [
        { data: fileUrl, type: 'OTHERS', mimeType },
      ],
      parameters: {},
    };
    if (cpf) cafPayload.parameters.cpf = cpf;
    if (cnpj) cafPayload.parameters.cnpj = cnpj;

    const cafResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cafPayload),
    });

    const cafResponseText = await cafResponse.text();
    console.log('[VerifAI] CAF HTTP:', cafResponse.status);

    let cafResult = null;
    try {
      cafResult = JSON.parse(cafResponseText);
    } catch (e) {
      console.error('[VerifAI] Parse error:', cafResponseText.substring(0, 300));
    }

    const verifaiSection = cafResult?.sections?.[service] || cafResult?.sections?.verifaiDocs || null;
    const score = verifaiSection?.score || 'UNKNOWN';
    const decision = verifaiSection?.decision || 'UNKNOWN';
    const indicators = verifaiSection?.indicators || [];
    const documentClass = verifaiSection?.documentClass || null;
    const sampleMetadata = verifaiSection?.sampleMetadata || null;

    const isHighRisk = decision === 'HIGH_RISK' || score === 'HIGH_RISK';
    const isWarning = decision === 'MEDIUM_RISK' || score === 'WARNING';

    const durationMs = Date.now() - startTime;

    // Log to IntegrationLog
    const redFlags = [];
    if (isHighRisk) redFlags.push('DOCUMENT_MANIPULATION_DETECTED');
    if (isWarning) redFlags.push('DOCUMENT_INTEGRITY_WARNING');

    try {
      await base44.asServiceRole.entities.IntegrationLog.create({
        onboarding_case_id: onboardingCaseId || '',
        provider: 'CAF',
        service_type: 'verifai_docs',
        request_id: cafResult?.uuid || '',
        transaction_id: cafResult?.uuid || '',
        status: cafResponse.ok ? 'success' : 'failed',
        result_status: isHighRisk ? 'REPROVED' : isWarning ? 'PENDING_REVIEW' : 'APPROVED',
        request_payload: { service, fileUrl: fileUrl.substring(0, 80), documentUploadId },
        response_payload: { score, decision, indicators: indicators.length, documentClass },
        score: isHighRisk ? 0 : isWarning ? 50 : 100,
        red_flags: redFlags,
        duration_ms: durationMs,
      });
    } catch (e) {
      console.warn('[VerifAI] IntegrationLog error:', e.message);
    }

    // Save ExternalValidationResult
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: `VerifAI Docs — ${documentClass || 'Documento'} (${service})`,
          endpoint: `/v1/transactions (${service})`,
          resultData: {
            score,
            decision,
            indicators,
            documentClass,
            sampleMetadata,
            transactionId: cafResult?.uuid || null,
            fileName: docUpload?.fileName || null,
          },
          score: isHighRisk ? 0 : isWarning ? 50 : 100,
          status: isHighRisk ? 'Falha' : isWarning ? 'Pendente' : 'Sucesso',
          timestamp: new Date().toISOString(),
          responseTime: durationMs,
        });
      } catch (e) {
        console.warn('[VerifAI] ExternalValidation error:', e.message);
      }
    }

    // Update DocumentUpload validation status
    if (documentUploadId) {
      try {
        const newStatus = isHighRisk ? 'Rejeitado' : isWarning ? 'Pendente' : 'Validado';
        const notes = [
          `VerifAI: ${score} / ${decision}`,
          indicators.filter(i => i.type === 'RISK').map(i => i.title).join(', '),
          documentClass ? `Tipo: ${documentClass}` : '',
        ].filter(Boolean).join(' | ');

        await base44.asServiceRole.entities.DocumentUpload.update(documentUploadId, {
          validationStatus: newStatus,
          validationNotes: notes,
        });
        console.log('[VerifAI] DocumentUpload updated:', newStatus);
      } catch (e) {
        console.warn('[VerifAI] DocumentUpload update error:', e.message);
      }
    }

    // Update OnboardingCase with red flags
    if (onboardingCaseId && redFlags.length > 0) {
      try {
        const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
        if (cases[0]) {
          const currentFlags = cases[0].redFlags || [];
          const mergedFlags = [...new Set([...currentFlags, ...redFlags])];
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
            redFlags: mergedFlags,
          });
        }
      } catch (e) {
        console.warn('[VerifAI] OnboardingCase update error:', e.message);
      }
    }

    return Response.json({
      success: true,
      documentUploadId,
      onboardingCaseId,
      verifai: {
        score,
        decision,
        documentClass,
        indicatorsCount: indicators.length,
        riskIndicators: indicators.filter(i => i.type === 'RISK'),
        trustIndicators: indicators.filter(i => i.type === 'TRUST'),
        sampleMetadata,
      },
      redFlags,
      duration_ms: durationMs,
    });

  } catch (error) {
    console.error('[VerifAI] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});