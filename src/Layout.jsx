import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isPublicPath } from '@/lib/publicRoutes';
import { 
  LayoutDashboard, 
  FileCheck, 
  Settings, 
  LogOut,
  Menu,
  X,
  Link as LinkIcon,
  Users,
  Inbox,
  Plug,
  Brain,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  History,
  Stamp,
  UserPlus,
  PanelLeftClose,
  PanelLeft,
  Home as HomeIcon,
  Wrench,
  BookOpen,
  Handshake,
  BarChart3,
  Presentation,
  Database,
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState([]);
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });

  // ⚡ SECURITY + STABILITY: on public routes we MUST NOT call base44.auth.me().
  // The SDK crashes anonymous visitors with a MessagePort/instanceof TypeError when
  // it tries to validate a missing token. Short-circuit before any auth call.
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isPublicRoute = isPublicPath(pathname);

  const { data: authData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch (error) {
        return { user: null, isAuthenticated: false };
      }
    },
    enabled: !isPublicRoute, // never runs on public pages
  });

  const user = isPublicRoute ? null : authData?.user;
  const isAuthenticated = isPublicRoute ? false : !!authData?.isAuthenticated;
  const isAdmin = user?.role === 'admin';

  const publicPages = [
    'IntroducerLandingPage','ContratoPublico','PropostaPadraoPublica','PropostaPixPublica',
    'OnboardingCompletion','PropostaPublica',
    'ComplianceDinamico','ComplianceResume','SubsellerQuestionnaire',
    'QuestionarioSimplificadoPublico',
    'QuestionarioLeadsPagsmile','LeadPixV4','FechamentoLandingPage','KickOffPublico',
    'SubsellerDocUpload','BankDataCollect'
  ];
  const isPublicPage = publicPages.includes(currentPageName);

  // Admin verification agora é feito pelo AuthContext (login por convite)

  const toggleSection = (sectionId) => {
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem('sidebar_collapsed', 'false');
      setExpandedSections([sectionId]);
      return;
    }
    setExpandedSections(prev => prev.includes(sectionId) ? [] : [sectionId]);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
    if (next) setExpandedSections([]);
  };

  const menuStructure = [
    {
      id: 'leads',
      label: t('menu.leads_proposals'),
      icon: Inbox,
      items: [
        { label: 'Dashboard CEO', path: 'DashboardCEO', icon: BarChart3 },
        { label: 'Dashboard Comercial', path: 'DashboardComercial', icon: LayoutDashboard },
        { label: t('menu.questionnaire_links'), path: 'LinksQuestionariosLeads', icon: LinkIcon },
        { label: t('menu.received_questionnaires'), path: 'QuestionariosLeads', icon: ClipboardList, highlight: true },
        { label: t('menu.commercial_pipeline'), path: 'PipelineComercial', icon: Users },
        { label: t('menu.proposal_management'), path: 'GestaoPropostas', icon: FileText },
        { label: t('menu.create_proposal'), path: 'CriarProposta', icon: FileCheck },
        { label: t('menu.standard_proposals'), path: 'GestaoPropostasPadrao', icon: FileText },
        { label: t('menu.pix_proposals'), path: 'GestaoPropostasPix', icon: FileText },
        { label: t('menu.introducers'), path: 'GestaoIntroducers', icon: UserPlus },
        { label: t('menu.landing_pages'), path: 'GestaoLandingPages', icon: LinkIcon },
        { label: t('menu.meeting_questionnaire'), path: 'QuestionarioReuniao', icon: ClipboardList },
        { label: t('menu.robot_questionnaire'), path: 'ProcessMeetingNotes', icon: Brain },
      ]
    },
    {
      id: 'compliance',
      label: t('menu.compliance'),
      icon: Shield,
      items: [
        { label: t('menu.dashboard'), path: 'AdminDashboard', icon: LayoutDashboard },
        { label: t('menu.compliance_links'), path: 'LinksCompliance', icon: LinkIcon },
        { label: t('menu.received_questionnaires'), path: 'QuestionariosRecebidos', icon: FileCheck },
        { label: t('menu.case_analysis'), path: 'AnaliseDeCasos', icon: ClipboardList, hidden: true },
        { label: t('menu.document_management'), path: 'GestaoDocumentos', icon: FileText },
        { label: t('menu.revalidation'), path: 'GestaoRevalidacao', icon: History },
        { label: t('menu.subaccount_links'), path: 'GerenciarSubsellerLinks', icon: Users },
        { label: 'Risk Scoring', path: 'RiskScoringV4', icon: Shield },
        { label: 'Risk Scoring Subcontas', path: 'RiskScoringSubcontas', icon: Shield },
        { label: 'Escalações Questionáveis', path: 'EscalationsReview', icon: AlertTriangle, highlight: true },
        { label: 'Reprocessar Compliance', path: 'BulkReprocess', icon: RotateCcw },
        { label: 'Documento KYC/KYB', path: 'DocumentoKYCKYB', icon: FileText },
        { label: 'Compliance Parceiro', path: 'ComplianceParceiro', icon: Handshake, highlight: true },
        { label: 'Doc Compliance Parceiros', path: 'DocCompParceiros', icon: FileSpreadsheet, highlight: true },
      ]
    },
    {
      id: 'contratos',
      label: t('menu.contracts'),
      icon: Stamp,
      items: [
        { label: t('menu.contract_management'), path: 'GestaoContratos', icon: FileText },
        { label: t('menu.create_contract'), path: 'CriarContrato', icon: FileCheck },
      ]
    },
    {
      id: 'tools',
      label: t('menu.tools'),
      icon: Wrench,
      items: [
        { label: t('menu.generate_link'), path: 'GerarLinkOnboarding', icon: LinkIcon },
        { label: t('menu.templates'), path: 'TemplatesQuestionarios', icon: FileText },
        { label: t('menu.message_templates'), path: 'MessageTemplates', icon: FileText },
        { label: 'Taxas Padrão Segmento', path: 'GerenciarTaxasPadrao', icon: Settings },
        { label: t('menu.rules_workflows'), path: 'RegrasDeCompliance', icon: Settings },
      ]
    },
    {
      id: 'integrations',
      label: t('menu.integrations'),
      icon: Plug,
      items: [
        { label: t('menu.caf_bigdatacorp'), path: 'IntegracoesExternas', icon: Plug },
        { label: 'CAF Test Lab', path: 'CafTestLab', icon: Wrench, adminOnly: true },
        { label: t('menu.helena_ai'), path: 'HelenaIA', icon: Brain },
      ]
    },
    {
      id: 'admin',
      label: t('menu.administration'),
      icon: Settings,
      items: [
        { label: 'Governança', path: 'Governanca', icon: Shield, adminOnly: true, highlight: true },
        { label: 'Perfis de Acesso', path: 'GestaoPerfis', icon: Shield, adminOnly: true },
        { label: 'Usuários & Perfis', path: 'GestaoUsuarios', icon: Users, adminOnly: true },
        { label: 'Parceiros de Compliance', path: 'AdminGestaoParceiros', icon: Handshake, adminOnly: true },
        { label: 'Auditoria de Acessos', path: 'AuditoriaAcessos', icon: History, adminOnly: true },
        { label: t('menu.settings'), path: 'Configuracoes', icon: Settings },
        { label: t('menu.audit'), path: 'Auditoria', icon: History },
      ]
    }
  ];

  // Auto-expand section containing active page (hooks MUST be before any early return)
  const prevPageRef = React.useRef(currentPageName);
  React.useEffect(() => {
    if (collapsed) return;
    const findSection = () => {
      for (const section of menuStructure) {
        if (section.items.some(i => i.path === currentPageName)) {
          return section.id;
        }
      }
      return null;
    };
    const activeSectionId = findSection();
    if (activeSectionId) {
      setExpandedSections(prev => {
        if (prev.length === 1 && prev[0] === activeSectionId) return prev;
        return [activeSectionId];
      });
    }
    prevPageRef.current = currentPageName;
  }, [currentPageName, collapsed]);

  // Check if a section has the active page
  const sectionHasActive = (section) => section.items.some(i => i.path === currentPageName);

  // Public layout
  if (isPublicPage) {
    return (
      <div className="min-h-screen font-sans antialiased bg-[#f4f4f4]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          :root {
            --pagsmile-green: #2bc196; --pagsmile-green-light: #5cf7cf;
            --pagsmile-blue: #002443; --pagsmile-blue-light: #003366;
            --pagsmile-gray: #f4f4f4; --font-sans: 'Plus Jakarta Sans', sans-serif;
            --foreground: #002443; --primary: #2bc196; --primary-foreground: #ffffff;
            --secondary: #002443; --secondary-foreground: #ffffff;
            --muted: #f4f4f4; --muted-foreground: #002443;
            --accent: #2bc196; --accent-foreground: #ffffff;
            --card: #ffffff; --card-foreground: #002443;
            --popover: #ffffff; --popover-foreground: #002443;
            --border: #e2e8f0; --input: #e2e8f0; --ring: #2bc196;
          }
          body { font-family: var(--font-sans); color: #002443; }
          * { color: inherit; }
          h1,h2,h3,h4,h5,h6,p,span,label,div { color: #002443; }
          .text-muted-foreground { color: #002443 !important; opacity: 0.7; }
          .text-foreground { color: #002443 !important; }
          .text-primary { color: #2bc196 !important; }
          .bg-primary { background-color: #2bc196 !important; }
          .text-black,.text-gray-900,.text-gray-800,.text-gray-700,.text-gray-600,.text-gray-500,.text-slate-900,.text-slate-800,.text-slate-700,.text-slate-600,.text-slate-500 { color: #002443 !important; }
          .modern-shadow { box-shadow: 0 4px 20px rgba(0,36,67,0.05); }
          .glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
        `}</style>
        <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--pagsmile-blue)] via-[var(--pagsmile-green)] to-[var(--pagsmile-green-light)] z-[60]" />
        <div className="fixed left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--pagsmile-blue)] via-[var(--pagsmile-green)] to-[var(--pagsmile-green-light)] z-[60]" />
        <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--pagsmile-blue)] via-[var(--pagsmile-green)] to-[var(--pagsmile-green-light)] z-[60]" />
        <div className="fixed top-4 right-4 z-[70]">
          <LanguageSelector />
        </div>
        <main className="pt-8 pb-8 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>
        </main>
        <footer className="py-4 text-center text-xs text-[var(--pagsmile-blue)]/40">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </footer>
      </div>
    );
  }

  const isIntroducerUser = user?.role === 'introducer';
  const isIntroducerPage = currentPageName === 'IntroducerDashboard';
  if (!isPublicPage && isIntroducerUser && !isIntroducerPage) {
    window.location.href = '/IntroducerDashboard';
    return null;
  }
  if (isIntroducerPage) return <div>{children}</div>;
  // Páginas admin são protegidas pelo AuthenticatedApp no App.jsx (login por convite)

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';
  const mainMargin = collapsed ? 'lg:ml-[72px]' : 'lg:ml-64';

  // ── Nav Item ──
  const NavItem = ({ item, isActive, onClick, isCollapsed }) => {
    const Icon = item.icon;
    const content = (
      <Link
        to={createPageUrl(item.path)}
        onClick={onClick}
        className={`group flex items-center gap-3 rounded-lg transition-all duration-200 text-[13px] font-medium relative
          ${isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}
          ${isActive
            ? 'bg-[#2bc196]/15 text-[#5cf7cf] font-semibold'
            : item.highlight && !isActive
            ? 'text-[#2bc196] hover:bg-white/5'
            : 'text-white/55 hover:text-white/90 hover:bg-white/5'
          }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#2bc196] rounded-r-full" />
        )}
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#2bc196]' : item.highlight ? 'text-[#2bc196]' : 'text-white/35 group-hover:text-white/60'}`} />
        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!isCollapsed && item.highlight && !isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#2bc196] animate-pulse" />
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-[#002443] text-white border-white/10 text-xs font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  // ── Nav Section ──
  const NavSection = ({ section, isMobile = false, isCollapsed = false }) => {
    const isExpanded = expandedSections.includes(section.id);
    const hasActive = sectionHasActive(section);
    const SectionIcon = section.icon;
    const visibleItems = section.items.filter(item => !item.hidden && (!item.adminOnly || isAdmin));

    // Collapsed: show just the section icon
    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => toggleSection(section.id)}
              className={`flex items-center justify-center w-full py-2.5 rounded-lg transition-all duration-200
                ${hasActive ? 'bg-[#2bc196]/10 text-[#2bc196]' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            >
              <SectionIcon className={`w-5 h-5 ${hasActive ? 'text-[#2bc196]' : 'text-white/35'}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#002443] text-white border-white/10 text-xs font-medium">
            {section.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div>
        {/* Section Header */}
        <button
          onClick={() => toggleSection(section.id)}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 rounded-lg
            ${isExpanded 
              ? 'text-[#2bc196] bg-[#2bc196]/8' 
              : hasActive
              ? 'text-[#2bc196]/70 hover:bg-white/5'
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
        >
          <SectionIcon className={`w-[18px] h-[18px] flex-shrink-0 ${isExpanded ? 'text-[#2bc196]' : hasActive ? 'text-[#2bc196]/60' : 'text-white/25'}`} />
          <span className="flex-1 text-left">{section.label}</span>
          {hasActive && !isExpanded && <span className="w-1.5 h-1.5 rounded-full bg-[#2bc196]" />}
          {isExpanded 
            ? <ChevronDown className="w-3.5 h-3.5 text-[#2bc196]/50" /> 
            : <ChevronRight className="w-3.5 h-3.5 text-white/20" />
          }
        </button>

        {/* Sub Items */}
        {isExpanded && (
          <div className="mt-1 ml-3 pl-3 border-l-2 border-[#2bc196]/20 space-y-0.5 pb-1">
            {visibleItems.map(item => (
              <NavItem 
                key={item.path} 
                item={item} 
                isActive={currentPageName === item.path}
                onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
                isCollapsed={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Separator ──
  const SectionDivider = ({ isCollapsed }) => (
    <div className={`my-2 ${isCollapsed ? 'mx-2' : 'mx-3'}`}>
      <div className="h-px bg-white/8" />
    </div>
  );

  // Group sections for dividers: primary [leads, compliance, contratos] | secondary [tools, integrations] | admin
  const primarySections = menuStructure.filter(s => ['leads', 'compliance', 'contratos'].includes(s.id));
  const secondarySections = menuStructure.filter(s => ['tools', 'integrations'].includes(s.id));
  const cadastroItem = { label: 'Cadastro', path: 'Cadastro', icon: Database };
  const adminSections = menuStructure.filter(s => s.id === 'admin');

  const renderSections = (sections, isMobile = false) => (
    <div className="space-y-0.5">
      {sections.map(section => (
        <NavSection key={section.id} section={section} isMobile={isMobile} isCollapsed={collapsed && !isMobile} />
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f4f4f4] flex font-sans">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          :root {
            --pagsmile-green: #2bc196; --pagsmile-green-light: #5cf7cf;
            --pagsmile-blue: #002443; --pagsmile-blue-light: #003366;
            --pagsmile-gray: #f4f4f4; --font-sans: 'Plus Jakarta Sans', sans-serif;
          }
          body { font-family: var(--font-sans); color: var(--pagsmile-blue); }
        `}</style>

        {/* ═══════ Desktop Sidebar ═══════ */}
        {isAuthenticated && (
          <aside className={`hidden lg:flex flex-col ${sidebarWidth} bg-[#002443] h-screen fixed left-0 top-0 z-20 transition-all duration-300 ease-in-out`}>
            
            {/* Logo + Language */}
            <div className={`border-b border-white/8 flex items-center ${collapsed ? 'px-3 py-4 justify-center flex-col gap-3' : 'px-5 py-4 justify-between'}`}>
              {collapsed ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-[#2bc196] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <LanguageSelector variant="sidebar-collapsed" />
                </>
              ) : (
                <>
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" 
                    alt="Pagsmile" 
                    className="h-7 w-auto"
                  />
                  <LanguageSelector variant="sidebar" />
                </>
              )}
            </div>

            {/* Navigation */}
            <nav className={`flex-1 min-h-0 ${collapsed ? 'px-2' : 'px-3'} py-3 overflow-y-auto sidebar-nav`}>
              
              {/* Home */}
              <div className="mb-1">
                <NavItem 
                  item={{ label: t('menu.home'), path: 'Home', icon: HomeIcon }} 
                  isActive={currentPageName === 'Home'}
                  isCollapsed={collapsed}
                />
              </div>

              <SectionDivider isCollapsed={collapsed} />

              {/* Primary: Leads, Compliance, Contratos */}
              {!collapsed && <div className="px-3 mb-1"><span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">{t('sidebar.operations')}</span></div>}
              {renderSections(primarySections)}

              {/* Cadastro - standalone */}
              <div className="mt-1">
                <NavItem 
                  item={cadastroItem} 
                  isActive={currentPageName === 'Cadastro' || currentPageName === 'CadastroDetalhe'}
                  isCollapsed={collapsed}
                />
              </div>

              <SectionDivider isCollapsed={collapsed} />

              {/* Secondary: Tools, Integrations */}
              {!collapsed && <div className="px-3 mb-1"><span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">{t('sidebar.system')}</span></div>}
              {renderSections(secondarySections)}

              <SectionDivider isCollapsed={collapsed} />

              {/* Admin */}
              {renderSections(adminSections)}

              {/* Parceiros - standalone */}
              <div className="mt-1">
                <NavItem 
                  item={{ label: t('menu.partners'), path: 'ConfiguracaoParceiros', icon: Handshake }} 
                  isActive={currentPageName === 'ConfiguracaoParceiros'}
                  isCollapsed={collapsed}
                />
              </div>

              {/* Dados & Insights - standalone */}
              <div className="mt-1">
                <NavItem 
                  item={{ label: 'Dados & Insights', path: 'DadosInsights', icon: BarChart3 }} 
                  isActive={currentPageName === 'DadosInsights'}
                  isCollapsed={collapsed}
                />
              </div>

              <SectionDivider isCollapsed={collapsed} />

              {/* Kick-Off */}
              <div className="mt-1">
                <NavItem 
                  item={{ label: 'Kick-Off', path: 'GerarKickOff', icon: Presentation }} 
                  isActive={currentPageName === 'GerarKickOff'}
                  isCollapsed={collapsed}
                />
              </div>

              {/* Processos Modelo */}
              <div className="mt-1">
                <NavItem 
                  item={{ label: 'Processos Modelo', path: 'ProcessosModelo', icon: BookOpen }} 
                  isActive={currentPageName === 'ProcessosModelo'}
                  isCollapsed={collapsed}
                />
              </div>

              {/* How It Works */}
              <div className="mt-1">
                <NavItem 
                  item={{ label: t('menu.how_it_works'), path: 'HowItWorks', icon: BookOpen }} 
                  isActive={currentPageName === 'HowItWorks'}
                  isCollapsed={collapsed}
                />
              </div>

            </nav>

            {/* Collapse Toggle */}
            <div className={`border-t border-white/8 ${collapsed ? 'px-2' : 'px-3'} py-2`}>
              <button
                onClick={toggleCollapsed}
                className="flex items-center justify-center w-full py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200"
              >
                {collapsed 
                  ? <PanelLeft className="w-[18px] h-[18px]" />
                  : <><PanelLeftClose className="w-[18px] h-[18px]" /><span className="text-xs ml-2">{t('sidebar.collapse')}</span></>
                }
              </button>
            </div>

            {/* User Info & Logout */}
            <div className={`border-t border-white/8 bg-white/[0.03] ${collapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
              {collapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <div className="w-9 h-9 rounded-full bg-[#2bc196] flex items-center justify-center text-white cursor-default">
                        <span className="text-sm font-semibold">{user?.full_name?.charAt(0) || 'U'}</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#002443] text-white border-white/10">
                    <p className="text-xs font-semibold">{user?.full_name}</p>
                    <p className="text-[10px] text-white/50">{isAdmin ? t('sidebar.admin') : t('sidebar.user')}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#2bc196] flex items-center justify-center text-white flex-shrink-0">
                      <span className="text-xs font-semibold">{user?.full_name?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
                      <p className="text-[10px] text-white/40 truncate">{isAdmin ? t('sidebar.admin') : t('sidebar.user')}</p>
                    </div>
                  </div>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => base44.auth.logout()}
                className={`w-full text-red-400/70 hover:text-red-300 hover:bg-red-500/10 font-medium text-xs ${collapsed ? 'justify-center px-0' : 'justify-start'}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                {!collapsed && <span className="ml-1.5">{t('sidebar.logout')}</span>}
              </Button>
            </div>
          </aside>
        )}

        {/* ═══════ Mobile Header ═══════ */}
        {isAuthenticated && (
          <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#002443] z-50">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white/80">
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" 
                  alt="Pagsmile" className="h-6"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()} className="text-white/60 hover:text-white hover:bg-white/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════ Mobile Sidebar ═══════ */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-72 bg-[#002443] h-full pt-16 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <nav className="px-3 py-4">
                <div className="mb-1">
                  <NavItem 
                    item={{ label: t('menu.home'), path: 'Home', icon: HomeIcon }} 
                    isActive={currentPageName === 'Home'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                <SectionDivider isCollapsed={false} />
                <div className="px-3 mb-1"><span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">{t('sidebar.operations')}</span></div>
                <div className="space-y-0.5">
                  {primarySections.map(section => (
                    <NavSection key={section.id} section={section} isMobile isCollapsed={false} />
                  ))}
                </div>

                {/* Cadastro - standalone mobile */}
                <div className="mt-1">
                  <NavItem 
                    item={cadastroItem} 
                    isActive={currentPageName === 'Cadastro' || currentPageName === 'CadastroDetalhe'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                <SectionDivider isCollapsed={false} />
                <div className="px-3 mb-1"><span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">{t('sidebar.system')}</span></div>
                <div className="space-y-0.5">
                  {secondarySections.map(section => (
                    <NavSection key={section.id} section={section} isMobile isCollapsed={false} />
                  ))}
                </div>

                <SectionDivider isCollapsed={false} />
                <div className="space-y-0.5">
                  {adminSections.map(section => (
                    <NavSection key={section.id} section={section} isMobile isCollapsed={false} />
                  ))}
                </div>

                {/* Parceiros - standalone mobile */}
                <div className="mt-1">
                  <NavItem 
                    item={{ label: t('menu.partners'), path: 'ConfiguracaoParceiros', icon: Handshake }} 
                    isActive={currentPageName === 'ConfiguracaoParceiros'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                {/* Dados & Insights - standalone mobile */}
                <div className="mt-1">
                  <NavItem 
                    item={{ label: 'Dados & Insights', path: 'DadosInsights', icon: BarChart3 }} 
                    isActive={currentPageName === 'DadosInsights'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                <SectionDivider isCollapsed={false} />

                {/* Kick-Off mobile */}
                <div className="mt-1">
                  <NavItem 
                    item={{ label: 'Kick-Off', path: 'GerarKickOff', icon: Presentation }} 
                    isActive={currentPageName === 'GerarKickOff'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                {/* Processos Modelo mobile */}
                <div className="mt-1">
                  <NavItem 
                    item={{ label: 'Processos Modelo', path: 'ProcessosModelo', icon: BookOpen }} 
                    isActive={currentPageName === 'ProcessosModelo'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                <div className="mt-1">
                  <NavItem 
                    item={{ label: t('menu.how_it_works'), path: 'HowItWorks', icon: BookOpen }} 
                    isActive={currentPageName === 'HowItWorks'}
                    onClick={() => setMobileMenuOpen(false)}
                    isCollapsed={false}
                  />
                </div>

                {/* Language Selector Mobile */}
                <div className="mt-3 px-1">
                  <LanguageSelector variant="sidebar" />
                </div>
              </nav>
            </aside>
          </div>
        )}

        {/* ═══════ Main Content ═══════ */}
        <main className={`flex-1 ${isAuthenticated ? mainMargin : ''} bg-[#f4f4f4] min-h-screen transition-all duration-300 ease-in-out`}>
          <div className={`p-4 lg:p-8 ${isAuthenticated ? 'pt-20 lg:pt-8' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}