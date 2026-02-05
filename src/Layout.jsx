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
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
                src="https://pagsmile.com/images/header/pagsmile_logo.svg" 
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

  // Layout do backoffice administrativo
  const adminNavItems = [
    { label: 'Dashboard', path: 'AdminDashboard', icon: LayoutDashboard },
    { label: 'Questionários Recebidos', path: 'ComplianceSubmissions', icon: FileCheck, highlight: true },
    { label: 'Gerar Link', path: 'GenerateOnboardingLink', icon: LinkIcon },
    { label: 'Templates', path: 'QuestionnaireTemplates', icon: Settings },
    { label: 'Configurações', path: 'AdminSettings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --pagsmile-green: #2bc196;
          --pagsmile-green-light: #5cf7cf;
          --pagsmile-blue: #002443;
          --pagsmile-blue-light: #003366;
          --pagsmile-gray: #f4f4f4;
        }
      `}</style>

      {/* Header */}
      <header className="bg-[var(--pagsmile-blue)] border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <img 
                  src="https://pagsmile.com/images/header/pagsmile_logo.svg" 
                  alt="Pagsmile" 
                  className="h-7 brightness-0 invert"
                />
                <div className="hidden sm:block">
                  <span className="text-xs font-medium text-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/10 px-2 py-1 rounded">
                    Compliance
                  </span>
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{user?.full_name}</div>
                  <div className="text-xs text-slate-400">{isAdmin ? 'Administrador' : 'Usuário'}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => base44.auth.logout()}
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Desktop */}
        {isAuthenticated && (
          <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-57px)]">
            <nav className="p-4 space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[var(--pagsmile-green)] text-white'
                        : item.highlight && !isActive
                        ? 'text-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 hover:bg-[var(--pagsmile-green)]/10 border border-[var(--pagsmile-green)]/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.highlight && !isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[var(--pagsmile-green)] animate-pulse"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Mobile Sidebar */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-64 bg-white h-full" onClick={(e) => e.stopPropagation()}>
              <nav className="p-4 space-y-1 mt-4">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[var(--pagsmile-green)] text-white'
                          : item.highlight && !isActive
                          ? 'text-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5 hover:bg-[var(--pagsmile-green)]/10 border border-[var(--pagsmile-green)]/20'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-[var(--pagsmile-green)] animate-pulse"></span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}