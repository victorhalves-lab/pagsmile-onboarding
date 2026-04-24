/**
 * SDK-FREE direct document upload.
 *
 * Uploads files by converting to base64 in the browser and POSTing as JSON
 * to `/functions/publicDirectDocUpload`. Completely bypasses @base44/sdk
 * to avoid its MessagePort/instanceof crash on public routes.
 *
 * Backend is idempotent (same case+docType+fileName+fileSize within 60s
 * returns the existing record), so retries are SAFE — no duplicates.
 *
 * Size limit: Base44 function payload cap ~10MB, so we accept files up to
 * ~7MB (base64 adds ~33% overhead). For larger files, callers must compress.
 */

import { callPublicFunction } from '@/lib/publicApi';

const MAX_FILE_SIZE_MB = 7;

function readFileAsBase64(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable && typeof onProgress === 'function') {
        const pct = Math.round((evt.loaded / evt.total) * 50); // 0-50% reading
        try { onProgress(pct); } catch (_) {}
      }
    };
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo no navegador'));
    reader.onabort = () => reject(new Error('Leitura do arquivo cancelada'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a single document.
 *
 * @param {Object} params
 * @param {File|null} params.file
 * @param {string} params.caseId
 * @param {string} params.documentTypeId
 * @param {string} params.documentName
 * @param {string} params.docLinkToken
 * @param {boolean} [params.notAvailable]
 * @param {string} [params.notAvailableReason]
 * @param {(pct:number)=>void} [params.onProgress]
 * @returns {Promise<Object>} { ok, documentUploadId, fileUri, fileUrl, ... }
 */
export async function directUploadDocument({
  file,
  caseId,
  documentTypeId,
  documentName,
  docLinkToken,
  notAvailable = false,
  notAvailableReason = '',
  onProgress,
}) {
  if (!caseId) throw new Error('caseId é obrigatório');
  if (!documentTypeId) throw new Error('documentTypeId é obrigatório');

  // ── Branch A: not-available justification ──
  if (notAvailable) {
    if (typeof onProgress === 'function') { try { onProgress(30); } catch (_) {} }
    const data = await callPublicFunction('publicDirectDocUpload', {
      caseId,
      documentTypeId,
      documentName: documentName || documentTypeId,
      docLinkToken: docLinkToken || undefined,
      notAvailable: true,
      notAvailableReason,
      uploadDate: new Date().toISOString(),
    });
    if (typeof onProgress === 'function') { try { onProgress(100); } catch (_) {} }
    if (!data?.ok) throw new Error(data?.error || 'Falha ao registrar justificativa');
    return data;
  }

  // ── Branch B: real file ──
  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error('Arquivo inválido');
  }

  const fileSizeMB = (file.size || 0) / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(
      `Arquivo muito grande (${fileSizeMB.toFixed(1)} MB). Máximo: ${MAX_FILE_SIZE_MB} MB. ` +
      `Reduza o tamanho do arquivo (compressão de imagem ou divida o PDF) e tente novamente.`
    );
  }

  let fileBase64 = await readFileAsBase64(file, onProgress);

  // 50-95% = network send / server processing — we can't track it precisely,
  // so we tick progress forward every 1.2s so the user sees activity.
  let tickStop = null;
  if (typeof onProgress === 'function') {
    let pct = 55;
    const tick = () => {
      pct = Math.min(90, pct + 3);
      try { onProgress(pct); } catch (_) {}
    };
    const interval = setInterval(tick, 1200);
    tickStop = () => clearInterval(interval);
  }

  try {
    // Build payload locally so we can NULL OUT fileBase64 immediately after
    // send, freeing ~2MB of string memory. Without this, multiple uploads
    // stack base64 strings in the JS heap, which combined with repeated
    // JSON.stringify calls freezes Chrome after ~6-8 files.
    const payload = {
      caseId,
      documentTypeId,
      documentName: documentName || documentTypeId,
      docLinkToken: docLinkToken || undefined,
      fileBase64,
      fileName: file.name || 'arquivo',
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size || 0,
      uploadDate: new Date().toISOString(),
    };
    // CRITICAL: use callPublicFunction (no retry) instead of ...WithRetry.
    // Retrying a 2MB base64 payload runs JSON.stringify up to 9x on the main
    // thread for a single upload — that is what was blocking the UI thread
    // and triggering "Página sem resposta". If the upload legitimately fails,
    // the user can click retry manually; the backend is idempotent.
    const data = await callPublicFunction('publicDirectDocUpload', payload);
    // Free the huge base64 strings immediately (both our local copy and the
    // payload reference) so GC can reclaim them before the next upload.
    fileBase64 = null;
    payload.fileBase64 = null;
    if (tickStop) tickStop();
    if (typeof onProgress === 'function') { try { onProgress(100); } catch (_) {} }
    // Gateway envelope case: function likely succeeded server-side (upload duration
    // outran gateway's auth-validation timeout), but we can't read documentUploadId.
    // Treat as success — the backend is idempotent. Client shows success; next
    // resume/bootstrap call will pick up the DocumentUpload row and merge state.
    if (data?._gatewayEnvelope) {
      return {
        ok: true,
        documentUploadId: null,
        fileUri: null,
        fileUrl: null,
        _gatewayEnvelope: true,
      };
    }
    if (!data?.ok) throw new Error(data?.error || 'Falha ao enviar arquivo');
    return data;
  } catch (err) {
    fileBase64 = null;
    if (tickStop) tickStop();
    throw err;
  }
}