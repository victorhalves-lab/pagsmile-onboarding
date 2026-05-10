import React from 'react';
import { H2, H3, B, Table, Note } from '../../DocPrimitives';

export default function Ch02_TermosTecnicos() {
  return (
    <>
      <H2 num="2.2">Termos Técnicos (Arquitetura, Segurança, Dados)</H2>

      <H3 num="2.2.1">Segurança e Autenticação</H3>
      <Table headers={['Termo', 'Definição', 'Onde aparece']} rows={[
        ['RLS', 'Row-Level Security — regras acesso por linha. user_condition role=admin é padrão', 'Todas entities/*.json'],
        ['Default Deny', 'O não-explicitamente-permitido é negado', 'AccessProfile, RLS, validação backend'],
        ['JWT', 'JSON Web Token (header.payload.signature base64url, HMAC-SHA256)', 'sessionStorage["base44_admin_jwt"] TTL 2h, ADMIN_JWT_SECRET'],
        ['HMAC', 'Hash-based Message Auth Code (SHA-256)', 'JWTs admin, webhooks CAF (raw body)'],
        ['TOTP', 'Time-based OTP (RFC 6238) — 6 dígitos / 30s, janela ±1 step', '2FA Google Authenticator/Authy/1Password'],
        ['PIN individual', '6 dígitos definidos pelo admin no enrollment, hash SHA-256+salt', 'twoFactorEnrollConfirm + twoFactorVerify constant-time'],
        ['Backup codes', '8 one-time codes gerados no enrollment (substituem TOTP)', 'twoFactorEnrollConfirm exibe UMA vez, hasheados'],
        ['Lockout', '5 falhas TOTP/15min=15min lockout. 3 falhas PIN/10min=30min lockout', 'AdminLoginAttempt + TwoFactorAudit'],
        ['ip_hash', 'SHA-256 do IP (LGPD — não persiste IP claro)', 'AccessAudit, TwoFactorAudit, AdminLoginAttempt'],
        ['Constant-time compare', 'Comparação byte-a-byte tempo fixo (mitiga timing attack)', 'twoFactorVerify validação PIN'],
        ['CSRF', 'Cross-Site Request Forgery', 'Mitigado: sessionStorage (não cookies), Same-Origin'],
        ['SDN List', 'Specially Designated Nationals (OFAC Treasury USA)', 'BDC kyc.Sanctions, cafScreeningInternacional'],
      ]} />

      <H3 num="2.2.2">Dados e Persistência</H3>
      <Table headers={['Termo', 'Definição', 'Exemplo']} rows={[
        ['Entity', 'Tabela do banco. JSON Schema em entities/*.json', 'OnboardingCase, Lead, Proposal, ComplianceScore'],
        ['Entity automation', 'Função backend disparada em create/update/delete', 'onLeadCreatedEnrich, autoEnrichOnboarding'],
        ['Append-only', 'Auditoria nunca edita/deleta — só adiciona', 'AccessAudit, AuditLog, TwoFactorAudit, IntegrationLog'],
        ['Idempotência', 'Re-execução não duplica efeitos', 'cafWebhookHandler dedupe requestId, autoEnrich skip se bigDataCorpCompleted'],
        ['Cache no campo', 'Cópia de outra entidade para auditoria histórica', 'QuestionnaireResponse.questionText'],
        ['Snapshot', 'Cópia imutável em momento do tempo', 'KickOffPresentation.proposalData'],
        ['Soft delete', 'Flag isActive=false em vez de DELETE', 'CompliancePartnerUser.isActive'],
        ['Backfill', 'População retroativa de campos novos', 'backfillPublicSlugs'],
        ['Versionamento proposta', 'previousVersionId + rootProposalId + isCurrentVersion', 'Proposal, PixProposal'],
      ]} />

      <H3 num="2.2.3">Pipelines e Concorrência</H3>
      <Table headers={['Termo', 'Definição', 'Exemplo']} rows={[
        ['Pipeline', 'Sequência ordenada de steps com dependências', 'autoEnrichOnboarding 11 steps (Cap. 3)'],
        ['Step blocking', 'Falha impede progresso', 'BDC lotes CRITICAL → HTTP 202'],
        ['Step non-blocking', 'Falha apenas log warning', 'cafPostCaptureAnalysis, SENTINEL'],
        ['Fire-and-forget', 'Invoca sem aguardar', 'cafVerifaiDocs em publicComplianceDocUpload'],
        ['Backoff jittered', 'Retry crescente + aleatório (anti-thundering-herd)', 'callBdcBatch HTTP 5xx'],
        ['Throttling', 'Limite requisições/janela do provider', 'BDC HTTP 429 → backoff'],
        ['Webhook', 'Callback HTTP do provider para evento async', 'cafWebhookHandler'],
        ['Batch', 'Conjunto processado junto', 'bdcEnrichCase 7 lotes datasets'],
        ['Cron / Scheduled', 'Automation por intervalo de tempo', 'expireProposalsScheduled, partnerSlaMonitor'],
      ]} />

      <H3 num="2.2.4">Plataforma Base44</H3>
      <Table headers={['Termo', 'Definição']} rows={[
        ['createClientFromRequest(req)', 'Cliente herda role/permissões do JWT da request'],
        ['base44.asServiceRole', 'Cliente com privilégios elevados — backend ops inter-entidade'],
        ['Frozen file', 'Arquivo gerenciado pela plataforma — não editável'],
        ['Connector (shared/app-user)', 'OAuth gerenciado. Shared = builder. App-user = cada user'],
        ['data_env', 'Production (default) vs Test database'],
      ]} />

      <Note title="Convenção" kind="info">
        Em dúvida, busque o termo no código. Padrão: <B>UPPERCASE</B> = sigla, <B>camelCase</B> = conceito. Entidades legacy = <B>snake_case</B>.
      </Note>
    </>
  );
}