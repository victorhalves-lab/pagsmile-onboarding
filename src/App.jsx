import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { PermissionsProvider } from '@/lib/PermissionsProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
import { base44 } from '@/api/base44Client';
// ── Eager imports: components that MUST be available immediately on every render ──
// (auth screens, error states, redirect helpers — small components, no async load benefit)
import LegacyComplianceRedirect from './pages/LegacyComplianceRedirect';
import ComplianceDocOnlyRedirect from './pages/ComplianceDocOnlyRedirect';
import PublicSlugRedirect from './pages/PublicSlugRedirect';
import SlugRedirect from './pages/SlugRedirect';
import AccessDenied from './components/AccessDenied';
import AdminLoginScreen from './components/admin/AdminLoginScreen';
import TwoFactorEnrollScreen from './components/admin/TwoFactorEnrollScreen';
import TwoFactorLoginScreen from './components/admin/TwoFactorLoginScreen';

// ── Lazy imports: heavy pages loaded only when their route is visited ──
// Each page becomes its own bundle chunk → smaller initial download.
// React.Suspense boundary in <AppRoutes> shows the spinner while loading.
const lazyPage = (loader) => React.lazy(() =>
  loader().catch((err) => {
    console.error('[App.jsx] Failed to load page:', err);
    return {
      default: () => React.createElement(
        'div',
        { style: { padding: '32px', fontFamily: 'Inter, system-ui, sans-serif' } },
        React.createElement('h1', { style: { color: '#002443', fontSize: '18px', marginBottom: '8px' } }, 'Erro ao carregar esta página'),
        React.createElement('p', { style: { color: '#002443', opacity: 0.7, fontSize: '14px' } }, String(err?.message || err))
      ),
    };
  })
);

const GestaoIntroducers = lazyPage(() => import('./pages/GestaoIntroducers'));
const IntroducerDashboard = lazyPage(() => import('./pages/IntroducerDashboard'));
const QuestionarioReuniao = lazyPage(() => import('./pages/QuestionarioReuniao'));
const ProcessMeetingNotes = lazyPage(() => import('./pages/ProcessMeetingNotes'));
const ComplianceResume = lazyPage(() => import('./pages/ComplianceResume'));
const QuestionarioReuniaoPix = lazyPage(() => import('./pages/QuestionarioReuniaoPix'));
const SubsellerQuestionnaire = lazyPage(() => import('./pages/SubsellerQuestionnaire'));
const GerenciarSubsellerLinks = lazyPage(() => import('./pages/GerenciarSubsellerLinks'));
const ConfiguracaoParceiros = lazyPage(() => import('./pages/ConfiguracaoParceiros'));
const IntroducerLandingPage = lazyPage(() => import('./pages/IntroducerLandingPage'));
const GestaoPropostasPadrao = lazyPage(() => import('./pages/GestaoPropostasPadrao'));
const CriarPropostaPadrao = lazyPage(() => import('./pages/CriarPropostaPadrao'));
const PropostaPadraoDetalhes = lazyPage(() => import('./pages/PropostaPadraoDetalhes'));
const PropostaPadraoPublica = lazyPage(() => import('./pages/PropostaPadraoPublica'));
const GestaoPropostasPix = lazyPage(() => import('./pages/GestaoPropostasPix'));
const CriarPropostaPix = lazyPage(() => import('./pages/CriarPropostaPix'));
const PropostaPixDetalhes = lazyPage(() => import('./pages/PropostaPixDetalhes'));
const PropostaPixPublica = lazyPage(() => import('./pages/PropostaPixPublica'));
const GestaoLandingPages = lazyPage(() => import('./pages/GestaoLandingPages'));
const DadosInsights = lazyPage(() => import('./pages/DadosInsights'));
const RiskScoringV4 = lazyPage(() => import('./pages/RiskScoringV4'));
const RiskScoringSubcontas = lazyPage(() => import('./pages/RiskScoringSubcontas'));
const QuestionarioLeadsPagsmile = lazyPage(() => import('./pages/QuestionarioLeadsPagsmile'));
const LeadPixV4 = lazyPage(() => import('./pages/LeadPixV4'));
const FechamentoLandingPage = lazyPage(() => import('./pages/FechamentoLandingPage'));
const DashboardComercial = lazyPage(() => import('./pages/DashboardComercial'));
const DashboardCEO = lazyPage(() => import('./pages/DashboardCEO'));
const ProcessosModelo = lazyPage(() => import('./pages/ProcessosModelo'));
const GerarKickOff = lazyPage(() => import('./pages/GerarKickOff'));
const KickOffPublico = lazyPage(() => import('./pages/KickOffPublico'));
const GerenciarTaxasPadrao = lazyPage(() => import('./pages/GerenciarTaxasPadrao'));
const SubsellerDocUpload = lazyPage(() => import('./pages/SubsellerDocUpload'));
const Cadastro = lazyPage(() => import('./pages/Cadastro'));
const CadastroDetalhe = lazyPage(() => import('./pages/CadastroDetalhe'));
const ComplianceDocOnly = lazyPage(() => import('./pages/ComplianceDocOnly'));
const PublicOnboarding = lazyPage(() => import('./pages/PublicOnboarding'));
const BDCHealthDashboard = lazyPage(() => import('./pages/BDCHealthDashboard'));
const AnaliseCompleta = lazyPage(() => import('./pages/AnaliseCompleta'));
const BulkReprocess = lazyPage(() => import('./pages/BulkReprocess'));
const DocumentoKYCKYB = lazyPage(() => import('./pages/DocumentoKYCKYB'));
const EscalationsReview = lazyPage(() => import('./pages/EscalationsReview'));
const AnaliseManual = lazyPage(() => import('./pages/AnaliseManual'));
const GestaoPerfis = lazyPage(() => import('./pages/GestaoPerfis'));
const EditorPerfil = lazyPage(() => import('./pages/EditorPerfil'));
const GestaoUsuarios = lazyPage(() => import('./pages/GestaoUsuarios'));
const AuditoriaAcessos = lazyPage(() => import('./pages/AuditoriaAcessos'));
const CafTestLab = lazyPage(() => import('./pages/CafTestLab'));
const ComplianceParceiro = lazyPage(() => import('./pages/ComplianceParceiro'));
const ComplianceParceiroDetalhe = lazyPage(() => import('./pages/ComplianceParceiroDetalhe'));
const AdminGestaoParceiros = lazyPage(() => import('./pages/AdminGestaoParceiros'));
const DocCompParceiros = lazyPage(() => import('./pages/DocCompParceiros'));
const BankDataCollect = lazyPage(() => import('./pages/BankDataCollect'));
const Governanca = lazyPage(() => import('./pages/Governanca'));
const DocumentacaoMaster = lazyPage(() => import('./pages/DocumentacaoMaster'));
const BdcLookup = lazyPage(() => import('./pages/BdcLookup'));
const V5_2_Status = lazyPage(() => import('./pages/V5_2_Status'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// --- Public routes: single source of truth in lib/publicRoutes.js ---
import { PUBLIC_PATHS, isPublicPath } from '@/lib/publicRoutes';

// --- Public pages are rendered without auth checks ---
const PublicRoutes = () => (
  <Routes>
    {/* Propostas Públicas */}
    {['PropostaPublica'].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}
    <Route path="/PropostaPadraoPublica" element={<LayoutWrapper currentPageName="PropostaPadraoPublica"><PropostaPadraoPublica /></LayoutWrapper>} />
    <Route path="/PropostaPixPublica" element={<LayoutWrapper currentPageName="PropostaPixPublica"><PropostaPixPublica /></LayoutWrapper>} />

    {/* Contrato Público */}
    {Pages['ContratoPublico'] && <Route path="/ContratoPublico" element={<LayoutWrapper currentPageName="ContratoPublico"><Pages.ContratoPublico /></LayoutWrapper>} />}

    {/* Landing Pages */}
    <Route path="/parceiro/:uniqueLandingPageSlug" element={<LayoutWrapper currentPageName="IntroducerLandingPage"><IntroducerLandingPage /></LayoutWrapper>} />

    {/* Compliance V4 (dinâmico) */}
    {['ComplianceDinamico', 'OnboardingCompletion'].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}
    <Route path="/ComplianceResume" element={<LayoutWrapper currentPageName="ComplianceResume"><ComplianceResume /></LayoutWrapper>} />

    {/* Legacy compliance flows → redirect to ComplianceDinamico */}
    {['ComplianceOnboardingStart','ComplianceEcommerce','ComplianceFullKYC','ComplianceGateway','ComplianceLite','ComplianceMarketplace','ComplianceMerchant','CompliancePixOnly','ComplianceSaaS'].map(name => (
      <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><LegacyComplianceRedirect legacyRoute={name} /></LayoutWrapper>} />
    ))}

    {/* Document upload flows (public, client-facing) */}
    {['DocumentUploadFull','DocumentUploadPix'].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}
    {/* Legacy document upload redirects */}
    {['DocumentUploadEcommerce','DocumentUploadLite','DocumentUploadSaaS'].map(name => (
      <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><LegacyComplianceRedirect legacyRoute={name} /></LayoutWrapper>} />
    ))}

    {/* Lead questionnaire flows (public, client-facing) */}
    {['LeadQuestionnaire','LeadSuccess'].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}

    {/* Liveness flows removed — redirected to completion */}
    <Route path="/LivenessFacematchStep" element={<LayoutWrapper currentPageName="OnboardingCompletion">{Pages.OnboardingCompletion ? <Pages.OnboardingCompletion /> : <div />}</LayoutWrapper>} />
    <Route path="/LivenessSimulation" element={<LayoutWrapper currentPageName="OnboardingCompletion">{Pages.OnboardingCompletion ? <Pages.OnboardingCompletion /> : <div />}</LayoutWrapper>} />

    {/* Subseller */}
    <Route path="/SubsellerQuestionnaire" element={<LayoutWrapper currentPageName="SubsellerQuestionnaire"><SubsellerQuestionnaire /></LayoutWrapper>} />
    <Route path="/SubsellerDocUpload" element={<LayoutWrapper currentPageName="SubsellerDocUpload"><SubsellerDocUpload /></LayoutWrapper>} />
    <Route path="/ComplianceDocOnly" element={<ComplianceDocOnlyRedirect />} />
    {/* Both /onboarding (legacy) and /PublicOnboarding (new — matches pages.config.js) render the same page.
        /PublicOnboarding is the canonical URL because it matches a page key in pages.config.js, which is what
        the Base44 platform gateway uses to decide which paths are public. /onboarding stays as a fallback
        for any links already sent to clients. */}
    <Route path="/onboarding" element={<PublicOnboarding />} />
    <Route path="/PublicOnboarding" element={<PublicOnboarding />} />

    {/* Questionário Simplificado */}
    {Pages['QuestionarioSimplificadoPublico'] && <Route path="/QuestionarioSimplificadoPublico" element={<LayoutWrapper currentPageName="QuestionarioSimplificadoPublico"><Pages.QuestionarioSimplificadoPublico /></LayoutWrapper>} />}

    {/* Leads V5 / PIX V4 */}
    <Route path="/QuestionarioLeadsPagsmile" element={<LayoutWrapper currentPageName="QuestionarioLeadsPagsmile"><QuestionarioLeadsPagsmile /></LayoutWrapper>} />
    <Route path="/LeadPixV4" element={<LayoutWrapper currentPageName="LeadPixV4"><LeadPixV4 /></LayoutWrapper>} />
    <Route path="/FechamentoLandingPage" element={<LayoutWrapper currentPageName="FechamentoLandingPage"><FechamentoLandingPage /></LayoutWrapper>} />
    <Route path="/KickOffPublico" element={<LayoutWrapper currentPageName="KickOffPublico"><KickOffPublico /></LayoutWrapper>} />

    {/* Bank Data Collection (public, client-facing) */}
    <Route path="/BankDataCollect" element={<LayoutWrapper currentPageName="BankDataCollect"><BankDataCollect /></LayoutWrapper>} />

    {/* Slug redirect — short URLs */}
    <Route path="/s/:slug" element={<LayoutWrapper currentPageName="SlugRedirect"><SlugRedirect /></LayoutWrapper>} />

    {/* Friendly public slug URLs for proposals and contracts */}
    <Route path="/p/:slug" element={<LayoutWrapper currentPageName="PublicSlugRedirect"><PublicSlugRedirect type="proposal" /></LayoutWrapper>} />
    <Route path="/pp/:slug" element={<LayoutWrapper currentPageName="PublicSlugRedirect"><PublicSlugRedirect type="standardProposal" /></LayoutWrapper>} />
    <Route path="/pix/:slug" element={<LayoutWrapper currentPageName="PublicSlugRedirect"><PublicSlugRedirect type="pixProposal" /></LayoutWrapper>} />
    <Route path="/c/:slug" element={<LayoutWrapper currentPageName="PublicSlugRedirect"><PublicSlugRedirect type="contract" /></LayoutWrapper>} />
  </Routes>
);

// --- Admin pages require authentication ---
// ALLOWED ROLES: only users explicitly invited with these roles can access admin pages.
// Users who self-register via Gmail on a public app get role 'user' and are BLOCKED.
const ALLOWED_ADMIN_ROLES = new Set(['admin', 'introducer']);

const ADMIN_TOKEN_KEY = 'base44_admin_jwt';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, user, navigateToLogin } = useAuth();

  // SECURITY: serverRole is fetched from the server and CANNOT be tampered via DevTools.
  // We NEVER trust `user.role` from AuthContext for security decisions — only for UX hints.
  // Any attempt to override user.role in React DevTools will fail here because the server
  // returns the true role bound to the auth token.
  const [serverRole, setServerRole] = React.useState({ status: 'checking', role: null });

  // Admin JWT state — server-signed, HMAC-validated.
  const [adminTokenState, setAdminTokenState] = React.useState({ status: 'checking', token: null });

  // 2FA enrollment state (TOTP + PIN individual per user).
  const [twoFactorState, setTwoFactorState] = React.useState({ status: 'checking', enrolled: false });

  // ─── Fetch the true role from the server on every mount ───
  React.useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await base44.functions.invoke('verifyUserAuth', {});
        if (res.data?.authenticated && res.data?.role) {
          setServerRole({ status: 'ready', role: res.data.role });
        } else {
          setServerRole({ status: 'ready', role: null });
        }
      } catch (e) {
        setServerRole({ status: 'ready', role: null });
      }
    })();
  }, [isAuthenticated]);

  // ─── Verify admin JWT with the server on every mount ───
  React.useEffect(() => {
    if (!isAuthenticated || serverRole.status !== 'ready') return;
    const role = serverRole.role;

    // Introducers get their own dashboard — no admin token needed
    if (role === 'introducer') {
      setAdminTokenState({ status: 'verified', token: null });
      setTwoFactorState({ status: 'ready', enrolled: true });
      return;
    }
    if (!ALLOWED_ADMIN_ROLES.has(role)) {
      setAdminTokenState({ status: 'denied', token: null });
      return;
    }

    const storedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!storedToken) {
      setAdminTokenState({ status: 'unverified', token: null });
      return;
    }

    (async () => {
      try {
        const res = await base44.functions.invoke('verifyAdminToken', { token: storedToken });
        if (res.data?.valid === true && res.data?.admin === true) {
          setAdminTokenState({ status: 'verified', token: storedToken });
        } else {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminTokenState({ status: 'unverified', token: null });
        }
      } catch (e) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdminTokenState({ status: 'unverified', token: null });
      }
    })();
  }, [isAuthenticated, serverRole]);

  // ─── Fetch 2FA enrollment status for admins ───
  React.useEffect(() => {
    if (!isAuthenticated || serverRole.status !== 'ready') return;
    if (serverRole.role !== 'admin') return;

    (async () => {
      try {
        const res = await base44.functions.invoke('twoFactorStatus', {});
        setTwoFactorState({ status: 'ready', enrolled: !!res.data?.enrolled });
      } catch (e) {
        setTwoFactorState({ status: 'ready', enrolled: false });
      }
    })();
  }, [isAuthenticated, serverRole]);

  const refreshTwoFactorStatus = async () => {
    try {
      const res = await base44.functions.invoke('twoFactorStatus', {});
      setTwoFactorState({ status: 'ready', enrolled: !!res.data?.enrolled });
    } catch (e) {
      setTwoFactorState({ status: 'ready', enrolled: false });
    }
  };

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // If user is not logged in, redirect to login
  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  // Waiting for server-side role fetch
  if (serverRole.status !== 'ready') {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // SECURITY: Use server-returned role, NEVER trust local user.role.
  // An attacker with React DevTools cannot override serverRole because it comes from
  // a fresh authenticated API call on every mount.
  const effectiveRole = serverRole.role;

  if (!effectiveRole || !ALLOWED_ADMIN_ROLES.has(effectiveRole)) {
    return <AccessDenied />;
  }

  // Waiting for server-side JWT validation or 2FA status check
  if (adminTokenState.status === 'checking' || (effectiveRole === 'admin' && twoFactorState.status === 'checking')) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // SECURITY LAYER 2a: Forced 2FA enrollment for admins who haven't set up TOTP+PIN yet.
  if (effectiveRole === 'admin' && !twoFactorState.enrolled) {
    return <TwoFactorEnrollScreen userEmail={user?.email} onComplete={refreshTwoFactorStatus} />;
  }

  // SECURITY LAYER 2b: Require valid server-signed JWT for admin pages (TOTP + PIN login).
  // Token is validated server-side on every mount — bypass via DevTools is IMPOSSIBLE.
  // Introducers skip this gate (no 2FA) but get limited access.
  if (effectiveRole !== 'introducer' && adminTokenState.status !== 'verified') {
    return <TwoFactorLoginScreen onSuccess={(token) => setAdminTokenState({ status: 'verified', token })} />;
  }

  // SECURITY: Introducers are BLOCKED from admin routes — only see IntroducerDashboard.
  // Without this, an introducer could type /Cadastro in the URL and hit admin pages.
  // Note: admins/admins-pending access everything. Introducers are strictly caged.
  if (effectiveRole === 'introducer') {
    const path = window.location.pathname;
    if (path !== '/IntroducerDashboard') {
      window.location.replace('/IntroducerDashboard');
      return null;
    }
    return (
      <Routes>
        <Route path="/IntroducerDashboard" element={<IntroducerDashboard />} />
        <Route path="*" element={<IntroducerDashboard />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
      {Object.entries(Pages).map(([path, Page]) => {
        // Skip pages that are handled by PublicRoutes
        if (PUBLIC_PATHS.has(`/${path}`)) return null;
        // Skip pages that have explicit routes below
        const explicitRoutes = new Set([
          'GestaoIntroducers','QuestionarioReuniao','ProcessMeetingNotes','IntroducerDashboard',
          'QuestionarioReuniaoPix','GerenciarSubsellerLinks','ConfiguracaoParceiros',
          'GestaoPropostasPadrao','CriarPropostaPadrao','PropostaPadraoDetalhes',
          'GestaoPropostasPix','CriarPropostaPix','PropostaPixDetalhes',
          'GestaoLandingPages','DadosInsights','RiskScoringV4','RiskScoringSubcontas',
          'DashboardComercial','DashboardCEO','ProcessosModelo','GerarKickOff',
          'GerenciarTaxasPadrao','Cadastro','CadastroDetalhe'
        ]);
        if (explicitRoutes.has(path)) return null;
        return (
          <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
        );
      })}
      <Route path="/GestaoIntroducers" element={<LayoutWrapper currentPageName="GestaoIntroducers"><GestaoIntroducers /></LayoutWrapper>} />
      <Route path="/QuestionarioReuniao" element={<LayoutWrapper currentPageName="QuestionarioReuniao"><QuestionarioReuniao /></LayoutWrapper>} />
      <Route path="/ProcessMeetingNotes" element={<LayoutWrapper currentPageName="ProcessMeetingNotes"><ProcessMeetingNotes /></LayoutWrapper>} />
      <Route path="/IntroducerDashboard" element={<IntroducerDashboard />} />
      <Route path="/QuestionarioReuniaoPix" element={<LayoutWrapper currentPageName="QuestionarioReuniaoPix"><QuestionarioReuniaoPix /></LayoutWrapper>} />
      <Route path="/GerenciarSubsellerLinks" element={<LayoutWrapper currentPageName="GerenciarSubsellerLinks"><GerenciarSubsellerLinks /></LayoutWrapper>} />
      <Route path="/ConfiguracaoParceiros" element={<LayoutWrapper currentPageName="ConfiguracaoParceiros"><ConfiguracaoParceiros /></LayoutWrapper>} />
      <Route path="/GestaoPropostasPadrao" element={<LayoutWrapper currentPageName="GestaoPropostasPadrao"><GestaoPropostasPadrao /></LayoutWrapper>} />
      <Route path="/CriarPropostaPadrao" element={<LayoutWrapper currentPageName="CriarPropostaPadrao"><CriarPropostaPadrao /></LayoutWrapper>} />
      <Route path="/PropostaPadraoDetalhes" element={<LayoutWrapper currentPageName="PropostaPadraoDetalhes"><PropostaPadraoDetalhes /></LayoutWrapper>} />
      <Route path="/GestaoPropostasPix" element={<LayoutWrapper currentPageName="GestaoPropostasPix"><GestaoPropostasPix /></LayoutWrapper>} />
      <Route path="/CriarPropostaPix" element={<LayoutWrapper currentPageName="CriarPropostaPix"><CriarPropostaPix /></LayoutWrapper>} />
      <Route path="/PropostaPixDetalhes" element={<LayoutWrapper currentPageName="PropostaPixDetalhes"><PropostaPixDetalhes /></LayoutWrapper>} />
      <Route path="/GestaoLandingPages" element={<LayoutWrapper currentPageName="GestaoLandingPages"><GestaoLandingPages /></LayoutWrapper>} />
      <Route path="/DadosInsights" element={<LayoutWrapper currentPageName="DadosInsights"><DadosInsights /></LayoutWrapper>} />
      <Route path="/RiskScoringV4" element={<LayoutWrapper currentPageName="RiskScoringV4"><RiskScoringV4 /></LayoutWrapper>} />
      <Route path="/RiskScoringSubcontas" element={<LayoutWrapper currentPageName="RiskScoringSubcontas"><RiskScoringSubcontas /></LayoutWrapper>} />
      <Route path="/DashboardComercial" element={<LayoutWrapper currentPageName="DashboardComercial"><DashboardComercial /></LayoutWrapper>} />
      <Route path="/DashboardCEO" element={<LayoutWrapper currentPageName="DashboardCEO"><DashboardCEO /></LayoutWrapper>} />
      <Route path="/ProcessosModelo" element={<LayoutWrapper currentPageName="ProcessosModelo"><ProcessosModelo /></LayoutWrapper>} />
      <Route path="/GerarKickOff" element={<LayoutWrapper currentPageName="GerarKickOff"><GerarKickOff /></LayoutWrapper>} />
      <Route path="/GerenciarTaxasPadrao" element={<LayoutWrapper currentPageName="GerenciarTaxasPadrao"><GerenciarTaxasPadrao /></LayoutWrapper>} />
      <Route path="/Cadastro" element={<LayoutWrapper currentPageName="Cadastro"><Cadastro /></LayoutWrapper>} />
      <Route path="/CadastroDetalhe" element={<LayoutWrapper currentPageName="CadastroDetalhe"><CadastroDetalhe /></LayoutWrapper>} />
      <Route path="/BDCHealthDashboard" element={<LayoutWrapper currentPageName="BDCHealthDashboard"><BDCHealthDashboard /></LayoutWrapper>} />
      <Route path="/AnaliseCompleta" element={<LayoutWrapper currentPageName="AnaliseCompleta"><AnaliseCompleta /></LayoutWrapper>} />
      <Route path="/BulkReprocess" element={<LayoutWrapper currentPageName="BulkReprocess"><BulkReprocess /></LayoutWrapper>} />
      <Route path="/DocumentoKYCKYB" element={<DocumentoKYCKYB />} />
      <Route path="/EscalationsReview" element={<LayoutWrapper currentPageName="EscalationsReview"><EscalationsReview /></LayoutWrapper>} />
      <Route path="/AnaliseManual" element={<LayoutWrapper currentPageName="AnaliseManual"><AnaliseManual /></LayoutWrapper>} />
      <Route path="/GestaoPerfis" element={<LayoutWrapper currentPageName="GestaoPerfis"><GestaoPerfis /></LayoutWrapper>} />
      <Route path="/EditorPerfil" element={<LayoutWrapper currentPageName="EditorPerfil"><EditorPerfil /></LayoutWrapper>} />
      <Route path="/GestaoUsuarios" element={<LayoutWrapper currentPageName="GestaoUsuarios"><GestaoUsuarios /></LayoutWrapper>} />
      <Route path="/AuditoriaAcessos" element={<LayoutWrapper currentPageName="AuditoriaAcessos"><AuditoriaAcessos /></LayoutWrapper>} />
      <Route path="/CafTestLab" element={<LayoutWrapper currentPageName="CafTestLab"><CafTestLab /></LayoutWrapper>} />
      <Route path="/ComplianceParceiro" element={<LayoutWrapper currentPageName="ComplianceParceiro"><ComplianceParceiro /></LayoutWrapper>} />
      <Route path="/ComplianceParceiroDetalhe" element={<LayoutWrapper currentPageName="ComplianceParceiroDetalhe"><ComplianceParceiroDetalhe /></LayoutWrapper>} />
      <Route path="/AdminGestaoParceiros" element={<LayoutWrapper currentPageName="AdminGestaoParceiros"><AdminGestaoParceiros /></LayoutWrapper>} />
      <Route path="/DocCompParceiros" element={<LayoutWrapper currentPageName="DocCompParceiros"><DocCompParceiros /></LayoutWrapper>} />
      <Route path="/Governanca" element={<LayoutWrapper currentPageName="Governanca"><Governanca /></LayoutWrapper>} />
      <Route path="/DocumentacaoMaster" element={<LayoutWrapper currentPageName="DocumentacaoMaster"><DocumentacaoMaster /></LayoutWrapper>} />
      <Route path="/BdcLookup" element={<LayoutWrapper currentPageName="BdcLookup"><BdcLookup /></LayoutWrapper>} />
      <Route path="/V5_2_Status" element={<LayoutWrapper currentPageName="V5_2_Status"><V5_2_Status /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// --- Suspense fallback for lazy-loaded pages ---
const PageSuspenseFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// --- Main router: checks if current path is public or requires auth ---
const AppRoutes = () => {
  const location = useLocation();

  const tree = isPublicPath(location.pathname) ? <PublicRoutes /> : <AuthenticatedApp />;
  return <React.Suspense fallback={<PageSuspenseFallback />}>{tree}</React.Suspense>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PermissionsProvider>
          <LanguageProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <NavigationTracker />
                <AppRoutes />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </LanguageProvider>
        </PermissionsProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App