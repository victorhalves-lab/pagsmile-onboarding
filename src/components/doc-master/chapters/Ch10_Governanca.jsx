import React from 'react';
import { Sec, H1, H2, H3, P, B, C, CodeBlock, Table, Note, Pipeline, Endpoint, Source } from '../DocPrimitives';

/**
 * Capítulo 10 — Governança, Acessos, 2FA, Auditoria
 */
export default function Ch10_Governanca() {
  return (
    <Sec id="ch-10">
      <H1 num="10">Governança — Acesso Granular, 2FA Obrigatório, Auditoria Append-Only</H1>

      <P>A governança da plataforma cumpre múltiplas exigências regulatórias: BCB Res. 119/2021 (segregação de funções), LGPD (controle de acesso a dados pessoais), Lei 9.613/1998 (5 anos retenção). Implementada em 4 camadas: <B>AccessProfile</B> (granular), <B>2FA TOTP+PIN</B> (obrigatório admin), <B>Anti-Brute-Force</B> (lockout), <B>Auditoria Append-Only</B>.</P>

      <H2 num="10.1">Camada 1 — AccessProfile (Granularidade Página/Aba/Sub-Aba/Ação)</H2>

      <H3 num="10.1.1">Schema do AccessProfile</H3>
      <Table dense headers={['Campo', 'Tipo', 'Descrição']} rows={[
        ['name', 'string', 'Nome humano do perfil. Ex: "Analista Compliance Sênior"'],
        ['slug', 'string (UQ)', 'Identificador único. Ex: "compliance-senior". Slugs reservados: "admin-full", "introducer", "partner-*"'],
        ['homePath', 'string', 'Path da página inicial após login. Ex: "/AdminDashboard"'],
        ['pagePermissions', 'array<object>', 'Lista detalhada de permissões — uma entry por página']
      ]} />

      <H3 num="10.1.2">Estrutura de pagePermission (granular)</H3>
      <CodeBlock language="json">{`{
  "pageKey": "Cadastro",
  "canView": true,
  "tabs": {
    "overview":   { "canView": true,  "subTabs": {} },
    "compliance": { "canView": true,  "subTabs": {
      "score":      { "canView": true },
      "findings":   { "canView": true },
      "sentinel":   { "canView": false }
    }},
    "documents":  { "canView": true },
    "historico":  { "canView": false }
  },
  "actions": {
    "approve":           { "allowed": false },
    "reject":            { "allowed": false },
    "request-recapture": { "allowed": true },
    "rerun-sentinel":    { "allowed": true },
    "claim-case":        { "allowed": true },
    "release-case":      { "allowed": true },
    "view-private-doc":  { "allowed": true },
    "download-dossie":   { "allowed": true }
  }
}`}</CodeBlock>

      <H3 num="10.1.3">Default Deny e Cascade</H3>
      <Note title="Princípio do Default Deny" kind="rule">
        <p>Tudo que <B>não está explicitamente permitido</B> é negado. Sem permissão na entry da página → página oculta no menu E URL direta retorna AccessDenied. Sem permissão na aba → aba oculta + tentativa de URL com query <C>?tab=X</C> ignora.</p>
        <p><B>Cascade:</B> se canView de página = false, ninguém pode acessar abas/sub-abas/ações dessa página, mesmo que estejam allowed. canView=false na página é um override total.</p>
      </Note>

      <H3 num="10.1.4">Componentes de Aplicação</H3>
      <Table dense headers={['Componente', 'Onde aplica', 'Comportamento']} rows={[
        ['ProtectedRoute', 'Wrapper de rotas <Route>', 'Verifica canView da página antes de renderizar. Senão → AccessDenied.'],
        ['SidebarPreview', 'Layout.jsx', 'Usa pagePermissions para decidir quais itens do menu mostrar. Item sem permissão = invisível.'],
        ['useAccessControl hook', 'Componentes de aba', 'hook.canViewTab(pageKey, tabKey) | hook.canViewSubTab(pageKey, tabKey, subTabKey) | hook.canExecuteAction(pageKey, actionKey).'],
        ['lib/PermissionsProvider.jsx', 'Provider global', 'Carrega o AccessProfile do user atual via getMyPermissions e disponibiliza via Context.'],
      ]} />

      <H3 num="10.1.5">Defaults Pré-Configurados (lib/defaultProfiles.js)</H3>
      <Table headers={['Slug', 'Nome', 'Resumo de acesso']} rows={[
        ['admin-full', 'Administrador Total', 'Tudo. Todas páginas, todas ações.'],
        ['compliance-senior', 'Compliance Sênior', 'Cadastro, Compliance, Risk Scoring, Bulk Reprocess. Pode aprovar/recusar.'],
        ['compliance-junior', 'Compliance Júnior', 'Cadastro (read), Compliance (read), Recapture allowed. NÃO pode aprovar/recusar.'],
        ['comercial-senior', 'Comercial Sênior', 'Pipeline, Propostas, Leads, Dashboard CEO/Comercial. Cria propostas e contratos.'],
        ['comercial-junior', 'Comercial Júnior', 'Pipeline (own only), Leads (own only). Sem dashboards executivos.'],
        ['introducer', 'Introducer (parceiro indicação)', 'Apenas /IntroducerDashboard. Caged.'],
      ]} />

      <H3 num="10.1.6">Funções Backend</H3>
      <Table dense headers={['Função', 'Propósito']} rows={[
        ['adminListProfiles', 'Lista todos AccessProfile.'],
        ['adminUpsertProfile', 'Cria/atualiza profile. Valida slug único. Bloqueia edição de admin-full crítica (canView pageKey=GestaoPerfis).'],
        ['adminDeleteProfile', 'Remove profile. Bloqueia se algum user está atribuído.'],
        ['adminAssignProfile', 'Atribui profile a user. Cria UserProfileAssignment.'],
        ['adminRevokeAssignment', 'Remove atribuição. User volta para "user" raw → AccessDenied.'],
        ['adminListUsersWithProfiles', 'Lista users com seu profile atual.'],
        ['adminInviteUser', 'Envia convite por email com role + profileSlug.'],
        ['getMyPermissions', 'Retorna AccessProfile efetivo do user logado. Chamado pelo PermissionsProvider.'],
        ['seedAccessProfiles', 'Seed inicial dos 6 defaults. Idempotente — não duplica.'],
      ]} />

      <H2 num="10.2">Camada 2 — 2FA Obrigatório (TOTP + PIN Individual)</H2>

      <H3 num="10.2.1">Por que 2FA é exigido para admin</H3>
      <P>Admin acessa dados sensíveis: documentos KYC privados, decisões de compliance, taxas, contratos. Exigência implícita Lei 9.613/1998 + LGPD. Toda sessão admin tem JWT TTL 2h, validado server-side a cada page load.</P>

      <H3 num="10.2.2">Fluxo de Enrollment Forçado</H3>
      <Pipeline steps={[
        { id: '01', name: 'twoFactorEnrollStart', desc: 'Usuário admin sem 2FA enrolled tenta acessar página admin. AuthenticatedApp detecta twoFactorState.enrolled === false → renderiza TwoFactorEnrollScreen. Backend gera TOTP secret + QR code.', source: 'functions/twoFactorEnrollStart.js + components/admin/TwoFactorEnrollScreen' },
        { id: '02', name: 'twoFactorEnrollVerifyTotp', desc: 'Usuário escaneia QR no app autenticador (Google Authenticator, Authy, 1Password) e digita código 6 dígitos. Backend valida com janela ±1 step (30s).', source: 'functions/twoFactorEnrollVerifyTotp.js' },
        { id: '03', name: 'twoFactorEnrollConfirm', desc: 'Usuário define PIN próprio (6 dígitos). Backend hashia PIN com SHA-256 + salt. Persiste no User entity (campos privados não acessíveis via SDK público).', source: 'functions/twoFactorEnrollConfirm.js' },
        { id: '04', name: 'Backup codes', desc: 'Backend gera 8 backup codes de uso único. Exibe UMA VEZ ao usuário (instrução para anotar). Persistidos hasheados.', source: 'twoFactorEnrollConfirm.js' },
      ]} />

      <H3 num="10.2.3">Fluxo de Login (após enrollment)</H3>
      <Pipeline steps={[
        { id: '01', name: 'Verificação inicial via verifyAdminToken', desc: 'AuthenticatedApp lê sessionStorage[base44_admin_jwt] e envia ao backend. Backend valida HMAC com ADMIN_JWT_SECRET. Se inválido/expirado → TwoFactorLoginScreen.', source: 'functions/verifyAdminToken.js' },
        { id: '02', name: 'TOTP code', desc: 'Usuário digita 6 dígitos do app autenticador. Backend valida com janela ±1 step.', source: 'components/admin/TwoFactorLoginScreen' },
        { id: '03', name: 'PIN', desc: 'Usuário digita PIN. Backend hashia + compara constant-time.', source: 'idem' },
        { id: '04', name: 'twoFactorVerify emite JWT', desc: 'Se ambos OK: HMAC sign { sub: email, role: "admin", iat, exp: iat + 7200 } com ADMIN_JWT_SECRET. Persiste em sessionStorage.', source: 'functions/twoFactorVerify.js' },
      ]} />

      <H3 num="10.2.4">Anti Brute-Force</H3>
      <Table dense headers={['Trigger', 'Ação']} rows={[
        ['5 falhas TOTP em 15min (mesmo user)', 'Lockout 15min — todas tentativas retornam "locked_out" sem validar nada'],
        ['3 falhas PIN em 10min', 'Lockout 30min'],
        ['10 falhas totais em 1h', 'Notify Slack #compliance + bloqueio 1h'],
        ['IP suspeito (mesmo IP, 20+ tentativas em 1h)', 'Marca como adversarial — log preserva ip_hash'],
      ]} />

      <H3 num="10.2.5">Reset por Admin</H3>
      <P>Admin com permissão <C>action: 2fa-reset-others</C> pode chamar <C>twoFactorResetUser</C> via /Governanca → aba 2FA. Apaga TOTP secret e PIN do user — força novo enrollment no próximo login.</P>

      <H2 num="10.3">Camada 3 — Auditoria Append-Only</H2>

      <H3 num="10.3.1">AccessAudit (navegação + ações)</H3>
      <P>Cada interação do admin gera entrada. Append-only — RLS create=true, update/delete=admin-only (na prática: nenhum endpoint expõe update/delete).</P>
      <Table dense headers={['action', 'O que registra']} rows={[
        ['page_view', 'Toda visita a página admin. Capturado em NavigationTracker (lib/NavigationTracker.jsx).'],
        ['tab_view', 'Mudança de aba dentro de página complexa.'],
        ['subtab_view', 'Sub-aba (raro).'],
        ['action_executed', 'Botão de ação executado (approve, reject, recapture, rerun-sentinel, etc.).'],
        ['access_denied', 'Tentativa de acesso a página/aba/ação sem permissão. Bandeira vermelha.'],
        ['profile_changed', 'Admin atribuiu novo profile a user.'],
        ['profile_created', 'Admin criou novo AccessProfile.'],
        ['profile_deleted', 'Admin removeu AccessProfile.'],
        ['user_assigned', 'Atribuição direta usuário ↔ profile.'],
        ['login', 'Login bem-sucedido.'],
        ['logout', 'Logout explícito ou expiração.'],
      ]} />

      <P>Campos persistidos: <C>user_email, user_name, profile_slug, action, target_page, target_tab, target_subtab, target_action, target_entity, target_entity_id, ip_hash (SHA-256), user_agent, allowed (bool), details (object)</C>.</P>

      <H3 num="10.3.2">TwoFactorAudit (eventos de 2FA)</H3>
      <Table dense headers={['event', 'Significado']} rows={[
        ['enroll_start / enroll_complete', 'Enrollment iniciado/concluído'],
        ['totp_success / totp_fail', 'Validação TOTP'],
        ['pin_success / pin_fail', 'Validação PIN'],
        ['backup_code_used', 'Usuário usou backup code'],
        ['admin_reset', 'Admin resetou 2FA de outro user'],
        ['pin_changed', 'User alterou PIN'],
        ['locked_out', 'Lockout disparado'],
      ]} />

      <H3 num="10.3.3">AdminLoginAttempt (anti brute-force)</H3>
      <P>Cada tentativa (sucesso ou falha) gera entrada. Usado para detecção de padrões: <C>{`Math.abs(now - attempt.created_date) < 15min AND user_email = X AND success = false`}</C> conta para lockout.</P>

      <H3 num="10.3.4">Retenção</H3>
      <P>5 anos por exigência da Lei 9.613/1998 Art. 10. Sem cleanup automático — admin manual após período. Backup periódico em snapshots persistentes (<C>backups/compliance-snapshot-*.json</C>).</P>

      <H2 num="10.4">Camada 4 — Página Governança Centralizada (/Governanca)</H2>

      <H3 num="10.4.1">Tabs do dashboard</H3>
      <Table dense headers={['Tab', 'Conteúdo', 'Componente']} rows={[
        ['Visão Geral', 'KPIs (logins ativos, 2FA enrollment %, eventos 24h, locked outs)', 'GovernanceKPIs'],
        ['Framework', 'Documenta a arquitetura governança (default deny, append-only, etc.)', 'GovernanceFramework'],
        ['Acessos', 'Tabela paginada de AccessAudit. Filtros: user, action, target_page, allowed, data range', 'AccessAuditTable'],
        ['2FA', 'Tabela TwoFactorAudit + botão "Reset 2FA" para um user', 'SecurityAuditTable + dialog de reset'],
        ['Audit Log Geral', 'Tabela AuditLog (entity-level)', 'AuditLogTable'],
        ['Changelog', 'Timeline de CodeChangelog (mudanças de código documentadas pelo agent)', 'ChangelogTimeline'],
      ]} />

      <H2 num="10.5">Hardening — Por que user.role do contexto é insuficiente</H2>

      <Note title="Por que serverRole > user.role" kind="warn">
        Em React DevTools é possível editar <C>user.role</C> de "user" para "admin" no AuthContext. Sem hardening, isso desbloquearia o menu admin (visualmente). <B>O fix:</B> AuthenticatedApp NUNCA confia em <C>user.role</C> para decisões de segurança — sempre faz fetch via <C>verifyUserAuth</C> que retorna o role REAL do banco. Estado <C>serverRole</C> é independente. Mesmo se um adversário forçar role=admin no front, todas as backend functions validam JWT 2FA contra ADMIN_JWT_SECRET — adulteração local não passa.
      </Note>

      <H3 num="10.5.1">Cadeia exata em App.jsx (já vista no Cap. 1)</H3>
      <CodeBlock language="js">{`// App.jsx AuthenticatedApp simplificado
1. AuthContext.isAuthenticated  // base44.auth.me()
2. verifyUserAuth → serverRole
3. ALLOWED_ADMIN_ROLES check (Set(["admin", "introducer"]))
4. Se admin: verifyAdminToken (JWT em sessionStorage)
5. Se admin sem 2FA enrolled: TwoFactorEnrollScreen forçado
6. Se admin com token expirado: TwoFactorLoginScreen
7. Se introducer: caged em /IntroducerDashboard
8. Renderiza rotas`}</CodeBlock>

      <Source files={[
        'lib/AuthContext.jsx',
        'lib/PermissionsProvider.jsx',
        'lib/permissionsRegistry.js',
        'lib/defaultProfiles.js',
        'components/ProtectedRoute',
        'components/admin/TwoFactorEnrollScreen',
        'components/admin/TwoFactorLoginScreen',
        'components/admin/AdminLoginScreen',
        'components/admin/profiles/* (toda subpasta)',
        'components/governance/* (toda subpasta)',
        'pages/Governanca.jsx',
        'pages/GestaoPerfis.jsx',
        'pages/EditorPerfil.jsx',
        'pages/AuditoriaAcessos.jsx',
        'functions/verifyUserAuth.js',
        'functions/verifyAdminToken.js',
        'functions/twoFactorEnrollStart.js',
        'functions/twoFactorEnrollVerifyTotp.js',
        'functions/twoFactorEnrollConfirm.js',
        'functions/twoFactorVerify.js',
        'functions/twoFactorStatus.js',
        'functions/twoFactorResetUser.js',
        'functions/adminListProfiles.js',
        'functions/adminUpsertProfile.js',
        'functions/adminDeleteProfile.js',
        'functions/adminAssignProfile.js',
        'functions/adminRevokeAssignment.js',
        'functions/adminListUsersWithProfiles.js',
        'functions/adminInviteUser.js',
        'functions/getMyPermissions.js',
        'functions/seedAccessProfiles.js',
        'entities/AccessProfile.json',
        'entities/UserProfileAssignment.json',
        'entities/AccessAudit.json',
        'entities/TwoFactorAudit.json',
        'entities/AdminLoginAttempt.json',
      ]} />
    </Sec>
  );
}