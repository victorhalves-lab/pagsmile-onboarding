import React from 'react';
import { S, H1, H2, H3, P, Li, Bold, Table, InfoBox } from './DocHelpers';

export default function DocAcessos() {
  return (
    <S>
      <H1>14. Governança de Acesso — Perfis, 2FA e Auditoria</H1>

      <P>O controle de acesso ao painel administrativo é um pilar regulatório tão importante quanto a análise de risco em si. O sistema implementa três camadas de proteção (perfis granulares + autenticação multifator obrigatória + auditoria completa) que juntas garantem que apenas pessoas autorizadas realizem ações críticas e que toda ação fique permanentemente rastreada para auditoria regulatória.</P>

      <H2>14.1. Modelo de Perfis Granulares (AccessProfile)</H2>
      <P>Cada usuário administrativo do sistema é vinculado a um perfil de acesso (entidade <code>AccessProfile</code>) que determina, de forma granular, o que ele pode ver e fazer em cada página, aba e sub-aba do sistema. A arquitetura segue o princípio <strong>"default deny"</strong>: se uma página ou ação não está explicitamente permitida no perfil, o usuário não tem acesso.</P>

      <H3>Perfis do Sistema (pré-instalados)</H3>
      <Table headers={['Perfil', 'Slug', 'Home padrão', 'Acesso']} rows={[
        ['Administrador', 'admin', '/Home', 'Acesso total a todas as páginas, abas e ações. Pode criar/editar/deletar outros perfis e convidar usuários.'],
        ['Analista de Compliance', 'compliance_analyst', '/QuestionariosRecebidos', 'Cadastro (leitura + decisão), Compliance (ler dossiê + aprovar/recusar/solicitar docs), Revalidação, Escalações. Sem acesso a Propostas/Contratos/Administração.'],
        ['Analista Comercial', 'commercial_analyst', '/DashboardComercial', 'Leads, Propostas, Contratos, Introducers, Kick-Off. Sem acesso ao dossiê de compliance completo.'],
        ['CEO / Diretor', 'ceo', '/DashboardCEO', 'Todos os dashboards agregados (CEO, Comercial, Dados & Insights). Leitura em Cadastro. Sem ações destrutivas.'],
        ['Introducer', 'introducer', '/IntroducerDashboard', 'Apenas o portal de Introducers (seus leads, comissões, landing page). ISOLADO — não pode acessar páginas administrativas mesmo digitando URL direta.'],
      ]} />

      <H3>Estrutura de Permissões</H3>
      <P>Cada perfil contém um array <code>pagePermissions</code> que detalha, para cada página do sistema:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li><Bold>canView:</Bold> Se false, a página fica oculta no menu E inacessível via URL direta.</Li>
        <Li><Bold>tabs:</Bold> Map de tabId → {`{ canView, canEdit }`}. Permite mostrar a aba "Compliance" em modo leitura e ocultar a aba "Histórico" para um perfil específico.</Li>
        <Li><Bold>subTabs:</Bold> Granularidade ainda mais fina — ex: dentro da aba "Compliance" mostrar a sub-aba "Score" mas ocultar "Overrides Aplicados".</Li>
        <Li><Bold>actions:</Bold> Map de actionId → boolean. Controla botões específicos como "Aprovar caso", "Recusar caso", "Solicitar documentos", "Gerar link subseller", "Enviar proposta".</Li>
      </ul>

      <H2>14.2. Autenticação Multifator Obrigatória (2FA)</H2>
      <P>Todo usuário com perfil <strong>admin</strong> é forçado a configurar 2FA no primeiro login. A flag <code>requiresAdminCode</code> do perfil determina se 2FA é obrigatório. A implementação segue o padrão <strong>TOTP (Time-based One-Time Password)</strong> conforme RFC 6238, totalmente compatível com Google Authenticator, Microsoft Authenticator, Authy e 1Password:</P>

      <Table headers={['Etapa', 'Função backend', 'O que acontece']} rows={[
        ['Enrollment — Start', 'twoFactorEnrollStart', 'Gera secret TOTP aleatório de 160 bits (Base32, 32 caracteres), grava como "pendente" no perfil do usuário e retorna o URI otpauth:// para renderização do QR code.'],
        ['Enrollment — Verify TOTP', 'twoFactorEnrollVerifyTotp', 'Usuário escaneia QR code e digita o código TOTP de 6 dígitos. Backend verifica se o código corresponde ao secret (janela de ±1 step = 30s de tolerância para clock drift).'],
        ['Enrollment — Confirm', 'twoFactorEnrollConfirm', 'Usuário define PIN pessoal de 6 dígitos. PIN é hasheado com SHA-256 + salt aleatório de 128 bits. Sistema gera 10 códigos de backup single-use (armazenados hasheados). Secret TOTP é promovido de "pendente" para "ativo".'],
        ['Login — Verify', 'twoFactorVerify', 'A cada login administrativo, usuário digita TOTP (6 dígitos do app) + PIN pessoal (6 dígitos). Backend valida ambos e emite um JWT assinado com ADMIN_JWT_SECRET contendo user_id + role + timestamp de expiração (2h).'],
        ['Session Check', 'verifyAdminToken', 'Cada carregamento de página administrativa valida o JWT server-side. Tentativas de adulterar o token localmente (React DevTools, localStorage) falham pois a assinatura HMAC não bate.'],
        ['Admin Reset', 'twoFactorResetUser', 'Apenas outro admin pode resetar o 2FA de um usuário (fluxo de perda de dispositivo). A ação gera evento de auditoria <code>admin_reset</code>.'],
      ]} />

      <InfoBox title="Backup Codes — Uso Único" color="amber">
        <p>Ao concluir o enrollment, o sistema exibe 10 códigos de backup que o usuário deve guardar em local seguro (cofre de senhas). Cada código só pode ser usado UMA vez (após uso, é marcado como consumido no banco). São usados para login quando o usuário perde acesso ao app autenticador. Código usado é evento <code>backup_code_used</code> na auditoria.</p>
      </InfoBox>

      <H2>14.3. Proteção Contra Força Bruta</H2>
      <P>A entidade <code>AdminLoginAttempt</code> registra cada tentativa de login com: email, sucesso/falha, hash do IP (SHA-256), user-agent e motivo. O sistema aplica bloqueio progressivo:</P>
      <ul className="list-disc ml-6 space-y-1 mb-4">
        <Li>5 falhas consecutivas em 15 minutos → usuário bloqueado por 30 minutos. Evento <code>locked_out</code> registrado.</Li>
        <Li>10 falhas em 1 hora → alerta automático ao canal #security do Slack.</Li>
        <Li>20 falhas de IPs distintos para o mesmo usuário em 24h → alerta crítico + exigência de rotação de senha.</Li>
      </ul>

      <H2>14.4. Auditoria Completa (AccessAudit + TwoFactorAudit)</H2>
      <P>Toda ação com relevância regulatória é registrada em duas entidades complementares:</P>

      <H3>AccessAudit</H3>
      <P>Registra navegação e execução de ações. Cada evento contém: email do usuário, nome, perfil ativo, tipo de ação (page_view, tab_view, subtab_view, action_executed, access_denied, profile_changed, login, logout), alvo (página/aba/sub-aba/ação/entidade), IP hash, user-agent, flag <code>allowed</code> (sucesso/bloqueado) e payload de detalhes.</P>

      <H3>TwoFactorAudit</H3>
      <P>Registra eventos específicos do 2FA: enroll_start, enroll_complete, totp_success, totp_fail, pin_success, pin_fail, backup_code_used, admin_reset, pin_changed, locked_out.</P>

      <InfoBox title="Retenção de Logs" color="green">
        <p>Os logs de auditoria são retidos por <strong>5 anos</strong> conforme exigência da Lei 9.613/1998 Art.10. A aba <strong>Auditoria de Acessos</strong> (<code>/AuditoriaAcessos</code>) permite que o admin filtre por usuário, data, ação, alvo e IP para responder auditorias do regulador.</p>
      </InfoBox>

      <H2>14.5. Telas Administrativas do Sistema de Acesso</H2>
      <Table headers={['Tela', 'Rota', 'Função']} rows={[
        ['Gestão de Perfis', '/GestaoPerfis', 'Lista todos os perfis, permite criar/duplicar/arquivar. Exibe quantos usuários estão vinculados a cada perfil.'],
        ['Editor de Perfil', '/EditorPerfil?slug=...', 'Interface granular para editar pagePermissions de um perfil: toggles de canView/canEdit por página, aba, sub-aba e ação. Inclui preview da sidebar com as páginas visíveis.'],
        ['Gestão de Usuários', '/GestaoUsuarios', 'Lista todos os usuários administrativos com perfil atribuído. Permite convidar novos usuários (função adminInviteUser), reatribuir perfil (adminAssignProfile), resetar 2FA e desativar acessos.'],
        ['Auditoria de Acessos', '/AuditoriaAcessos', 'Visualização filtrável de AccessAudit + TwoFactorAudit + AdminLoginAttempt unificados. Exportação CSV para compliance regulatório.'],
      ]} />
    </S>
  );
}