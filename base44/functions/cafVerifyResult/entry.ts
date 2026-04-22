import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Verifies and persists the result of a CAF SDK step (DocumentDetector, FaceLiveness, or Manual Selfie).
 * 
 * COMPLETE DATA ENRICHMENT:
 * 
 * For DocumentDetector:
 *   - Receives imageBase64 (preferred, from blob) OR imageUrl (temporary CAF URL)
 *   - Uploads image to our permanent storage
 *   - Persists: detectedDocument (type, side), isCaptureValid, storageInfo (key, bucket)
 *   - Creates: IntegrationLog + ExternalValidationResult + DocumentUpload
 * 
 * For FaceLiveness:
 *   - Receives signedResponse = JWT STRING directly from CafFaceLivenessSdk.run()
 *   - Decodes JWT payload: imageUrl, isAlive, isMatch, sessionId, personId
 *   - Downloads selfie from imageUrl, uploads to our storage
 *   - Persists ALL fields including face authentication results
 *   - Creates: IntegrationLog + ExternalValidationResult + DocumentUpload
 *   - Updates OnboardingCase: cafCompleted=true when liveness approved
 * 
 * CAF Decision Mapping:
 *   isAlive=true + isMatch=true  → APPROVED (face match confirmed)
 *   isAlive=true + isMatch=false → PENDING_REVIEW (alive but no match)
 *   isAlive=false                → REPROVED
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    // Tolerante a tokens de cliente inválidos/expirados — este endpoint é chamado após
    // cada etapa do CAF SDK (documento frente, verso, liveness) e o cliente é anônimo.
    let base44;
    try {
      base44 = createClientFromRequest(req);
    } catch (_) {
      const { createClient } = await import('npm:@base44/sdk@0.8.25');
      base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
        requiresAuth: false,
      });
    }
    const body = await req.json();
    const { 
      onboardingCaseId, 
      module,           // 'document_front' | 'document_back' | 'liveness' | 'manual_selfie'
      docLinkToken,     // Authenticates the caller for this specific case (from publicComplianceSubmit)
      // DocumentDetector fields
      imageBase64,      // base64 data URI from blob (preferred — no expiry risk)
      imageUrl,         // temporary CAF URL for document image (fallback)
      detectedDocument, // { type, side }
      isCaptureValid,
      storageInfo,      // { key, bucket } from CAF S3
      // FaceLiveness fields
      signedResponse,   // JWT string DIRECTLY from CafFaceLivenessSdk.run()
      // Manual selfie fallback
      manualUpload,     // boolean - if true, this is a manual selfie upload
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId is required' }, { status: 400 });
    }
    if (!module) {
      return Response.json({ error: 'module is required' }, { status: 400 });
    }

    // Authenticate caller using the case's docLinkToken. Cases created before this deploy
    // may not have a token — we fall back to allow (backward compat) but log the bypass
    // so we can monitor how many legacy cases are still using the unauthenticated path.
    let theCase = null;
    try {
      const cases = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
      theCase = cases[0] || null;
    } catch (authErr) {
      // A lookup failure (malformed id, etc.) is treated the same as "not found" — we
      // simply can't find this case, so we refuse. We do NOT return 500 here because
      // that would let a malformed id become a DoS vector.
      console.warn('[CAF] cafVerifyResult case lookup failed:', authErr.message);
    }
    if (!theCase) {
      return Response.json({ error: 'Caso não encontrado' }, { status: 404 });
    }
    if (theCase.docLinkToken) {
      if (!docLinkToken || docLinkToken !== theCase.docLinkToken) {
        console.warn('[CAF] cafVerifyResult: invalid docLinkToken for case', onboardingCaseId);
        return Response.json({ error: 'Invalid or missing docLinkToken' }, { status: 403 });
      }
    } else {
      console.log('[CAF] cafVerifyResult: legacy case (no docLinkToken) — accepting:', onboardingCaseId);
    }

    let isApproved = false;
    let cafDecision = 'PENDING_REVIEW'; // APPROVED | REPROVED | PENDING_REVIEW
    let decodedPayload = null;
    let cafImageUrl = imageUrl || null;
    let uploadedFileUrl = null;
    let similarity = null;
    let isAlive = null;
    let isMatch = null;
    let sessionId = null;
    let livenessPersonId = null;
    let probability = null;

    // ── For FaceLiveness: decode JWT to extract ALL data ──
    if (module === 'liveness' && signedResponse) {
      try {
        // signedResponse IS the JWT string directly from run()
        const jwtString = typeof signedResponse === 'string' ? signedResponse : '';
        const parts = jwtString.split('.');
        if (parts.length === 3) {
          // Decode payload (part 1)
          let payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          // Pad if needed
          while (payloadB64.length % 4) payloadB64 += '=';
          const payloadStr = atob(payloadB64);
          decodedPayload = JSON.parse(payloadStr);
          
          console.log('[CAF] Decoded JWT payload keys:', Object.keys(decodedPayload));
          console.log('[CAF] isAlive:', decodedPayload.isAlive, 'isMatch:', decodedPayload.isMatch, 'sessionId:', decodedPayload.sessionId);
          
          // Extract ALL available fields from JWT
          isAlive = decodedPayload.isAlive === true;
          isMatch = decodedPayload.isMatch === true;
          sessionId = decodedPayload.sessionId || null;
          livenessPersonId = decodedPayload.personId || null;
          similarity = decodedPayload.similarity || null;
          probability = decodedPayload.probability || null;
          
          // Determine approval status based on all signals
          if (isAlive && isMatch) {
            isApproved = true;
            cafDecision = 'APPROVED';
          } else if (isAlive && !isMatch) {
            // Person is alive but face doesn't match document — needs manual review
            isApproved = false;
            cafDecision = 'PENDING_REVIEW';
          } else {
            isApproved = false;
            cafDecision = 'REPROVED';
          }
          
          // Extract imageUrl from JWT payload (selfie URL)
          if (decodedPayload.imageUrl) {
            cafImageUrl = decodedPayload.imageUrl;
          }
        } else {
          console.warn('[CAF] signedResponse is not a valid JWT (parts:', parts.length, ')');
        }
      } catch (decodeErr) {
        console.error('[CAF] Failed to decode signedResponse JWT:', decodeErr.message);
        console.error('[CAF] signedResponse type:', typeof signedResponse, 'length:', signedResponse?.length);
      }
    }

    // ── For DocumentDetector: use the values passed directly ──
    if (module === 'document_front' || module === 'document_back') {
      isApproved = isCaptureValid !== false; // default true unless explicitly false
      cafDecision = isApproved ? 'APPROVED' : 'REPROVED';
    }

    // ── Upload image to our permanent storage ──
    // Priority: imageBase64 (from blob, reliable) > cafImageUrl (temporary, may expire)
    if (imageBase64 && imageBase64.startsWith('data:')) {
      try {
        console.log('[CAF] Uploading image from base64 blob...');
        // Extract the base64 content and mime type
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const b64Data = matches[2];
          const binaryStr = atob(b64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          
          const extension = mimeType.includes('png') ? 'png' : 'jpg';
          const timestamp = Date.now();
          const fileName = `caf_${module}_${onboardingCaseId}_${timestamp}.${extension}`;
          const file = new File([bytes], fileName, { type: mimeType });
          
          const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          uploadedFileUrl = uploadResult.file_url;
          console.log('[CAF] Image uploaded from base64 successfully:', uploadedFileUrl);
        }
      } catch (b64Err) {
        console.warn('[CAF] Failed to upload from base64:', b64Err.message);
      }
    }
    
    // Fallback: download from CAF temporary URL if base64 upload failed
    if (!uploadedFileUrl && cafImageUrl) {
      try {
        console.log('[CAF] Fallback: downloading image from CAF URL:', cafImageUrl.substring(0, 80) + '...');
        const imgResponse = await fetch(cafImageUrl);
        if (imgResponse.ok) {
          const imgBlob = await imgResponse.blob();
          const extension = imgBlob.type?.includes('png') ? 'png' : 'jpg';
          const timestamp = Date.now();
          const fileName = `caf_${module}_${onboardingCaseId}_${timestamp}.${extension}`;
          const file = new File([imgBlob], fileName, { type: imgBlob.type || 'image/jpeg' });
          
          const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          uploadedFileUrl = uploadResult.file_url;
          console.log('[CAF] Image uploaded from URL successfully:', uploadedFileUrl);
        } else {
          console.warn('[CAF] Failed to download image from CAF URL:', imgResponse.status);
        }
      } catch (imgErr) {
        console.warn('[CAF] Error downloading/uploading image from URL:', imgErr.message);
      }
    }

    const durationMs = Date.now() - startTime;

    // ── Handle manual selfie upload ──
    if (module === 'manual_selfie') {
      const manualImageUrl = imageUrl || null;
      if (manualImageUrl) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: 'face_liveness',
            status: 'success',
            result_status: 'PENDING_REVIEW',
            image_urls: [manualImageUrl],
            response_payload: { manualUpload: true, imageUrl: manualImageUrl },
            red_flags: ['MANUAL_SELFIE_UPLOAD'],
            duration_ms: Date.now() - startTime,
          });
          await base44.asServiceRole.entities.DocumentUpload.create({
            onboardingCaseId,
            documentTypeId: 'caf_selfie_manual',
            documentName: 'Selfie Manual (Fallback)',
            fileUrl: manualImageUrl,
            fileName: `manual_selfie_${Date.now()}.jpg`,
            fileType: 'image/jpeg',
            uploadDate: new Date().toISOString(),
            validationStatus: 'Pendente',
            validationNotes: 'Selfie enviada manualmente ap\u00f3s falha no FaceLiveness. Requer revis\u00e3o manual.',
          });
          // Update case: mark as needing manual review for face
          const existingCase = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          const currentFlags = existingCase[0]?.redFlags || [];
          const newFlags = currentFlags.includes('MANUAL_SELFIE') ? currentFlags : [...currentFlags, 'MANUAL_SELFIE'];
          await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
            cafCompleted: false,
            redFlags: newFlags,
          });
          console.log('[CAF] Manual selfie saved successfully');
        } catch (manualErr) {
          console.error('[CAF] Failed to save manual selfie:', manualErr.message);
        }
      }
      return Response.json({ success: true, module: 'manual_selfie', cafDecision: 'PENDING_REVIEW' });
    }

    // ── Dedup: check if document already exists for this case+module ──
    if (module === 'document_front' || module === 'document_back') {
      try {
        const docTypeId = module === 'document_front' ? 'caf_doc_front' : 'caf_doc_back';
        const existingDocs = await base44.asServiceRole.entities.DocumentUpload.filter({
          onboardingCaseId: onboardingCaseId,
          documentTypeId: docTypeId,
        });
        if (existingDocs.length > 0) {
          console.log(`[CAF] Document ${module} already exists for case ${onboardingCaseId} (${existingDocs.length} records). Skipping duplicate.`);
          return Response.json({
            success: true,
            approved: true,
            cafDecision: 'APPROVED',
            module,
            uploadedImageUrl: existingDocs[0]?.fileUrl,
            deduplicated: true,
          });
        }
      } catch (dedupErr) {
        console.warn('[CAF] Dedup check failed, proceeding with save:', dedupErr.message);
      }
    }

    // ── Map module to service_type for IntegrationLog ──
    const serviceTypeMap = {
      'document_front': 'document_detector_front',
      'document_back': 'document_detector_back',
      'liveness': 'face_liveness',
    };

    // ── Create IntegrationLog (FULL enrichment) ──
    const integrationLogData = {
      onboarding_case_id: onboardingCaseId,
      provider: 'CAF',
      service_type: serviceTypeMap[module] || 'document_detector',
      request_id: sessionId || decodedPayload?.requestId || storageInfo?.key || '',
      transaction_id: sessionId || null,
      status: isApproved ? 'success' : 'failed',
      result_status: cafDecision,
      response_payload: module === 'liveness' ? {
        // Full liveness payload
        isAlive,
        isMatch,
        sessionId,
        personId: livenessPersonId,
        similarity,
        probability,
        imageUrl: cafImageUrl,
        uploadedImageUrl: uploadedFileUrl,
        jwtPayload: decodedPayload,
      } : {
        // Full document payload
        imageUrl: cafImageUrl,
        uploadedImageUrl: uploadedFileUrl,
        detectedDocument,
        isCaptureValid,
        storageInfo,
      },
      is_alive: isAlive,
      similarity: similarity || (isMatch === true ? 1.0 : isMatch === false ? 0.0 : null),
      probability: probability,
      duration_ms: durationMs,
      image_urls: uploadedFileUrl ? [uploadedFileUrl] : [],
      red_flags: module === 'liveness' ? (
        [
          ...(isAlive === false ? ['LIVENESS_FAILED'] : []),
          ...(isMatch === false ? ['FACE_MISMATCH'] : []),
        ]
      ) : (
        isCaptureValid === false ? ['INVALID_CAPTURE'] : []
      ),
    };

    try {
      await base44.asServiceRole.entities.IntegrationLog.create(integrationLogData);
      console.log('[CAF] IntegrationLog created for', module, '- decision:', cafDecision);
    } catch (logErr) {
      console.error('[CAF] Failed to create IntegrationLog:', logErr.message);
    }

    // ── Create ExternalValidationResult (FULL enrichment) ──
    const validationTypeName = module === 'liveness' ? 'FaceLiveness' : 
                    module === 'document_front' ? 'DocumentDetector Frente' : 'DocumentDetector Verso';

    const validationData = {
      onboardingCaseId: onboardingCaseId,
      provider: 'CAF',
      validationType: validationTypeName,
      endpoint: module === 'liveness' ? 'caf-sdk/face-liveness' : 'caf-sdk/document-detector',
      resultData: {
        // Common fields
        uploadedImageUrl: uploadedFileUrl,
        cafOriginalImageUrl: cafImageUrl,
        cafDecision: cafDecision,
        // Liveness-specific fields
        ...(module === 'liveness' ? {
          isAlive,
          isMatch,
          sessionId,
          personId: livenessPersonId,
          similarity,
          probability,
          jwtPayloadFull: decodedPayload,
        } : {}),
        // Document-specific fields
        ...(module !== 'liveness' ? {
          detectedDocument: detectedDocument || null,
          isCaptureValid,
          storageInfo: storageInfo || null,
          documentType: detectedDocument?.type || null,
          documentSide: detectedDocument?.side || null,
        } : {}),
      },
      status: isApproved ? 'Sucesso' : (cafDecision === 'PENDING_REVIEW' ? 'Pendente' : 'Falha'),
      score: module === 'liveness' 
        ? (isAlive && isMatch ? 100 : isAlive ? 50 : 0)
        : (isCaptureValid ? 100 : 0),
      timestamp: new Date().toISOString(),
      responseTime: durationMs,
    };

    try {
      await base44.asServiceRole.entities.ExternalValidationResult.create(validationData);
      console.log('[CAF] ExternalValidationResult created for', module, '- score:', validationData.score);
    } catch (valErr) {
      console.error('[CAF] Failed to create ExternalValidationResult:', valErr.message);
    }

    // ── Create DocumentUpload for the image ──
    if (uploadedFileUrl) {
      const docTypeMap = {
        'document_front': { id: 'caf_doc_front', name: 'CAF — Documento Frente (SDK)' },
        'document_back': { id: 'caf_doc_back', name: 'CAF — Documento Verso (SDK)' },
        'liveness': { id: 'caf_selfie_liveness', name: 'CAF — Selfie / Prova de Vida (SDK)' },
      };
      const docMeta = docTypeMap[module] || { id: `caf_${module}`, name: `CAF — ${module}` };

      // Build detailed validation notes
      let validationNotes = '';
      if (module === 'liveness') {
        const parts = [];
        parts.push(`Prova de vida: ${isAlive ? 'APROVADA' : 'REPROVADA'}`);
        if (isMatch !== null) parts.push(`Face match: ${isMatch ? 'CONFIRMADO' : 'NÃO CORRESPONDEU'}`);
        if (similarity !== null) parts.push(`Similaridade: ${(similarity * 100).toFixed(1)}%`);
        if (sessionId) parts.push(`Session: ${sessionId}`);
        parts.push(`Decisão CAF: ${cafDecision}`);
        validationNotes = parts.join(' | ');
      } else {
        const parts = [];
        parts.push(`Documento: ${detectedDocument?.type || 'detectado'} (${detectedDocument?.side || module})`);
        parts.push(`Captura: ${isCaptureValid ? 'válida' : 'inválida'}`);
        if (storageInfo?.key) parts.push(`S3 key: ${storageInfo.key}`);
        validationNotes = parts.join(' | ');
      }

      try {
        await base44.asServiceRole.entities.DocumentUpload.create({
          onboardingCaseId: onboardingCaseId,
          documentTypeId: docMeta.id,
          documentName: docMeta.name,
          fileUrl: uploadedFileUrl,
          fileName: `caf_${module}_${Date.now()}.jpg`,
          fileType: 'image/jpeg',
          uploadDate: new Date().toISOString(),
          validationStatus: isApproved ? 'Validado' : (cafDecision === 'PENDING_REVIEW' ? 'Pendente' : 'Rejeitado'),
          validationNotes,
        });
        console.log('[CAF] DocumentUpload created for', module);
      } catch (docErr) {
        console.error('[CAF] Failed to create DocumentUpload:', docErr.message);
      }
    }

    // ── Update OnboardingCase based on liveness result ──
    if (module === 'liveness') {
      try {
        const updateData = { cafCompleted: true };
        
        // If liveness failed or face didn't match, flag the case
        if (!isAlive) {
          updateData.cafCompleted = false;
          // Add red flag
          const existingCase = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          const currentFlags = existingCase[0]?.redFlags || [];
          if (!currentFlags.includes('CAF_LIVENESS_FAILED')) {
            updateData.redFlags = [...currentFlags, 'CAF_LIVENESS_FAILED'];
          }
        } else if (!isMatch) {
          // Alive but face doesn't match — still flag for review
          const existingCase = await base44.asServiceRole.entities.OnboardingCase.filter({ id: onboardingCaseId });
          const currentFlags = existingCase[0]?.redFlags || [];
          if (!currentFlags.includes('CAF_FACE_MISMATCH')) {
            updateData.redFlags = [...currentFlags, 'CAF_FACE_MISMATCH'];
          }
        }
        
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, updateData);
        console.log('[CAF] OnboardingCase updated - cafCompleted:', updateData.cafCompleted, 
                    'redFlags:', updateData.redFlags ? updateData.redFlags.length : 'unchanged');
      } catch (upErr) {
        console.warn('[CAF] Failed to update case:', upErr.message);
      }
    }

    return Response.json({
      success: true,
      approved: isApproved,
      cafDecision,
      module,
      uploadedImageUrl: uploadedFileUrl,
      isAlive,
      isMatch,
      similarity,
      sessionId,
      probability,
    });

  } catch (error) {
    console.error('[CAF] Error in cafVerifyResult:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});