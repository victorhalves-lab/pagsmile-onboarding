import { base44 } from '@/api/base44Client';

/**
 * Upload a file to private storage with automatic retry on failure.
 * - 3 attempts total (1 initial + 2 retries)
 * - Exponential backoff: 1s, 2s
 * - Returns { file_uri } on success, throws on final failure
 */
export async function uploadPrivateFileWithRetry(file, { maxAttempts = 3 } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await base44.integrations.Core.UploadPrivateFile({ file });
      if (result?.file_uri) return result;
      throw new Error('Resposta inválida do servidor (sem file_uri)');
    } catch (err) {
      lastError = err;
      console.warn(`[upload] tentativa ${attempt}/${maxAttempts} falhou:`, err?.message);
      if (attempt < maxAttempts) {
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError || new Error('Upload falhou após múltiplas tentativas');
}