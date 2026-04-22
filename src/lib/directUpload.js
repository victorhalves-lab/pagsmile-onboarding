/**
 * BULLETPROOF DIRECT UPLOAD — ZERO SDK DEPENDENCY
 *
 * Uploads a single file directly to the `publicDirectDocUpload` backend function
 * using the native browser XMLHttpRequest API (for progress events) or fetch (fallback).
 *
 * Why this exists:
 *   The Base44 SDK's `integrations.Core.UploadPrivateFile` is great in authenticated
 *   contexts, but on public routes it can fail with obscure errors
 *   (e.g. "instanceof is not callable", legacy session token crashes).
 *   This module bypasses the SDK entirely — raw multipart/form-data → server.
 *
 * The server handles:
 *   - File storage (asServiceRole → Base44 private storage)
 *   - DocumentUpload entity creation
 *   - CAF VerifAI documentoscopia trigger (async, non-blocking)
 *
 * Returns: { ok, documentUploadId, fileUri, fileUrl, fileName, fileSize, fileType }
 */

const BASE44_APP_ID = '6983b65f017b96d5f695f9bb';

function getFunctionUrl() {
  // Base44 serves functions at https://app.base44.com/api/apps/<appId>/functions/<name>
  // We resolve this from the current origin to keep it portable across prod/dev/custom domains.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/api/apps/${BASE44_APP_ID}/functions/publicDirectDocUpload`;
}

/**
 * Uploads a single file (or a not-available justification) to the backend.
 *
 * @param {Object} params
 * @param {File|null} params.file           - The file to upload (null for notAvailable).
 * @param {string} params.caseId            - OnboardingCase ID.
 * @param {string} params.documentTypeId    - Document type key.
 * @param {string} params.documentName      - Human-readable name for the doc slot.
 * @param {string} params.docLinkToken      - Security token for public doc-only links.
 * @param {boolean} [params.notAvailable]   - True → no file, just a justification.
 * @param {string} [params.notAvailableReason] - Required when notAvailable=true.
 * @param {(pct: number) => void} [params.onProgress] - Callback (0-100).
 * @param {number} [params.timeoutMs=120000] - Abort upload if takes too long.
 * @returns {Promise<Object>} The server response payload.
 */
export function directUploadDocument({
  file,
  caseId,
  documentTypeId,
  documentName,
  docLinkToken,
  notAvailable = false,
  notAvailableReason = '',
  onProgress,
  timeoutMs = 120000,
}) {
  return new Promise((resolve, reject) => {
    if (!caseId) return reject(new Error('caseId é obrigatório'));
    if (!documentTypeId) return reject(new Error('documentTypeId é obrigatório'));
    if (!notAvailable && !(file instanceof File) && !(file instanceof Blob)) {
      return reject(new Error('Arquivo é obrigatório'));
    }

    const form = new FormData();
    form.append('caseId', caseId);
    form.append('documentTypeId', documentTypeId);
    form.append('documentName', documentName || documentTypeId);
    if (docLinkToken) form.append('docLinkToken', docLinkToken);
    form.append('notAvailable', notAvailable ? 'true' : 'false');
    form.append('uploadDate', new Date().toISOString());
    if (notAvailable) {
      form.append('notAvailableReason', notAvailableReason || '');
    } else {
      // Preserve the original filename — FormData would otherwise use "blob" for Blobs.
      const name = file?.name || 'arquivo';
      form.append('file', file, name);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', getFunctionUrl(), true);
    xhr.timeout = timeoutMs;

    // Progress events — only available for XHR (fetch doesn't expose upload progress).
    if (typeof onProgress === 'function' && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          try { onProgress(Math.min(99, pct)); } catch (_) {}
        }
      };
    }

    xhr.onload = () => {
      // Final tick so UI shows 100%.
      if (typeof onProgress === 'function') {
        try { onProgress(100); } catch (_) {}
      }
      let body = null;
      try { body = JSON.parse(xhr.responseText || '{}'); } catch (_) { body = { raw: xhr.responseText }; }
      if (xhr.status >= 200 && xhr.status < 300 && body?.ok === true) {
        resolve(body);
      } else {
        const msg = body?.error || `HTTP ${xhr.status}`;
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Erro de rede ao enviar arquivo. Verifique sua conexão.'));
    xhr.ontimeout = () => reject(new Error('Tempo esgotado ao enviar arquivo. Tente novamente com uma conexão mais estável.'));
    xhr.onabort = () => reject(new Error('Envio cancelado'));

    xhr.send(form);
  });
}