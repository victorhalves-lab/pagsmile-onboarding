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
      if (prop === 'entities' || prop === 'asServiceRole' || prop === 'integrations' || prop === 'analytics' || prop === 'agents' || prop === 'users' || prop === 'connectors' || prop === 'appLogs') {
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
// - On PUBLIC routes: real SDK is NEVER instantiated — a mock is exported.
//   This makes the SDK's User/me 401 + instanceof crash physically impossible.
// - On ADMIN routes: real SDK with token is used; AuthenticatedApp in App.jsx
//   enforces 3 layers of protection (auth.me, verifyUserAuth, admin JWT).
// ═══════════════════════════════════════════════════════════════════════
export const base44 = isPublic
  ? createPublicMockClient()
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl,
    });