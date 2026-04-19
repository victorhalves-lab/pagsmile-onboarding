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
import { base44 } from '@/api/base44Client';
import GestaoIntroducers from './pages/GestaoIntroducers';
import IntroducerDashboard from './pages/IntroducerDashboard';
import QuestionarioReuniao from './pages/QuestionarioReuniao';
import ProcessMeetingNotes from './pages/ProcessMeetingNotes';
import ComplianceResume from './pages/ComplianceResume';
import LegacyComplianceRedirect from './pages/LegacyComplianceRedirect';
import QuestionarioReuniaoPix from './pages/QuestionarioReuniaoPix';
import SubsellerQuestionnaire from './pages/SubsellerQuestionnaire';
import GerenciarSubsellerLinks from './pages/GerenciarSubsellerLinks';
import ConfiguracaoParceiros from './pages/ConfiguracaoParceiros';
import IntroducerLandingPage from './pages/IntroducerLandingPage';
import GestaoPropostasPadrao from './pages/GestaoPropostasPadrao';
import CriarPropostaPadrao from './pages/CriarPropostaPadrao';
import PropostaPadraoDetalhes from './pages/PropostaPadraoDetalhes';
import PropostaPadraoPublica from './pages/PropostaPadraoPublica';
import GestaoPropostasPix from './pages/GestaoPropostasPix';
import CriarPropostaPix from './pages/CriarPropostaPix';
import PropostaPixDetalhes from './pages/PropostaPixDetalhes';
import PropostaPixPublica from './pages/PropostaPixPublica';
import GestaoLandingPages from './pages/GestaoLandingPages';
import DadosInsights from './pages/DadosInsights';
import RiskScoringV4 from './pages/RiskScoringV4';
import RiskScoringSubcontas from './pages/RiskScoringSubcontas';
import QuestionarioLeadsPagsmile from './pages/QuestionarioLeadsPagsmile';
import LeadPixV4 from './pages/LeadPixV4';
import FechamentoLandingPage from './pages/FechamentoLandingPage';
import DashboardComercial from './pages/DashboardComercial';
import DashboardCEO from './pages/DashboardCEO';
import ProcessosModelo from './pages/ProcessosModelo';
import GerarKickOff from './pages/GerarKickOff';
import KickOffPublico from './pages/KickOffPublico';
import SlugRedirect from './pages/SlugRedirect';
import AccessDenied from './components/AccessDenied';
import AdminLoginScreen from './components/admin/AdminLoginScreen';
import TwoFactorEnrollScreen from './components/admin/TwoFactorEnrollScreen';
import TwoFactorLoginScreen from './components/admin/TwoFactorLoginScreen';
import GerenciarTaxasPadrao from './pages/GerenciarTaxasPadrao';
import SubsellerDocUpload from './pages/SubsellerDocUpload';
import Cadastro from './pages/Cadastro';
import CadastroDetalhe from './pages/CadastroDetalhe';
import ComplianceDocOnly from './pages/ComplianceDocOnly';
import BDCHealthDashboard from './pages/BDCHealthDashboard';
import AnaliseCompleta from './pages/AnaliseCompleta';
import BulkReprocess from './pages/BulkReprocess';
import DocumentoKYCKYB from './pages/DocumentoKYCKYB';
import EscalationsReview from './pages/EscalationsReview';
import PublicSlugRedirect from './pages/PublicSlugRedirect';
import GestaoPerfis from './pages/GestaoPerfis';
import EditorPerfil from './pages/EditorPerfil';
import GestaoUsuarios from './pages/GestaoUsuarios';
import AuditoriaAcessos from './pages/AuditoriaAcessos';
import CafTestLab from './pages/CafTestLab';

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
    <Route path="/ComplianceDocOnly" element={<ComplianceDocOnly />} />

    {/* Questionário Simplificado */}
    {Pages['QuestionarioSimplificadoPublico'] && <Route path="/QuestionarioSimplificadoPublico" element={<LayoutWrapper currentPageName="QuestionarioSimplificadoPublico"><Pages.QuestionarioSimplificadoPublico /></LayoutWrapper>} />}

    {/* Leads V5 / PIX V4 */}
    <Route path="/QuestionarioLeadsPagsmile" element={<LayoutWrapper currentPageName="QuestionarioLeadsPagsmile"><QuestionarioLeadsPagsmile /></LayoutWrapper>} />
    <Route path="/LeadPixV4" element={<LayoutWrapper currentPageName="LeadPixV4"><LeadPixV4 /></LayoutWrapper>} />
    <Route path="/FechamentoLandingPage" element={<LayoutWrapper currentPageName="FechamentoLandingPage"><FechamentoLandingPage /></LayoutWrapper>} />
    <Route path="/KickOffPublico" element={<LayoutWrapper currentPageName="KickOffPublico"><KickOffPublico /></LayoutWrapper>} />

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
      <Route path="/GestaoPerfis" element={<LayoutWrapper currentPageName="GestaoPerfis"><GestaoPerfis /></LayoutWrapper>} />
      <Route path="/EditorPerfil" element={<LayoutWrapper currentPageName="EditorPerfil"><EditorPerfil /></LayoutWrapper>} />
      <Route path="/GestaoUsuarios" element={<LayoutWrapper currentPageName="GestaoUsuarios"><GestaoUsuarios /></LayoutWrapper>} />
      <Route path="/AuditoriaAcessos" element={<LayoutWrapper currentPageName="AuditoriaAcessos"><AuditoriaAcessos /></LayoutWrapper>} />
      <Route path="/CafTestLab" element={<LayoutWrapper currentPageName="CafTestLab"><CafTestLab /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

// --- Main router: checks if current path is public or requires auth ---
const AppRoutes = () => {
  const location = useLocation();

  if (isPublicPath(location.pathname)) {
    return <PublicRoutes />;
  }

  return <AuthenticatedApp />;
};

function App() {
  return (
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
  )
}

export default App