// ══════════════════════════════════════════════════════════════════
// PUBLIC PATHS REGISTRY — Fonte única da verdade
// ══════════════════════════════════════════════════════════════════
// Todas as rotas que NÃO exigem autenticação / RBAC.
// NUNCA proteja páginas listadas aqui com <ProtectedPage>.
// ══════════════════════════════════════════════════════════════════

export const PUBLIC_PATHS = new Set([
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
  // Liveness flows (redirected to OnboardingCompletion)
  '/LivenessFacematchStep',
  '/LivenessSimulation',
]);

export const PUBLIC_PATH_PREFIXES = [
  '/parceiro/',  // landing pages de introducer
  '/s/',         // slug redirects
  '/p/',         // proposal friendly slugs
  '/pp/',        // standard proposal slugs
  '/pix/',       // pix proposal slugs
  '/c/',         // contract slugs
];

/** Retorna true se o pathname é público (não requer auth/RBAC) */
export function isPublicPath(pathname) {
  if (!pathname) return false;
  if (PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}