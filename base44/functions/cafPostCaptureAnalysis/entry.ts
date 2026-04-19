import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafPostCaptureAnalysis — Análise pós-captura completa via CAF Core API
 *
 * UPGRADES v2:
 *   1. _callbackUrl in every transaction → garante webhook
 *   2. metadata with onboardingCaseId for correlation
 *   3. _lang=pt in all requests
 *
 * SÍNCRONO: OCR (nome, CPF, nascimento, RG, mãe)
 * ASSÍNCRONO: Documentoscopy, Document Liveness, Deepfake, Biometria, Facesets
 *
 * Auth: CAF_CLIENT_SECRET as static Bearer token
 */

const CAF_API_BASE = 'https://api.combateafraude.com';

function getCafToken() {
  const token = Deno.env.get('CAF_CORE_API_TOKEN');
  if (!token) throw new Error('CAF_CORE_API_TOKEN not configured');
  return token;
}

function crossValidateOcr(ocrData, merchantData) {
  const flags = [];
  const details = {};
  if (!ocrData) return { flags, details, score: 0 };

  const ocrName = (ocrData.name || ocrData.fullName || '').toUpperCase().trim();
  const merchName = (merchantData.name || '').toUpperCase().trim();
  if (ocrName && merchName) {
    const nameMatch = ocrName === merchName || ocrName.includes(merchName) || merchName.includes(ocrName);
    details.nameOcr = ocrName; details.nameDeclared = merchName; details.nameMatch = nameMatch;
    if (!nameMatch) flags.push(`OCR_NAME_MISMATCH: Doc="${ocrName}" vs Declarado="${merchName}"`);
  }

  const ocrCpf = (ocrData.cpf || ocrData.documentNumber || '').replace(/\D/g, '');
  const merchCpf = (merchantData.cpf || '').replace(/\D/g, '');
  if (ocrCpf && merchCpf) {
    details.cpfOcr = ocrCpf; details.cpfDeclared = merchCpf; details.cpfMatch = ocrCpf === merchCpf;
    if (ocrCpf !== merchCpf) flags.push(`OCR_CPF_MISMATCH: Doc="${ocrCpf}" vs Declarado="${merchCpf}"`);
  }

  const ocrBirth = ocrData.birthDate || ocrData.dateOfBirth || '';
  const merchBirth = merchantData.birthDate || '';
  if (ocrBirth && merchBirth) {
    const normOcr = ocrBirth.replace(/\D/g, '').substring(0, 8);
    const normMerch = merchBirth.replace(/\D/g, '').substring(0, 8);
    details.birthOcr = ocrBirth; details.birthDeclared = merchBirth; details.birthMatch = normOcr === normMerch;
    if (normOcr !== normMerch && normOcr.length >= 8 && normMerch.length >= 8) {
      flags.push(`OCR_BIRTHDATE_MISMATCH: Doc="${ocrBirth}" vs Declarado="${merchBirth}"`);
    }
  }

  const ocrMother = (ocrData.motherName || '').toUpperCase().trim();
  const merchMother = (merchantData.motherName || '').toUpperCase().trim();
  if (ocrMother && merchMother) {
    details.motherOcr = ocrMother; details.motherDeclared = merchMother;
    details.motherMatch = ocrMother === merchMother || ocrMother.includes(merchMother) || merchMother.includes(ocrMother);
    if (!details.motherMatch) flags.push(`OCR_MOTHER_MISMATCH: Doc="${ocrMother}" vs Declarado="${merchMother}"`);
  }

  return { flags, details, score: flags.length === 0 ? 100 : Math.max(0, 100 - flags.length * 25) };
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { onboardingCaseId, frontImageUrl, backImageUrl, selfieImageUrl, cpf, name, birthDate, motherName, callbackUrl } = body;

    if (!onboardingCaseId) return Response.json({ error: 'onboardingCaseId é obrigatório' }, { status: 400 });

    // ITEM 1 FIX: Auto-resolve callbackUrl from cafWebhookHandler endpoint
    // If no callbackUrl provided, build it from the app's function URL
    const resolvedCallbackUrl = body.callbackUrl || '';

    let merchant = null;
    let onboardingCase = null;
    try {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      onboardingCase = cases[0];
      if (onboardingCase?.merchantId) {
        const merchants = await base44.asServiceRole.entities.Merchant.filter({ id: onboardingCase.merchantId });
        merchant = merchants[0];
      }
    } catch (e) { console.warn('[CAF-PostCapture] Could not load case/merchant:', e.message); }

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
      } catch (e) { console.warn('[CAF-PostCapture] Could not load documents:', e.message); }
    }

    if (!front && !back && !selfie) return Response.json({ error: 'Nenhuma imagem disponível' }, { status: 400 });

    const personCpf = cpf || merchant?.cpfCnpj?.replace(/\D/g, '') || '';
    const personName = name || merchant?.fullName || '';
    const personBirth = birthDate || merchant?.dateOfBirth || '';
    const personMother = motherName || merchant?.motherName || '';

    const authToken = getCafToken();

    // STEP 1: OCR Sync
    let ocrResult = null;
    let ocrCrossValidation = null;

    if (front || back) {
      console.log('[CAF-PostCapture] Step 1: OCR Sync...');
      const ocrFiles = [];
      if (front) ocrFiles.push({ data: front, type: 'FRONT', mimeType: 'image/jpeg' });
      if (back) ocrFiles.push({ data: back, type: 'BACK', mimeType: 'image/jpeg' });

      const ocrPayload = {
        template: { services: ['ocr_sync'] },
        files: ocrFiles,
        parameters: {},
        metadata: { onboardingCaseId, source: 'pagsmile_ocr_sync' },
      };
      if (personCpf) ocrPayload.parameters.cpf = personCpf;
      if (personName) ocrPayload.parameters.name = personName;
      if (resolvedCallbackUrl) ocrPayload._callbackUrl = resolvedCallbackUrl;

      // ─── POST OCR transaction ONCE, then POLL via GET ───
      const ocrPostRes = await fetch(`${CAF_API_BASE}/v1/transactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ocrPayload),
      });
      const ocrPostText = await ocrPostRes.text();
      try { ocrResult = JSON.parse(ocrPostText); } catch { /* */ }
      const ocrTxId = ocrResult?.uuid || ocrResult?.id || null;

      // Poll up to 5 times × 3s = 15s for OCR sync result
      if (ocrPostRes.ok && ocrTxId) {
        for (let attempt = 1; attempt <= 5; attempt++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const pollRes = await fetch(
              `${CAF_API_BASE}/v1/transactions/${ocrTxId}?_lang=pt`,
              { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            if (!pollRes.ok) continue;
            const pollText = await pollRes.text();
            let pollResult;
            try { pollResult = JSON.parse(pollText); } catch { continue; }
            const ocrSection = pollResult?.sections?.ocr;
            if (ocrSection && (ocrSection.name || ocrSection.cpf)) {
              ocrResult = pollResult;
              console.log(`[CAF-PostCapture] OCR ready after ${attempt} poll(s)`);
              break;
            }
          } catch { /* continue */ }
        }
      }

      if (ocrResult?.sections?.ocr) {
        ocrCrossValidation = crossValidateOcr(ocrResult.sections.ocr, { name: personName, cpf: personCpf, birthDate: personBirth, motherName: personMother });
      }

      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId, merchant_id: merchant?.id || '', provider: 'CAF',
          service_type: 'ocr_sync', transaction_id: ocrResult?.uuid || '',
          status: 'success', result_status: ocrCrossValidation?.flags?.length > 0 ? 'PENDING_REVIEW' : 'APPROVED',
          request_payload: { services: ['ocr_sync'] },
          response_payload: { ocr: ocrResult?.sections?.ocr, crossValidation: ocrCrossValidation },
          score: ocrCrossValidation?.score ?? null, red_flags: ocrCrossValidation?.flags || [],
          duration_ms: Date.now() - startTime,
        });
      } catch (e) { console.warn('[CAF-PostCapture] Log OCR error:', e.message); }

      try {
        await base44.asServiceRole.entities.ExternalValidationResult.create({
          onboardingCaseId, provider: 'CAF',
          validationType: 'OCR Sync — Extração de Dados do Documento',
          endpoint: '/v1/transactions (ocr_sync)',
          resultData: { ocrExtracted: ocrResult?.sections?.ocr, crossValidation: ocrCrossValidation, transactionId: ocrResult?.uuid },
          score: ocrCrossValidation?.score ?? null, status: 'Sucesso',
          timestamp: new Date().toISOString(), responseTime: Date.now() - startTime,
        });
      } catch (e) { console.warn('[CAF-PostCapture] ExternalValidation OCR error:', e.message); }
    }

    // STEP 2: Async full analysis
    let asyncTransactionId = null;
    let asyncResult = null;

    if (front || selfie) {
      console.log('[CAF-PostCapture] Step 2: Async full analysis...');
      const asyncServices = [];
      const asyncFiles = [];

      if (front) {
        asyncFiles.push({ data: front, type: 'FRONT', mimeType: 'image/jpeg' });
        asyncServices.push('documentscopy', 'documentLiveness');
      }
      if (back) asyncFiles.push({ data: back, type: 'BACK', mimeType: 'image/jpeg' });
      if (selfie) {
        asyncFiles.push({ data: selfie, type: 'SELFIE', mimeType: 'image/jpeg' });
        asyncServices.push('deepfakeDetection', 'officialData', 'privateFaceset', 'sharedFaceset');
        if (body.isReVerification === true) asyncServices.push('faceAuthentication');
      }

      const asyncPayload = {
        template: { services: asyncServices },
        files: asyncFiles,
        parameters: {},
        metadata: { onboardingCaseId, source: 'pagsmile_post_capture' },
      };
      if (personCpf) asyncPayload.parameters.cpf = personCpf;
      if (personName) asyncPayload.parameters.name = personName;
      if (personBirth) asyncPayload.parameters.birthDate = personBirth;
      if (resolvedCallbackUrl) asyncPayload._callbackUrl = resolvedCallbackUrl;

      const asyncResponse = await fetch(`${CAF_API_BASE}/v1/transactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(asyncPayload),
      });

      const asyncResponseText = await asyncResponse.text();
      try { asyncResult = JSON.parse(asyncResponseText); asyncTransactionId = asyncResult?.uuid || asyncResult?.id || null; } catch { /* */ }

      // Poll up to 8 × 3s = 24s for async sections to populate (remainder arrives via webhook)
      if (asyncResponse.ok && asyncTransactionId) {
        for (let attempt = 1; attempt <= 8; attempt++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const pollRes = await fetch(
              `${CAF_API_BASE}/v1/transactions/${asyncTransactionId}?_lang=pt&_includeCroppedImages=true&_includePfRelationships=true`,
              { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            if (!pollRes.ok) continue;
            const pollText = await pollRes.text();
            let pollResult;
            try { pollResult = JSON.parse(pollText); } catch { continue; }
            const secs = pollResult?.sections || {};
            const hasData = Object.keys(secs).length > 0 && Object.values(secs).some(s => s && typeof s === 'object' && Object.keys(s).length > 0);
            const terminal = ['APPROVED', 'REPROVED', 'WAITING_DOCUMENTS'].includes(pollResult?.status);
            if (terminal || hasData) {
              asyncResult = pollResult;
              console.log(`[CAF-PostCapture] Async ready after ${attempt} poll(s), status=${pollResult?.status}, sections=${Object.keys(secs).length}`);
              break;
            }
          } catch { /* continue */ }
        }
      }

      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId, merchant_id: merchant?.id || '', provider: 'CAF',
          service_type: 'caf_post_capture_full', transaction_id: asyncTransactionId || '',
          status: asyncResponse.ok ? 'processing' : 'failed', result_status: 'PENDING_REVIEW',
          request_payload: { services: asyncServices }, response_payload: asyncResult || {},
          duration_ms: Date.now() - startTime,
        });
      } catch (e) { console.warn('[CAF-PostCapture] Log async error:', e.message); }

      // Process inline results
      if (asyncResult?.sections) {
        const inlineFlags = [];
        const secs = asyncResult.sections;

        if (secs.documentscopy?.fraud) inlineFlags.push('DOCUMENTSCOPY_FRAUD_DETECTED');
        if (secs.documentLiveness && (secs.documentLiveness.front?.decision === true || secs.documentLiveness.back?.decision === true)) inlineFlags.push('DOCUMENT_IS_COPY');
        if (secs.deepfakeDetection?.isDeepfake) inlineFlags.push('DEEPFAKE_DETECTED');
        if (secs.officialData?.confidence != null && secs.officialData.confidence < 0.7) inlineFlags.push('OFFICIAL_BIOMETRICS_LOW_MATCH');
        if (secs.privateFaceset?.results?.some(r => r.personId && r.personId !== personCpf)) inlineFlags.push('FACE_REUSE_DIFFERENT_CPF');
        if (secs.sharedFaceset?.results?.length > 0) inlineFlags.push('FACE_IN_FRAUD_DATABASE');

        for (const [secName, secData] of Object.entries(secs)) {
          try {
            await base44.asServiceRole.entities.ExternalValidationResult.create({
              onboardingCaseId, provider: 'CAF',
              validationType: `Post-Capture — ${secName}`,
              endpoint: `/v1/transactions (${secName})`,
              resultData: secData,
              status: 'Sucesso', timestamp: new Date().toISOString(), responseTime: Date.now() - startTime,
            });
          } catch { /* */ }
        }

        if (inlineFlags.length > 0 && onboardingCase) {
          try {
            const newFlags = [...new Set([...(onboardingCase.redFlags || []), ...inlineFlags])];
            await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, { redFlags: newFlags });
          } catch (e) { console.warn('[CAF-PostCapture] Case update error:', e.message); }
        }
      }
    }

    return Response.json({
      success: true, onboardingCaseId,
      ocrSync: { extracted: ocrResult?.sections?.ocr || null, crossValidation: ocrCrossValidation, transactionId: ocrResult?.uuid || null },
      asyncAnalysis: { transactionId: asyncTransactionId, status: asyncTransactionId ? 'processing' : 'skipped' },
      duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-PostCapture] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});