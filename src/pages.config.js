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
import ComplianceFullKYC from './pages/ComplianceFullKYC';
import ComplianceLite from './pages/ComplianceLite';
import ComplianceOnboardingStart from './pages/ComplianceOnboardingStart';
import CompliancePixOnly from './pages/CompliancePixOnly';
import Configuracoes from './pages/Configuracoes';
import DocumentUploadFull from './pages/DocumentUploadFull';
import DocumentUploadLite from './pages/DocumentUploadLite';
import DocumentUploadPix from './pages/DocumentUploadPix';
import EditorQuestionario from './pages/EditorQuestionario';
import GerarLinkOnboarding from './pages/GerarLinkOnboarding';
import GestaoDocumentos from './pages/GestaoDocumentos';
import GestaoRevalidacao from './pages/GestaoRevalidacao';
import HelenaIA from './pages/HelenaIA';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import IntegracoesExternas from './pages/IntegracoesExternas';
import LivenessFacematchStep from './pages/LivenessFacematchStep';
import LivenessSimulation from './pages/LivenessSimulation';
import OnboardingCompletion from './pages/OnboardingCompletion';
import QuestionariosRecebidos from './pages/QuestionariosRecebidos';
import RegrasDeCompliance from './pages/RegrasDeCompliance';
import TemplatesQuestionarios from './pages/TemplatesQuestionarios';
import ComplianceEcommerce from './pages/ComplianceEcommerce';
import DocumentUploadEcommerce from './pages/DocumentUploadEcommerce';
import ComplianceSaaS from './pages/ComplianceSaaS';
import DocumentUploadSaaS from './pages/DocumentUploadSaaS';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AnaliseDeCasos": AnaliseDeCasos,
    "Auditoria": Auditoria,
    "ComplianceFullKYC": ComplianceFullKYC,
    "ComplianceLite": ComplianceLite,
    "ComplianceOnboardingStart": ComplianceOnboardingStart,
    "CompliancePixOnly": CompliancePixOnly,
    "Configuracoes": Configuracoes,
    "DocumentUploadFull": DocumentUploadFull,
    "DocumentUploadLite": DocumentUploadLite,
    "DocumentUploadPix": DocumentUploadPix,
    "EditorQuestionario": EditorQuestionario,
    "GerarLinkOnboarding": GerarLinkOnboarding,
    "GestaoDocumentos": GestaoDocumentos,
    "GestaoRevalidacao": GestaoRevalidacao,
    "HelenaIA": HelenaIA,
    "Home": Home,
    "HowItWorks": HowItWorks,
    "IntegracoesExternas": IntegracoesExternas,
    "LivenessFacematchStep": LivenessFacematchStep,
    "LivenessSimulation": LivenessSimulation,
    "OnboardingCompletion": OnboardingCompletion,
    "QuestionariosRecebidos": QuestionariosRecebidos,
    "RegrasDeCompliance": RegrasDeCompliance,
    "TemplatesQuestionarios": TemplatesQuestionarios,
    "ComplianceEcommerce": ComplianceEcommerce,
    "DocumentUploadEcommerce": DocumentUploadEcommerce,
    "ComplianceSaaS": ComplianceSaaS,
    "DocumentUploadSaaS": DocumentUploadSaaS,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};