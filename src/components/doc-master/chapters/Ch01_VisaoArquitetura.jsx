import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Pipeline, Source } from '../DocPrimitives';

/**
 * Capítulo 1 — Visão Geral da Arquitetura
 */
export default function Ch01_VisaoArquitetura() {
  return (
    <Sec id="ch-01">
      <H1 num="01">Visão Geral da Arquitetura — Stack, Camadas e Princípios Invioláveis</H1>

      <H2 num="1.1">Stack Tecnológico Exato</H2>

      <P>A plataforma PagSmile é construída sobre o ecossistema <B>Base44</B> com arquitetura serverless. Toda infra é serverless via Deno Deploy (backend) e CDN (frontend).</P>

      <H3 num="1.1.1">Frontend (SPA)</H3>
      <Table dense headers={['Componente', 'Versão', 'Papel']} rows={[
        ['React', '^18.2.0', 'Framework de UI principal — hooks e funcional components'],
        ['Vite', '5.x', 'Build tool e dev server. HMR em dev. Tree-shaking em prod'],
        ['Tailwind CSS', '3.x', 'Sistema de design utilitário. Tokens em index.css + tailwind.config.js'],
        ['shadcn/ui', '—', 'Biblioteca Radix UI + Tailwind em components/ui/'],
        ['React Router DOM', '^6.26.0', 'Roteamento client-side. App.jsx orquestra rotas públicas vs autenticadas'],
        ['@tanstack/react-query', '^5.84.1', 'Cache de servidor + sincronização'],
        ['Lucide React', '^0.475.0', 'Ícones SVG. Importação on-demand'],
        ['Recharts', '^2.15.4', 'Gráficos para dashboards'],
        ['Framer Motion', '^11.16.4', 'Animações suaves'],
        ['React Hook Form', '^7.54.2', 'Formulários complexos com validação'],
        ['date-fns', '^3.6.0', 'Manipulação de datas'],
        ['html2canvas + jspdf', '—', 'Geração de PDFs no client'],
        ['docx', '^8.5.0', 'Geração de DOCX no client'],
        ['xlsx', '^0.18.5', 'Geração de planilhas (Pré-KYC para BaaS)'],
      ]} />

      <H3 num="1.1.2">Backend (Serverless Deno)</H3>
      <Table dense headers={['Componente', 'Papel']} rows={[
        ['Deno Runtime', 'Runtime das backend functions. Cada função é um Deno.serve handler isolado'],
        ['@base44/sdk@0.8.25', 'SDK que dá acesso a entidades, integrações e auth. Inicializado por createClientFromRequest(req)'],
        ['Web Crypto API', 'Geração de tokens cripto-seguros (crypto.getRandomValues). SHA-256 para hashing'],
        ['SubtleCrypto (async)', 'Validação HMAC de webhooks (CAF, etc.) — SEMPRE async em Deno'],
      ]} />

      <H3 num="1.1.3">Integrações Externas</H3>
      <Table headers={['Integração', 'Endpoint Base', 'Secrets', 'Uso']} rows={[
        ['BigDataCorp (BDC)', 'plataforma.bigdatacorp.com.br', 'BDC_ACCESS_TOKEN, BDC_TOKEN_ID', 'Datasets de KYC/KYB para Score V4'],
        ['CAF Connect', 'api.caf.io/v1', 'CAF_CONNECT_CLIENT_ID/SECRET', 'OAuth Client Credentials Trust Platform'],
        ['CAF Core API', 'api.combateafraude.com', 'CAF_CORE_API_TOKEN', 'API legacy CAF — onboarding web, OCR, VerifAI'],
        ['CAF SDK Web', 'cdn caf.io', 'CAF_CLIENT_ID, CAF_CLIENT_SECRET, CAF_TEMPLATE_ID_PF/PJ', 'SDK JavaScript embedado no browser'],
        ['CAF Webhook', 'recebe POSTs', 'CAF_WEBHOOK_SECRET (HMAC SHA-256)', 'Webhook de resultados assíncronos'],
        ['Brasil API', 'brasilapi.com.br', '— (público)', 'Consulta CNPJ na Receita Federal'],
        ['Slack', 'slack.com/api', 'Connector slackbot (OAuth)', 'Notificações em #compliance'],
        ['Portal Transparência', 'api.portaldatransparencia.gov.br', 'PORTAL_TRANSPARENCIA_TOKEN', 'Validações de servidores públicos'],
      ]} />

      <H2 num="1.2">5 Camadas Lógicas</H2>

      <Pipeline steps={[
        { id: 'L1', name: 'Camada Pública (Public Routes)', desc: 'Páginas sem autenticação. Listadas em lib/publicRoutes.js. Nunca chamam base44.auth.me() — usam callPublicFunction. Inclui questionários de leads (V5, PIX V4), propostas públicas, compliance público.', source: 'lib/publicRoutes.js + App.jsx PublicRoutes' },
        { id: 'L2', name: 'Camada Cliente (Customer-facing)', desc: 'Backend functions chamadas pelo frontend público. Validam tokens cripto-seguros vinculados a entidades.', source: 'functions/public*.js' },
        { id: 'L3', name: 'Camada Operacional (Admin Internal)', desc: 'Tudo dentro de AuthenticatedApp. Exige user.role ∈ {admin, introducer} server-validated. Admin precisa JWT 2FA válido.', source: 'App.jsx AuthenticatedApp' },
        { id: 'L4', name: 'Camada Parceiro Externo', desc: 'Bureaus/auditorias com acesso isolado a /ComplianceParceiro. Permissões via partnerRole. Caged: tentativa de outras páginas redireciona.', source: 'pages/ComplianceParceiro*' },
        { id: 'L5', name: 'Camada Sistema (Service Role)', desc: 'Backend functions com privilégios elevados via base44.asServiceRole. Bypassam RLS para operações administrativas, automações, webhooks.', source: 'asServiceRole.* nas functions' },
      ]} />

      <H2 num="1.3">Princípios Arquiteturais Invioláveis</H2>

      <Note title="Princípio Data-First v7.0 — A Lei Suprema do Compliance" kind="rule">
        <p><B>Decisões de compliance são 100% determinísticas. Baseadas EXCLUSIVAMENTE em:</B></p>
        <ol className="list-decimal ml-5 mt-1">
          <li>Score V4 calculado por <C>bdcEnrichCase</C> (FONTE ÚNICA do score).</li>
          <li>Tabela de subfaixas → decisão (1A/1B = Aprovado, 4 = Manual, 5 = Recusado).</li>
          <li>Veto biométrico CAF (deepfake, liveness/documentscopy REPROVED).</li>
        </ol>
        <p className="mt-1.5"><B>Reguladores exigem decisões auditáveis e reproduzíveis.</B> Logo:</p>
        <ul className="list-disc ml-5 mt-1">
          <li>SENTINEL é <B>RELATOR</B> — produz narrativa para o dossiê. <B>Nunca decide.</B></li>
          <li>Questionário é <B>CONTEXTO</B> — alimenta o dossiê. <B>Nunca veta.</B></li>
          <li>SENTINEL pode <B>escalar V4→Manual</B>, mas <B>nunca rebaixar</B> Manual→Aprovado.</li>
          <li>Safety Net: se decisão = Recusado SEM bloqueio V4 ativo E SEM fraude CAF, sistema rebaixa para Manual.</li>
        </ul>
      </Note>

      <H3 num="1.3.1">Princípios Operacionais</H3>
      <Table headers={['Princípio', 'O que significa']} rows={[
        ['Default Deny (RLS)', 'Toda entidade tem RLS configurada explicitamente. Default = admin-only. Páginas/abas/ações não permitidas em AccessProfile ficam ocultas E inacessíveis via URL direta'],
        ['Server-side Auth Validation', 'Frontend NUNCA é fonte de verdade. user.role do contexto pode ser adulterado via DevTools, mas verifyUserAuth + verifyAdminToken sempre fazem verificação real. JWT 2FA é HMAC-validado em cada page load'],
        ['Append-Only Audit', 'AccessAudit, TwoFactorAudit, AdminLoginAttempt, AuditLog são append-only. Retenção de 5 anos (Lei 9.613/1998 Art. 10)'],
        ['Fire-and-forget para análise pesada', 'cafVerifaiDocs, cafPostCaptureAnalysis, SENTINEL — disparados em background. Resultado vem por webhook ou polling'],
        ['Idempotência por Token', 'Tokens cripto-seguros (32-48 chars hex) vinculados a entidades. Reutilizar token = mesmo registro atualizado, não duplicado'],
        ['Cascata Automática', 'Mudanças em SegmentDefaultRates propagam para StandardProposal + Introducer.standardRates[] via cascadeSegmentRatesUpdate'],
        ['Public functions via callPublicFunction', 'Rotas públicas usam SDK-free fetch. lib/publicApi.js encapsula esse padrão'],
        ['Tokens com TTL', 'JWT admin = 2h. Signed URLs de docs = 5min. Tokens de captura CAF = configurável por template'],
      ]} />

      <H2 num="1.4">Variáveis de Ambiente (Secrets) Consumidos</H2>

      <P><B>Nenhum secret é hardcoded.</B> Todos consultados via <C>Deno.env.get('NOME_SECRET')</C>:</P>

      <Table headers={['Secret', 'Tipo', 'Consumido por', 'Função']} rows={[
        ['BDC_ACCESS_TOKEN', 'Token API', 'bdcEnrichCase, bdcEnrichLead, bdcQueryCompany, bdcQueryPerson, bdcRetryWorker, bdcDeepDueLead', 'AccessToken header BigDataCorp'],
        ['BDC_TOKEN_ID', 'Token API', 'mesmas que acima', 'TokenId header BigDataCorp'],
        ['CAF_CLIENT_ID', 'OAuth ID', 'cafGenerateToken, CAF SDK frontend', 'Identificação cliente CAF para SDK'],
        ['CAF_CLIENT_SECRET', 'OAuth Secret', 'cafGenerateToken', 'Secret CAF para gerar JWT do SDK'],
        ['CAF_TEMPLATE_ID_PF', 'Template ID', 'cafGenerateToken (PF)', 'Template SDK CAF para PF'],
        ['CAF_TEMPLATE_ID_PJ', 'Template ID', 'cafGenerateToken (PJ)', 'Template SDK CAF para PJ'],
        ['CAF_CONNECT_CLIENT_ID', 'OAuth ID', 'cafConnectAuth', 'Trust Platform Client ID'],
        ['CAF_CONNECT_CLIENT_SECRET', 'OAuth Secret', 'cafConnectAuth', 'Trust Platform Client Secret'],
        ['CAF_CORE_API_TOKEN', 'Bearer', '~12 funções cafXxx', 'API Core CAF (legacy)'],
        ['CAF_WEBHOOK_SECRET', 'HMAC Key', 'cafWebhookHandler', 'Validação HMAC SHA-256 ASYNC (Web Crypto)'],
        ['SLACK_COMPLIANCE_CHANNEL', 'Channel ID', '~12 functions notifyXxx', 'Override do canal padrão #compliance'],
        ['ADMIN_JWT_SECRET', 'HMAC Key', 'twoFactorVerify, verifyAdminToken', 'Assinatura JWTs admin (TTL 2h)'],
        ['ADMIN_ACCESS_CODE / _2', 'Senha', 'verifyAdminCode', 'Códigos admin para enrollment 2FA inicial'],
        ['PORTAL_TRANSPARENCIA_TOKEN', 'API Token', 'sanctionsScreening', 'Portal Transparência (CGU)'],
      ]} />

      <Note title="Connector Slack (não é secret)" kind="info">
        Slack é integrado via <B>OAuth connector</B> autorizado no Base44. Acessado via <C>{`base44.asServiceRole.connectors.getConnection('slackbot')`}</C> que retorna <C>{`{ accessToken }`}</C>. Scopes: <C>chat:write, chat:write.public, channels:read, chat:write.customize</C>.
      </Note>

      <H2 num="1.5">Roteamento — App.jsx (Camada de Decisão de Acesso)</H2>

      <H3 num="1.5.1">Detecção de Rota Pública</H3>
      <CodeBlock language="js">{`// lib/publicRoutes.js — fonte única
export const PUBLIC_PATHS = new Set([
  '/PropostaPublica', '/PropostaPadraoPublica', '/PropostaPixPublica',
  '/ContratoPublico', '/ComplianceDinamico', '/OnboardingCompletion',
  '/ComplianceResume', '/SubsellerQuestionnaire', '/SubsellerDocUpload',
  '/QuestionarioSimplificadoPublico', '/QuestionarioLeadsPagsmile',
  '/LeadPixV4', '/FechamentoLandingPage', '/KickOffPublico',
  '/BankDataCollect', '/PublicOnboarding', '/onboarding',
  '/ComplianceDocOnly', '/LeadQuestionnaire', '/LeadSuccess',
  '/DocumentUploadFull', '/DocumentUploadPix',
]);

export function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/parceiro/')) return true;
  if (pathname.startsWith('/s/'))  return true;
  if (pathname.startsWith('/p/'))  return true;
  if (pathname.startsWith('/pp/')) return true;
  if (pathname.startsWith('/pix/'))return true;
  if (pathname.startsWith('/c/'))  return true;
  return false;
}`}</CodeBlock>

      <Note title="Importante para evitar crashes em rotas públicas" kind="warn">
        Em rotas públicas, o SDK do Base44 NÃO deve chamar <C>base44.auth.me()</C> — visitantes anônimos disparam erro <C>MessagePort/instanceof TypeError</C>. Por isso, <C>Layout.jsx</C> faz <C>const isPublicRoute = isPublicPath(pathname)</C> e desativa <C>useQuery</C> de auth via <C>enabled: !isPublicRoute</C>.
      </Note>

      <H3 num="1.5.2">Cadeia de Validação para Páginas Admin (7 steps)</H3>
      <Pipeline steps={[
        { id: '1', name: 'isAuthenticated check', desc: 'AuthContext faz base44.auth.me(). Se falha, redireciona para login.', source: 'lib/AuthContext.jsx' },
        { id: '2', name: 'verifyUserAuth (server-side role)', desc: 'Backend retorna role REAL do usuário do banco. user.role do contexto pode ser adulterado via DevTools — só o servidor sabe a verdade.', source: 'functions/verifyUserAuth.js' },
        { id: '3', name: 'ALLOWED_ADMIN_ROLES check', desc: 'Set(["admin", "introducer"]). Outros roles → AccessDenied component. role="user" autossignup é bloqueado.', source: 'App.jsx ln ~108' },
        { id: '4', name: 'verifyAdminToken (JWT 2FA)', desc: 'Para role="admin": busca token em sessionStorage, envia ao backend que valida HMAC com ADMIN_JWT_SECRET.', source: 'functions/verifyAdminToken.js' },
        { id: '5', name: 'twoFactorStatus check', desc: 'Para admins novos: checa se 2FA já enrolled. Se não → TwoFactorEnrollScreen forçado.', source: 'functions/twoFactorStatus.js' },
        { id: '6', name: 'TwoFactorLoginScreen (token expirado)', desc: 'Pede TOTP + PIN. Backend twoFactorVerify valida e emite novo JWT 2h.', source: 'components/admin/TwoFactorLoginScreen' },
        { id: '7', name: 'Introducer caging', desc: 'Se role="introducer": força redirect para /IntroducerDashboard. Tentativa de URL admin direta é bloqueada.', source: 'App.jsx ln ~225' },
      ]} />

      <Source files={[
        'App.jsx',
        'lib/AuthContext.jsx',
        'lib/publicRoutes.js',
        'functions/verifyUserAuth.js',
        'functions/verifyAdminToken.js',
        'functions/twoFactorStatus.js',
        'functions/twoFactorVerify.js',
        'components/admin/TwoFactorLoginScreen',
        'components/admin/TwoFactorEnrollScreen',
      ]} />
    </Sec>
  );
}