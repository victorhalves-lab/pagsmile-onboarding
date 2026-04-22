import { base44 } from '@/api/base44Client';

/**
 * Upload a file to private storage with automatic retry on failure.
 * - 3 attempts total (1 initial + 2 retries)
 * - Exponential backoff: 1s, 2s
 * - Returns { file_uri } on success, throws on final failure with a user-friendly message
 *
 * HARDENED (2026-04-22): error message is ALWAYS actionable so clients know what to do.
 */
export async function uploadPrivateFileWithRetry(file, { maxAttempts = 3 } = {}) {
  if (!file) throw new Error('Nenhum arquivo selecionado');

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await base44.integrations.Core.UploadPrivateFile({ file });
      if (result?.file_uri) {
        if (attempt > 1) {
          console.log(`[upload] succeeded on attempt ${attempt}/${maxAttempts} for ${file.name}`);
        }
        return result;
      }
      throw new Error('Resposta inválida do servidor (sem file_uri)');
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[upload] tentativa ${attempt}/${maxAttempts} falhou para ${file?.name}:`, errMsg);
      if (attempt < maxAttempts) {
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  // Translate common errors to user-friendly messages
  const rawMsg = lastError?.message || String(lastError);
  let friendlyMsg = rawMsg;
  if (/network|fetch|failed to fetch/i.test(rawMsg)) {
    friendlyMsg = 'Conexão com o servidor falhou. Verifique sua internet e tente novamente.';
  } else if (/timeout|timed out/i.test(rawMsg)) {
    friendlyMsg = 'O upload demorou demais. Tente um arquivo menor ou verifique sua internet.';
  } else if (/413|too large|payload/i.test(rawMsg)) {
    friendlyMsg = 'Arquivo muito grande para upload. Reduza o tamanho ou divida em partes.';
  } else if (/401|403|unauthorized|forbidden/i.test(rawMsg)) {
    friendlyMsg = 'Sessão expirada. Recarregue a página e tente novamente.';
  }

  const finalError = new Error(friendlyMsg);
  finalError.originalMessage = rawMsg;
  throw finalError;
}