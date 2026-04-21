import { base44 } from '@/api/base44Client';

/**
 * Upload a file to private storage with automatic retry on failure.
 * - 3 attempts total (1 initial + 2 retries)
 * - Exponential backoff: 1s, 2s
 * - Returns { file_uri } on success, throws on final failure
 *
 * On final failure: persists an IntegrationLog via logPublicClientError so that
 * we can diagnose problems without the client's browser console.
 */
export async function uploadPrivateFileWithRetry(file, { maxAttempts = 3, context = {} } = {}) {
  let lastError = null;
  const attemptErrors = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[upload] tentativa ${attempt}/${maxAttempts} — arquivo=${file?.name} tamanho=${file?.size} tipo=${file?.type}`);
      const result = await base44.integrations.Core.UploadPrivateFile({ file });
      if (result?.file_uri) {
        console.log(`[upload] sucesso na tentativa ${attempt} — uri=${result.file_uri}`);
        return result;
      }
      throw new Error('Resposta inválida do servidor (sem file_uri)');
    } catch (err) {
      lastError = err;
      const msg = err?.message || String(err);
      attemptErrors.push(`tentativa${attempt}=${msg}`);
      console.warn(`[upload] tentativa ${attempt}/${maxAttempts} falhou: ${msg}`, err);
      if (attempt < maxAttempts) {
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  // All attempts failed — log to backend so admins can see exactly what happened.
  try {
    await base44.functions.invoke('logPublicClientError', {
      stage: context.stage || 'file_upload',
      errorMessage: attemptErrors.join(' | '),
      caseId: context.caseId || null,
      merchantId: context.merchantId || null,
      linkCode: context.linkCode || null,
      fileName: file?.name || null,
      fileSize: file?.size || null,
      fileType: file?.type || null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      extra: { maxAttempts, documentSlot: context.documentSlot || null },
    });
  } catch (_) { /* never block on logging */ }
  throw lastError || new Error('Upload falhou após múltiplas tentativas');
}