import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Shield, Lock, FileCheck, Users, Database, GitBranch, AlertTriangle } from 'lucide-react';

const pillars = [
  {
    icon: FileCheck,
    title: 'Auditoria & Rastreabilidade',
    color: 'text-emerald-600 bg-emerald-50',
    items: [
      'AuditLog: registra CREATE, UPDATE, DELETE, APPROVAL, REJECTION, VALIDATION, VIEW',
      'Captura quem (changedBy), quando (changeDate), o quê (entityName, entityId), antes/depois (details), origem (IP, User Agent)',
      'AccessAudit: rastreia tentativas de acesso a páginas/ações por perfil',
      'TwoFactorAudit: enrollments, sucesso/falha TOTP e PIN, uso de backup codes',
      'AdminLoginAttempt: cada login admin com IP/user-agent e razão',
      'IntegrationLog: chamadas externas (CAF, BigDataCorp) com payloads e respostas',
    ],
  },
  {
    icon: Shield,
    title: 'Controle de Acesso (RBAC + RLS)',
    color: 'text-blue-600 bg-blue-50',
    items: [
      'Roles: admin, introducer, user — cada qual com escopo definido',
      'Row-Level Security em todas entidades sensíveis (Merchant, OnboardingCase, ComplianceScore, etc.)',
      'AccessProfile + UserProfileAssignment: perfis customizáveis com permissões granulares por página/aba/ação',
      'Verificação de role server-side via verifyUserAuth — impossível burlar via DevTools',
      'Introducers travados em /IntroducerDashboard, sem acesso a rotas admin',
    ],
  },
  {
    icon: Lock,
    title: 'Autenticação Forte (2FA)',
    color: 'text-violet-600 bg-violet-50',
    items: [
      'TOTP obrigatório para todos os admins (Google Authenticator, Authy, 1Password)',
      'PIN individual por usuário, separado da senha',
      'Backup codes single-use para recuperação',
      'JWT server-signed (HMAC-SHA256) com expiração — validado em cada mount',
      'Rate limiting + lockout após tentativas falhadas',
      'twoFactorResetUser para reset administrativo auditado',
    ],
  },
  {
    icon: Database,
    title: 'Integridade & Segregação de Dados',
    color: 'text-indigo-600 bg-indigo-50',
    items: [
      'Documentos KYC privados (LGPD) — fileUri com signed URL temporária',
      'Bancos de dados Production e Test isolados',
      'Versionamento de QuestionnaireTemplate e Proposal com previousVersionId',
      'Cleanup orphan jobs para garantir consistência',
    ],
  },
  {
    icon: GitBranch,
    title: 'Mudanças & Deploy',
    color: 'text-cyan-600 bg-cyan-50',
    items: [
      'Schemas de entidade versionados em entities/*.json',
      'Backend functions versionadas com histórico de deploy',
      'Secrets centralizados — nunca expostos no código',
      'Backups periódicos (compliance-snapshot)',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Compliance & Risk Framework',
    color: 'text-amber-600 bg-amber-50',
    items: [
      'Risk Scoring V4: 3 camadas (segmento, variáveis, enriquecimento) — 0-849',
      'Bloqueios B01-B10 automáticos (CNPJ inativo, ≤1 mês, sanctions, etc.)',
      'SENTINEL: agente IA com 7 dimensões de análise qualitativa',
      'Cross-validation declarado vs verificado (BDC + CAF)',
      'Escalation engine com motivo técnico registrado (escalationReason, escalationSource)',
      'Revalidação periódica obrigatória (RevalidationSchedule)',
    ],
  },
  {
    icon: Users,
    title: 'Segregação de Funções',
    color: 'text-rose-600 bg-rose-50',
    items: [
      'Comercial não aprova compliance — analystId separado de commercialAgentId',
      'Parceiros de compliance externos com portal próprio (CompliancePartner)',
      'Aprovação manual obrigatória para casos escalados',
      'manualReviewerId + comments + date em todas as decisões manuais',
    ],
  },
];

export default function GovernanceFramework() {
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-[#0A0A0A] to-[#003366] text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1356E2]/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-[#1356E2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Framework de Governança Pin Bank</h2>
            <p className="text-sm text-white/70 mt-1">Sete pilares que garantem rastreabilidade, segurança, conformidade regulatória e segregação de funções em toda a operação.</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {pillars.map(p => {
          const Icon = p.icon;
          return (
            <Card key={p.title} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-[#0A0A0A]">{p.title}</h3>
              </div>
              <ul className="space-y-2">
                {p.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#0A0A0A]/80">
                    <CheckCircle2 className="w-4 h-4 text-[#1356E2] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}