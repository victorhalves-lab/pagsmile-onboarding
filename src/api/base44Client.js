import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isPublicPath } from '@/lib/publicRoutes';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// ═══════════════════════════════════════════════════════════════════════
// CRITICAL: on PUBLIC routes, we MUST create the SDK with token=null.
// ═══════════════════════════════════════════════════════════════════════
// Why: when a token is passed to createClient(), the Base44 SDK internally
// may attempt to validate it by calling /entities/User/me. If that token is
// expired or invalid (e.g. a client re-opening an old link where they were
// once logged in with a stale cookie), the SDK returns 401 and internally
// throws "TypeError: Right-hand side of 'instanceof' is not callable"
// — which crashes the entire page with a blank white screen BEFORE React
// can even render the public route.
//
// This was the root cause of merchant 69df027aeaea350bc491e9a1 being
// unable to re-upload documents: the SDK tried to validate a stale token
// from a previous session and crashed instead of gracefully falling back
// to anonymous mode.
//
// FIX: on public routes, we proactively:
//   1. Nuke any stale token from localStorage (defense in depth)
//   2. Pass token=null to createClient so the SDK never tries to validate
// ═══════════════════════════════════════════════════════════════════════

const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isPublic = isPublicPath(pathname);

// Defensive cleanup: on public routes, purge any stale auth tokens from
// localStorage BEFORE creating the SDK. This guarantees zero authenticated
// calls from the client side on public pages.
if (isPublic && typeof window !== 'undefined') {
  try {
    window.localStorage.removeItem('base44_access_token');
    window.localStorage.removeItem('token');
  } catch {}
}

const effectiveToken = isPublic ? null : token;

// SECURITY MODEL:
// - The app is set to "Public (No Login)" at the platform level, so anonymous
//   users can open public pages (propostas, compliance, contratos, etc.) without login.
// - requiresAuth is set to FALSE so the SDK doesn't force a token on every call.
//   Anonymous traffic hits public-safe backend endpoints (publicReadContext,
//   publicLeadSubmit, publicProposalAction, etc.) that validate URL tokens server-side
//   and use asServiceRole to read admin-RLS entities in a controlled way.
// - Admin routes remain fully protected in App.jsx by 3 layers: base44.auth.me(),
//   server-side role verification (verifyUserAuth), and an HMAC-signed admin JWT
//   (verifyAdminToken). None of these can be bypassed from the client.
export const base44 = createClient({
  appId,
  token: effectiveToken,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});