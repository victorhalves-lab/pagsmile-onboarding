// Single source of truth for public routes.
// Used by App.jsx (router-level guard) and AuthContext.jsx (to skip login redirects).
// ANY page listed here is accessible to ANYONE with the link — no login, no 2FA, no role.

export const PUBLIC_PATHS = new Set([
  '/onboarding',
  '/PublicOnboarding',
  '/ComplianceDocOnly',
  '/PropostaPublica',
  '/PropostaPadraoPublica',
  '/PropostaPixPublica',
  '/ContratoPublico',
  '/ComplianceDinamico',
  '/ComplianceResume',
  '/OnboardingCompletion',
  '/SubsellerQuestionnaire',
  '/SubsellerDocUpload',
  '/SubsellerInfoForm',
  '/QuestionarioSimplificadoPublico',
  '/QuestionarioLeadsPagsmile',
  '/LeadPixV4',
  '/FechamentoLandingPage',
  '/KickOffPublico',
  // Legacy compliance flows (redirected to ComplianceDinamico)
  '/ComplianceOnboardingStart',
  '/ComplianceEcommerce',
  '/ComplianceFullKYC',
  '/ComplianceGateway',
  '/ComplianceLite',
  '/ComplianceMarketplace',
  '/ComplianceMerchant',
  '/CompliancePixOnly',
  '/ComplianceSaaS',
  // Document upload flows (public, client-facing)
  '/DocumentUploadEcommerce',
  '/DocumentUploadFull',
  '/DocumentUploadLite',
  '/DocumentUploadPix',
  '/DocumentUploadSaaS',
  // Lead questionnaire flows (public, client-facing)
  '/LeadQuestionnaire',
  '/LeadSuccess',
  '/LeadQuestionnairePix',
  // Liveness flows (redirected to OnboardingCompletion)
  '/LivenessFacematchStep',
  '/LivenessSimulation',
  // Bank data collection (partner doc flow)
  '/BankDataCollect',
  // Propostas Global (public, USD, trilingual)
  '/GlobalQuestionnaireForm',
  '/GlobalPublicProposal',
  '/GlobalComplianceForm',
]);

// Case-insensitive lookup set.
const PUBLIC_PATHS_LOWER = new Set(Array.from(PUBLIC_PATHS).map(p => p.toLowerCase()));

// Public URL prefixes (e.g. /p/:slug, /parceiro/:id, etc.).
const PUBLIC_PREFIXES = [
  '/parceiro/', '/s/', '/p/', '/pp/', '/pix/', '/c/', '/u/',
];

function normalizePath(pathname) {
  if (!pathname) return '/';
  let p = String(pathname).trim();
  // Strip query & hash
  const q = p.indexOf('?'); if (q >= 0) p = p.slice(0, q);
  const h = p.indexOf('#'); if (h >= 0) p = p.slice(0, h);
  // Strip trailing slash (but keep "/")
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

export function isPublicPath(pathname) {
  const p = normalizePath(pathname).toLowerCase();
  if (PUBLIC_PATHS_LOWER.has(p)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (p.startsWith(prefix)) return true;
  }
  return false;
}