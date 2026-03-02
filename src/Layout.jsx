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
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState(['leads', 'compliance']);

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

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Layout público para fluxo de onboarding (via link)
  if (isPublicPage) {
    return (
      <div className="min-h-screen font-sans antialiased bg-[#f8f9fa]">
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
      id: 'tools',
      label: 'Ferramentas',
      icon: Settings,
      items: [
        { label: 'Gerar Link', path: 'GerarLinkOnboarding', icon: LinkIcon },
        { label: 'Templates', path: 'TemplatesQuestionarios', icon: FileText },
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
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
          isActive
            ? 'bg-[var(--pagsmile-green)] text-white shadow-md'
            : item.highlight && !isActive
            ? 'text-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 hover:bg-[var(--pagsmile-green)]/10'
            : 'text-[#002443]/80 hover:text-[#002443] hover:bg-[#002443]/5'
            }`}
            >
        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#002443]/80'}`} />
        <span className="flex-1">{item.label}</span>
        {item.highlight && !isActive && (
          <span className="w-2 h-2 rounded-full bg-[var(--pagsmile-green)] animate-pulse"></span>
        )}
        {item.badge && (
          <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{item.badge}</span>
        )}
      </Link>
    );
  };

  const NavSection = ({ section, isMobile = false }) => {
    const isExpanded = expandedSections.includes(section.id);
    const SectionIcon = section.icon;
    const visibleItems = section.items.filter(item => !item.hidden);
    
    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(section.id)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-[#002443] uppercase tracking-wider hover:text-[#002443]/80 transition-colors"
        >
          <SectionIcon className="w-4 h-4 text-[#2bc196]" />
          <span className="flex-1 text-left">{section.label}</span>
          {isExpanded ? <ChevronDown className="w-3 h-3 text-[#002443]/50" /> : <ChevronRight className="w-3 h-3 text-[#002443]/50" />}
        </button>
        {isExpanded && (
          <div className="mt-1 space-y-1 pl-2">
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
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
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

      {/* Sidebar - Desktop */}
      {isAuthenticated && (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0 z-20">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
                alt="Pagsmile" 
                className="h-8 w-auto"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {menuStructure.map(section => (
                    <NavSection key={section.id} section={section} />
                  ))}

                  {/* How It Works - standalone */}
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <NavItem 
                      item={{ label: 'How It Works', path: 'HowItWorks', icon: FileText }} 
                      isActive={currentPageName === 'HowItWorks'} 
                    />
                  </div>
                </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#002443] flex items-center justify-center text-white shadow-sm">
                <span className="text-sm font-semibold">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#002443] truncate">{user?.full_name}</p>
                <p className="text-xs text-[var(--pagsmile-blue)]/70 truncate">{isAdmin ? 'Administrador' : 'Usuário'}</p>
              </div>
              </div>
              <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
              >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {isAuthenticated && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#002443]"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
                alt="Pagsmile" 
                className="h-6"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="text-[#002443]"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 bg-white h-full pt-16 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <nav className="p-4">
              {menuStructure.map(section => (
                <NavSection key={section.id} section={section} isMobile />
              ))}

              {/* How It Works - standalone */}
              <div className="mt-2 pt-2 border-t border-slate-200">
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
      <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''} bg-[#f8f9fa] min-h-screen`}>
        <div className={`p-4 lg:p-8 ${isAuthenticated ? 'pt-20 lg:pt-8' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}