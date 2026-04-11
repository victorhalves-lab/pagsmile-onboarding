import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * Verifies and persists the result of a CAF SDK step (DocumentDetector or FaceLiveness).
 * 
 * For DocumentDetector: receives imageUrl (temporary CAF URL) or imageBase64, downloads/uploads
 * the image to our storage, creates IntegrationLog + ExternalValidationResult + DocumentUpload.
 * 
 * For FaceLiveness: decodes the signedResponse JWT which contains imageUrl, isAlive, isMatch etc.
 * Downloads the selfie image, uploads to storage, creates IntegrationLog + ExternalValidationResult + DocumentUpload.
 */

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { 
      onboardingCaseId, 
      module,           // 'document_front' | 'document_back' | 'liveness'
      // DocumentDetector fields
      imageUrl,         // temporary CAF URL for document image
      detectedDocument, // { type, side }
      isCaptureValid,
      storageInfo,      // { key, bucket } from CAF S3
      // FaceLiveness fields
      signedResponse,   // JWT string
    } = body;

    if (!onboardingCaseId) {
      return Response.json({ error: 'onboardingCaseId is required' }, { status: 400 });
    }
    if (!module) {
      return Response.json({ error: 'module is required' }, { status: 400 });
    }

    let isApproved = false;
    let decodedPayload = null;
    let cafImageUrl = imageUrl || null;
    let uploadedFileUrl = null;
    let similarity = null;
    let isAlive = null;

    // ── For FaceLiveness: decode JWT to extract data ──
    if (module === 'liveness' && signedResponse) {
      try {
        const parts = signedResponse.split('.');
        if (parts.length === 3) {
          const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payloadStr = atob(payloadB64);
          decodedPayload = JSON.parse(payloadStr);
          
          isAlive = decodedPayload.isAlive === true;
          isApproved = isAlive;
          similarity = decodedPayload.similarity || decodedPayload.isMatch ? 1.0 : null;
          
          // Extract imageUrl from JWT payload
          if (decodedPayload.imageUrl) {
            cafImageUrl = decodedPayload.imageUrl;
          }
        }
      } catch (decodeErr) {
        console.warn('[CAF] Failed to decode signedResponse JWT:', decodeErr.message);
      }
    }

    // ── For DocumentDetector: use the values passed directly ──
    if (module === 'document_front' || module === 'document_back') {
      isApproved = isCaptureValid !== false; // default true unless explicitly false
    }

    // ── Download image from CAF and upload to our storage ──
    if (cafImageUrl) {
      try {
        console.log('[CAF] Downloading image from CAF:', cafImageUrl.substring(0, 80) + '...');
        const imgResponse = await fetch(cafImageUrl);
        if (imgResponse.ok) {
          const imgBlob = await imgResponse.blob();
          const extension = imgBlob.type?.includes('png') ? 'png' : 'jpg';
          const timestamp = Date.now();
          const fileName = `caf_${module}_${onboardingCaseId}_${timestamp}.${extension}`;
          
          // Create a File object from the blob
          const file = new File([imgBlob], fileName, { type: imgBlob.type || 'image/jpeg' });
          
          const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          uploadedFileUrl = uploadResult.file_url;
          console.log('[CAF] Image uploaded successfully:', uploadedFileUrl);
        } else {
          console.warn('[CAF] Failed to download image from CAF:', imgResponse.status);
        }
      } catch (imgErr) {
        console.warn('[CAF] Error downloading/uploading image:', imgErr.message);
      }
    }

    // ── Map module to service_type for IntegrationLog ──
    const serviceTypeMap = {
      'document_front': 'document_detector_front',
      'document_back': 'document_detector_back',
      'liveness': 'face_liveness',
    };

    // ── Create IntegrationLog ──
    const integrationLogData = {
      onboarding_case_id: onboardingCaseId,
      provider: 'CAF',
      service_type: serviceTypeMap[module] || 'document_detector',
      request_id: decodedPayload?.requestId || decodedPayload?.sessionId || storageInfo?.key || '',
      status: isApproved ? 'success' : 'failed',
      result_status: isApproved ? 'APPROVED' : 'REPROVED',
      response_payload: decodedPayload || { 
        imageUrl: cafImageUrl, 
        detectedDocument, 
        isCaptureValid,
        storageInfo 
      },
      is_alive: isAlive,
      similarity: similarity,
      duration_ms: Date.now() - startTime,
      image_urls: uploadedFileUrl ? [uploadedFileUrl] : [],
    };

    try {
      await base44.asServiceRole.entities.IntegrationLog.create(integrationLogData);
      console.log('[CAF] IntegrationLog created for', module);
    } catch (logErr) {
      console.error('[CAF] Failed to create IntegrationLog:', logErr.message);
    }

    // ── Create ExternalValidationResult ──
    const validationData = {
      onboardingCaseId: onboardingCaseId,
      provider: 'CAF',
      validationType: module === 'liveness' ? 'FaceLiveness' : 
                      module === 'document_front' ? 'DocumentDetector Frente' : 'DocumentDetector Verso',
      endpoint: module === 'liveness' ? 'caf-sdk/face-liveness' : 'caf-sdk/document-detector',
      resultData: {
        ...(decodedPayload || {}),
        detectedDocument: detectedDocument || null,
        isCaptureValid: isCaptureValid,
        uploadedImageUrl: uploadedFileUrl,
        cafOriginalImageUrl: cafImageUrl,
        storageInfo: storageInfo || null,
      },
      status: isApproved ? 'Sucesso' : 'Falha',
      score: isAlive !== null ? (isAlive ? 100 : 0) : (isCaptureValid ? 100 : 0),
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    };

    try {
      await base44.asServiceRole.entities.ExternalValidationResult.create(validationData);
      console.log('[CAF] ExternalValidationResult created for', module);
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

      try {
        await base44.asServiceRole.entities.DocumentUpload.create({
          onboardingCaseId: onboardingCaseId,
          documentTypeId: docMeta.id,
          documentName: docMeta.name,
          fileUrl: uploadedFileUrl,
          fileName: `caf_${module}_${Date.now()}.jpg`,
          fileType: 'image/jpeg',
          uploadDate: new Date().toISOString(),
          validationStatus: isApproved ? 'Validado' : 'Pendente',
          validationNotes: module === 'liveness' 
            ? `Prova de vida: ${isAlive ? 'APROVADA' : 'REPROVADA'}${similarity ? `, similaridade: ${similarity}` : ''}`
            : `Documento ${detectedDocument?.type || 'detectado'} (${detectedDocument?.side || module}): ${isCaptureValid ? 'captura válida' : 'captura inválida'}`,
        });
        console.log('[CAF] DocumentUpload created for', module, '- URL:', uploadedFileUrl);
      } catch (docErr) {
        console.error('[CAF] Failed to create DocumentUpload:', docErr.message);
      }
    }

    // ── Update OnboardingCase if liveness approved ──
    if (module === 'liveness' && isApproved) {
      try {
        await base44.asServiceRole.entities.OnboardingCase.update(onboardingCaseId, {
          cafCompleted: true,
        });
        console.log('[CAF] OnboardingCase cafCompleted=true');
      } catch (upErr) {
        console.warn('[CAF] Failed to update case:', upErr.message);
      }
    }

    return Response.json({
      success: true,
      approved: isApproved,
      module,
      uploadedImageUrl: uploadedFileUrl,
      isAlive,
      similarity,
    });

  } catch (error) {
    console.error('[CAF] Error in cafVerifyResult:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});