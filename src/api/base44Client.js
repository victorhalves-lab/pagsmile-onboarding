import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// SECURITY: requiresAuth=true forces the SDK to attach the user's access token
// to every backend request. Combined with server-side role checks and JWT validation,
// this prevents unauthenticated API access.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: true,
  appBaseUrl
});