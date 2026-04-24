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

let realClient = null;

export async function ensureSdkLoaded() {
  if (isOnboardingPublicRoute) return; // NEVER load SDK here
  if (realClient) return;
  const mod = await import('@base44/sdk');
  realClient = mod.createClient({
    appId: appParams.appId,
    token: appParams.token,
    functionsVersion: appParams.functionsVersion,
    serverUrl: '',
    requiresAuth: false,
    appBaseUrl: appParams.appBaseUrl,
  });
}

const mockClient = createMock();

export const base44 = new Proxy({}, {
  get(_t, prop) {
    if (isOnboardingPublicRoute) return mockClient[prop];
    if (realClient) return realClient[prop];
    // SDK not yet loaded — fall back to mock. In practice main.jsx awaits
    // ensureSdkLoaded() before rendering, so this branch never fires at
    // render time, only during cold module evaluation.
    return mockClient[prop];
  },
});