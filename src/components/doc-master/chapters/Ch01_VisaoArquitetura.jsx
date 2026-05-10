import React from 'react';
import { Sec, H1, H2, H3, P, Li, B, C, CodeBlock, Table, Note, Source } from '../DocPrimitives';
import Ch01_Stack from './ch01/Ch01_Stack';
import Ch01_Bootstrap from './ch01/Ch01_Bootstrap';
import Ch01_Routing from './ch01/Ch01_Routing';
import Ch01_Auth from './ch01/Ch01_Auth';
import Ch01_DesignSystem from './ch01/Ch01_DesignSystem';
import Ch01_Layouts from './ch01/Ch01_Layouts';
import Ch01_Secrets from './ch01/Ch01_Secrets';

/**
 * Capítulo 1 — Visão Arquitetural Microscópica
 *
 * Cobre, com profundidade absoluta:
 *   §1.1  Stack tecnológico real (versões, papéis, gotchas)
 *   §1.2  Bootstrap da aplicação (main.jsx → ensureSdkLoaded → App)
 *   §1.3  Roteamento (App.jsx pagesConfig + rotas explícitas + PUBLIC_PATHS)
 *   §1.4  Autenticação em 7 camadas (verifyUserAuth + 2FA + JWT + Anti-Brute-Force)
 *   §1.5  Design System (CSS tokens HSL + Tailwind theme + Pagsmile brand overlay)
 *   §1.6  Layouts (público vs admin) e o padrão SidebarPreview
 *   §1.7  Secrets (catálogo de env vars Deno)
 *
 * Cada subcapítulo é um componente focado para facilitar leitura, manutenção e export.
 */
export default function Ch01_VisaoArquitetura() {
  return (
    <Sec id="ch-01">
      <H1 num="01">Arquitetura — Stack, Bootstrap, Roteamento, Auth, Design e Secrets</H1>

      <P>Este capítulo descreve <B>com profundidade microscópica</B> como a aplicação PagSmile é montada — desde o primeiro byte carregado pelo navegador até o ponto em que o usuário admin (autenticado, com 2FA validado) acessa o dashboard. Cada decisão arquitetural é justificada com referência ao arquivo real e à linha exata onde a decisão é implementada.</P>

      <Note title="Princípios não-negociáveis" kind="rule">
        <ul className="list-disc ml-5 mt-1 space-y-0.5 text-[12px]">
          <li><B>Default Deny</B> em RLS, rotas e ações — o que não está explicitamente permitido é negado.</li>
          <li><B>Determinismo</B> em scoring de risco — IA pode escalar para humano, nunca decidir aprovação.</li>
          <li><B>Auditoria append-only</B> — eventos persistidos não podem ser editados ou deletados (5 anos retenção Lei 9.613/1998).</li>
          <li><B>Zero confiança no front</B> — toda decisão de segurança é re-validada server-side a cada chamada.</li>
          <li><B>Idempotência</B> em pipelines — re-execução não duplica efeitos.</li>
          <li><B>Public &times; Admin estritamente segregados</B> — rotas públicas <B>nunca</B> carregam o SDK Base44.</li>
        </ul>
      </Note>

      {/* §1.1 */}
      <Ch01_Stack />

      {/* §1.2 */}
      <Ch01_Bootstrap />

      {/* §1.3 */}
      <Ch01_Routing />

      {/* §1.4 */}
      <Ch01_Auth />

      {/* §1.5 */}
      <Ch01_DesignSystem />

      {/* §1.6 */}
      <Ch01_Layouts />

      {/* §1.7 */}
      <Ch01_Secrets />

      <Source files={[
        'index.html',
        'main.jsx',
        'api/base44Client.js',
        'lib/AuthContext.jsx',
        'lib/PermissionsProvider.jsx',
        'lib/publicRoutes.js',
        'lib/app-params.js',
        'App.jsx',
        'layout.jsx (Layout principal)',
        'index.css',
        'globals.css',
        'tailwind.config.js',
        'pages.config.js',
        'components/ErrorBoundary.jsx',
        'components/AccessDenied.jsx',
        'components/UserNotRegisteredError.jsx',
        'components/admin/AdminLoginScreen.jsx',
        'components/admin/TwoFactorEnrollScreen.jsx',
        'components/admin/TwoFactorLoginScreen.jsx',
        'functions/verifyUserAuth.js',
        'functions/verifyAdminToken.js',
        'functions/twoFactorVerify.js',
        'functions/twoFactorEnrollStart.js',
        'functions/twoFactorEnrollVerifyTotp.js',
        'functions/twoFactorEnrollConfirm.js',
        'functions/twoFactorStatus.js',
        'functions/twoFactorResetUser.js',
        'functions/getMyPermissions.js',
      ]} />
    </Sec>
  );
}