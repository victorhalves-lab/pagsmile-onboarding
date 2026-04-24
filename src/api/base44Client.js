import { appParams } from '@/lib/app-params';
import { isPublicPath } from '@/lib/publicRoutes';

// ── Determine if this is a public route BEFORE doing anything ──
// We use a broad check: any path in PUBLIC_PATHS (from publicRoutes.js)
// must never load @base44/sdk. The SDK's module-level code has side-effects
// that crash anonymous visitors with minified errors like:
//   TypeError: vw is not a function    (chunk jUTrF7TZ)
//   TypeError: i4 is not a function    (chunk CwCfScd1)
// These are top-level calls inside the SDK bundle that fail when the
// environment (auth token, window state) is not set up for authenticated use.
const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isPublicRoute = isPublicPath(pathname);

// ── Defensive token cleanup on any public route ──
if (isPublicRoute && typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('base44_token');
  } catch {}
}

// ── Global crash shield ──
// Catches any "X is not a function" that leaks from the SDK bundle evaluation.
// This is a belt-and-suspenders — the real fix is not importing the SDK on
// public routes. But cached bundles may still trigger these errors.
if (typeof window !== 'undefined' && !window.__base44CrashShieldInstalled) {
  window.__base44CrashShieldInstalled = true;

  const isSdkCrash = (err) => {
    const msg = String(err?.message || err || '');
    const stack = String(err?.stack || '');
    const name = String(err?.name || '');
    // Match the known minified crash patterns
    if (msg.includes("Right-hand side of 'instanceof' is not callable")) return true;
    if (name === 'TypeError' && /instanceof/i.test(msg)) return true;
    if (/MessagePort/i.test(stack) && /instanceof/i.test(stack)) return true;
    // Catch any short minified-name "X is not a function" from SDK bundle chunks.
    // These are top-level initialisation calls that fail on anonymous routes.
    if (/index-[A-Za-z0-9]+\.js/.test(stack) && /is not a function/i.test(msg)) {
      return true;
    }
    return false;
  };

  window.addEventListener('error', (evt) => {
    if (isSdkCrash(evt?.error) || isSdkCrash(evt?.message)) {
      evt.preventDefault();
      evt.stopImmediatePropagation?.();
      return false;
    }
  }, true);

  window.addEventListener('unhandledrejection', (evt) => {
    if (isSdkCrash(evt?.reason)) {
      evt.preventDefault();
    }
  }, true);
}

// ─────────────────────────────────────────────────────────────────────────
// Pure mock client — used on ALL public routes. Never imports @base44/sdk.
// ─────────────────────────────────────────────────────────────────────────
function createMock() {
  const throwOnUse = (path) => () => {
    throw new Error(`[base44] Blocked SDK call: ${path} — cannot use on public route.`);
  };
  const handler = {
    get(_t, prop) {
      if (prop === 'auth') {
        return {
          me: throwOnUse('auth.me'),
          isAuthenticated: async () => false,
          logout: () => {},
          redirectToLogin: () => {},
          updateMe: throwOnUse('auth.updateMe'),
        };
      }
      if (prop === 'functions') return { invoke: throwOnUse('functions.invoke') };
      if (prop === 'analytics') return { track: () => {}, identify: () => {}, page: () => {} };
      return new Proxy({}, handler);
    },
    apply() { throw new Error('[base44] Blocked SDK call on public route.'); },
  };
  return new Proxy(function () {}, handler);
}

// ─────────────────────────────────────────────────────────────────────────
// Real SDK — loaded ONLY on authenticated routes.
//
// IMPORTANT: import('@base44/sdk') EVALUATES the SDK bundle's top-level code.
// That code has minified side-effects that crash with "X is not a function"
// on public routes. We guard with isPublicRoute so the import() call is never
// reached on any public page.
// ─────────────────────────────────────────────────────────────────────────
const mockClient = createMock();
let realClient = null;
let sdkLoadPromise = null;

function loadSdk() {
  if (sdkLoadPromise) return sdkLoadPromise;

  if (isPublicRoute) {
    sdkLoadPromise = Promise.resolve(null);
    return sdkLoadPromise;
  }

  sdkLoadPromise = import('@base44/sdk')
    .then((mod) => {
      try {
        realClient = mod.createClient({
          appId: appParams.appId,
          token: appParams.token,
          functionsVersion: appParams.functionsVersion,
          serverUrl: '',
          requiresAuth: false,
          appBaseUrl: appParams.appBaseUrl,
        });
        return realClient;
      } catch (err) {
        console.error('[base44Client] createClient() threw — using mock:', err);
        return null;
      }
    })
    .catch((err) => {
      console.error('[base44Client] import(@base44/sdk) failed — using mock:', err);
      return null;
    });

  return sdkLoadPromise;
}

// Start loading on non-public routes immediately so the client is ready
// before the first React render.
if (!isPublicRoute) {
  loadSdk();
}

export async function ensureSdkLoaded() {
  await loadSdk();
}

export const base44 = new Proxy({}, {
  get(_t, prop) {
    const client = realClient || mockClient;
    return client[prop];
  },
});