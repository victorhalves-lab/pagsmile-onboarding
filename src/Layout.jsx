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
  const [expandedSections, setExpandedSections] = React.useState(['compliance']);

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
    'DocumentUploadPix',
    'DocumentUploadFull',
    'LivenessFacematchStep',
    'LivenessSimulation',
    'OnboardingCompletion'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <style>{`
          :root {
            --pagsmile-green: #2bc196;
            --pagsmile-green-light: #5cf7cf;
            --pagsmile-blue: #002443;
            --pagsmile-blue-light: #003366;
            --pagsmile-gray: #f4f4f4;
          }
        `}</style>
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
                alt="Pagsmile" 
                className="h-8"
              />
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  // Menu items com estrutura hierárquica
  const menuStructure = [
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      items: [
        { label: 'Dashboard', path: 'AdminDashboard', icon: LayoutDashboard },
        { label: 'Questionários Recebidos', path: 'ComplianceSubmissions', icon: FileCheck, highlight: true },
        { label: 'Análise de Casos', path: 'OnboardingCaseDetails', icon: ClipboardList, hidden: true },
        { label: 'Gestão de Documentos', path: 'AdminComplianceDocs', icon: FileText },
        { label: 'Revalidação', path: 'AdminRevalidationManager', icon: History },
      ]
    },
    {
      id: 'tools',
      label: 'Ferramentas',
      icon: Settings,
      items: [
        { label: 'Gerar Link', path: 'GenerateOnboardingLink', icon: LinkIcon },
        { label: 'Templates', path: 'QuestionnaireTemplates', icon: FileText },
        { label: 'Regras & Workflows', path: 'AdminComplianceRules', icon: Settings },
      ]
    },
    {
      id: 'integrations',
      label: 'Integrações',
      icon: Plug,
      items: [
        { label: 'CAF & BigDataCorp', path: 'AdminIntegrations', icon: Plug },
        { label: 'Helena IA', path: 'AdminHelenaIA', icon: Brain },
      ]
    },
    {
      id: 'admin',
      label: 'Administração',
      icon: Settings,
      items: [
        { label: 'Configurações', path: 'AdminSettings', icon: Settings },
        { label: 'Auditoria', path: 'AdminComplianceAudit', icon: History },
      ]
    }
  ];

  const NavItem = ({ item, isActive, onClick }) => {
    const Icon = item.icon;
    return (
      <Link
        to={createPageUrl(item.path)}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
          isActive
            ? 'bg-[var(--pagsmile-green)] text-white'
            : item.highlight && !isActive
            ? 'text-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 hover:bg-[var(--pagsmile-green)]/10'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className="w-4 h-4" />
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
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700"
        >
          <SectionIcon className="w-4 h-4" />
          <span className="flex-1 text-left">{section.label}</span>
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
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
    <div className="min-h-screen bg-slate-50 flex">
      <style>{`
        :root {
          --pagsmile-green: #2bc196;
          --pagsmile-green-light: #5cf7cf;
          --pagsmile-blue: #002443;
          --pagsmile-blue-light: #003366;
          --pagsmile-gray: #f4f4f4;
        }
      `}</style>

      {/* Sidebar - Desktop */}
      {isAuthenticated && (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen fixed left-0 top-0">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
                alt="Pagsmile" 
                className="h-7"
              />
              <span className="text-xs font-medium text-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/10 px-2 py-1 rounded">
                Compliance
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {menuStructure.map(section => (
              <NavSection key={section.id} section={section} />
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[var(--pagsmile-green)]/10 flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--pagsmile-green)]">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{isAdmin ? 'Administrador' : 'Usuário'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => base44.auth.logout()}
              className="w-full justify-start text-slate-600 hover:text-slate-800"
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
                className="text-slate-600"
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
              className="text-slate-600"
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
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''}`}>
        <div className={`p-4 lg:p-6 ${isAuthenticated ? 'pt-20 lg:pt-6' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}