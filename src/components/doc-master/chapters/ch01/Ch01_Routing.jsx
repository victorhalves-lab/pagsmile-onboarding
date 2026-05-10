import React from 'react';
import { H2, H3, H4, P, B, C, Table, Note, CodeBlock } from '../../DocPrimitives';

/**
 * §1.3 Roteamento — App.jsx, PUBLIC_PATHS, PublicRoutes vs AuthenticatedApp
 */
export default function Ch01_Routing() {
  return (
    <>
      <H2 num="1.3">Roteamento — Segregação Pública × Autenticada</H2>

      <P>O App.jsx é o <B>roteador raiz absoluto</B>. Tem duas árvores de rotas mutuamente exclusivas: <C>{'<PublicRoutes />'}</C> e <C>{'<AuthenticatedApp />'}</C>. A escolha entre elas é feita por <C>isPublicPath(location.pathname)</C> em <C>{'<AppRoutes />'}</C>. Não há rota que exista em ambas — segregação total.</P>

      <H3 num="1.3.1">Estrutura macro do App.jsx</H3>
      <CodeBlock language="jsx">{`// App.jsx (estrutura simplificada — total ~430 linhas)
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PermissionsProvider>
          <LanguageProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <NavigationTracker />
                <AppRoutes />   {/* ← decide Public vs Authenticated */}
              </Router>
              <Toaster />
            </QueryClientProvider>
          </LanguageProvider>
        </PermissionsProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}`}</CodeBlock>

      <Table dense headers={['Provider', 'Responsabilidade']} rows={[
        ['ErrorBoundary', 'Captura crashes de qualquer subárvore. Última linha de defesa.'],
        ['AuthProvider', 'Estado de auth (user, isAuthenticated, isLoadingAuth, authError, appPublicSettings, navigateToLogin, logout). Curto-circuita em rota pública.'],
        ['PermissionsProvider', 'Carrega AccessProfile efetivo do user via getMyPermissions. Disponibiliza hook useAccessControl. Em rota pública, retorna stub.'],
        ['LanguageProvider', 'i18n. Lê idioma do localStorage (pt | en | zh). t(key) helper.'],
        ['QueryClientProvider', 'react-query global. queryClientInstance é singleton em lib/query-client.js com staleTime configurado.'],
        ['Router (BrowserRouter)', 'react-router-dom. HTML5 History API.'],
        ['NavigationTracker', 'Effect que persiste page_view em AccessAudit a cada mudança de rota (apenas usuário autenticado, ver Cap. 10).'],
        ['Toaster', 'Sonner. Renderizado UMA vez no topo.'],
      ]} />

      <H3 num="1.3.2">Decisor de árvore — AppRoutes</H3>
      <CodeBlock language="jsx">{`const AppRoutes = () => {
  const location = useLocation();
  const tree = isPublicPath(location.pathname)
    ? <PublicRoutes />
    : <AuthenticatedApp />;
  return <React.Suspense fallback={<PageSuspenseFallback />}>{tree}</React.Suspense>;
};`}</CodeBlock>

      <P>O <C>{'<Suspense>'}</C> existe para suportar futuro code-splitting via <C>React.lazy()</C>. Hoje todas as páginas são imports síncronos no topo do App.jsx, então o Suspense nunca é acionado — mas a infraestrutura está pronta.</P>

      <H3 num="1.3.3">PUBLIC_PATHS — fonte única da verdade</H3>

      <P>O arquivo <C>lib/publicRoutes.js</C> exporta um <C>Set</C> com <B>todos os paths públicos</B> e uma função <C>isPublicPath(pathname)</C>. Este arquivo é <B>importado tanto pelo App.jsx quanto pelo AuthContext.jsx quanto pelo base44Client.js</B>. Mudanças aqui propagam para os 3 lugares.</P>

      <H4>Categorias de rotas públicas (47 paths exatos + 6 prefixos)</H4>
      <Table headers={['Categoria', 'Paths', 'Total']} rows={[
        ['Onboarding público (legado e atual)', '/onboarding, /PublicOnboarding', '2'],
        ['Compliance público (V4 atual)', '/ComplianceDinamico, /ComplianceResume, /OnboardingCompletion, /ComplianceDocOnly', '4'],
        ['Compliance legado (redirecionados)', '/ComplianceOnboardingStart, /ComplianceEcommerce, /ComplianceFullKYC, /ComplianceGateway, /ComplianceLite, /ComplianceMarketplace, /ComplianceMerchant, /CompliancePixOnly, /ComplianceSaaS', '9'],
        ['Document upload', '/DocumentUploadFull, /DocumentUploadPix, /DocumentUploadEcommerce (legado), /DocumentUploadLite (legado), /DocumentUploadSaaS (legado)', '5'],
        ['Lead questionnaires', '/LeadQuestionnaire, /LeadSuccess, /LeadQuestionnairePix, /QuestionarioLeadsPagsmile, /LeadPixV4, /QuestionarioSimplificadoPublico', '6'],
        ['Propostas / Contratos públicos', '/PropostaPublica, /PropostaPadraoPublica, /PropostaPixPublica, /ContratoPublico', '4'],
        ['Subseller', '/SubsellerQuestionnaire, /SubsellerDocUpload', '2'],
        ['Pré-KYC bancário', '/BankDataCollect', '1'],
        ['Liveness (deprecated, redirecionados)', '/LivenessFacematchStep, /LivenessSimulation', '2'],
        ['Fechamento / Kick-Off', '/FechamentoLandingPage, /KickOffPublico', '2'],
        ['Prefixos de slug', '/parceiro/, /s/, /p/, /pp/, /pix/, /c/', '6 prefixos'],
      ]} />

      <H3 num="1.3.4">Normalização de path</H3>
      <CodeBlock language="js">{`function normalizePath(pathname) {
  if (!pathname) return '/';
  let p = String(pathname).trim();
  const q = p.indexOf('?'); if (q >= 0) p = p.slice(0, q);  // strip query
  const h = p.indexOf('#'); if (h >= 0) p = p.slice(0, h);  // strip hash
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1); // strip trailing slash
  return p;
}

export function isPublicPath(pathname) {
  const p = normalizePath(pathname).toLowerCase();
  if (PUBLIC_PATHS_LOWER.has(p)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (p.startsWith(prefix)) return true;
  }
  return false;
}`}</CodeBlock>

      <Note title="Por que case-insensitive" kind="info">
        Usuários colam URLs em e-mail/WhatsApp e o WhatsApp ocasionalmente capitaliza letras na pré-visualização. <C>/ComplianceDinamico?token=abc</C> e <C>/compliancedinamico?token=abc</C> precisam funcionar igual. A normalização via toLowerCase() resolve.
      </Note>

      <H3 num="1.3.5">PublicRoutes — árvore completa de rotas públicas</H3>

      <P>O componente <C>{'<PublicRoutes />'}</C> em App.jsx contém um <C>{'<Routes>'}</C> com <B>todas</B> as rotas públicas registradas explicitamente. Não há fallback para o pagesConfig — o que não estiver listado aqui simplesmente não existe como rota pública.</P>

      <H4>Padrões de redirecionamento (legacy → atual)</H4>
      <CodeBlock language="jsx">{`// Cada rota legada renderiza <LegacyComplianceRedirect legacyRoute={name} />
// que redireciona para /ComplianceDinamico preservando query string.
['ComplianceOnboardingStart','ComplianceEcommerce', /* 9 itens */]
  .map(name => (
    <Route key={name} path={\`/\${name}\`} element={
      <LayoutWrapper currentPageName={name}>
        <LegacyComplianceRedirect legacyRoute={name} />
      </LayoutWrapper>
    } />
  ))`}</CodeBlock>

      <H4>Slug redirects — URLs amigáveis</H4>
      <Table dense headers={['Path', 'Redireciona para', 'Lookup']} rows={[
        ['/s/:slug', 'Pode ser qualquer entidade', 'SlugRedirect tenta múltiplas entidades'],
        ['/p/:slug', 'PropostaPublica?token=...', 'Lookup por publicSlug em Proposal'],
        ['/pp/:slug', 'PropostaPadraoPublica?token=...', 'Lookup em StandardProposal'],
        ['/pix/:slug', 'PropostaPixPublica?token=...', 'Lookup em PixProposal'],
        ['/c/:slug', 'ContratoPublico?token=...', 'Lookup em Contract'],
        ['/parceiro/:slug', 'IntroducerLandingPage', 'Lookup por uniqueLandingPageSlug'],
      ]} />

      <H3 num="1.3.6">AuthenticatedApp — gating em 7 camadas</H3>

      <P>Quando o pathname NÃO é público, App.jsx renderiza <C>{'<AuthenticatedApp />'}</C>. Este componente implementa <B>7 camadas de validação</B> antes de exibir qualquer conteúdo admin (cobertas em detalhe em §1.4 e Cap. 10). Resumo:</P>

      <Table headers={['#', 'Camada', 'Bloqueia se...', 'Tela exibida']} rows={[
        ['1', 'isLoadingPublicSettings || isLoadingAuth', 'Ainda buscando appPublicSettings ou base44.auth.me()', 'Spinner centralizado'],
        ['2', 'authError', 'authError.type === "user_not_registered"', '<UserNotRegisteredError />'],
        ['—', '', 'authError.type === "auth_required"', 'navigateToLogin() (redirect)'],
        ['3', '!isAuthenticated', 'Sem token válido', 'navigateToLogin()'],
        ['4', 'serverRole.status !== "ready"', 'Aguardando verifyUserAuth()', 'Spinner'],
        ['5', '!ALLOWED_ADMIN_ROLES.has(serverRole.role)', 'Role no servidor não é admin nem introducer', '<AccessDenied />'],
        ['6', 'effectiveRole === "admin" && !twoFactorState.enrolled', 'Admin sem 2FA configurado', '<TwoFactorEnrollScreen />'],
        ['7', 'effectiveRole !== "introducer" && adminTokenState.status !== "verified"', 'Sem JWT 2FA válido em sessionStorage', '<TwoFactorLoginScreen />'],
      ]} />

      <H3 num="1.3.7">Caging do introducer</H3>

      <P>Após passar todas as camadas, há um <B>guard adicional para role=introducer</B>: independente da URL digitada, o usuário é forçosamente redirecionado para <C>/IntroducerDashboard</C>. Tentativas de acessar qualquer outra rota (ex: <C>/Cadastro</C>) batem em <C>window.location.replace('/IntroducerDashboard')</C>.</P>

      <CodeBlock language="jsx">{`// App.jsx — caging do introducer
if (effectiveRole === 'introducer') {
  const path = window.location.pathname;
  if (path !== '/IntroducerDashboard') {
    window.location.replace('/IntroducerDashboard');
    return null;
  }
  return (
    <Routes>
      <Route path="/IntroducerDashboard" element={<IntroducerDashboard />} />
      <Route path="*" element={<IntroducerDashboard />} />
    </Routes>
  );
}`}</CodeBlock>

      <H3 num="1.3.8">Estratégia de rotas explícitas vs pagesConfig</H3>

      <Note title="MUDANÇA DE COMPORTAMENTO 2026" kind="warn">
        O arquivo <C>pages.config.js</C> NÃO é mais auto-gerado pela plataforma Base44. Páginas novas precisam de <B>{'<Route>'} explícito</B> no AuthenticatedApp. O pagesConfig loop ainda existe e renderiza páginas antigas, mas filtra (via Set <C>explicitRoutes</C>) páginas que têm rota explícita. Não tente confiar apenas no loop.
      </Note>

      <CodeBlock language="jsx">{`// AuthenticatedApp simplificado — convivência loop + rotas explícitas
return (
  <Routes>
    <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />

    {/* Loop de páginas antigas auto-registradas */}
    {Object.entries(Pages).map(([path, Page]) => {
      if (PUBLIC_PATHS.has(\`/\${path}\`)) return null;        // skip públicas
      if (explicitRoutes.has(path)) return null;             // skip duplicatas
      return <Route key={path} path={\`/\${path}\`} element={
        <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
      } />;
    })}

    {/* Rotas explícitas — páginas novas adicionadas após mudança */}
    <Route path="/Cadastro" element={...} />
    <Route path="/CadastroDetalhe" element={...} />
    <Route path="/Governanca" element={...} />
    <Route path="/DocumentacaoMaster" element={...} />
    {/* ... ~40 outras rotas explícitas ... */}

    <Route path="*" element={<PageNotFound />} />
  </Routes>
);`}</CodeBlock>

      <H4>Quando criar Route explícito</H4>
      <ul className="list-disc ml-5 text-[12.5px] leading-[1.7]">
        <li><B>Sempre</B> que criar uma página nova em <C>pages/*.jsx</C>.</li>
        <li>Quando precisar de wrapper diferente do <C>LayoutWrapper</C> default (ex: <C>IntroducerDashboard</C> não passa por LayoutWrapper).</li>
        <li>Quando o nome do componente diverge do path (raro, apenas legado).</li>
      </ul>
    </>
  );
}