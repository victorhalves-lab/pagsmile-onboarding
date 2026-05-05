import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * cafGenerateToken — Fluxo OFICIAL de autenticação CAF SDK
 * 
 * Referência: https://docs.caf.io/caf-sdk/authentication
 * 
 * Passos (exatamente como a doc manda):
 *   1. Gera JWT HS256 com { iss: CAF_CLIENT_ID, exp: now+5min }, assinado com CAF_CLIENT_SECRET.
 *   2. Troca esse JWT por Session Token via GET https://web.us.prd.caf.io/bff/session-tokens
 *      com header "Authorization: <JWT>" (SEM prefixo "Bearer").
 *   3. Retorna sessionToken ao frontend, que usa no SDK init.
 * 
 * ⚠️  NÃO expor CAF_CLIENT_SECRET ao frontend. NÃO reutilizar Session Tokens entre sessões.
 * ⚠️  CAF revoga keys identificadas como expostas automaticamente.
 *
 * 🛡️  RATE-LIMITING DEFENSIVO (adicionado 2026-05-05 após pico de erros 429):
 *   1. CACHE: Reutiliza o mesmo session-token por até 4 minutos para o mesmo onboardingCaseId+CPF.
 *      → Evita que clientes que fecham/reabrem o SDK gerem N session-tokens.
 *   2. EXPONENTIAL BACKOFF + JITTER: Se a CAF retornar 429, tentamos até 3× com 1s/2s/4s + jitter.
 *      → Conforme recomendação oficial da CAF.
 *   3. PER-CASE THROTTLE: Bloqueia mais de 1 chamada nova ao /bff/session-tokens por caso a cada 10s.
 *      → Protege contra loops malucos do frontend.
 *   Tudo isso é INVISÍVEL para o cliente final — quando funciona, ele recebe o token normalmente;
 *   quando há 429 transiente, ele recebe o token após o retry sem ver erro.
 */

// HS256 JWT sign usando Web Crypto API (Deno)
async function signJwtHS256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();

  const b64url = (bytes) => {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const sigB64 = b64url(new Uint8Array(sigBuf));

  return `${signingInput}.${sigB64}`;
}

// ─── In-memory cache (per Deno isolate) ─────────────────────────────────
// Token CAF é válido por mais tempo, mas re-emitimos a cada 4 min para segurança.
// Chave: `${onboardingCaseId}:${cpfClean}` — string vazia quando não há caso.
const TOKEN_CACHE = new Map();
const TOKEN_TTL_MS = 4 * 60 * 1000; // 4 minutos
const THROTTLE_MS = 10 * 1000; // 10 segundos entre chamadas distintas para a CAF (mesmo caso)

// Limpa cache periodicamente para evitar memory leak
function pruneCache() {
  const now = Date.now();
  for (const [k, v] of TOKEN_CACHE.entries()) {
    if (now - v.cachedAt > TOKEN_TTL_MS) TOKEN_CACHE.delete(k);
  }
}

// ─── Sleep com jitter ─────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Chamada à CAF com exponential backoff em 429 ─────────────────────
// Conforme a doc CAF de "Handling 429 too many requests errors"
async function fetchSessionTokenWithBackoff(authJwt, exchangeUrl, maxRetries = 3) {
  let lastResponse = null;
  let lastBodyText = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(exchangeUrl, {
      method: 'GET',
      headers: {
        'Authorization': authJwt,
        'Accept': 'application/json',
      },
    });

    // 429 Too Many Requests → backoff e retry
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('retry-after');
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

      // Honra o Retry-After se for válido; senão, exponential backoff + jitter
      const baseWaitMs = retryAfterSec && Number.isFinite(retryAfterSec)
        ? retryAfterSec * 1000
        : Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      const jitterMs = Math.random() * 0.5 * baseWaitMs;
      const waitMs = baseWaitMs + jitterMs;

      console.warn(`[CAF-Token] 429 received (attempt ${attempt + 1}/${maxRetries}), waiting ${Math.round(waitMs)}ms before retry`);

      // Drena body para liberar conexão antes de dormir
      try { await res.text(); } catch {}

      // Só dorme se ainda houver retry restante
      if (attempt < maxRetries - 1) {
        await sleep(waitMs);
        continue;
      } else {
        // Último retry esgotado → devolve a 429 para o caller
        lastResponse = res;
        lastBodyText = '{"error":"rate_limited"}';
        break;
      }
    }

    // Qualquer outro status (200, 4xx, 5xx) → retorna imediatamente
    lastResponse = res;
    lastBodyText = await res.text();
    break;
  }

  return { res: lastResponse, bodyText: lastBodyText };
}

Deno.serve(async (req) => {
  const startTime = Date.now();

  try {
    // Tolerante a tokens inválidos — este endpoint é público (SDK CAF no navegador do cliente).
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
    const body = await req.json().catch(() => ({}));
    const { personCpf, onboardingCaseId } = body;

    const clientId = Deno.env.get('CAF_CLIENT_ID');
    const clientSecret = Deno.env.get('CAF_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({
        error: 'CAF_CLIENT_ID ou CAF_CLIENT_SECRET não configurados.',
      }, { status: 500 });
    }

    // ─── 0. Cache lookup ──────────────────────────────────────────────
    pruneCache();
    const cleanCpf = (personCpf || '').replace(/\D/g, '');
    const hasValidCpf = cleanCpf.length === 11;
    const cacheKey = `${onboardingCaseId || ''}:${cleanCpf}`;
    const cached = TOKEN_CACHE.get(cacheKey);

    if (cached && (Date.now() - cached.cachedAt < TOKEN_TTL_MS)) {
      console.log(`[CAF-Token] Cache HIT for ${cacheKey} (age=${Math.round((Date.now() - cached.cachedAt)/1000)}s)`);
      return Response.json({
        sdkToken: cached.sessionToken,
        personId: cached.personId,
        tokenType: 'session',
        tokenStrategy: 'official_session_exchange_cached',
        requestId: cached.requestId,
        canUseFaceAuth: false,
        cached: true,
        duration_ms: Date.now() - startTime,
      });
    }

    // ─── 0b. Throttle: bloqueia chamadas demasiadamente próximas para o mesmo caso ──
    // Se há um cache RECÉM-EXPIRADO (< THROTTLE_MS antes do TTL), espera um pouco.
    // Isso protege contra loops malucos do frontend que ignoram o cache hit acima.
    if (cached) {
      const sinceLast = Date.now() - cached.cachedAt;
      if (sinceLast < THROTTLE_MS) {
        // Reusa o token mesmo expirando logo — é melhor que bater na CAF
        console.log(`[CAF-Token] Throttle: reusing cached token (sinceLast=${sinceLast}ms < ${THROTTLE_MS}ms)`);
        return Response.json({
          sdkToken: cached.sessionToken,
          personId: cached.personId,
          tokenType: 'session',
          tokenStrategy: 'official_session_exchange_throttled',
          requestId: cached.requestId,
          canUseFaceAuth: false,
          cached: true,
          throttled: true,
          duration_ms: Date.now() - startTime,
        });
      }
    }

    // ── 1. Gerar Authentication Token (JWT HS256) ──
    const now = Math.floor(Date.now() / 1000);
    const authPayload = {
      iss: clientId,
      exp: now + 300, // 5 minutos (short-lived, como a doc recomenda)
    };

    const authJwt = await signJwtHS256(authPayload, clientSecret);

    // ── 2. Trocar por Session Token em /bff/session-tokens (com backoff em 429) ──
    const exchangeUrl = 'https://web.us.prd.caf.io/bff/session-tokens';
    const { res: exchangeRes, bodyText: exchangeBodyText } = await fetchSessionTokenWithBackoff(authJwt, exchangeUrl, 3);

    let exchangeBody;
    try { exchangeBody = JSON.parse(exchangeBodyText); } catch { exchangeBody = { raw: exchangeBodyText }; }

    if (!exchangeRes.ok) {
      console.error('[CAF-Token] session-tokens exchange failed', {
        status: exchangeRes.status,
        body: exchangeBody,
      });

      if (onboardingCaseId) {
        try {
          await base44.asServiceRole.entities.IntegrationLog.create({
            onboarding_case_id: onboardingCaseId,
            provider: 'CAF',
            service_type: 'sdk_token_generation',
            status: 'failed',
            result_status: 'REPROVED',
            error_code: exchangeRes.status === 429 ? 'RATE_LIMITED' : `HTTP_${exchangeRes.status}`,
            error_message: `session-tokens HTTP ${exchangeRes.status}`,
            request_payload: { endpoint: exchangeUrl, jwt_iss: clientId },
            response_payload: { status: exchangeRes.status, body: exchangeBody },
            duration_ms: Date.now() - startTime,
          });
        } catch (e) { console.warn('[CAF-Token] Log error:', e.message); }
      }

      // 429 explícito → devolve 429 para o frontend (ao invés de 502) para que ele
      // possa mostrar mensagem específica de "muitas tentativas" se quiser.
      const responseStatus = exchangeRes.status === 429 ? 429 : 502;

      return Response.json({
        error: exchangeRes.status === 429
          ? 'Limite de requisições atingido na CAF. Tente novamente em alguns segundos.'
          : 'Falha ao obter session token da CAF',
        details: {
          status: exchangeRes.status,
          body: exchangeBody,
        },
      }, { status: responseStatus });
    }

    const sessionToken = exchangeBody?.sessionToken;
    const requestId = exchangeBody?.requestId;

    if (!sessionToken) {
      return Response.json({
        error: 'CAF retornou 200 mas sem sessionToken',
        details: exchangeBody,
      }, { status: 502 });
    }

    // ── 3. PersonId (opcional mas recomendado) ──
    const personId = hasValidCpf ? cleanCpf : 'anonymous';

    // ── 3b. Salva no cache para reusar nos próximos 4 minutos ──
    TOKEN_CACHE.set(cacheKey, {
      sessionToken,
      personId,
      requestId,
      cachedAt: Date.now(),
    });

    // ── 4. Log sucesso ──
    if (onboardingCaseId) {
      try {
        await base44.asServiceRole.entities.IntegrationLog.create({
          onboarding_case_id: onboardingCaseId,
          provider: 'CAF',
          service_type: 'sdk_token_generation',
          status: 'success',
          result_status: 'APPROVED',
          request_id: requestId,
          request_payload: {
            endpoint: exchangeUrl,
            jwt_iss: clientId,
            hasCpf: hasValidCpf,
            cached: false,
          },
          response_payload: {
            sessionTokenLength: sessionToken.length,
            requestId,
          },
          duration_ms: Date.now() - startTime,
        });
      } catch (e) { console.warn('[CAF-Token] Log error:', e.message); }
    }

    console.log(`[CAF-Token] Session token obtained (len=${sessionToken.length}, requestId=${requestId})`);

    return Response.json({
      sdkToken: sessionToken,
      personId,
      tokenType: 'session',
      tokenStrategy: 'official_session_exchange',
      requestId,
      canUseFaceAuth: false,
      cached: false,
      duration_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[CAF-Token] Fatal error:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});