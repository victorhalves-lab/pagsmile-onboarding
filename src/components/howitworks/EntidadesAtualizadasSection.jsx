import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * HowItWorks Section — Modelo de Dados Atualizado v9.0 (50+ entidades)
 * Substitui visualmente a versão anterior de 27+ entidades.
 * Cada categoria é um bloco focado com badge da entidade + descrição curta.
 */
const CATEGORIES = [
  {
    name: 'Core do Onboarding KYC/KYB',
    color: 'border-l-[#1356E2]',
    items: [
      ['Merchant', 'PJ/PF, type, cpfCnpj, parentMerchantId (subseller), onboardingStatus.'],
      ['OnboardingCase', 'merchantId, questionnaireTemplateId, status, riskScoreV4, subfaixa, rollingReservePercent, monitoramentoNivel, escalationSource, escalationReason, docLinkToken, cafRecaptureRequested.'],
      ['OnboardingLink', 'linkType (LEAD_QUESTIONNAIRE/SUBSELLER_COMPLIANCE/PROPOSAL/etc), uniqueCode, customSlug, branding, métricas.'],
      ['ComplianceSession', 'token, currentPhase/Step, formData persistido, status (active/completed).'],
    ],
  },
  {
    name: 'Funis de Captação (Lead Pré-KYC)',
    color: 'border-l-blue-500',
    items: [
      ['Lead', 'email, cpfCnpj, status (11), leadQualifierScore/Level, bdcLeadScore, bdcFlags[], iaRiskScore, iaDecision, expectedRates.'],
      ['LeadActivity', 'Log de interações: contato, mudança de status, proposta, follow-up.'],
      ['SimplifiedLead', 'QuestionarioSimplificado — captura mínima pós-reunião.'],
      ['LandingPageLead', 'Vinculado a Introducer.uniqueLandingPageSlug.'],
      ['IntroducerLead', 'Cria Lead + atualiza métricas do Introducer.'],
      ['StandardProposalLead', 'Lead vindo de proposta padrão por segmento.'],
    ],
  },
  {
    name: 'Questionários',
    color: 'border-l-purple-500',
    items: [
      ['QuestionnaireTemplate', '11 V4 cartão + 3 PIX + 2 subseller (PF/PJ) + legados. requiredDocuments[], riskThresholds, version, isArchived.'],
      ['Question', '10 tipos + conditionalLogic, riskWeight, riskValues, helpText (critério interno).'],
      ['QuestionnaireResponse', 'caseId + questionId + value (Text/Number/Boolean/Array).'],
      ['InternalCommercialQuestionnaire', 'Reunião comercial (manual ou via IA processMeetingNotes).'],
    ],
  },
  {
    name: 'Documentos & Validação',
    color: 'border-l-orange-500',
    items: [
      ['DocumentType', 'name, formats, maxSize, cafSdk (FaceLiveness/DocumentDetector/SelfieWithDocument), conditionalLogic.'],
      ['DocumentUpload', 'fileUri privado (LGPD), validationStatus, isPrivate, notAvailable + notAvailableReason quando declarado ausente.'],
    ],
  },
  {
    name: 'Análise V4 + SENTINEL',
    color: 'border-l-pink-500',
    items: [
      ['ComplianceScore', 'framework_version v4.0, score_base_segmento (C1) + score_variaveis (C2) + score_enriquecimento (C3) = score_final 0-849, subfaixa, bloqueios_ativos[], red_flags unificados (V4 + SENTINEL), 7 dimensões de análise.'],
      ['ComplianceFinding', '6 níveis de severidade, fase, seção, evidência, recomendação.'],
      ['QualityAssessment', 'Scores 1-5 em 4 dimensões + padrões evasivos.'],
      ['HelenaAnalysis', 'Análise legada Helena com score, decisão, breakdown.'],
    ],
  },
  {
    name: 'Validações Externas (BDC + CAF)',
    color: 'border-l-cyan-500',
    items: [
      ['ExternalValidationResult', 'Resultado bruto de cada dataset/serviço por caso.'],
      ['IntegrationConfig', 'Provedor (CAF/BigDataCorp), ambiente, URLs.'],
      ['IntegrationLog', '20+ service_types: liveness, facematch, documentscopy, deepfake_detection, official_biometrics, private_faceset, shared_faceset, verifai_docs, kyb_company_search, pep_international, sanctions_international, etc.'],
      ['BdcRetryQueue', 'Fila persistente de datasets BDC que falharam — 3 prioridades (CRITICAL/IMPORTANT/COMPLEMENTARY) com backoff exponencial.'],
    ],
  },
  {
    name: 'Propostas & Contratos',
    color: 'border-l-indigo-500',
    items: [
      ['Proposal', 'leadId, taxas por bandeira × 4 faixas, antecipação, status (8), versionamento, publicSlug.'],
      ['StandardProposal', 'templateName, segment, isDefaultForSegment, taxas fixas, tokenPublico.'],
      ['PixProposal', 'leadId, taxa PIX (% ou fixo), TPV mínimo (3 meses), versionamento.'],
      ['Contract', 'leadId, proposalId, módulos, SLAs, preços, cláusulas, assinatura digital.'],
      ['Partner', 'Parceiro adquirente: nome, modelo, taxas MDR por MCC.'],
      ['PartnerCost', 'Custo detalhado por MCC/bandeira.'],
      ['SegmentDefaultRates', 'Taxas padrão por segmento (cascata para StandardProposal e Introducer).'],
      ['KickOffPresentation', 'publicToken, dados consolidados de proposta + contrato + ID dos slides.'],
    ],
  },
  {
    name: 'Introducers & Landing',
    color: 'border-l-violet-500',
    items: [
      ['Introducer', 'referralCode único, uniqueLandingPageSlug, standardRates[] por segmento, comissão.'],
      ['LandingPageEvent', 'page_view, segment_view, calculator_interact, cta_contratar — analytics anonimizada.'],
    ],
  },
  {
    name: 'Parceiros de Compliance Externos',
    color: 'border-l-rose-500',
    items: [
      ['CompliancePartner', 'Bureau/auditoria externa: slaHours, allowedOnboardingCaseModels[], defaultVisibilityLevel, notificationChannels.'],
      ['CompliancePartnerUser', 'userId + partnerRole (viewer/analyst/manager).'],
      ['PartnerAssignment', 'caso atribuído + dueDate + recommendation (approve/reject/request_docs/escalate).'],
      ['PartnerAssignmentActivity', 'Log auditável: assigned, viewed, documents_downloaded, recommendation_submitted, sla_breached.'],
      ['BankDataCollection', 'Coleta bancária via token público 192 bits — alimenta export Pré-KYC.'],
    ],
  },
  {
    name: 'Governança & Auditoria',
    color: 'border-l-slate-600',
    items: [
      ['AccessProfile', 'Perfis granulares: pagePermissions[] com canView/tabs/subTabs/actions. Default deny.'],
      ['UserProfileAssignment', 'User → AccessProfile (1:N).'],
      ['AccessAudit', 'Log de navegação e ações: page_view, action_executed, access_denied. Retenção 5 anos.'],
      ['TwoFactorAudit', 'Eventos 2FA: enroll_complete, totp_success/fail, backup_code_used, locked_out.'],
      ['AdminLoginAttempt', 'Anti brute-force: 5 falhas/15min → lockout 30min. IP hasheado.'],
      ['CodeChangelog', 'Histórico de mudanças no sistema com categoria, severity, files/entities/functions/pages affected.'],
      ['AuditLog', 'Genérico: entityName + actionType + changedBy + details.'],
    ],
  },
  {
    name: 'Operacional',
    color: 'border-l-emerald-500',
    items: [
      ['ComplianceRule', 'Regras configuráveis: condições, ações, prioridade, isActive.'],
      ['RevalidationSchedule', 'Agendamento por subfaixa: 1A-1B=12m, 2A-2B=9m, 3A-3B=6m, 4=3m.'],
      ['SubsellerScore', 'Score específico de subseller dentro do portfólio do seller principal.'],
      ['MessageTemplate', 'Templates WhatsApp/e-mail com variáveis dinâmicas {nome_empresa}, {protocolo}, etc.'],
      ['OnboardingAnalytics', 'Eventos de funil para análise de conversão por link.'],
    ],
  },
];

export default function EntidadesAtualizadasSection() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003366] rounded-2xl p-4 text-white">
        <p className="text-white/80 text-sm leading-relaxed">
          <strong className="text-[#E84B1C]">50+ entidades</strong> agrupadas por domínio funcional.
          Cada entidade tem RLS (Row-Level Security) aplicada por papel — admin, parceiro externo, introducer e
          público (rotas /Public*) operam em conjuntos de permissões disjuntos.
        </p>
      </div>

      {CATEGORIES.map((cat, i) => (
        <div key={i}>
          <h4 className="font-bold text-[#0A0A0A] text-sm mb-2 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cat.color.replace('border-l-', 'bg-')}`} />
            {cat.name}
            <span className="text-[10px] font-normal text-[#0A0A0A]/40">({cat.items.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
            {cat.items.map(([name, desc], j) => (
              <div key={j} className={`p-3 border-l-4 ${cat.color} bg-slate-50/70 rounded-r-lg`}>
                <Badge className="bg-[#0A0A0A] text-white font-mono text-[10px] border-0 mb-1.5">{name}</Badge>
                <p className="text-[11px] text-[#0A0A0A]/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}