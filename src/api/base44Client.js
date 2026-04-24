// This file exports `base44`, the default client used throughout the app.
//
// On onboarding public routes (/onboarding, /PublicOnboarding, /ComplianceDocOnly)
// we MUST NOT import `@base44/sdk` at all — its module side effects register
// global MessagePort listeners that crash on anonymous visitors with:
//     TypeError: Right-hand side of 'instanceof' is not callable
//
// On every other route we want the real SDK for auth and all SDK features.
//
// Strategy: two sibling modules, `base44Client.real.js` and `base44Client.mock.js`.
// This file does a synchronous require-like re-export based on the current URL
// at module-evaluation time. Vite bundles BOTH modules, but only the one that
// matches the current URL is actually executed at runtime — the other's side
// effects never fire because its export getter is never accessed.
//
// Small caveat: because `import` statements must be static, we use a dynamic
// `import()` that is awaited at the top of main.jsx BEFORE any React code runs.

// CRITICAL: `@base44/sdk` is imported DYNAMICALLY (not statically) so that
// public onboarding routes NEVER even download the SDK bundle. A static
// import here forces Vite to evaluate the SDK's module-level code on EVERY
// page load (including /PublicOnboarding), and that side-effect code
// minifies in production to a call like `vw(...)` where `vw` may be
// tree-shaken to `undefined`, producing:
//     TypeError: vw is not a function
// which crashes the page before React can render. Dynamic import defers
// SDK loading to authenticated routes only.
import { appParams } from '@/lib/app-params';
import { isPublicPath } from '@/lib/publicRoutes';

// ── Global crash shield (always installed, belt & suspenders) ──
if (typeof window !== 'undefined' && !window.__base44CrashShieldInstalled) {
  window.__base44CrashShieldInstalled = true;
  const isSdkCrash = (err) => {
    const msg = String(err?.message || err || '');
    const stack = String(err?.stack || '');
    if (msg.includes("Right-hand side of 'instanceof' is not callable")) return true;
    if (/is not a function.*evaluating.*instanceof/i.test(msg)) return true;
    if (/MessagePort/i.test(stack) && /instanceof/i.test(stack)) return true;
    if (err?.name === 'TypeError' && /instanceof/i.test(msg)) return true;
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
    if (isSdkCrash(evt?.reason)) evt.preventDefault();
  }, true);
}

// ── Which routes must NEVER load @base44/sdk ──
const ONBOARDING_PUBLIC_ROUTES_LOWER = new Set([
  '/onboarding',
  '/publiconboarding',
  '/compliancedoconly',
]);
const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isOnboardingPublicRoute = typeof window !== 'undefined'
  && ONBOARDING_PUBLIC_ROUTES_LOWER.has(pathname.toLowerCase());

// ── Defensive token cleanup on any public route ──
if (isPublicPath(pathname) && typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────
// Pure mock client — never imports @base44/sdk.
// Exposed on onboarding public routes; also used as a safe fallback for
// any call that happens before the real SDK finishes loading.
// ─────────────────────────────────────────────────────────────────────────
function createMock() {
  const throwOnUse = (path) => () => {
    throw new Error(`[base44] Blocked call to ${path} on public onboarding route.`);
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
      if (['entities','asServiceRole','integrations','agents','users','connectors','appLogs'].includes(prop)) {
        return new Proxy({}, handler);
      }
      return new Proxy({}, handler);
    },
    apply() { throw new Error('[base44] Blocked call on public onboarding route.'); },
  };
  return new Proxy(function () {}, handler);
}

// ─────────────────────────────────────────────────────────────────────────
// Exported client.
//
// On onboarding public routes: pure mock (no SDK import ever).
// On every other route: lazily load the SDK and forward calls. Because the
// top of main.jsx awaits `ensureSdkLoaded()` before rendering, all callers
// on non-onboarding routes get the real client synchronously.
// ─────────────────────────────────────────────────────────────────────────

// SDK client is instantiated LAZILY and asynchronously.
//  • On onboarding public routes → always mock (SDK never downloaded).
//  • On other routes → kick off a dynamic import on module load, cache the
//    client promise. Consumers hit the mock until the SDK finishes loading,
//    then transparently switch to the real client.
// If the dynamic import or createClient() ever throws, we permanently fall
// back to the mock — never crash the module and take the whole app down.
const mockClient = createMock();
let realClient = null;
let sdkLoadPromise = null;

function loadSdk() {
  if (sdkLoadPromise) return sdkLoadPromise;
  if (isOnboardingPublicRoute) {
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
        console.error('[base44] createClient failed — using mock:', err);
        return null;
      }
    })
    .catch((err) => {
      console.error('[base44] SDK dynamic import failed — using mock:', err);
      return null;
    });
  return sdkLoadPromise;
}

// Start loading immediately on non-onboarding routes so the client is ready
// by the time the app renders authenticated pages.
if (!isOnboardingPublicRoute) loadSdk();

// ensureSdkLoaded() — await this in main.jsx if you need the SDK synchronously
// before the first render on authenticated routes. Safe to call anywhere;
// resolves to either the real client or null (caller falls back to mock).
export async function ensureSdkLoaded() {
  await loadSdk();
}

export const base44 = new Proxy({}, {
  get(_t, prop) {
    const client = realClient || mockClient;
    return client[prop];
  },
});