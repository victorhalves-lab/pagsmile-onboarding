import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isPublicPath } from '@/lib/publicRoutes';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// ═══════════════════════════════════════════════════════════════════════
// Public route handling — zero-auth mode + crash shield.
// ═══════════════════════════════════════════════════════════════════════
// The Base44 SDK silently crashes anonymous public-route visitors with
//   TypeError: Right-hand side of 'instanceof' is not callable
// originating from its MessagePort / scheduler code when it receives a 401
// from internal token validation. The crash happens asynchronously in a
// microtask, so wrapping try/catch in our own code does not help.
//
// Defense in depth:
//   1. Purge any stale auth tokens from localStorage before creating the SDK.
//   2. Pass token=null on public paths (no token = no validation attempt).
//   3. Install a global crash shield: a window error listener that swallows
//      this specific SDK error so it doesn't escalate to an uncaught
//      exception (which React's error boundary can't recover from because
//      the error is not thrown during rendering).
// ═══════════════════════════════════════════════════════════════════════

const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isPublic = isPublicPath(pathname);

// ── 1. Defensive token cleanup on public routes ──
if (isPublic && typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  } catch {}
}

// ── 2. Global crash shield ──
// Install ONCE per page load. Catches the SDK's async instanceof crash and
// logs a warning instead of letting it kill the app. Only active in the browser.
if (typeof window !== 'undefined' && !window.__base44CrashShieldInstalled) {
  window.__base44CrashShieldInstalled = true;

  const isSdkInstanceofCrash = (err) => {
    const msg = String(err?.message || err || '');
    return msg.includes("Right-hand side of 'instanceof' is not callable");
  };

  // Sync errors (rare for this specific crash, but covers the base)
  window.addEventListener(
    'error',
    (evt) => {
      if (isSdkInstanceofCrash(evt?.error) || isSdkInstanceofCrash(evt?.message)) {
        console.warn('[base44Client] Suppressed SDK crash (MessagePort/instanceof) — page continues.');
        evt.preventDefault();
        evt.stopImmediatePropagation?.();
        return false;
      }
    },
    true, // capture phase — run before anything else
  );

  // Async errors — Promise rejections inside MessagePort.onmessage surface here
  window.addEventListener(
    'unhandledrejection',
    (evt) => {
      if (isSdkInstanceofCrash(evt?.reason)) {
        console.warn('[base44Client] Suppressed SDK async rejection (MessagePort/instanceof).');
        evt.preventDefault();
      }
    },
    true,
  );
}

const effectiveToken = isPublic ? null : token;

// SECURITY MODEL:
// - The app is "Public (No Login)" — anonymous users can open public pages
//   (proposals, compliance, contracts, onboarding) without login.
// - requiresAuth:false so SDK doesn't force a token on every call.
// - Anonymous traffic hits public-safe backend endpoints that validate URL
//   tokens server-side via asServiceRole.
// - Admin routes remain fully protected in App.jsx by 3 layers:
//   base44.auth.me(), verifyUserAuth (server role), and HMAC admin JWT.
export const base44 = createClient({
  appId,
  token: effectiveToken,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl,
});