import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { encodeBase64 } from 'https://deno.land/std@0.220.0/encoding/base64.ts';

/**
 * cafPostCaptureAnalysis — Fase 1: Análise pós-captura completa via CAF Core API
 *
 * Executa APÓS as imagens do SDK (frente, verso, selfie) estarem salvas.
 * Envia tudo para a CAF Transaction API e extrai:
 *
 * SÍNCRONO (retorna na response):
 *   - OCR Sync: dados extraídos do documento (nome, CPF, nascimento, RG, mãe)
 *
 * ASSÍNCRONO (via webhook — cafWebhookHandler):
 *   - Documentoscopy: fraude documental (3000+ reference codes)
 *   - Document Liveness: detecção de fotocópia/screenshot
 *   - Deepfake Detection: verifica se selfie é deepfake
 *   - Official Data (Biometria): compara selfie com bases governo (Denatran, TSE)
 *   - Private Faceset: compara selfie contra transações anteriores
 *   - Shared Faceset: compara selfie contra banco de fraudes CAF
 *
 * Parâmetros de entrada:
 *   - onboardingCaseId (obrigatório)
 *   - frontImageUrl (URL da imagem da frente salva no nosso storage)
 *   - backImageUrl (URL da imagem do verso salva no nosso storage)
 *   - selfieImageUrl (URL da selfie salva no nosso storage)
 *   - cpf (CPF do merchant)
 *   - name (nome do merchant)
 *   - birthDate (data de nascimento, formato DD/MM/YYYY)
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

// ── Auth helper: gera JWT para a Core API ──
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

// ── Cross-validation: compara OCR extraído vs dados do questionário ──
function crossValidateOcr(ocrData, merchantData) {
  const flags = [];
  const details = {};

  if (!ocrData) return { flags, details, score: 0 };

  // Nome
  const ocrName = (ocrData.name || ocrData.fullName || '').toUpperCase().trim();
  const merchName = (merchantData.name || '').toUpperCase().trim();
  if (ocrName && merchName) {
    const nameMatch = ocrName === merchName || ocrName.includes(merchName) || merchName.includes(ocrName);
    details.nameOcr = ocrName;
    details.nameDeclared = merchName;
    details.nameMatch = nameMatch;
    if (!nameMatch) {
      flags.push(`OCR_NAME_MISMATCH: Doc="${ocrName}" vs Declarado="${merchName}"`);
    }
  }

  // CPF
  const ocrCpf = (ocrData.cpf || ocrData.documentNumber || '').replace(/\D/g, '');
  const merchCpf = (merchantData.cpf || '').replace(/\D/g, '');
  if (ocrCpf && merchCpf) {
    details.cpfOcr = ocrCpf;
    details.cpfDeclared = merchCpf;
    details.cpfMatch = ocrCpf === merchCpf;
    if (ocrCpf !== merchCpf) {
      flags.push(`OCR_CPF_MISMATCH: Doc="${ocrCpf}" vs Declarado="${merchCpf}"`);
    }
  }

  // Data de nascimento
  const ocrBirth = ocrData.birthDate || ocrData.dateOfBirth || '';
  const merchBirth = merchantData.birthDate || '';
  if (ocrBirth && merchBirth) {
    // Normalize to compare (both could be DD/MM/YYYY or YYYY-MM-DD)
    const normOcr = ocrBirth.replace(/\D/g, '').substring(0, 8);
    const normMerch = merchBirth.replace(/\D/g, '').substring(0, 8);
    details.birthOcr = ocrBirth;
    details.birthDeclared = merchBirth;
    details.birthMatch = normOcr === normMerch;
    if (normOcr !== normMerch && normOcr.length >= 8 && normMerch.length >= 8) {
      flags.push(`OCR_BIRTHDATE_MISMATCH: Doc="${ocrBirth}" vs Declarado="${merchBirth}"`);
    }
  }

  // Nome da mãe
  const ocrMother = (ocrData.motherName || '').toUpperCase().trim();
  const merchMother = (merchantData.motherName || '').toUpperCase().trim();
  if (ocrMother && merchMother) {
    details.motherOcr = ocrMother;
    details.motherDeclared = merchMother;
    details.motherMatch = ocrMother === merchMother || ocrMother.includes(merchMother) || merchMother.includes(ocrMother);
    if (!details.motherMatch) {
      flags.push(`OCR_MOTHER_MISMATCH: Doc="${ocrMother}" vs Declarado="${merchMother}"`);
    }
  }

  return {
    flags,
    details,
    score: flags.length === 0 ? 100 : Math.max(0, 100 - flags.length * 25),
  };
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      onboardingCaseId,
      frontImageUrl,
      backImageUrl,
      selfieImageUrl,
      cpf,
      name,
      birthDate,
      motherName,
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId é obrigatório' }, { status: 400 });
    }

    // Load case + merchant data for cross-validation
    let merchant = null;
    let onboardingCase = null;
    try {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      onboardingCase = cases[0];
      if (onboardingCase?.merchantId) {
        const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
        merchant = merchants[0];
      }
    } catch (e) {
      console.warn('[CAF-PostCapture] Could not load case/merchant:', e.message);
    }

    // Determine image URLs from params or from existing DocumentUploads
    let front = frontImageUrl;
    let back = backImageUrl;
    let selfie = selfieImageUrl;

    if ((!front || !back || !selfie) && onboardingCaseId) {
      try {
        const docs = await base44.asServiceRole.entities.DocumentUpload.filter({ onboardingCaseId });
        for (const doc of docs) {
          if (doc.documentTypeId === 'caf_doc_front' && !front) front = doc.fileUrl;
          if (doc.documentTypeId === 'caf_doc_back' && !back) back = doc.fileUrl;
          if (doc.documentTypeId === 'caf_selfie_liveness' && !selfie) selfie = doc.fileUrl;
        }
      } catch (e) {
        console.warn('[CAF-PostCapture] Could not load documents:', e.message);
      }
    }

    if (!front && !back && !selfie) {
      return Response.json({ error: 'Nenhuma imagem disponível (frente, verso ou selfie)' }, { status: 400 });
    }

    const personCpf = cpf || merchant?.cpfCnpj?.replace(/\D/g, '') || '';
    const personName = name || merchant?.fullName || '';
    const personBirth = birthDate || merchant?.dateOfBirth || '';
    const personMother = motherName || merchant?.motherName || '';

    // ══════════════════════════════════════════════════════════════
    // STEP 1: SÍNCRONO — OCR Sync (retorna na response)
    // ══════════════════════════════════════════════════════════════
    let ocrResult = null;
    let ocrCrossValidation = null;

    if (front || back) {
      console.log('[CAF-PostCapture] Step 1: OCR Sync...');
      const authToken = await createCafAuthToken();

      const ocrFiles = [];
      if (front) ocrFiles.push({ data: front, type: 'FRONT', mimeType: 'image/jpeg' });
      if (back) ocrFiles.push({ data: back, type: 'BACK', mimeType: 'image/jpeg' });

      const ocrPayload = {
        template: { services: ['ocr_sync'] },
        files: ocrFiles,
        parameters: {},
      };
      if (personCpf) ocrPayload.parameters.cpf = personCpf;
      if (personName) ocrPayload.parameters.name = personName;

      const ocrResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ocrPayload),
      });

      const ocrResponseText = await ocrResponse.text();
      console.log('[CAF-PostCapture] OCR HTTP:', ocrResponse.status);

      try {
        ocrResult = JSON.parse(ocrResponseText);
      } catch (e) {
        console.error('[CAF-PostCapture] OCR parse error:', ocrResponseText.substring(0, 300));
      }

      // Cross-validate OCR vs merchant data
      if (ocrResult && ocrResult.sections?.ocr) {
        const ocrData = ocrResult.sections.ocr;
        ocrCrossValidation = crossValidateOcr(ocrData, {
          name: personName,
          cpf: personCpf,
          birthDate: personBirth,
          motherName: personMother,
        });
        console.log('[CAF-PostCapture] OCR cross-validation:', ocrCrossValidation.flags.length, 'mismatches');
      }

      // Log OCR result
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          merchant_id: merchant?.id || '',
          provider: 'CAF',
          service_type: 'ocr_sync',
          request_id: ocrResult?.uuid || ocrResult?.id || '',
          transaction_id: ocrResult?.uuid || '',
          status: ocrResponse.ok ? 'success' : 'failed',
          result_status: ocrCrossValidation?.flags?.length > 0 ? 'PENDING_REVIEW' : 'APPROVED',
          request_payload: { services: ['ocr_sync'], cpf: personCpf ? `***${personCpf.slice(-4)}` : '' },
          response_payload: { ocr: ocrResult?.sections?.ocr || null, crossValidation: ocrCrossValidation },
          score: ocrCrossValidation?.score ?? null,
          red_flags: ocrCrossValidation?.flags || [],
          duration_ms: Date.now() - startTime,
        });
      } catch (logErr) {
        console.warn('[CAF-PostCapture] Log OCR error:', logErr.message);
      }

      // Save OCR ExternalValidationResult
      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId,
          provider: 'CAF',
          validationType: 'OCR Sync — Extração de Dados do Documento',
          endpoint: '/v1/transactions (ocr_sync)',
          resultData: {
            ocrExtracted: ocrResult?.sections?.ocr || null,
            crossValidation: ocrCrossValidation,
            transactionId: ocrResult?.uuid || null,
          },
          score: ocrCrossValidation?.score ?? null,
          status: ocrResponse.ok ? 'Sucesso' : 'Erro',
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        });
      } catch (e) {
        console.warn('[CAF-PostCapture] ExternalValidation OCR error:', e.message);
      }
    }

    // ══════════════════════════════════════════════════════════════
    // STEP 2: ASSÍNCRONO — Full analysis transaction
    // Documentoscopy + Document Liveness + Deepfake + Biometria + Facesets
    // Results arrive via webhook (cafWebhookHandler)
    // ══════════════════════════════════════════════════════════════
    let asyncTransactionId = null;
    let asyncResult = null;

    if (front || selfie) {
      console.log('[CAF-PostCapture] Step 2: Async full analysis transaction...');
      const authToken = await createCafAuthToken();

      const asyncServices = [];
      const asyncFiles = [];

      // Document analysis services (need FRONT + BACK)
      if (front) {
        asyncFiles.push({ data: front, type: 'FRONT', mimeType: 'image/jpeg' });
        asyncServices.push('documentscopy');
        asyncServices.push('documentLiveness');
      }
      if (back) {
        asyncFiles.push({ data: back, type: 'BACK', mimeType: 'image/jpeg' });
      }

      // Face/selfie analysis services
      if (selfie) {
        asyncFiles.push({ data: selfie, type: 'SELFIE', mimeType: 'image/jpeg' });
        asyncServices.push('deepfakeDetection');
        asyncServices.push('officialData');
        asyncServices.push('privateFaceset');
        asyncServices.push('sharedFaceset');
      }

      const asyncPayload = {
        template: { services: asyncServices },
        files: asyncFiles,
        parameters: {},
      };
      if (personCpf) asyncPayload.parameters.cpf = personCpf;
      if (personName) asyncPayload.parameters.name = personName;
      if (personBirth) asyncPayload.parameters.birthDate = personBirth;

      console.log('[CAF-PostCapture] Sending services:', asyncServices.join(', '));

      const asyncResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asyncPayload),
      });

      const asyncResponseText = await asyncResponse.text();
      console.log('[CAF-PostCapture] Async HTTP:', asyncResponse.status);

      try {
        asyncResult = JSON.parse(asyncResponseText);
        asyncTransactionId = asyncResult?.uuid || asyncResult?.id || null;
      } catch (e) {
        console.error('[CAF-PostCapture] Async parse error:', asyncResponseText.substring(0, 300));
      }

      // Log async transaction
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          merchant_id: merchant?.id || '',
          provider: 'CAF',
          service_type: 'caf_post_capture_full',
          request_id: asyncTransactionId || '',
          transaction_id: asyncTransactionId || '',
          status: asyncResponse.ok ? 'processing' : 'failed',
          result_status: 'PENDING_REVIEW',
          request_payload: { services: asyncServices },
          response_payload: asyncResult || { error: asyncResponseText.substring(0, 500) },
          red_flags: [],
          duration_ms: Date.now() - startTime,
        });
      } catch (logErr) {
        console.warn('[CAF-PostCapture] Log async error:', logErr.message);
      }

      // If the response already contains inline results (some services return immediately)
      if (asyncResult?.sections) {
        const inlineFlags = [];

        // Documentoscopy inline result
        if (asyncResult.sections.documentscopy) {
          const ds = asyncResult.sections.documentscopy;
          if (ds.fraud === true) {
            inlineFlags.push('DOCUMENTSCOPY_FRAUD_DETECTED');
          }
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId,
              provider: 'CAF',
              validationType: 'Documentoscopy — Análise de Fraude Documental',
              endpoint: '/v1/transactions (documentscopy)',
              resultData: ds,
              score: ds.fraud ? 0 : 100,
              status: ds.fraud ? 'Falha' : 'Sucesso',
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - startTime,
            });
          } catch (e) { console.warn('ExternalValidation documentscopy:', e.message); }
        }

        // Document Liveness inline result
        if (asyncResult.sections.documentLiveness) {
          const dl = asyncResult.sections.documentLiveness;
          const isCopy = dl.front?.decision === true || dl.back?.decision === true;
          if (isCopy) inlineFlags.push('DOCUMENT_IS_COPY');
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId,
              provider: 'CAF',
              validationType: 'Document Liveness — Detecção de Fotocópia',
              endpoint: '/v1/transactions (documentLiveness)',
              resultData: dl,
              score: isCopy ? 0 : 100,
              status: isCopy ? 'Falha' : 'Sucesso',
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - startTime,
            });
          } catch (e) { console.warn('ExternalValidation documentLiveness:', e.message); }
        }

        // Deepfake inline result
        if (asyncResult.sections.deepfakeDetection) {
          const df = asyncResult.sections.deepfakeDetection;
          if (df.isDeepfake === true) inlineFlags.push('DEEPFAKE_DETECTED');
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId,
              provider: 'CAF',
              validationType: 'Deepfake Detection',
              endpoint: '/v1/transactions (deepfakeDetection)',
              resultData: df,
              score: df.isDeepfake ? 0 : 100,
              status: df.isDeepfake ? 'Falha' : 'Sucesso',
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - startTime,
            });
          } catch (e) { console.warn('ExternalValidation deepfake:', e.message); }
        }

        // Official biometrics inline result
        if (asyncResult.sections.officialData) {
          const od = asyncResult.sections.officialData;
          const lowMatch = od.confidence != null && od.confidence < 0.7;
          if (lowMatch) inlineFlags.push('OFFICIAL_BIOMETRICS_LOW_MATCH');
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId,
              provider: 'CAF',
              validationType: 'Biometria Oficial — Bases Governo',
              endpoint: '/v1/transactions (officialData)',
              resultData: od,
              score: od.confidence != null ? Math.round(od.confidence * 100) : null,
              status: lowMatch ? 'Pendente' : 'Sucesso',
              timestamp: new Date().toISOString(),
              responseTime: Date.now() - startTime,
            });
          } catch (e) { console.warn('ExternalValidation officialData:', e.message); }
        }

        // Faceset results
        if (asyncResult.sections.privateFaceset) {
          const pf = asyncResult.sections.privateFaceset;
          const hasReuse = pf.results?.some(r => r.personId && r.personId !== personCpf);
          if (hasReuse) inlineFlags.push('FACE_REUSE_DIFFERENT_CPF');
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId,
              provider: 'CAF',
              validationType: 'Private Faceset — Reutilização de Face',
              endpoint: '/v1/transactions (privateFaceset)',
              resultData: pf,
              status: hasReuse ? 'Pendente' : 'Sucesso',
              timestamp: new Date().toISOString(),
            });
          } catch (e) { console.warn('ExternalValidation privateFaceset:', e.message); }
        }

        if (asyncResult.sections.sharedFaceset) {
          const sf = asyncResult.sections.sharedFaceset;
          const inFraudDb = sf.results?.length > 0;
          if (inFraudDb) inlineFlags.push('FACE_IN_FRAUD_DATABASE');
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId,
              provider: 'CAF',
              validationType: 'Shared Faceset — Banco de Fraudes CAF',
              endpoint: '/v1/transactions (sharedFaceset)',
              resultData: sf,
              status: inFraudDb ? 'Falha' : 'Sucesso',
              timestamp: new Date().toISOString(),
            });
          } catch (e) { console.warn('ExternalValidation sharedFaceset:', e.message); }
        }

        // Update case with red flags from inline results
        if (inlineFlags.length > 0 && onboardingCase) {
          try {
            const currentFlags = onboardingCase.redFlags || [];
            const newFlags = [...new Set([...currentFlags, ...inlineFlags])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
              redFlags: newFlags,
            });
            console.log('[CAF-PostCapture] Case updated with', inlineFlags.length, 'new flags');
          } catch (e) {
            console.warn('[CAF-PostCapture] Case update error:', e.message);
          }
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[CAF-PostCapture] Completed in ${totalDuration}ms`);

    return Response.json({
      success: true,
      onboardingCaseId,
      ocrSync: {
        extracted: ocrResult?.sections?.ocr || null,
        crossValidation: ocrCrossValidation,
        transactionId: ocrResult?.uuid || null,
      },
      asyncAnalysis: {
        transactionId: asyncTransactionId,
        servicesRequested: asyncResult ? Object.keys(asyncResult.sections || {}) : [],
        status: asyncTransactionId ? 'processing' : 'skipped',
        note: asyncTransactionId ? 'Full results will arrive via webhook (cafWebhookHandler)' : 'No images available for async analysis',
      },
      duration_ms: totalDuration,
    });

  } catch (error) {
    console.error('[CAF-PostCapture] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});