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
 * Build candidate URLs to hit the backend function.
 *
 * Base44 apps may be served from different origins depending on environment:
 *   - Preview: https://preview-sandbox--{appId}.base44.app
 *   - Production custom domain: e.g. https://app.pagsmile.com
 *   - Embedded shell: appBaseUrl passed via query param
 *
 * The functions gateway lives at `{appBaseUrl}/api/apps/{appId}/functions/{name}`.
 * We try, in order:
 *   1. {appBaseUrl}/api/apps/{appId}/functions/{name}  (when appBaseUrl is known)
 *   2. /api/apps/{appId}/functions/{name}              (same-origin — works on preview.base44.app)
 *   3. /functions/{name}                                (legacy same-origin)
 * and return the first that yields a JSON body.
 */
function buildCandidateUrls(functionName) {
  const urls = [];
  let storedAppBaseUrl = null;
  try {
    const appId =
      (typeof window !== 'undefined' && window.localStorage.getItem('base44_app_id')) ||
      import.meta.env.VITE_BASE44_APP_ID;
    storedAppBaseUrl =
      (typeof window !== 'undefined' && window.localStorage.getItem('base44_app_base_url')) ||
      import.meta.env.VITE_BASE44_APP_BASE_URL;

    // Same-origin URLs FIRST — these always match the current domain
    // (critical when the app has a custom domain like autonboarding.base44.app
    // and the stored appBaseUrl still points to an old domain).
    if (appId) {
      urls.push(`/api/apps/${appId}/functions/${functionName}`);
    }
    urls.push(`/functions/${functionName}`);

    // Only add the stored appBaseUrl as a FALLBACK if its hostname matches
    // the current origin. If the domain changed (e.g. custom domain migration),
    // the stored appBaseUrl is stale and would produce CORS or auth errors.
    if (appId && storedAppBaseUrl) {
      try {
        const storedHost = new URL(String(storedAppBaseUrl)).hostname;
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
        if (storedHost === currentHost) {
          const base = String(storedAppBaseUrl).replace(/\/+$/, '');
          urls.push(`${base}/api/apps/${appId}/functions/${functionName}`);
        } else {
          // Domain mismatch — clear stale value so future calls skip this check
          if (typeof window !== 'undefined') {
            try { window.localStorage.removeItem('base44_app_base_url'); } catch (_) {}
          }
        }
      } catch (_) {
        // storedAppBaseUrl is not a valid URL — skip it
      }
    }
  } catch (_) {}
  return urls;
}

async function fetchFunction(functionName, payload) {
  const urls = buildCandidateUrls(functionName);
  let lastError = null;
  let lastAuthResponse = null;
  // CRITICAL: Stringify ONCE outside the loop. Previously we called
  // JSON.stringify on every URL attempt (up to 3x), which for upload payloads
  // (base64 strings ~2MB per file) would block the main thread for 200-500ms
  // EACH — stacking with retry amplification to ~9 blocking calls per upload.
  // That is why the onboarding page froze ("Página sem resposta") after 6-8
  // files. Now the browser stringifies the payload a single time per call.
  const bodyString = JSON.stringify(payload || {});
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyString,
        credentials: 'omit',
      });
      // Server replied with HTML (wrong endpoint) → skip to next candidate.
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        lastError = new Error(`non-json response from ${url} (status ${res.status})`);
        continue;
      }
      // Save 401/403 responses as fallback — if all other URLs also fail,
      // we return this so callPublicFunction can handle gateway envelopes.
      if (res.status === 401 || res.status === 403) {
        lastAuthResponse = res;
        lastError = new Error(`auth error from ${url} (status ${res.status})`);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  // If we got an auth response from at least one URL, return it so
  // callPublicFunction can detect gateway envelopes and retry appropriately.
  if (lastAuthResponse) return lastAuthResponse;
  throw lastError || new Error('all function endpoints failed');
}

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

  const res = await fetchFunction(functionName, payload);

  // Even for 4xx/5xx we try to parse JSON so callers can read { ok: false, reason }
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    body = null;
  }

  // ⚡ Base44 gateway edge case: on anonymous requests it sometimes wraps the function
  // response with a 401/403 "Authentication required" envelope even though the function
  // itself ran successfully and returned a valid body. If the body already looks like
  // a valid function response, trust the body over the HTTP status.
  //
  // A "valid function response" is any JSON body that is NOT purely an auth-error
  // envelope. Auth-error envelopes from Base44 gateway have shape:
  //   { message: "Authentication required...", detail: "You must be logged in..." }
  //   { message: "This app is private...", extra_data: { reason: "auth_required" } }
  //
  // If the body has ANY domain field we recognize (ok, template, questions, link,
  // introducer, proposal, contract, redirectTo, presentation, case, merchant, rates,
  // proposalSubmitted, docUrl, fileUrl, ...), it's our function's real response.
  if (body && typeof body === 'object') {
    const knownFunctionKeys = [
      'ok', 'template', 'questions', 'link', 'introducer', 'proposal',
      'contract', 'redirectTo', 'presentation', 'case', 'merchant',
      'rates', 'partnerId', 'docUrl', 'fileUrl', 'url', 'merchantId',
      'onboardingCaseId', 'docLinkToken', 'success', 'data', 'bankData',
      'token', 'status', 'reason',
    ];
    const hasFunctionData = knownFunctionKeys.some(k => k in body);
    if (hasFunctionData) {
      return body;
    }
  }

  // ⚡ Gateway wrap detection: Base44 gateway sometimes wraps a SUCCESSFUL
  // function response with a 401/403 envelope when the anonymous request
  // outran the gateway's auth-validation timeout. We CANNOT assume success
  // here — if we return { ok: true } without the real function payload
  // (documentUploadId, fileUri etc), the UI saves a phantom entry that
  // shows green toast but renders empty file list. That is exactly what
  // made clients click "Não tenho este documento" in the 2026-05-19 cases.
  //
  // Correct behavior: throw a retryable error so callPublicFunctionWithRetry
  // retries (backend is idempotent — dedup within 60s prevents duplicates),
  // or the direct caller catches it and shows a real error message to the
  // user instead of a fake success.
  const isGatewayAuthEnvelope =
    (res.status === 401 || res.status === 403) &&
    body && typeof body === 'object' &&
    typeof body.message === 'string' &&
    /authentication required|must be logged in|this app is private/i.test(body.message + ' ' + (body.detail || ''));
  if (isGatewayAuthEnvelope) {
    const err = new Error('Conexão instável durante o envio. Aguarde 2 segundos e tente novamente — seus dados estão seguros.');
    err.isGatewayEnvelope = true;
    err.retryable = true;
    throw err;
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
        err?.retryable === true ||
        err?.isGatewayEnvelope === true ||
        msg.includes('network') ||
        msg.includes('timeout') ||
        msg.includes('aborted') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed') ||
        msg.includes('http 5') ||
        msg.includes('conexão instável');
      if (!retryable || attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  throw lastErr;
}