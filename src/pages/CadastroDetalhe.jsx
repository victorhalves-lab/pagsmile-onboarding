import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, Globe, Calendar, Shield, FileText, Users, FileCheck, Stamp, BarChart3, History, Database, Microscope, Handshake, Briefcase, Brain, ClipboardList, UserCheck, ShieldCheck, Rocket, GitBranch, Inbox, Sparkles } from 'lucide-react';
import CasePartnerAssignments from '@/components/partners-compliance/CasePartnerAssignments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import CadastroOverviewTab from '@/components/cadastro/CadastroOverviewTab';
import CadastroDadosTab from '@/components/cadastro/CadastroDadosTab';
import CadastroDocumentosTab from '@/components/cadastro/CadastroDocumentosTab';
import CadastroDocumentosUnificadoTab from '@/components/cadastro/CadastroDocumentosUnificadoTab';
import CadastroDocumentJustificationsBlock from '@/components/cadastro/CadastroDocumentJustificationsBlock';
import CadastroAllProposalsTab from '@/components/cadastro/CadastroAllProposalsTab';
import CadastroComplianceTab from '@/components/cadastro/CadastroComplianceTab';
import CadastroSubsellersTab from '@/components/cadastro/CadastroSubsellersTab';
import CadastroContratoTab from '@/components/cadastro/CadastroContratoTab';
import CadastroHistoricoTab from '@/components/cadastro/CadastroHistoricoTab';
import CadastroEnrichmentTab from '@/components/cadastro/CadastroEnrichmentTab';
import CadastroRegulatoryPanel from '@/components/cadastro/CadastroRegulatoryPanel';
import CadastroComercialTab from '@/components/cadastro/CadastroComercialTab';
import CadastroOrigemTab from '@/components/cadastro/CadastroOrigemTab';
import CadastroGatewayCollectionsTab from '@/components/cadastro/CadastroGatewayCollectionsTab';
import CadastroLeadIATab from '@/components/cadastro/CadastroLeadIATab';
import CadastroPendenciasTab from '@/components/cadastro/CadastroPendenciasTab';
import CadastroRepresentantesTab from '@/components/cadastro/CadastroRepresentantesTab';
import CadastroAuditoriaTab from '@/components/cadastro/CadastroAuditoriaTab';
import CadastroBankDataBlock from '@/components/cadastro/CadastroBankDataBlock';
import CadastroSessionDraftsBlock from '@/components/cadastro/CadastroSessionDraftsBlock';
import CadastroRevalidationBlock from '@/components/cadastro/CadastroRevalidationBlock';
import CadastroPartnerActivityBlock from '@/components/cadastro/CadastroPartnerActivityBlock';
import EnterpriseExecutiveSummary from '@/components/cadastro/EnterpriseExecutiveSummary';
import CadastroMonitoringEventsBlock from '@/components/cadastro/CadastroMonitoringEventsBlock';
import CadastroMonitoringExtendedBlock from '@/components/cadastro/CadastroMonitoringExtendedBlock';
import CadastroTimelineUnificadaTab from '@/components/cadastro/CadastroTimelineUnificadaTab';
import DownloadDossieButton from '@/components/cadastro/DownloadDossieButton';
import CadastroV5_2Banner from '@/components/cadastro/CadastroV5_2Banner';
import CadastroV5_2Tab from '@/components/cadastro/CadastroV5_2Tab';
import ReprocessV4AsV5_2Button from '@/components/cadastro/ReprocessV4AsV5_2Button';
import CadastroCompletenessAuditModal from '@/components/cadastro/CadastroCompletenessAuditModal';
import { segmentLabel } from '@/lib/segmentLabels';

const STATUS_CONFIG = {
  'Pendente': { color: 'bg-gray-100 text-gray-700' },
  'Em Análise': { color: 'bg-blue-100 text-blue-700' },
  'Aprovado': { color: 'bg-green-100 text-green-700' },
  'Manual': { color: 'bg-amber-100 text-amber-700' },
  'Recusado': { color: 'bg-red-100 text-red-700' },
};

function formatDoc(doc) {
  if (!doc) return '—';
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}

export default function CadastroDetalhe() {
  const urlParams = new URLSearchParams(window.location.search);
  const merchantId = urlParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: merchant, isLoading } = useQuery({
    queryKey: ['cadastro-merchant', merchantId],
    queryFn: async () => {
      const list = await base44.entities.Merchant.filter({ id: merchantId });
      return list[0] || null;
    },
    enabled: !!merchantId,
  });

  // Current user for admin-gated actions
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-cadastro-detalhe'],
    queryFn: async () => {
      try { return await base44.auth.me(); } catch { return null; }
    },
  });
  const isAdmin = currentUser?.role === 'admin';

  const { data: cases = [] } = useQuery({
    queryKey: ['cadastro-cases-merchant', merchantId],
    queryFn: () => base44.entities.OnboardingCase.filter({ merchantId }),
    enabled: !!merchantId,
  });

  const latestCase = useMemo(() => {
    if (!cases.length) return null;
    return cases.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  }, [cases]);

  // Fetch leads by cpfCnpj
  const { data: leadsByCnpj = [] } = useQuery({
    queryKey: ['cadastro-leads-cnpj', merchant?.cpfCnpj],
    queryFn: () => base44.entities.Lead.filter({ cpfCnpj: merchant.cpfCnpj }),
    enabled: !!merchant?.cpfCnpj,
  });

  // Fetch leads by email
  const { data: leadsByEmail = [] } = useQuery({
    queryKey: ['cadastro-leads-email', merchant?.email],
    queryFn: () => base44.entities.Lead.filter({ email: merchant.email }),
    enabled: !!merchant?.email,
  });

  // Merge leads (dedupe by id)
  const allLeads = useMemo(() => {
    const map = new Map();
    [...leadsByCnpj, ...leadsByEmail].forEach(l => map.set(l.id, l));
    return Array.from(map.values());
  }, [leadsByCnpj, leadsByEmail]);

  const lead = allLeads[0] || null;

  const { data: subsellersRaw = [] } = useQuery({
    queryKey: ['cadastro-subsellers', merchantId],
    queryFn: () => base44.entities.Merchant.filter({ parentMerchantId: merchantId }),
    enabled: !!merchantId && !merchant?.isSubseller,
  });

  // Check if this merchant is a Gateway that has subseller collection links
  const { data: gatewayCollections = [] } = useQuery({
    queryKey: ['cadastro-gateway-check', merchant?.cpfCnpj],
    queryFn: () => base44.entities.SubsellerInfoCollection.filter({ gateway_cnpj: merchant.cpfCnpj }),
    enabled: !!merchant?.cpfCnpj && !merchant?.isSubseller,
  });
  const isGatewayWithCollections = gatewayCollections.length > 0;

  // Fetch latest OnboardingCase per subseller to surface score V4 + subfaixa in the list
  const subsellerIds = useMemo(() => subsellersRaw.map(s => s.id), [subsellersRaw]);
  const { data: subsellerCases = [] } = useQuery({
    queryKey: ['cadastro-subsellers-cases', subsellerIds],
    queryFn: async () => {
      if (!subsellerIds.length) return [];
      const results = await Promise.all(
        subsellerIds.map(id => base44.entities.OnboardingCase.filter({ merchantId: id }, '-created_date', 1))
      );
      return results.flat();
    },
    enabled: subsellerIds.length > 0,
  });

  const subsellers = useMemo(() => {
    const caseByMerchant = new Map();
    subsellerCases.forEach(c => {
      const prev = caseByMerchant.get(c.merchantId);
      if (!prev || new Date(c.created_date) > new Date(prev.created_date)) {
        caseByMerchant.set(c.merchantId, c);
      }
    });
    return subsellersRaw.map(s => {
      const c = caseByMerchant.get(s.id);
      return {
        ...s,
        _scoreV4: c?.riskScoreV4 ?? null,
        _subfaixa: c?.subfaixa ?? null,
        _subfaixaNome: c?.subfaixaNome ?? null,
      };
    });
  }, [subsellersRaw, subsellerCases]);

  // Fetch responses from ALL cases
  const allCaseIds = useMemo(() => cases.map(c => c.id), [cases]);
  
  const { data: responses = [] } = useQuery({
    queryKey: ['cadastro-responses', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // Fetch documents from ALL cases
  const { data: documents = [] } = useQuery({
    queryKey: ['cadastro-docs', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.DocumentUpload.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // Fetch proposals from ALL leads + also by merchant cpfCnpj/email
  const allLeadIds = useMemo(() => allLeads.map(l => l.id), [allLeads]);

  const { data: proposalsByLeads = [] } = useQuery({
    queryKey: ['cadastro-proposals-leads', allLeadIds],
    queryFn: async () => {
      const results = await Promise.all(allLeadIds.map(id => base44.entities.Proposal.filter({ leadId: id })));
      return results.flat();
    },
    enabled: allLeadIds.length > 0,
  });

  const { data: proposalsByCnpj = [] } = useQuery({
    queryKey: ['cadastro-proposals-cnpj', merchant?.cpfCnpj],
    queryFn: () => base44.entities.Proposal.filter({ clienteCnpj: merchant.cpfCnpj }),
    enabled: !!merchant?.cpfCnpj,
  });

  // Also search proposals by clienteNome (for cases where CNPJ/lead aren't linked)
  const merchantDisplayName = merchant?.companyName || merchant?.fullName || '';
  const { data: proposalsByName = [] } = useQuery({
    queryKey: ['cadastro-proposals-name', merchantDisplayName],
    queryFn: () => base44.entities.Proposal.filter({ clienteNome: merchantDisplayName }),
    enabled: !!merchantDisplayName && merchantDisplayName.length > 2,
  });

  // Merge all proposals (dedupe by id)
  const allProposals = useMemo(() => {
    const map = new Map();
    [...proposalsByLeads, ...proposalsByCnpj, ...proposalsByName].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [proposalsByLeads, proposalsByCnpj, proposalsByName]);

  const latestProposal = useMemo(() => {
    if (!allProposals.length) return null;
    const current = allProposals.find(p => p.isCurrentVersion);
    return current || allProposals[0];
  }, [allProposals]);

  // Fetch ALL contracts (by cnpj, leadId, merchantId)
  const { data: contractsByCnpj = [] } = useQuery({
    queryKey: ['cadastro-contracts-cnpj', merchant?.cpfCnpj],
    queryFn: () => base44.entities.Contract.filter({ clientCnpj: merchant.cpfCnpj }),
    enabled: !!merchant?.cpfCnpj,
  });

  const { data: contractsByMerchant = [] } = useQuery({
    queryKey: ['cadastro-contracts-merchant', merchantId],
    queryFn: () => base44.entities.Contract.filter({ merchantId }),
    enabled: !!merchantId,
  });

  const allContracts = useMemo(() => {
    const map = new Map();
    [...contractsByCnpj, ...contractsByMerchant].forEach(c => map.set(c.id, c));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [contractsByCnpj, contractsByMerchant]);

  const latestContract = allContracts[0] || null;

  // Fetch compliance scores from ALL cases
  const { data: scores = [] } = useQuery({
    queryKey: ['cadastro-scores', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ComplianceScore.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const latestScore = useMemo(() => {
    if (!scores.length) return null;
    return scores.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  }, [scores]);

  // Fetch ExternalValidationResult for all cases
  const { data: validations = [] } = useQuery({
    queryKey: ['cadastro-validations', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ExternalValidationResult.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // Fetch IntegrationLog for all cases
  const { data: integrationLogs = [] } = useQuery({
    queryKey: ['cadastro-intlogs', allCaseIds],
    queryFn: async () => {
      const results = await Promise.all(allCaseIds.map(id => base44.entities.IntegrationLog.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // Fetch AuditLogs for merchant + all cases + all proposals
  const auditEntityIds = useMemo(() => {
    const ids = [merchantId];
    allCaseIds.forEach(id => ids.push(id));
    allProposals.forEach(p => ids.push(p.id));
    allContracts.forEach(c => ids.push(c.id));
    return ids.filter(Boolean);
  }, [merchantId, allCaseIds, allProposals, allContracts]);

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['cadastro-audit', auditEntityIds],
    queryFn: async () => {
      const results = await Promise.all(auditEntityIds.map(id => base44.entities.AuditLog.filter({ entityId: id })));
      return results.flat();
    },
    enabled: auditEntityIds.length > 0,
  });

  // Dados extras para a Timeline Unificada (Sprint E)
  const { data: timelineExtras = { findings: [], feedbacks: [], monitoringEvents: [], pendencies: [] } } = useQuery({
    queryKey: ['cadastro-timeline-extras', allCaseIds, merchant?.cpfCnpj],
    queryFn: async () => {
      const cleanDoc = (merchant?.cpfCnpj || '').replace(/\D/g, '');
      const [findingsRes, feedbacksRes, monitoringRes, pendenciesRes] = await Promise.all([
        allCaseIds.length
          ? Promise.all(allCaseIds.map(id => base44.entities.ComplianceFinding.filter({ onboarding_case_id: id }))).then(r => r.flat())
          : Promise.resolve([]),
        allCaseIds.length
          ? Promise.all(allCaseIds.map(id => base44.entities.SentinelFeedback.filter({ onboarding_case_id: id }))).then(r => r.flat())
          : Promise.resolve([]),
        cleanDoc
          ? base44.entities.BdcMonitoringEvent.filter({ document: cleanDoc }, '-receivedAt', 100)
          : Promise.resolve([]),
        allCaseIds.length
          ? Promise.all(allCaseIds.map(id => base44.entities.PendencyRequest.filter({ onboardingCaseId: id }))).then(r => r.flat())
          : Promise.resolve([]),
      ]);
      return {
        findings: findingsRes,
        feedbacks: feedbacksRes,
        monitoringEvents: monitoringRes,
        pendencies: pendenciesRes,
      };
    },
    enabled: allCaseIds.length > 0 || !!merchant?.cpfCnpj,
  });

  const handleMerchantUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['cadastro-merchant', merchantId] });
    queryClient.invalidateQueries({ queryKey: ['cadastro-audit'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--pinbank-blue)]/50">Merchant não encontrado</p>
        <Link to="/Cadastro">
          <Button variant="outline" className="mt-4">Voltar ao Cadastro</Button>
        </Link>
      </div>
    );
  }

  // Helper inline component to fetch PartnerAssignments and render activities below the list
  function PartnerActivitiesForCase({ onboardingCaseId }) {
    const { data: assigns = [] } = useQuery({
      queryKey: ['cadastro-partner-assignments', onboardingCaseId],
      queryFn: () => base44.entities.PartnerAssignment.filter({ onboardingCaseId }),
      enabled: !!onboardingCaseId,
    });
    if (!assigns.length) return null;
    return <CadastroPartnerActivityBlock assignments={assigns} />;
  }

  const sc = STATUS_CONFIG[merchant.onboardingStatus] || STATUS_CONFIG['Pendente'];
  const backLink = merchant.isSubseller && merchant.parentMerchantId
    ? `/CadastroDetalhe?id=${merchant.parentMerchantId}`
    : '/Cadastro';

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-[var(--pinbank-blue)]/60 hover:text-[var(--pinbank-blue)] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {merchant.isSubseller ? 'Voltar ao Seller' : 'Voltar ao Cadastro'}
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${merchant.type === 'PJ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            {merchant.type === 'PJ' ? <Building2 className="w-7 h-7 text-blue-600" /> : <User className="w-7 h-7 text-purple-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[var(--pinbank-blue)]">{merchant.companyName || merchant.fullName}</h1>
              <Badge variant="outline" className="text-xs">{merchant.type}</Badge>
              {merchant.isSubseller && <Badge className="bg-purple-100 text-purple-700 text-xs">Subseller</Badge>}
              {(lead?.businessSubCategory || latestCase?.questionnaireTemplateId) && (
                <Badge className="bg-emerald-50 text-emerald-700 text-xs border-emerald-200">
                  {segmentLabel(lead?.businessSubCategory)}
                </Badge>
              )}
              <Badge className={`${sc.color} text-xs`}>{merchant.onboardingStatus}</Badge>
            </div>
            {merchant.fullName && merchant.companyName && (
              <p className="text-sm text-[var(--pinbank-blue)]/50 mb-2">{merchant.fullName}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-[var(--pinbank-blue)]/60">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{formatDoc(merchant.cpfCnpj)}</span>
              {merchant.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{merchant.email}</span>}
              {merchant.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{merchant.phone}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Desde {new Date(merchant.created_date).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={`/AnaliseCompleta?id=${merchantId}`}>
              <Button variant="outline" className="gap-2 text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                <Microscope className="w-3.5 h-3.5" /> Análise Completa CAF/BDC
              </Button>
            </Link>
            <ReprocessV4AsV5_2Button latestCase={latestCase} isAdmin={isAdmin} merchantId={merchantId} />
            {isAdmin && <CadastroCompletenessAuditModal merchantId={merchantId} merchantName={merchant.companyName || merchant.fullName} />}
            <DownloadDossieButton merchantId={merchantId} merchantName={merchant.companyName || merchant.fullName} />
          {(latestCase?.riskScoreV4 != null || latestCase?.riskScore != null || latestScore?.score_final != null) && (() => {
            const scoreV4 = latestCase?.riskScoreV4 ?? latestScore?.score_final;
            const subfaixa = latestCase?.subfaixaNome || latestScore?.subfaixa_nome || '';
            const displayScore = scoreV4 ?? latestCase?.riskScore;
            const isV4 = scoreV4 != null;
            const color = isV4 
              ? (scoreV4 <= 200 ? 'bg-green-50 text-green-700' : scoreV4 <= 500 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')
              : (latestCase.riskScore <= 40 ? 'bg-green-50 text-green-700' : latestCase.riskScore <= 70 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700');
            return (
              <div className={`text-center px-4 py-2 rounded-xl flex-shrink-0 ${color.split(' ')[0]}`}>
                <p className={`text-2xl font-bold ${color.split(' ').slice(1).join(' ')}`}>{displayScore}</p>
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">{isV4 ? `V4 — ${subfaixa}` : 'Risk Score'}</p>
              </div>
            );
          })()}
          </div>
        </div>
      </div>

      {/* V5.2 Banner — só renderiza para casos framework_version=v5.2 */}
      <CadastroV5_2Banner latestCase={latestCase} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[var(--pinbank-blue)]/8 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="overview" className="text-xs gap-1"><BarChart3 className="w-3 h-3" />Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs gap-1 data-[state=active]:bg-[#1356E2]/10 data-[state=active]:text-[#E84B1C]"><Sparkles className="w-3 h-3" />Timeline</TabsTrigger>
          <TabsTrigger value="dados" className="text-xs gap-1"><FileText className="w-3 h-3" />Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="origem" className="text-xs gap-1"><GitBranch className="w-3 h-3" />Origem & Captação</TabsTrigger>
          <TabsTrigger value="comercial" className="text-xs gap-1"><Briefcase className="w-3 h-3" />Comercial</TabsTrigger>
          <TabsTrigger value="lead-ia" className="text-xs gap-1"><Brain className="w-3 h-3" />Lead & IA</TabsTrigger>
          {isGatewayWithCollections && (
            <TabsTrigger value="gateway" className="text-xs gap-1 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"><Inbox className="w-3 h-3" />Coletas Gateway ({gatewayCollections.length})</TabsTrigger>
          )}
          <TabsTrigger value="documentos" className="text-xs gap-1"><FileCheck className="w-3 h-3" />Documentos</TabsTrigger>
          <TabsTrigger value="pendencias" className="text-xs gap-1"><ClipboardList className="w-3 h-3" />Pendências</TabsTrigger>
          <TabsTrigger value="representantes" className="text-xs gap-1"><UserCheck className="w-3 h-3" />Representantes</TabsTrigger>
          <TabsTrigger value="proposta" className="text-xs gap-1"><FileText className="w-3 h-3" />Propostas{allProposals.length > 0 ? ` (${allProposals.length})` : ''}</TabsTrigger>
          <TabsTrigger value="contrato" className="text-xs gap-1"><Stamp className="w-3 h-3" />Contratos{allContracts.length > 0 ? ` (${allContracts.length})` : ''}</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs gap-1"><Shield className="w-3 h-3" />Compliance</TabsTrigger>
          {latestCase?.framework_version === 'v5.2' && (
            <TabsTrigger value="v5_2" className="text-xs gap-1 data-[state=active]:bg-[#1356E2]/10 data-[state=active]:text-[#E84B1C]">
              <Rocket className="w-3 h-3" />V5.2
            </TabsTrigger>
          )}
          <TabsTrigger value="regulatory" className="text-xs gap-1"><Shield className="w-3 h-3" />Regulatório</TabsTrigger>
          <TabsTrigger value="enrichment" className="text-xs gap-1"><Database className="w-3 h-3" />BDC / CAF{(validations.length + integrationLogs.length) > 0 ? ` (${validations.length + integrationLogs.length})` : ''}</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs gap-1"><History className="w-3 h-3" />Histórico{auditLogs.length > 0 ? ` (${auditLogs.length})` : ''}</TabsTrigger>
          <TabsTrigger value="auditoria" className="text-xs gap-1"><ShieldCheck className="w-3 h-3" />Auditoria LGPD</TabsTrigger>
          <TabsTrigger value="parceiros" className="text-xs gap-1"><Handshake className="w-3 h-3" />Parceiros</TabsTrigger>
          {!merchant.isSubseller && (
            <TabsTrigger value="subsellers" className="text-xs gap-1"><Users className="w-3 h-3" />Subsellers ({subsellers.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <CadastroOverviewTab merchant={merchant} latestCase={latestCase} lead={lead} latestProposal={latestProposal} latestContract={latestContract} latestScore={latestScore} documents={documents} subsellers={subsellers} allProposals={allProposals} allContracts={allContracts} allLeads={allLeads} allCases={cases} />
        </TabsContent>
        <TabsContent value="timeline">
          <CadastroTimelineUnificadaTab
            merchant={merchant}
            allLeads={allLeads}
            allProposals={allProposals}
            allContracts={allContracts}
            allCases={cases}
            documents={documents}
            validations={validations}
            integrationLogs={integrationLogs}
            scores={scores}
            auditLogs={auditLogs}
            findings={timelineExtras.findings}
            feedbacks={timelineExtras.feedbacks}
            monitoringEvents={timelineExtras.monitoringEvents}
            pendencies={timelineExtras.pendencies}
            subsellers={subsellers}
          />
        </TabsContent>
        <TabsContent value="dados">
          <div className="space-y-4">
            <CadastroDadosTab merchant={merchant} lead={lead} responses={responses} latestCase={latestCase} onMerchantUpdated={handleMerchantUpdated} />
            <CadastroBankDataBlock allCaseIds={allCaseIds} merchantId={merchantId} />
          </div>
        </TabsContent>
        <TabsContent value="origem">
          <CadastroOrigemTab merchant={merchant} allLeads={allLeads} />
        </TabsContent>
        <TabsContent value="comercial">
          <CadastroComercialTab lead={lead} allLeads={allLeads} />
        </TabsContent>
        {isGatewayWithCollections && (
          <TabsContent value="gateway">
            <CadastroGatewayCollectionsTab merchant={merchant} />
          </TabsContent>
        )}
        <TabsContent value="lead-ia">
          <CadastroLeadIATab lead={lead} latestCase={latestCase} />
        </TabsContent>
        <TabsContent value="documentos">
          <div className="space-y-4">
            <CadastroDocumentJustificationsBlock documents={documents} />
            <CadastroDocumentosUnificadoTab
              documents={documents}
              latestCase={latestCase}
              merchantEmail={merchant?.email}
              merchant={merchant}
              integrationLogs={integrationLogs}
              contracts={allContracts}
              allCases={cases}
            />
          </div>
        </TabsContent>
        <TabsContent value="pendencias">
          <CadastroPendenciasTab allCaseIds={allCaseIds} />
        </TabsContent>
        <TabsContent value="representantes">
          <CadastroRepresentantesTab latestCase={latestCase} />
        </TabsContent>
        <TabsContent value="proposta">
          <CadastroAllProposalsTab proposals={allProposals} lead={lead} allLeads={allLeads} merchant={merchant} />
        </TabsContent>
        <TabsContent value="contrato">
          <CadastroContratoTab contracts={allContracts} />
        </TabsContent>
        <TabsContent value="compliance">
          <div className="space-y-4">
            <CadastroComplianceTab score={latestScore} latestCase={latestCase} allScores={scores} allCases={cases} allCaseIds={allCaseIds} integrationLogs={integrationLogs} validations={validations} />
            <CadastroMonitoringExtendedBlock allCaseIds={allCaseIds} merchantId={merchantId} merchantDoc={merchant?.cpfCnpj} />
            <CadastroMonitoringEventsBlock document={merchant?.cpfCnpj} onboardingCaseId={latestCase?.id} merchantId={merchantId} />
            <CadastroRevalidationBlock merchantId={merchantId} />
            <CadastroSessionDraftsBlock merchantEmail={merchant?.email} />
          </div>
        </TabsContent>
        {latestCase?.framework_version === 'v5.2' && (
          <TabsContent value="v5_2">
            <CadastroV5_2Tab
              latestCase={latestCase}
              latestScore={latestScore}
              onRefetch={() => {
                queryClient.invalidateQueries({ queryKey: ['cadastro-scores', allCaseIds] });
                queryClient.invalidateQueries({ queryKey: ['cadastro-cases-merchant', merchantId] });
              }}
            />
          </TabsContent>
        )}
        <TabsContent value="regulatory">
          <div className="space-y-4">
            <CadastroRegulatoryPanel merchant={merchant} latestCase={latestCase} validations={validations} integrationLogs={integrationLogs} score={latestScore} />
            <CadastroMonitoringEventsBlock document={merchant?.cpfCnpj} onboardingCaseId={latestCase?.id} merchantId={merchantId} />
          </div>
        </TabsContent>
        <TabsContent value="enrichment">
          <div className="space-y-4">
            <EnterpriseExecutiveSummary
              onboardingCase={latestCase}
              merchant={merchant}
              complianceScore={latestScore}
              validations={validations}
              integrationLogs={integrationLogs}
            />
            <CadastroEnrichmentTab validations={validations} integrationLogs={integrationLogs} />
          </div>
        </TabsContent>
        <TabsContent value="historico">
          <CadastroHistoricoTab auditLogs={auditLogs} />
        </TabsContent>
        <TabsContent value="auditoria">
          <CadastroAuditoriaTab
            merchantId={merchantId}
            allCaseIds={allCaseIds}
            allProposalIds={allProposals.map(p => p.id)}
          />
        </TabsContent>
        <TabsContent value="parceiros">
          {latestCase?.id ? (
            <>
              <CasePartnerAssignments onboardingCaseId={latestCase.id} />
              <PartnerActivitiesForCase onboardingCaseId={latestCase.id} />
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-sm text-slate-500">
              Este merchant ainda não possui um caso de onboarding para ser atribuído a parceiros.
            </div>
          )}
        </TabsContent>
        {!merchant.isSubseller && (
          <TabsContent value="subsellers">
            <CadastroSubsellersTab subsellers={subsellers} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}