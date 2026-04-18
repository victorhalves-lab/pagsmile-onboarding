import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

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
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});