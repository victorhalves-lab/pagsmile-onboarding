import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
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

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/GestaoIntroducers" element={<LayoutWrapper currentPageName="GestaoIntroducers"><GestaoIntroducers /></LayoutWrapper>} />
      <Route path="/QuestionarioReuniao" element={<LayoutWrapper currentPageName="QuestionarioReuniao"><QuestionarioReuniao /></LayoutWrapper>} />
      <Route path="/ProcessMeetingNotes" element={<LayoutWrapper currentPageName="ProcessMeetingNotes"><ProcessMeetingNotes /></LayoutWrapper>} />
      <Route path="/IntroducerDashboard" element={<IntroducerDashboard />} />
      <Route path="/ComplianceResume" element={<LayoutWrapper currentPageName="ComplianceResume"><ComplianceResume /></LayoutWrapper>} />
      <Route path="/QuestionarioReuniaoPix" element={<LayoutWrapper currentPageName="QuestionarioReuniaoPix"><QuestionarioReuniaoPix /></LayoutWrapper>} />
      <Route path="/LeadQuestionnairePix" element={<LayoutWrapper currentPageName="LeadQuestionnairePix"><LeadQuestionnairePix /></LayoutWrapper>} />
      <Route path="/SubsellerQuestionnaire" element={<LayoutWrapper currentPageName="SubsellerQuestionnaire"><SubsellerQuestionnaire /></LayoutWrapper>} />
      <Route path="/GerenciarSubsellerLinks" element={<LayoutWrapper currentPageName="GerenciarSubsellerLinks"><GerenciarSubsellerLinks /></LayoutWrapper>} />
      <Route path="/ConfiguracaoParceiros" element={<LayoutWrapper currentPageName="ConfiguracaoParceiros"><ConfiguracaoParceiros /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App