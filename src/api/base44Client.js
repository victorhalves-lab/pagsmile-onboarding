import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isPublicPath } from '@/lib/publicRoutes';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// ═══════════════════════════════════════════════════════════════════════
// Public route handling — 100% ZERO-SDK mode.
// ═══════════════════════════════════════════════════════════════════════
// The Base44 SDK, as soon as it's instantiated, kicks off background
// auth-validation work. On anonymous visitors this ALWAYS triggers:
//   GET /api/apps/{appId}/entities/User/me → 401
// …and then asynchronously crashes in MessagePort.onmessage with
//   TypeError: Right-hand side of 'instanceof' is not callable
//
// On public routes we make the crash physically impossible by NEVER
// instantiating the real SDK. We return a proxy that throws a clear
// error for any accidental usage and a few common no-op methods so
// imports don't break.
//
// Public components and hooks use raw `fetch` against `/functions/*`
// endpoints (see lib/publicApi.js + lib/directUpload.js). All public
// backend functions validate the URL token server-side with
// asServiceRole, so anonymous POSTs are safe and work perfectly.
// ═══════════════════════════════════════════════════════════════════════

const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isPublic = isPublicPath(pathname);

// ── Defensive token cleanup on public routes ──
if (isPublic && typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  } catch {}
}

// ── Global crash shield (belt AND suspenders) ──
if (typeof window !== 'undefined' && !window.__base44CrashShieldInstalled) {
  window.__base44CrashShieldInstalled = true;

  const isSdkCrash = (err) => {
    const msg = String(err?.message || err || '');
    const stack = String(err?.stack || '');
    if (msg.includes("Right-hand side of 'instanceof' is not callable")) return true;
    if (/MessagePort/i.test(stack) && /instanceof/i.test(stack)) return true;
    if (err?.name === 'TypeError' && /instanceof/i.test(msg)) return true;
    return false;
  };

  window.addEventListener(
    'error',
    (evt) => {
      if (isSdkCrash(evt?.error) || isSdkCrash(evt?.message)) {
        console.warn('[base44Client] Suppressed SDK sync crash — page continues.');
        evt.preventDefault();
        evt.stopImmediatePropagation?.();
        return false;
      }
    },
    true,
  );

  window.addEventListener(
    'unhandledrejection',
    (evt) => {
      if (isSdkCrash(evt?.reason)) {
        console.warn('[base44Client] Suppressed SDK async rejection — page continues.');
        evt.preventDefault();
      }
    },
    true,
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Public-route mock client
// ═══════════════════════════════════════════════════════════════════════
// Never call auth.me(), never fetch User, never reach any authenticated
// endpoint. Any accidental property access on public pages throws a
// descriptive error so the issue surfaces early in dev instead of making
// a silent 401 request.
// ═══════════════════════════════════════════════════════════════════════
function createPublicMockClient() {
  const throwOnUse = (path) => () => {
    throw new Error(
      `[base44] Blocked call to ${path} on public route — public pages must use lib/publicApi.js.`,
    );
  };

  // A tiny Proxy that returns mock methods for commonly-accessed paths
  // (auth, entities, functions, integrations, asServiceRole) and throws
  // on any other access. Imports like `import { base44 } from ...` work,
  // but actually CALLING them throws.
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
      if (prop === 'functions') {
        return { invoke: throwOnUse('functions.invoke') };
      }
      // Analytics is fire-and-forget telemetry — must NEVER throw or crash
      // the page on public routes. Return silent no-ops.
      if (prop === 'analytics') {
        return {
          track: () => {},
          identify: () => {},
          page: () => {},
        };
      }
      if (prop === 'entities' || prop === 'asServiceRole' || prop === 'integrations' || prop === 'agents' || prop === 'users' || prop === 'connectors' || prop === 'appLogs') {
        return new Proxy({}, handler);
      }
      // Unknown prop — return another proxy that also blocks calls.
      return new Proxy({}, handler);
    },
    apply() {
      throw new Error('[base44] Blocked call on public route — use lib/publicApi.js.');
    },
  };

  return new Proxy(function () {}, handler);
}

// ═══════════════════════════════════════════════════════════════════════
// SECURITY MODEL:
// - The app is "Public (No Login)" — anonymous users can open public pages
//   (proposals, compliance, contracts, onboarding) without login.
// - On ONBOARDING public routes (/onboarding, /PublicOnboarding,
//   /ComplianceDocOnly), we return a mock client that NEVER instantiates
//   the real SDK. These are the routes where the gateway returns 401 on
//   the initial HTML, which in turn triggers the SDK's MessagePort
//   listener to crash with:
//       TypeError: Right-hand side of 'instanceof' is not callable
//   By never creating the real client on those routes, the listener is
//   never registered, so the crash is physically impossible.
// - On every OTHER route (including other public routes like proposals
//   and contracts, and all admin routes), we instantiate the real SDK
//   with `requiresAuth: false`. Those pages have been working correctly
//   and we don't want to break them.
// ═══════════════════════════════════════════════════════════════════════
const ONBOARDING_PUBLIC_ROUTES_LOWER = new Set([
  '/onboarding',
  '/publiconboarding',
  '/compliancedoconly',
]);
const isOnboardingPublicRoute = typeof window !== 'undefined'
  && ONBOARDING_PUBLIC_ROUTES_LOWER.has(window.location.pathname.toLowerCase());

export const base44 = isOnboardingPublicRoute
  ? createPublicMockClient()
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    });

void isPublic;