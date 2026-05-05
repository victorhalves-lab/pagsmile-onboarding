/**
 * pages.config.js - Page routing configuration
 *
 * Pages are lazy-loaded via React.lazy so a single broken page doesn't
 * crash the entire app. If one page fails to load, only that route shows
 * an error — every other page keeps working.
 */
import React from 'react';
import __Layout from './Layout.jsx';

const lazyPage = (loader) => React.lazy(() =>
  loader().catch((err) => {
    console.error('[pages.config] Failed to load page:', err);
    return {
      default: () => React.createElement(
        'div',
        { style: { padding: '32px', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' } },
        React.createElement('h1', { style: { color: '#002443', fontSize: '18px', marginBottom: '8px' } }, 'Erro ao carregar esta página'),
        React.createElement('p', { style: { color: '#002443', opacity: 0.7, fontSize: '14px' } }, String(err?.message || err))
      ),
    };
  })
);

export const PAGES = {
    "AdminDashboard": lazyPage(() => import('./pages/AdminDashboard')),
    "AnaliseDeCasos": lazyPage(() => import('./pages/AnaliseDeCasos')),
    "Auditoria": lazyPage(() => import('./pages/Auditoria')),
    "ComplianceDinamico": lazyPage(() => import('./pages/ComplianceDinamico')),
    "Configuracoes": lazyPage(() => import('./pages/Configuracoes')),
    "ContratoPublico": lazyPage(() => import('./pages/ContratoPublico')),
    "CriarContrato": lazyPage(() => import('./pages/CriarContrato')),
    "CriarProposta": lazyPage(() => import('./pages/CriarProposta')),
    "DocumentUploadFull": lazyPage(() => import('./pages/DocumentUploadFull')),
    "DocumentUploadPix": lazyPage(() => import('./pages/DocumentUploadPix')),
    "EditorContrato": lazyPage(() => import('./pages/EditorContrato')),
    "EditorQuestionario": lazyPage(() => import('./pages/EditorQuestionario')),
    "GerarLinkOnboarding": lazyPage(() => import('./pages/GerarLinkOnboarding')),
    "GestaoContratos": lazyPage(() => import('./pages/GestaoContratos')),
    "GestaoDocumentos": lazyPage(() => import('./pages/GestaoDocumentos')),
    "GestaoPropostas": lazyPage(() => import('./pages/GestaoPropostas')),
    "GestaoRevalidacao": lazyPage(() => import('./pages/GestaoRevalidacao')),
    "HelenaIA": lazyPage(() => import('./pages/HelenaIA')),
    "Home": lazyPage(() => import('./pages/Home')),
    "HowItWorks": lazyPage(() => import('./pages/HowItWorks')),
    "IntegracoesExternas": lazyPage(() => import('./pages/IntegracoesExternas')),
    "LeadDetails": lazyPage(() => import('./pages/LeadDetails')),
    "LeadManagement": lazyPage(() => import('./pages/LeadManagement')),
    "LeadQuestionnaire": lazyPage(() => import('./pages/LeadQuestionnaire')),
    "LeadSuccess": lazyPage(() => import('./pages/LeadSuccess')),
    "LinksCompliance": lazyPage(() => import('./pages/LinksCompliance')),
    "LinksQuestionariosLeads": lazyPage(() => import('./pages/LinksQuestionariosLeads')),
    "MessageTemplates": lazyPage(() => import('./pages/MessageTemplates')),
    "OnboardingCompletion": lazyPage(() => import('./pages/OnboardingCompletion')),
    "PipelineComercial": lazyPage(() => import('./pages/PipelineComercial')),
    "PublicOnboarding": lazyPage(() => import('./pages/PublicOnboarding')),
    "PreviewContrato": lazyPage(() => import('./pages/PreviewContrato')),
    "PropostaDetalhes": lazyPage(() => import('./pages/PropostaDetalhes')),
    "PropostaPublica": lazyPage(() => import('./pages/PropostaPublica')),
    "QuestionarioSimplificadoPublico": lazyPage(() => import('./pages/QuestionarioSimplificadoPublico')),
    "QuestionariosLeads": lazyPage(() => import('./pages/QuestionariosLeads')),
    "SlugRedirect": lazyPage(() => import('./pages/SlugRedirect')),
    "SubsellerQuestionnaire": lazyPage(() => import('./pages/SubsellerQuestionnaire')),
    "QuestionariosRecebidos": lazyPage(() => import('./pages/QuestionariosRecebidos')),
    "RegrasDeCompliance": lazyPage(() => import('./pages/RegrasDeCompliance')),
    "TemplatesQuestionarios": lazyPage(() => import('./pages/TemplatesQuestionarios')),
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};