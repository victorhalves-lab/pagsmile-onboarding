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
import QuestionarioReuniaoPix from './pages/QuestionarioReuniaoPix';
import LeadQuestionnairePix from './pages/LeadQuestionnairePix';
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// --- Public routes: these pages do NOT require authentication ---
const PUBLIC_PATHS = new Set([
  '/LeadQuestionnaire',
  '/LeadQuestionnairePix',
  '/LeadSuccess',
  '/QuestionarioSimplificadoPublico',
  '/PropostaPublica',
  '/PropostaPadraoPublica',
  '/PropostaPixPublica',
  '/ContratoPublico',
  '/ComplianceOnboardingStart',
  '/ComplianceDinamico',
  '/ComplianceResume',
  '/CompliancePixOnly',
  '/ComplianceFullKYC',
  '/ComplianceLite',
  '/ComplianceSaaS',
  '/ComplianceGateway',
  '/ComplianceMerchant',
  '/ComplianceMarketplace',
  '/ComplianceEcommerce',
  '/DocumentUploadPix',
  '/DocumentUploadFull',
  '/DocumentUploadLite',
  '/DocumentUploadSaaS',
  '/DocumentUploadEcommerce',
  '/LivenessFacematchStep',
  '/LivenessSimulation',
  '/OnboardingCompletion',
  '/SubsellerQuestionnaire',
]);

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/parceiro/')) return true;
  return false;
}

// --- Public pages are rendered without auth checks ---
const PublicRoutes = () => (
  <Routes>
    {/* Lead Questionnaires */}
    {['LeadQuestionnaire', 'LeadQuestionnairePix', 'LeadSuccess', 'QuestionarioSimplificadoPublico'].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}

    {/* Propostas Públicas */}
    {['PropostaPublica', 'PropostaPadraoPublica', 'PropostaPixPublica'].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}
    <Route path="/PropostaPadraoPublica" element={<LayoutWrapper currentPageName="PropostaPadraoPublica"><PropostaPadraoPublica /></LayoutWrapper>} />
    <Route path="/PropostaPixPublica" element={<LayoutWrapper currentPageName="PropostaPixPublica"><PropostaPixPublica /></LayoutWrapper>} />

    {/* Contrato Público */}
    {Pages['ContratoPublico'] && <Route path="/ContratoPublico" element={<LayoutWrapper currentPageName="ContratoPublico"><Pages.ContratoPublico /></LayoutWrapper>} />}

    {/* Landing Pages */}
    <Route path="/parceiro/:uniqueLandingPageSlug" element={<LayoutWrapper currentPageName="IntroducerLandingPage"><IntroducerLandingPage /></LayoutWrapper>} />

    {/* Compliance / Onboarding */}
    {['ComplianceOnboardingStart', 'ComplianceDinamico', 'CompliancePixOnly', 'ComplianceFullKYC',
      'ComplianceLite', 'ComplianceSaaS', 'ComplianceGateway', 'ComplianceMerchant',
      'ComplianceMarketplace', 'ComplianceEcommerce',
      'DocumentUploadPix', 'DocumentUploadFull', 'DocumentUploadLite', 'DocumentUploadSaaS', 'DocumentUploadEcommerce',
      'LivenessFacematchStep', 'LivenessSimulation', 'OnboardingCompletion'
    ].map(name => {
      const Page = Pages[name];
      return Page ? <Route key={name} path={`/${name}`} element={<LayoutWrapper currentPageName={name}><Page /></LayoutWrapper>} /> : null;
    })}
    <Route path="/ComplianceResume" element={<LayoutWrapper currentPageName="ComplianceResume"><ComplianceResume /></LayoutWrapper>} />

    {/* Subseller */}
    <Route path="/SubsellerQuestionnaire" element={<LayoutWrapper currentPageName="SubsellerQuestionnaire"><SubsellerQuestionnaire /></LayoutWrapper>} />
    <Route path="/LeadQuestionnairePix" element={<LayoutWrapper currentPageName="LeadQuestionnairePix"><LeadQuestionnairePix /></LayoutWrapper>} />
  </Routes>
);

// --- Admin pages require authentication ---
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

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

  // If app is public but user is not logged in, redirect to login
  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
      {Object.entries(Pages).map(([path, Page]) => {
        // Skip pages that are handled by PublicRoutes
        if (PUBLIC_PATHS.has(`/${path}`)) return null;
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