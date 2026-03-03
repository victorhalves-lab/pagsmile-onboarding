/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AnaliseDeCasos from './pages/AnaliseDeCasos';
import Auditoria from './pages/Auditoria';
import ComplianceEcommerce from './pages/ComplianceEcommerce';
import ComplianceFullKYC from './pages/ComplianceFullKYC';
import ComplianceLite from './pages/ComplianceLite';
import ComplianceOnboardingStart from './pages/ComplianceOnboardingStart';
import CompliancePixOnly from './pages/CompliancePixOnly';
import ComplianceSaaS from './pages/ComplianceSaaS';
import Configuracoes from './pages/Configuracoes';
import CriarProposta from './pages/CriarProposta';
import DocumentUploadEcommerce from './pages/DocumentUploadEcommerce';
import DocumentUploadFull from './pages/DocumentUploadFull';
import DocumentUploadLite from './pages/DocumentUploadLite';
import DocumentUploadPix from './pages/DocumentUploadPix';
import DocumentUploadSaaS from './pages/DocumentUploadSaaS';
import EditorQuestionario from './pages/EditorQuestionario';
import GerarLinkOnboarding from './pages/GerarLinkOnboarding';
import GestaoDocumentos from './pages/GestaoDocumentos';
import GestaoPropostas from './pages/GestaoPropostas';
import GestaoRevalidacao from './pages/GestaoRevalidacao';
import HelenaIA from './pages/HelenaIA';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import IntegracoesExternas from './pages/IntegracoesExternas';
import LeadDetails from './pages/LeadDetails';
import LeadManagement from './pages/LeadManagement';
import LeadQuestionnaire from './pages/LeadQuestionnaire';
import LeadSuccess from './pages/LeadSuccess';
import LivenessFacematchStep from './pages/LivenessFacematchStep';
import LivenessSimulation from './pages/LivenessSimulation';
import MessageTemplates from './pages/MessageTemplates';
import OnboardingCompletion from './pages/OnboardingCompletion';
import PipelineComercial from './pages/PipelineComercial';
import PropostaPublica from './pages/PropostaPublica';
import QuestionarioSimplificadoPublico from './pages/QuestionarioSimplificadoPublico';
import QuestionariosLeads from './pages/QuestionariosLeads';
import QuestionariosRecebidos from './pages/QuestionariosRecebidos';
import RegrasDeCompliance from './pages/RegrasDeCompliance';
import TemplatesQuestionarios from './pages/TemplatesQuestionarios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AnaliseDeCasos": AnaliseDeCasos,
    "Auditoria": Auditoria,
    "ComplianceEcommerce": ComplianceEcommerce,
    "ComplianceFullKYC": ComplianceFullKYC,
    "ComplianceLite": ComplianceLite,
    "ComplianceOnboardingStart": ComplianceOnboardingStart,
    "CompliancePixOnly": CompliancePixOnly,
    "ComplianceSaaS": ComplianceSaaS,
    "Configuracoes": Configuracoes,
    "CriarProposta": CriarProposta,
    "DocumentUploadEcommerce": DocumentUploadEcommerce,
    "DocumentUploadFull": DocumentUploadFull,
    "DocumentUploadLite": DocumentUploadLite,
    "DocumentUploadPix": DocumentUploadPix,
    "DocumentUploadSaaS": DocumentUploadSaaS,
    "EditorQuestionario": EditorQuestionario,
    "GerarLinkOnboarding": GerarLinkOnboarding,
    "GestaoDocumentos": GestaoDocumentos,
    "GestaoPropostas": GestaoPropostas,
    "GestaoRevalidacao": GestaoRevalidacao,
    "HelenaIA": HelenaIA,
    "Home": Home,
    "HowItWorks": HowItWorks,
    "IntegracoesExternas": IntegracoesExternas,
    "LeadDetails": LeadDetails,
    "LeadManagement": LeadManagement,
    "LeadQuestionnaire": LeadQuestionnaire,
    "LeadSuccess": LeadSuccess,
    "LivenessFacematchStep": LivenessFacematchStep,
    "LivenessSimulation": LivenessSimulation,
    "MessageTemplates": MessageTemplates,
    "OnboardingCompletion": OnboardingCompletion,
    "PipelineComercial": PipelineComercial,
    "PropostaPublica": PropostaPublica,
    "QuestionarioSimplificadoPublico": QuestionarioSimplificadoPublico,
    "QuestionariosLeads": QuestionariosLeads,
    "QuestionariosRecebidos": QuestionariosRecebidos,
    "RegrasDeCompliance": RegrasDeCompliance,
    "TemplatesQuestionarios": TemplatesQuestionarios,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};