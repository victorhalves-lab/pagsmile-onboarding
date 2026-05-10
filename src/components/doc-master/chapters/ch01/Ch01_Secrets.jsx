import React from 'react';
import { H2, H3, P, B, C, Table, Note } from '../../DocPrimitives';

/**
 * §1.7 Secrets — catálogo completo de env vars Deno + uso em cada função
 */
export default function Ch01_Secrets() {
  return (
    <>
      <H2 num="1.7">Secrets — Catálogo de Env Vars Deno</H2>

      <P>Backend functions acessam segredos via <C>Deno.env.get('NOME')</C>. A lista abaixo é o <B>inventário completo</B> dos segredos configurados no app, com sua finalidade e onde são usados. <B>Nunca commitar secrets em código</B> — sempre via dashboard Base44.</P>

      <H3 num="1.7.1">Catálogo completo</H3>
      <Table headers={['Secret', 'Categoria', 'Usado em', 'Crítico se vazar']} rows={[
        ['CAF_CLIENT_ID', 'CAF SDK Web', 'cafGenerateToken (compõe JWT do SDK)', 'Médio — combina com CLIENT_SECRET'],
        ['CAF_CLIENT_SECRET', 'CAF SDK Web', 'cafGenerateToken (assinatura JWT)', 'ALTO — atacante pode forjar JWTs'],
        ['CAF_TEMPLATE_ID_PF', 'CAF SDK Web', 'cafGenerateToken para fluxo PF', 'Baixo — apenas ID público'],
        ['CAF_TEMPLATE_ID_PJ', 'CAF SDK Web', 'cafGenerateToken para fluxo PJ', 'Baixo'],
        ['CAF_CORE_API_TOKEN', 'CAF Core API', 'Bearer token em todas chamadas Core API: cafPostCaptureAnalysis, cafScreeningInternacional, cafCreditAnalysis, cafCpfValidation, cafVerifaiDocs, cafCheckProfile, cafKybSearch, cafFaceRegister', 'CRÍTICO — acesso completo CAF Core'],
        ['CAF_CONNECT_CLIENT_ID', 'CAF Connect (experimental)', 'cafConnectAuth (OAuth Client Credentials)', 'Médio'],
        ['CAF_CONNECT_CLIENT_SECRET', 'CAF Connect', 'cafConnectAuth', 'ALTO'],
        ['CAF_WEBHOOK_SECRET', 'CAF Webhook HMAC', 'cafWebhookHandler valida X-Signature contra HMAC SHA-256 deste secret + raw body', 'CRÍTICO — atacante pode forjar webhooks de fraude'],
        ['BDC_ACCESS_TOKEN', 'BigDataCorp', 'Header AccessToken em bdcEnrichCase, bdcEnrichLead, bdcDeepDueLead, bdcQueryCompany, bdcQueryPerson, bdcRetryWorker, bdcBigIdFallback, bdcHealthCheck', 'CRÍTICO — créditos BDC ilimitados'],
        ['BDC_TOKEN_ID', 'BigDataCorp', 'Header TokenId par com AccessToken', 'CRÍTICO'],
        ['SLACK_COMPLIANCE_CHANNEL', 'Slack', 'Canal alvo de todos os notify*.js (notifyComplianceCompleted, notifyNewLead, notifyComplianceCaseChange, etc.)', 'Baixo — apenas ID público do canal'],
        ['ADMIN_JWT_SECRET', '2FA admin', 'twoFactorVerify ASSINA o JWT. verifyAdminToken VALIDA. ADMIN_JWT_SECRET é o pivot de toda autenticação admin.', 'CRÍTICO — atacante pode emitir JWTs admin válidos'],
        ['ADMIN_ACCESS_CODE', '2FA — bypass legacy', 'verifyAdminCode (caminho legado de código mestre — em desuso)', 'ALTO'],
        ['ADMIN_ACCESS_CODE_2', '2FA — bypass legacy', 'verifyAdminCode (segundo código mestre)', 'ALTO'],
        ['PORTAL_TRANSPARENCIA_TOKEN', 'Portal da Transparência', 'sanctionsScreening (consulta listas oficiais BR)', 'Médio'],
      ]} />

      <H3 num="1.7.2">Pré-populados pela plataforma (não setados manualmente)</H3>
      <Table dense headers={['Variável', 'Conteúdo']} rows={[
        ['BASE44_APP_ID', 'ID do app Base44 — usado por backend functions para chamadas inter-app'],
      ]} />

      <Note title="O que NÃO existe (não pedir, não usar)" kind="rule">
        <C>BASE44_SERVICE_TOKEN</C> e <C>BASE44_SERVICE_ROLE_KEY</C> <B>NÃO existem</B>. Nunca peça ao usuário para configurar — esses não são padrão Base44. Para chamadas com privilégios elevados, use <C>base44.asServiceRole.*</C>; para chamadas em nome do user, use <C>createClientFromRequest(req)</C>.
      </Note>

      <H3 num="1.7.3">Padrão de uso em funções</H3>
      <Table dense headers={['Padrão', 'Exemplo']} rows={[
        ['Bearer header', `'Authorization': \`Bearer \${Deno.env.get('CAF_CORE_API_TOKEN')}\``],
        ['Custom headers BDC', `headers: { AccessToken: Deno.env.get('BDC_ACCESS_TOKEN'), TokenId: Deno.env.get('BDC_TOKEN_ID') }`],
        ['HMAC SHA-256 webhook', `crypto.subtle.importKey('raw', encoder.encode(Deno.env.get('CAF_WEBHOOK_SECRET')), {name:'HMAC',hash:'SHA-256'}, false, ['verify'])`],
        ['JWT sign (admin)', `await hmacSha256Hex(Deno.env.get('ADMIN_JWT_SECRET'), header + '.' + payload)`],
        ['Slack channel', `body: { channel: Deno.env.get('SLACK_COMPLIANCE_CHANNEL'), text: '...' }`],
      ]} />

      <H3 num="1.7.4">Rotação de secrets</H3>
      <Table dense headers={['Secret', 'Frequência recomendada', 'Impacto da rotação']} rows={[
        ['ADMIN_JWT_SECRET', '90 dias OU em caso de suspeita', 'Todos JWTs admin emitidos invalidam. Admins precisam re-autenticar (TOTP+PIN).'],
        ['CAF_WEBHOOK_SECRET', 'Semestral OU em caso de suspeita', 'Coordenar com CAF — webhooks com signature antiga rejeitados.'],
        ['BDC_ACCESS_TOKEN / BDC_TOKEN_ID', 'Anual OU em caso de suspeita', 'BDC fornece — coordenar para evitar 401 em produção.'],
        ['CAF_CORE_API_TOKEN', 'Anual', 'CAF fornece via portal cliente.'],
        ['ADMIN_ACCESS_CODE / ADMIN_ACCESS_CODE_2', 'Em deprecação', 'Substituídos por TOTP+PIN. Manter apenas até remoção do verifyAdminCode.'],
      ]} />

      <H3 num="1.7.5">Auditoria de uso</H3>

      <P>Toda chamada a um secret é implicitamente auditada por:</P>
      <ul className="list-disc ml-5 text-[12.5px] leading-[1.7]">
        <li><B>IntegrationLog</B> — cada chamada externa CAF/BDC gera log com provider, service_type, timestamp, duration, status. Análise forense via <C>/CafTestLab</C> ou Cadastro → Compliance → Timeline Integrações.</li>
        <li><B>AdminLoginAttempt + TwoFactorAudit</B> — toda emissão de JWT admin (que envolve ADMIN_JWT_SECRET) é registrada com user_email, IP hash, success/fail.</li>
        <li><B>console.log nos handlers</B> — Deno Deploy preserva logs por 30 dias. Acessíveis via dashboard Base44 → Functions → Logs.</li>
      </ul>
    </>
  );
}