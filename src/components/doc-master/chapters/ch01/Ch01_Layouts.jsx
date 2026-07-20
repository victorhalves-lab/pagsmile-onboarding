import React from 'react';
import { H2, H3, H4, P, B, C, Table, Note, CodeBlock } from '../../DocPrimitives';

/**
 * §1.6 Layouts — Layout principal (sidebar admin) + LayoutWrapper público
 */
export default function Ch01_Layouts() {
  return (
    <>
      <H2 num="1.6">Layouts — Wrapper Público × Sidebar Admin</H2>

      <P>A aplicação tem <B>UM único arquivo de layout</B>: <C>layout.jsx</C> na raiz do projeto. Esse componente decide internamente se renderiza em modo <B>público</B> (página pública sem sidebar) ou <B>admin</B> (com sidebar de ~600px de altura, navegação completa, user widget e logout). A decisão é por nome de página, não por path.</P>

      <H3 num="1.6.1">Decisão público vs admin</H3>
      <CodeBlock language="js">{`// layout.jsx — lista hardcoded de páginas públicas
const publicPages = [
  'IntroducerLandingPage','ContratoPublico','PropostaPadraoPublica','PropostaPixPublica',
  'OnboardingCompletion','PropostaPublica',
  'ComplianceDinamico','ComplianceResume','SubsellerQuestionnaire',
  'QuestionarioSimplificadoPublico',
  'QuestionarioLeadsPagsmile','LeadPixV4','FechamentoLandingPage','KickOffPublico',
  'SubsellerDocUpload','BankDataCollect'
];
const isPublicPage = publicPages.includes(currentPageName);`}</CodeBlock>

      <Note title="Diferença sutil entre publicPages e PUBLIC_PATHS" kind="warn">
        <C>publicPages</C> em <C>layout.jsx</C> é uma lista <B>local</B> de páginas que querem o layout público (logo + footer simples). <C>PUBLIC_PATHS</C> em <C>lib/publicRoutes.js</C> é a lista <B>global</B> de rotas que dispensam autenticação. Existem páginas em PUBLIC_PATHS que NÃO estão em publicPages (ex: <C>/onboarding</C>, <C>/PublicOnboarding</C>) — essas renderizam SEM nenhum wrapper de layout (são auto-suficientes). Páginas legadas redirecionadas (LegacyComplianceRedirect) também não usam o layout público pleno.
      </Note>

      <H3 num="1.6.2">Layout público — renderização</H3>

      <CodeBlock language="jsx">{`// layout.jsx — branch público (resumido)
if (isPublicPage) {
  return (
    <div className="min-h-screen font-sans antialiased bg-[#f4f4f4]">
      {/* CSS reset com tokens Pin Bank injetado inline (style tag) */}
      <style>{\`
        :root {
          --pinbank-blue: #1356E2; --pinbank-blue: #0A0A0A;
          --foreground: #0A0A0A; --primary: #1356E2;
          /* ... força tokens shadcn para Pin Bank em modo público */
        }
        body { font-family: var(--font-sans); color: #0A0A0A; }
        h1,h2,h3,h4,h5,h6,p,span,label,div { color: #0A0A0A; }
        .glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); }
      \`}</style>

      {/* Faixas decorativas no topo e na lateral esquerda */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--pinbank-blue)] via-[var(--pinbank-blue)] to-[var(--pinbank-blue-light)] z-[60]" />
      <div className="fixed left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--pinbank-blue)] via-[var(--pinbank-blue)] to-[var(--pinbank-blue-light)] z-[60]" />

      {/* Language selector no canto superior direito */}
      <div className="fixed top-4 right-4 z-[70]">
        <LanguageSelector />
      </div>

      <main className="pt-8 pb-8 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[var(--pinbank-blue)]/40">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}`}</CodeBlock>

      <H3 num="1.6.3">Sidebar admin — Estrutura macro do menuStructure</H3>

      <P>O sidebar é montado a partir de uma <B>estrutura declarativa</B>: array de seções, cada com array de items. O componente renderiza Sections expansíveis com NavItems aninhados.</P>

      <CodeBlock language="js">{`// layout.jsx — menuStructure (estrutura macro)
const menuStructure = [
  { id: 'leads',         label: t('menu.leads_proposals'),    icon: Inbox,    items: [/* 13 items */] },
  { id: 'compliance',    label: t('menu.compliance'),         icon: Shield,   items: [/* 14 items */] },
  { id: 'contratos',     label: t('menu.contracts'),          icon: Stamp,    items: [/*  2 items */] },
  { id: 'tools',         label: t('menu.tools'),              icon: Wrench,   items: [/*  5 items */] },
  { id: 'integrations',  label: t('menu.integrations'),       icon: Plug,     items: [/*  3 items */] },
  { id: 'admin',         label: t('menu.administration'),     icon: Settings, items: [/*  7 items */] },
];`}</CodeBlock>

      <H4>Items adicionais standalone (fora das seções)</H4>
      <Table dense headers={['Item', 'Path', 'Posição']} rows={[
        ['Home', '/Home', 'Topo (acima de tudo)'],
        ['Cadastro', '/Cadastro', 'Após "operations" sections, standalone'],
        ['Parceiros (operacional)', '/ConfiguracaoParceiros', 'Após admin section'],
        ['Dados & Insights', '/DadosInsights', 'Após Parceiros'],
        ['Kick-Off', '/GerarKickOff', 'Próximo do final'],
        ['Processos Modelo', '/ProcessosModelo', '—'],
        ['How It Works', '/HowItWorks', '—'],
        ['Documentação Master', '/DocumentacaoMaster', 'Final, marcado highlight'],
      ]} />

      <H3 num="1.6.4">Estados do sidebar</H3>
      <Table dense headers={['Estado', 'Onde guardado', 'Comportamento']} rows={[
        ['collapsed', 'localStorage["sidebar_collapsed"] (boolean string)', 'Quando true: largura w-[72px], só ícones, tooltip on hover. Quando false: w-64 com labels.'],
        ['expandedSections', 'React state (não persistido)', 'Array de IDs de seções expandidas. Apenas UMA por vez na prática (toggle troca).'],
        ['mobileMenuOpen', 'React state', 'Em viewport <lg, sidebar é off-canvas e este estado controla open/close.'],
      ]} />

      <H3 num="1.6.5">Auto-expand da seção ativa</H3>
      <CodeBlock language="js">{`// layout.jsx — useEffect que expande seção contendo currentPageName
React.useEffect(() => {
  if (collapsed) return;
  const findSection = () => {
    for (const section of menuStructure) {
      if (section.items.some(i => i.path === currentPageName)) return section.id;
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
}, [currentPageName, collapsed]);`}</CodeBlock>

      <P>Ao navegar para uma página, o sidebar automaticamente expande a seção que contém aquela página. Se já está expandida, não re-renderiza (early return).</P>

      <H3 num="1.6.6">Modo collapsed — tooltips Radix</H3>

      <P>Quando o sidebar está collapsed (apenas ícones), cada NavItem é envolvido em <C>{'<Tooltip>'}</C> do Radix UI. Hover mostra o label completo no lado direito. NavSections em modo collapsed também viram tooltip — clicar expande para w-64 e abre a seção (ux smart).</P>

      <CodeBlock language="jsx">{`// layout.jsx — NavItem em modo collapsed
if (isCollapsed) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" className="bg-[#0A0A0A] text-white border-white/10 text-xs font-medium">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
return content;`}</CodeBlock>

      <H3 num="1.6.7">Items "highlight" — destaque verde</H3>

      <P>Items com <C>highlight: true</C> recebem texto verde (<C>text-[#1356E2]</C>) + um pequeno dot pulsante (<C>animate-pulse</C>) à direita. Usado em features novas que merecem chamar atenção: <C>QuestionariosLeads</C>, <C>EscalationsReview</C>, <C>ComplianceParceiro</C>, <C>DocCompParceiros</C>, <C>Governanca</C>, <C>DocumentacaoMaster</C>.</P>

      <H3 num="1.6.8">User Widget no rodapé</H3>
      <CodeBlock language="jsx">{`// layout.jsx — bloco final do sidebar (não-collapsed)
<div className="flex items-center gap-3 mb-2">
  <div className="w-8 h-8 rounded-full bg-[#1356E2] flex items-center justify-center text-white">
    <span className="text-xs font-semibold">{user?.full_name?.charAt(0) || 'U'}</span>
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
    <p className="text-[10px] text-white/40 truncate">{isAdmin ? t('sidebar.admin') : t('sidebar.user')}</p>
  </div>
</div>
<Button variant="ghost" size="sm" onClick={() => base44.auth.logout()}>
  <LogOut className="w-3.5 h-3.5" /> <span className="ml-1.5">{t('sidebar.logout')}</span>
</Button>`}</CodeBlock>

      <Note title="adminOnly hidden quando role !== admin" kind="rule">
        Items marcados com <C>adminOnly: true</C> são <B>filtrados antes do render</B>: <C>{`section.items.filter(item => !item.hidden && (!item.adminOnly || isAdmin))`}</C>. Introducer NÃO vê esses items. PermissionsProvider adiciona um filtro adicional baseado em AccessProfile (Cap. 10).
      </Note>

      <H3 num="1.6.9">Dimensões e responsividade</H3>
      <Table dense headers={['Viewport', 'Comportamento']} rows={[
        ['<lg (mobile/tablet)', 'Sidebar oculto. Header fixo no topo (h-14) com hamburger menu. Click abre off-canvas drawer w-72 com overlay preto 60%.'],
        ['≥lg, !collapsed', 'Sidebar fixed left, w-64 (16rem). Main content tem ml-64.'],
        ['≥lg, collapsed', 'Sidebar fixed left, w-[72px]. Main content tem ml-[72px]. Transition all 300ms ease-in-out.'],
      ]} />
    </>
  );
}