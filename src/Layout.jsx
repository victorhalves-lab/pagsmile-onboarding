import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  Stamp
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState([]);

  const { data: authData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch (error) {
        return { user: null, isAuthenticated: false };
      }
    }
  });

  const user = authData?.user;
  const isAuthenticated = authData?.isAuthenticated;
  const isAdmin = user?.role === 'admin';

  // Páginas públicas (fluxo de onboarding do merchant via link)
  const publicPages = [
    'ContratoPublico',
    'ComplianceOnboardingStart',
    'CompliancePixOnly',
    'ComplianceFullKYC',
    'ComplianceLite',
    'ComplianceSaaS',
    'DocumentUploadPix',
    'DocumentUploadFull',
    'DocumentUploadLite',
    'DocumentUploadSaaS',
    'LivenessFacematchStep',
    'LivenessSimulation',
    'OnboardingCompletion',
    'LeadQuestionnaire',
    'LeadSuccess',
    'PropostaPublica',
    'QuestionarioSimplificadoPublico'
  ];

  const isPublicPage = publicPages.includes(currentPageName);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? []
        : [sectionId]
    );
  };

  // Layout público para fluxo de onboarding (via link)
  if (isPublicPage) {
    return (
      <div className="min-h-screen font-sans antialiased bg-[#f4f4f4]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

          :root {
            --pagsmile-green: #2bc196;
            --pagsmile-green-light: #5cf7cf;
            --pagsmile-blue: #002443;
            --pagsmile-blue-light: #003366;
            --pagsmile-gray: #f4f4f4;
            --font-sans: 'Plus Jakarta Sans', sans-serif;

            /* Override Shadcn default colors */
            --foreground: #002443;
            --primary: #2bc196;
            --primary-foreground: #ffffff;
            --secondary: #002443;
            --secondary-foreground: #ffffff;
            --muted: #f4f4f4;
            --muted-foreground: #002443;
            --accent: #2bc196;
            --accent-foreground: #ffffff;
            --card: #ffffff;
            --card-foreground: #002443;
            --popover: #ffffff;
            --popover-foreground: #002443;
            --border: #e2e8f0;
            --input: #e2e8f0;
            --ring: #2bc196;
          }

          body {
            font-family: var(--font-sans);
            color: #002443;
          }

          * {
            color: inherit;
          }

          h1, h2, h3, h4, h5, h6, p, span, label, div {
            color: #002443;
          }

          .text-muted-foreground {
            color: #002443 !important;
            opacity: 0.7;
          }

          .text-foreground {
            color: #002443 !important;
          }

          .text-primary {
            color: #2bc196 !important;
          }

          .bg-primary {
            background-color: #2bc196 !important;
          }

          .text-black, .text-gray-900, .text-gray-800, .text-gray-700, .text-gray-600, .text-gray-500, .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-600, .text-slate-500 {
            color: #002443 !important;
          }

          .modern-shadow {
            box-shadow: 0 4px 20px rgba(0, 36, 67, 0.05);
          }

          .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        `}</style>

        <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--pagsmile-blue)] via-[var(--pagsmile-green)] to-[var(--pagsmile-green-light)] z-[60]" />

        <div className="fixed left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--pagsmile-blue)] via-[var(--pagsmile-green)] to-[var(--pagsmile-green-light)] z-[60]" />
        <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--pagsmile-blue)] via-[var(--pagsmile-green)] to-[var(--pagsmile-green-light)] z-[60]" />

        <main className="pt-8 pb-8 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-[var(--pagsmile-blue)]/40">
          <p>&copy; {new Date().getFullYear()} Pagsmile.</p>
        </footer>
      </div>
    );
  }

  // Menu items com estrutura hierárquica
  const menuStructure = [
    {
      id: 'leads',
      label: 'Leads & Propostas',
      icon: Inbox,
      items: [
        { label: 'Links de Questionários', path: 'LinksQuestionariosLeads', icon: LinkIcon },
        { label: 'Questionários Recebidos', path: 'QuestionariosLeads', icon: ClipboardList, highlight: true },
        { label: 'Pipeline Comercial', path: 'PipelineComercial', icon: Users },
        { label: 'Gestão de Propostas', path: 'GestaoPropostas', icon: FileText },
        { label: 'Criar Proposta', path: 'CriarProposta', icon: FileCheck },
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      items: [
        { label: 'Dashboard', path: 'AdminDashboard', icon: LayoutDashboard },
        { label: 'Questionários Recebidos', path: 'QuestionariosRecebidos', icon: FileCheck },
        { label: 'Análise de Casos', path: 'AnaliseDeCasos', icon: ClipboardList, hidden: true },
        { label: 'Gestão de Documentos', path: 'GestaoDocumentos', icon: FileText },
        { label: 'Revalidação', path: 'GestaoRevalidacao', icon: History },
      ]
    },
    {
      id: 'contratos',
      label: 'Contratos',
      icon: Stamp,
      items: [
        { label: 'Gestão de Contratos', path: 'GestaoContratos', icon: FileText },
        { label: 'Criar Contrato', path: 'CriarContrato', icon: FileCheck },
      ]
    },
    {
      id: 'tools',
      label: 'Ferramentas',
      icon: Settings,
      items: [
        { label: 'Gerar Link', path: 'GerarLinkOnboarding', icon: LinkIcon },
        { label: 'Templates', path: 'TemplatesQuestionarios', icon: FileText },
        { label: 'Templates de Mensagem', path: 'MessageTemplates', icon: FileText },
        { label: 'Regras & Workflows', path: 'RegrasDeCompliance', icon: Settings },
      ]
    },
    {
      id: 'integrations',
      label: 'Integrações',
      icon: Plug,
      items: [
        { label: 'CAF & BigDataCorp', path: 'IntegracoesExternas', icon: Plug },
        { label: 'Helena IA', path: 'HelenaIA', icon: Brain },
      ]
    },
    {
      id: 'admin',
      label: 'Administração',
      icon: Settings,
      items: [
        { label: 'Configurações', path: 'Configuracoes', icon: Settings },
        { label: 'Auditoria', path: 'Auditoria', icon: History },
      ]
    }
  ];

  const NavItem = ({ item, isActive, onClick }) => {
    const Icon = item.icon;
    return (
      <Link
        to={createPageUrl(item.path)}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative ${
          isActive
            ? 'bg-white/10 text-[#5cf7cf] font-semibold'
            : item.highlight && !isActive
            ? 'text-[#2bc196] hover:bg-white/5'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#5cf7cf] rounded-r-full" />
        )}
        <Icon className={`w-4 h-4 ${isActive ? 'text-[#5cf7cf]' : item.highlight ? 'text-[#2bc196]' : 'text-white/40'}`} />
        <span className="flex-1">{item.label}</span>
        {item.highlight && !isActive && (
          <span className="w-2 h-2 rounded-full bg-[#2bc196] animate-pulse"></span>
        )}
        {item.badge && (
          <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-md">{item.badge}</span>
        )}
      </Link>
    );
  };

  const NavSection = ({ section, isMobile = false }) => {
    const isExpanded = expandedSections.includes(section.id);
    const SectionIcon = section.icon;
    const visibleItems = section.items.filter(item => !item.hidden);
    
    return (
      <div className="mb-1">
        <button
        onClick={() => toggleSection(section.id)}
        className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-bold tracking-wide transition-all duration-200 rounded-lg ${
          isExpanded 
            ? 'text-[#5cf7cf] bg-white/5' 
            : 'text-white/70 hover:text-white/90 hover:bg-white/5'
        }`}
        >
        <SectionIcon className={`w-4 h-4 ${isExpanded ? 'text-[#2bc196]' : 'text-white/30'}`} />
        <span className="flex-1 text-left">{section.label}</span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#2bc196]/60" /> : <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
        </button>
        {isExpanded && (
          <div className="mt-0.5 space-y-0.5 pl-1">
            {visibleItems.map(item => (
              <NavItem 
                key={item.path} 
                item={item} 
                isActive={currentPageName === item.path}
                onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --pagsmile-green: #2bc196;
          --pagsmile-green-light: #5cf7cf;
          --pagsmile-blue: #002443;
          --pagsmile-blue-light: #003366;
          --pagsmile-gray: #f4f4f4;
          --font-sans: 'Plus Jakarta Sans', sans-serif;
        }

        body {
          font-family: var(--font-sans);
          color: var(--pagsmile-blue);
        }
      `}</style>

      {/* Sidebar - Desktop (Dark Premium) */}
      {isAuthenticated && (
        <aside className="hidden lg:flex flex-col w-64 bg-[#002443] min-h-screen fixed left-0 top-0 z-20">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
                alt="Pagsmile" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-nav">
            {/* Home link */}
            <div className="mb-2">
              <NavItem 
                item={{ label: 'Home', path: 'Home', icon: LayoutDashboard }} 
                isActive={currentPageName === 'Home'} 
              />
            </div>

            {menuStructure.map(section => (
              <NavSection key={section.id} section={section} />
            ))}

            {/* How It Works - standalone */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <NavItem 
                item={{ label: 'How It Works', path: 'HowItWorks', icon: FileText }} 
                isActive={currentPageName === 'HowItWorks'} 
              />
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#2bc196] flex items-center justify-center text-white shadow-sm">
                <span className="text-sm font-semibold">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-white/50 truncate">{isAdmin ? 'Administrador' : 'Usuário'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {isAuthenticated && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#002443] z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white/80"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
                alt="Pagsmile" 
                className="h-6 brightness-0 invert"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 bg-[#002443] h-full pt-16 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <nav className="px-3 py-4">
              {/* Home link */}
              <div className="mb-2">
                <NavItem 
                  item={{ label: 'Home', path: 'Home', icon: LayoutDashboard }} 
                  isActive={currentPageName === 'Home'}
                  onClick={() => setMobileMenuOpen(false)}
                />
              </div>

              {menuStructure.map(section => (
                <NavSection key={section.id} section={section} isMobile />
              ))}

              {/* How It Works - standalone */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <NavItem 
                  item={{ label: 'How It Works', path: 'HowItWorks', icon: FileText }} 
                  isActive={currentPageName === 'HowItWorks'}
                  onClick={() => setMobileMenuOpen(false)}
                />
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''} bg-[#f4f4f4] min-h-screen`}>
        <div className={`p-4 lg:p-8 ${isAuthenticated ? 'pt-20 lg:pt-8' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}