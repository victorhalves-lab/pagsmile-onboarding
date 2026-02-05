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
import ComplianceFullKYC from './pages/ComplianceFullKYC';
import ComplianceOnboardingStart from './pages/ComplianceOnboardingStart';
import CompliancePixOnly from './pages/CompliancePixOnly';
import DocumentUploadFull from './pages/DocumentUploadFull';
import DocumentUploadPix from './pages/DocumentUploadPix';
import Home from './pages/Home';
import LivenessFacematchStep from './pages/LivenessFacematchStep';
import LivenessSimulation from './pages/LivenessSimulation';
import OnboardingCompletion from './pages/OnboardingCompletion';
import QuestionariosRecebidos from './pages/QuestionariosRecebidos';
import AnaliseDeCasos from './pages/AnaliseDeCasos';
import GestaoDocumentos from './pages/GestaoDocumentos';
import GestaoRevalidacao from './pages/GestaoRevalidacao';
import GerarLinkOnboarding from './pages/GerarLinkOnboarding';
import TemplatesQuestionarios from './pages/TemplatesQuestionarios';
import EditorQuestionario from './pages/EditorQuestionario';
import RegrasDeCompliance from './pages/RegrasDeCompliance';
import IntegracoesExternas from './pages/IntegracoesExternas';
import HelenaIA from './pages/HelenaIA';
import Configuracoes from './pages/Configuracoes';
import Auditoria from './pages/Auditoria';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "ComplianceFullKYC": ComplianceFullKYC,
    "ComplianceOnboardingStart": ComplianceOnboardingStart,
    "CompliancePixOnly": CompliancePixOnly,
    "DocumentUploadFull": DocumentUploadFull,
    "DocumentUploadPix": DocumentUploadPix,
    "Home": Home,
    "LivenessFacematchStep": LivenessFacematchStep,
    "LivenessSimulation": LivenessSimulation,
    "OnboardingCompletion": OnboardingCompletion,
    "QuestionariosRecebidos": QuestionariosRecebidos,
    "AnaliseDeCasos": AnaliseDeCasos,
    "GestaoDocumentos": GestaoDocumentos,
    "GestaoRevalidacao": GestaoRevalidacao,
    "GerarLinkOnboarding": GerarLinkOnboarding,
    "TemplatesQuestionarios": TemplatesQuestionarios,
    "EditorQuestionario": EditorQuestionario,
    "RegrasDeCompliance": RegrasDeCompliance,
    "IntegracoesExternas": IntegracoesExternas,
    "HelenaIA": HelenaIA,
    "Configuracoes": Configuracoes,
    "Auditoria": Auditoria,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};