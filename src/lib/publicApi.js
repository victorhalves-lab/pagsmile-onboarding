/**
 * SDK-FREE public API client.
 *
 * Calls Base44 backend functions via raw `fetch`, completely bypassing the
 * `@base44/sdk` runtime. This exists because the SDK attempts to validate
 * the auth session in the background on mount — even when initialized with
 * token=null — which on some browsers throws an internal
 * `TypeError: Right-hand side of 'instanceof' is not callable` from its
 * MessagePort handler, crashing the page before React can render.
 *
 * Since our public functions (publicOnboardingBootstrap, publicOnboardingSave,
 * publicOnboardingFinalize, publicDirectDocUpload) all validate the URL
 * docLinkToken server-side via `asServiceRole`, we do NOT need any auth
 * headers — anonymous POST works perfectly.
 *
 * Endpoint pattern: `POST /functions/{functionName}` with JSON body.
 * This is the same URL the SDK uses internally, just without its
 * token-validation plumbing.
 */

/**
 * Call a backend function with a JSON payload.
 * Returns the parsed JSON response. Throws on network failure or non-2xx.
 *
 * @param {string} functionName
 * @param {object} payload
 * @returns {Promise<any>}
 */
export async function callPublicFunction(functionName, payload = {}) {
  if (!functionName) throw new Error('functionName é obrigatório');

  const res = await fetch(`/functions/${functionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
    credentials: 'omit', // never send cookies — public endpoints are fully stateless
  });

  // Even for 4xx/5xx we try to parse JSON so callers can read { ok: false, reason }
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }

  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return body;
}

/**
 * Call a backend function with retry on transient network errors.
 * Used for uploads / saves that might fail due to flaky network but are
 * safe to retry because backend is idempotent.
 */
export async function callPublicFunctionWithRetry(functionName, payload, { maxAttempts = 3, backoffMs = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await callPublicFunction(functionName, payload);
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || '').toLowerCase();
      const retryable =
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('aborted') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed') ||
        msg.includes('http 5');
      if (!retryable || attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  throw lastErr;
}