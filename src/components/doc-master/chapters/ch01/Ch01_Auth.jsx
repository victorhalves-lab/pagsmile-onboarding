import React from 'react';
import { H2, H3, H4, P, B, C, Table, Note, CodeBlock, Pipeline } from '../../DocPrimitives';

/**
 * §1.4 Autenticação em 7 camadas — código real em App.jsx + AuthContext + funções backend
 */
export default function Ch01_Auth() {
  return (
    <>
      <H2 num="1.4">Autenticação — 7 Camadas Servidor + Frontend</H2>

      <P>A segurança da aplicação é construída sobre o princípio "<B>nunca confie no front</B>". Cada camada é validada server-side. Tentativa de bypass via DevTools (editar <C>user.role</C> no AuthContext) FALHA porque a decisão final usa <C>serverRole</C> retornado por uma função backend.</P>

      <H3 num="1.4.1">AuthContext — primeira camada (Base44 SDK auth)</H3>

      <P>O <C>AuthProvider</C> em <C>lib/AuthContext.jsx</C> chama <C>checkAppState()</C> uma vez no mount. O fluxo:</P>

      <Pipeline steps={[
        { id: 'A.1', name: 'Short-circuit em rota pública', desc: 'isPublicPath(window.location.pathname) → true: setIsLoadingAuth(false), setIsAuthenticated(false), setUser(null), return. Anônimos NUNCA fazem chamada a base44.auth.me().', source: 'lib/AuthContext.jsx linhas 38-45' },
        { id: 'A.2', name: 'Fetch publicSettings com appClient', desc: 'Importa @base44/sdk/dist/utils/axios-client (DINÂMICO, não top-level), cria appClient com baseURL /api/apps/public + X-App-Id header + token (se houver). Faz GET /prod/public-settings/by-id/{appId}.', source: 'lib/AuthContext.jsx linhas 47-61' },
        { id: 'A.3', name: 'Trata 403 com extra_data.reason', desc: 'reason "auth_required" → setAuthError({type:"auth_required"}). reason "user_not_registered" → setAuthError({type:"user_not_registered"}). Outras razões mapeadas em setAuthError({type: reason}).', source: 'lib/AuthContext.jsx linhas 86-103' },
        { id: 'A.4', name: 'Se token válido: checkUserAuth()', desc: 'Chama base44.auth.me() (REAL SDK, já carregado por main.jsx). Sucesso: setUser + setIsAuthenticated(true). 401/403: setAuthError({type:"auth_required"}).', source: 'lib/AuthContext.jsx linhas 124-145' },
      ]} />

      <H3 num="1.4.2">verifyUserAuth — segunda camada (server-side role)</H3>

      <P>Após passar AuthContext, o <C>AuthenticatedApp</C> imediatamente chama <C>base44.functions.invoke('verifyUserAuth', {})</C>. Esta função backend é a <B>fonte da verdade</B> para o role do usuário.</P>

      <CodeBlock language="js">{`// functions/verifyUserAuth.js (skeleton)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ authenticated: false });
    return Response.json({
      authenticated: true,
      role: user.role,        // ← lido do banco, NÃO do front
      email: user.email,
      full_name: user.full_name,
    });
  } catch {
    return Response.json({ authenticated: false }, { status: 401 });
  }
});`}</CodeBlock>

      <Note title="Por que serverRole > user.role" kind="rule">
        Um adversário pode editar o estado do AuthContext em React DevTools (mudar user.role de 'user' para 'admin') — isso desbloquearia visualmente o sidebar admin. <B>Sem efeito real</B>: o estado <C>serverRole</C> é independente, vem de uma chamada autenticada que retorna o role REAL do banco. Mesmo se o sidebar aparecesse, o JWT 2FA exigido nas funções backend invalida qualquer ação. <B>Defense in depth</B>.
      </Note>

      <H3 num="1.4.3">ALLOWED_ADMIN_ROLES — terceira camada</H3>

      <CodeBlock language="js">{`// App.jsx
const ALLOWED_ADMIN_ROLES = new Set(['admin', 'introducer']);

if (!effectiveRole || !ALLOWED_ADMIN_ROLES.has(effectiveRole)) {
  return <AccessDenied />;
}`}</CodeBlock>

      <Note title="Por que apenas duas roles" kind="warn">
        Em apps Base44 públicos, qualquer usuário com Gmail pode se auto-registrar via login social — recebem role <C>'user'</C> automaticamente. <B>NÃO queremos esses usuários no admin</B>. A allowlist explícita de <C>'admin'</C> e <C>'introducer'</C> garante que apenas convites manuais via <C>adminInviteUser</C> têm acesso. Adicionar uma role nova (ex: 'partner_user' para CompliancePartner) exige editar este Set.
      </Note>

      <H3 num="1.4.4">verifyAdminToken — quarta camada (JWT em sessionStorage)</H3>

      <P>Para role=admin, é exigido um JWT assinado server-side com <C>ADMIN_JWT_SECRET</C>. O JWT é emitido por <C>twoFactorVerify</C> após validação TOTP+PIN. Cada page load chama <C>verifyAdminToken</C>.</P>

      <CodeBlock language="js">{`// App.jsx — chave do storage
const ADMIN_TOKEN_KEY = 'base44_admin_jwt';

const storedToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
const res = await base44.functions.invoke('verifyAdminToken', { token: storedToken });
if (res.data?.valid === true && res.data?.admin === true) {
  setAdminTokenState({ status: 'verified', token: storedToken });
} else {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  setAdminTokenState({ status: 'unverified', token: null });
}`}</CodeBlock>

      <H4>Estrutura do JWT</H4>
      <CodeBlock language="js">{`// Header (base64url)
{ "alg": "HS256", "typ": "JWT" }

// Payload (base64url)
{
  "sub": "alice@empresa.com",   // email do admin
  "role": "admin",
  "iat": 1714820000,            // issued at (segundos)
  "exp": 1714827200             // expira em iat + 7200 (2h)
}

// Signature: HMAC-SHA256(base64url(header) + "." + base64url(payload), ADMIN_JWT_SECRET)`}</CodeBlock>

      <Table dense headers={['Campo', 'Descrição']} rows={[
        ['sub', 'Email do admin (não user_id) — facilita debug em logs'],
        ['role', 'Sempre "admin" para tokens emitidos por twoFactorVerify'],
        ['iat', 'Timestamp de emissão (Unix seconds)'],
        ['exp', 'iat + 7200 — TTL de 2 horas. Após expiração, twoFactorVerify exige re-autenticação completa (TOTP+PIN).'],
      ]} />

      <H4>Persistência: sessionStorage (não localStorage)</H4>
      <P>Decisão deliberada: <C>sessionStorage</C> é por aba e expira ao fechar. <C>localStorage</C> persistiria entre reinicializações do browser — comprometendo um device de outra pessoa daria acesso a tokens admin antigos. Para sessões longas, o usuário re-autentica.</P>

      <H3 num="1.4.5">2FA — quinta e sexta camadas</H3>

      <Pipeline steps={[
        { id: 'B.1', name: 'twoFactorStatus', desc: 'Após verifyUserAuth confirmar role=admin, AuthenticatedApp chama twoFactorStatus para descobrir se o admin já fez enrollment. Retorno: { enrolled: bool }.', source: 'functions/twoFactorStatus.js + App.jsx useEffect linhas ~150-170' },
        { id: 'B.2', name: 'Sem 2FA → TwoFactorEnrollScreen forçado', desc: 'enrolled === false: renderiza componente que guia o admin pelo enrollment. Não há como pular — está antes do JWT gate.', source: 'components/admin/TwoFactorEnrollScreen.jsx' },
        { id: 'B.3', name: 'Enrollment: 4 sub-steps', desc: 'twoFactorEnrollStart (gera TOTP secret + QR), user escaneia em Google Authenticator/Authy, twoFactorEnrollVerifyTotp (valida primeiro código), user define PIN próprio (6 dígitos), twoFactorEnrollConfirm (hashia PIN + gera 8 backup codes).', source: '4 funções em functions/twoFactor*.js' },
        { id: 'B.4', name: 'Login: TOTP + PIN', desc: 'TwoFactorLoginScreen pede 6 dígitos do app autenticador + PIN. Backend twoFactorVerify valida ambos com janela ±1 step (30s) para TOTP. Sucesso emite JWT.', source: 'functions/twoFactorVerify.js' },
        { id: 'B.5', name: 'Anti-Brute-Force', desc: '5 falhas TOTP em 15min → lockout 15min. 3 falhas PIN em 10min → lockout 30min. 10 falhas totais 1h → notify Slack + lockout 1h. AdminLoginAttempt persiste cada tentativa para detecção de padrões.', source: 'functions/twoFactorVerify.js + entities/AdminLoginAttempt.json' },
      ]} />

      <H3 num="1.4.6">getMyPermissions — sétima camada (granularidade)</H3>

      <P>Mesmo após todas as camadas anteriores, o <C>PermissionsProvider</C> ainda chama <C>getMyPermissions</C> para descobrir o <C>AccessProfile</C> efetivo do usuário. Este define quais páginas/abas/sub-abas/ações específicas são permitidas dentro do dashboard admin.</P>

      <CodeBlock language="js">{`// functions/getMyPermissions.js (skeleton)
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
if (!user) return Response.json({}, { status: 401 });

// Busca UserProfileAssignment ativa
const assignments = await base44.asServiceRole.entities.UserProfileAssignment
  .filter({ userId: user.id, isActive: true });

if (assignments.length === 0) {
  // Sem profile atribuído: defaults baseados em role
  const defaultSlug = user.role === 'admin' ? 'admin-full' : null;
  // ...
}

// Retorna o AccessProfile inteiro
const profile = await base44.asServiceRole.entities.AccessProfile.get(assignments[0].profileId);
return Response.json({ profile, slug: profile.slug, homePath: profile.homePath });`}</CodeBlock>

      <P>Detalhes completos do <C>AccessProfile</C> (estrutura granular página/aba/sub-aba/ação, default deny, cascade) estão no <B>Cap. 10</B>.</P>

      <H3 num="1.4.7">Resumo visual da cadeia</H3>
      <CodeBlock language="text">{`┌─ User abre /Cadastro ─────────────────────────────────────┐
│                                                            │
│  1.  isPublicPath('/Cadastro')? NÃO → AuthenticatedApp     │
│                                                            │
│  2.  AuthContext.checkAppState                             │
│       └→ /api/apps/public/prod/public-settings/...         │
│       └→ base44.auth.me() ───────────────── user via SDK   │
│                                                            │
│  3.  base44.functions.invoke('verifyUserAuth')             │
│       └→ serverRole = 'admin' (ou 'introducer' / null)     │
│                                                            │
│  4.  ALLOWED_ADMIN_ROLES.has(serverRole)?                  │
│       NÃO → <AccessDenied />                               │
│                                                            │
│  5.  twoFactorStatus → enrolled?                           │
│       NÃO → <TwoFactorEnrollScreen />                      │
│                                                            │
│  6.  verifyAdminToken(sessionStorage[base44_admin_jwt])    │
│       INVÁLIDO → <TwoFactorLoginScreen />                  │
│                                                            │
│  7.  PermissionsProvider.getMyPermissions                  │
│       └→ AccessProfile.pagePermissions['Cadastro'].canView │
│       FALSE → <AccessDenied />                             │
│       TRUE  → renderiza <Cadastro />                       │
└────────────────────────────────────────────────────────────┘`}</CodeBlock>

      <P>Cada camada bloqueia INDEPENDENTEMENTE — comprometer uma não compromete as outras. Esse é o princípio <B>Defense in Depth</B> aplicado por design.</P>
    </>
  );
}