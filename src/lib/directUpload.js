/**
 * BULLETPROOF DIRECT UPLOAD — uses base44.functions.invoke (native SDK public channel).
 *
 * Strategy (chosen after validating all alternatives):
 *   1. Convert the File to base64 in the browser using FileReader (100% native, zero SDK).
 *   2. Send as JSON via base44.functions.invoke('publicDirectDocUpload', { fileBase64, ... }).
 *   3. The server decodes base64 → File → uses asServiceRole.integrations.Core.UploadPrivateFile.
 *
 * Why this is 100% reliable on PUBLIC routes:
 *   - base44.functions.invoke works anonymously (requiresAuth:false in base44Client)
 *   - It does NOT touch SDK.integrations.Core.UploadPrivateFile on the client (the
 *     function that was causing the crashes with stale tokens)
 *   - JSON transport is stable; no multipart / CORS edge cases
 *   - Progress feedback is best-effort (FileReader progress + toast updates)
 *
 * Size limit: Base44 function payload cap ~10MB, so we accept files up to ~7MB
 * (base64 adds ~33% overhead). For larger files, the caller should compress first.
 */

import { base44 } from '@/api/base44Client';

const MAX_FILE_SIZE_MB = 7; // hard cap — base64 overhead pushes 7MB → ~9.3MB payload

function readFileAsBase64(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable && typeof onProgress === 'function') {
        const pct = Math.round((evt.loaded / evt.total) * 50); // 0-50% reading
        try { onProgress(pct); } catch (_) {}
      }
    };
    reader.onload = () => {
      // result is a data URL: "data:mime;base64,XXX" — keep as-is (server handles both forms)
      resolve(reader.result);
    };
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
    const res = await base44.functions.invoke('publicDirectDocUpload', {
      caseId,
      documentTypeId,
      documentName: documentName || documentTypeId,
      docLinkToken: docLinkToken || undefined,
      notAvailable: true,
      notAvailableReason,
      uploadDate: new Date().toISOString(),
    });
    if (typeof onProgress === 'function') { try { onProgress(100); } catch (_) {} }
    const data = res?.data || {};
    if (!data.ok) throw new Error(data.error || 'Falha ao registrar justificativa');
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

  const fileBase64 = await readFileAsBase64(file, onProgress);

  // 50-95% = network send / server processing — we can't track it precisely,
  // so we tick progress forward every 1.5s so the user sees activity.
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
    const res = await base44.functions.invoke('publicDirectDocUpload', {
      caseId,
      documentTypeId,
      documentName: documentName || documentTypeId,
      docLinkToken: docLinkToken || undefined,
      fileBase64,
      fileName: file.name || 'arquivo',
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size || 0,
      uploadDate: new Date().toISOString(),
    });
    if (tickStop) tickStop();
    if (typeof onProgress === 'function') { try { onProgress(100); } catch (_) {} }
    const data = res?.data || {};
    if (!data.ok) throw new Error(data.error || 'Falha ao enviar arquivo');
    return data;
  } catch (err) {
    if (tickStop) tickStop();
    throw err;
  }
}