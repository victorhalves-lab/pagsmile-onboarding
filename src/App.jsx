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
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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
import GerenciarTaxasPadrao from './pages/GerenciarTaxasPadrao';
import SubsellerDocUpload from './pages/SubsellerDocUpload';
import Cadastro from './pages/Cadastro';
import CadastroDetalhe from './pages/CadastroDetalhe';
import ComplianceDocOnly from './pages/ComplianceDocOnly';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// --- Public routes: these pages do NOT require authentication ---
const PUBLIC_PATHS = new Set([
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

// Also treat /s/:slug as public


function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/parceiro/')) return true;
  if (pathname.startsWith('/s/')) return true;
  return false;
}

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
  </Routes>
);

// --- Admin pages require authentication ---
// ALLOWED ROLES: only users explicitly invited with these roles can access admin pages.
// Users who self-register via Gmail on a public app get role 'user' and are BLOCKED.
const ALLOWED_ADMIN_ROLES = new Set(['admin', 'introducer']);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, user, navigateToLogin } = useAuth();
  const [adminVerified, setAdminVerified] = React.useState(() => sessionStorage.getItem('admin_verified') === 'true');

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

  // SECURITY: Block users who self-registered (role 'user') from accessing admin pages.
  // Only explicitly invited users (admin, introducer) can access.
  if (user && !ALLOWED_ADMIN_ROLES.has(user.role)) {
    return <AccessDenied />;
  }

  // SECURITY LAYER 2: Require admin access code even for invited users.
  // Code is verified server-side and cached in sessionStorage for the browser session.
  if (!adminVerified) {
    return <AdminLoginScreen onSuccess={() => setAdminVerified(true)} />;  
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
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AppRoutes />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}

export default App