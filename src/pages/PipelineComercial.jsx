import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search, Eye, Pencil, BarChart3, Loader2, X,
  DollarSign, TrendingUp, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import LeadKanbanCard from '../components/pipeline/LeadKanbanCard';
import PipelineMetrics from '../components/pipeline/PipelineMetrics';
import PipelineAgingAlerts from '../components/pipeline/PipelineAgingAlerts';
import PipelineConversionChart from '../components/pipeline/PipelineConversionChart';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const formatMoeda = (val) => {
  if (!val) return 'R$ 0';
  return `R$ ${val.toLocaleString('pt-BR')}`;
};

export default function PipelineComercial() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');

  // Pipeline simplificado: cliente NÃO assina contrato — proposta aceita = NEGÓCIO FECHADO.
  // Propostas expiradas (sem aceite) voltam para "Proposta Enviada" para reenvio.
  const COLUNAS = [
    { id: 'leads_completo', name: t('pipeline_page.col_leads_complete'), color: '#6B7280', statuses: ['questionario_preenchido', 'analisado_priscila'], questionnaireType: 'FULL' },
    { id: 'em_contato_simplificado', name: t('pipeline_page.col_in_contact'), color: '#F59E0B', statuses: ['em_contato_comercial'], questionnaireType: 'ANY' },
    { id: 'proposta_enviada', name: t('pipeline_page.col_proposal_sent'), color: '#3B82F6', statuses: ['proposta_enviada'], specialRule: 'PROPOSAL_OPEN' },
    { id: 'negocio_fechado', name: 'Negócio Fechado (Proposta Aceita)', color: '#8B5CF6', statuses: ['proposta_aceita'], specialRule: 'DEAL_CLOSED' },
    { id: 'compliance_kyc', name: t('pipeline_page.col_compliance'), color: '#10B981', statuses: ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'] },
    { id: 'ativado', name: 'Ativado (Operando)', color: '#047857', statuses: ['ativado'] },
    { id: 'perdido', name: t('pipeline_page.col_lost'), color: '#EF4444', statuses: ['perdido', 'proposta_recusada'] },
  ];

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['pipeline-contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 500)
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['pipeline-proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 500)
  });

  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['pipeline-onboarding-links'],
    queryFn: () => base44.entities.OnboardingLink.list('-created_date', 500)
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['pipeline-merchants'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500)
  });

  const { data: onboardingCases = [] } = useQuery({
    queryKey: ['pipeline-onboarding-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500)
  });

  // Build enrichment maps: leadId -> has contract, leadId -> has proposal
  // Multi-strategy matching with aggressive name/CNPJ matching
  const leadContractMap = useMemo(() => {
    const map = {};
    const normalizeCnpj = (v) => (v || '').replace(/[.\-\/\s]/g, '');
    const isValidCnpj = (v) => /^\d{11,14}$/.test(v);
    const normalizeName = (v) => (v || '').toLowerCase().trim().replace(/\s+/g, ' ');

    // Build merchant lookup maps
    const merchantById = {};
    const merchantCnpjMap = {}; // merchantId -> valid CNPJ
    merchants.forEach(m => {
      merchantById[m.id] = m;
      const cnpj = normalizeCnpj(m.cpfCnpj);
      if (cnpj && isValidCnpj(cnpj)) merchantCnpjMap[m.id] = cnpj;
    });

    // Build OnboardingCase maps
    const caseMerchantMap = {}; // caseId -> merchantId
    onboardingCases.forEach(c => { if (c.merchantId) caseMerchantMap[c.id] = c.merchantId; });

    // Build merchantId -> contract map
    const merchantToContract = {};
    contracts.forEach(c => {
      if (c.merchantId) merchantToContract[c.merchantId] = c;
    });

    // Build name-based indexes for contracts (clientName + merchant names)
    const contractByName = {}; // normalized name -> contract
    const contractByCnpj = {}; // normalized CNPJ -> contract
    contracts.forEach(c => {
      // Index by clientName
      const cName = normalizeName(c.clientName);
      if (cName && cName.length > 3) contractByName[cName] = c;
      
      // Index by merchant name/companyName
      if (c.merchantId && merchantById[c.merchantId]) {
        const m = merchantById[c.merchantId];
        const mName = normalizeName(m.fullName);
        const mCompany = normalizeName(m.companyName);
        if (mName && mName.length > 3) contractByName[mName] = c;
        if (mCompany && mCompany.length > 3) contractByName[mCompany] = c;
      }
      
      // Index by valid CNPJ (from contract or merchant)
      const cCnpj = normalizeCnpj(c.clientCnpj);
      if (cCnpj && isValidCnpj(cCnpj)) contractByCnpj[cCnpj] = c;
      if (c.merchantId && merchantCnpjMap[c.merchantId]) {
        contractByCnpj[merchantCnpjMap[c.merchantId]] = c;
      }
    });

    // Strategy 1: direct leadId linkage
    contracts.forEach(c => {
      if (c.leadId) map[c.leadId] = c;
    });

    // Strategy 2: Lead -> OnboardingCase -> Merchant -> Contract
    leads.forEach(l => {
      if (map[l.id]) return;
      if (l.onboardingCaseId) {
        const merchantId = caseMerchantMap[l.onboardingCaseId];
        if (merchantId && merchantToContract[merchantId]) {
          map[l.id] = merchantToContract[merchantId];
          return;
        }
      }
    });

    // Strategy 3: Match by valid CNPJ
    leads.forEach(l => {
      if (map[l.id]) return;
      const cnpj = normalizeCnpj(l.cpfCnpj);
      if (cnpj && isValidCnpj(cnpj) && contractByCnpj[cnpj]) {
        map[l.id] = contractByCnpj[cnpj];
        return;
      }
    });

    // Strategy 4: Match by name (fullName, companyName) - fuzzy contains
    leads.forEach(l => {
      if (map[l.id]) return;
      const leadFullName = normalizeName(l.fullName);
      const leadCompany = normalizeName(l.companyName);
      
      // Exact name match
      if (leadFullName && contractByName[leadFullName]) { map[l.id] = contractByName[leadFullName]; return; }
      if (leadCompany && contractByName[leadCompany]) { map[l.id] = contractByName[leadCompany]; return; }
      
      // Partial name match (lead name contains contract name or vice versa)
      for (const [cName, contract] of Object.entries(contractByName)) {
        if (leadFullName && (leadFullName.includes(cName) || cName.includes(leadFullName))) {
          map[l.id] = contract; return;
        }
        if (leadCompany && (leadCompany.includes(cName) || cName.includes(leadCompany))) {
          map[l.id] = contract; return;
        }
      }
    });

    return map;
  }, [contracts, leads, merchants, onboardingCases]);

  const leadProposalMap = useMemo(() => {
    const map = {};
    proposals.forEach(p => {
      if (p.leadId && p.isCurrentVersion !== false) {
        if (!map[p.leadId] || new Date(p.created_date) > new Date(map[p.leadId].created_date)) {
          map[p.leadId] = p;
        }
      }
    });
    return map;
  }, [proposals]);

  // Map linkCode -> linkType for quick lookup
  const linkTypeMap = React.useMemo(() => {
    const map = {};
    onboardingLinks.forEach(link => {
      if (link.uniqueCode) map[link.uniqueCode] = link.linkType;
    });
    return map;
  }, [onboardingLinks]);

  // ─── Virtual Leads: Merchants with compliance/proposals/contracts but NO Lead ───
  const virtualLeads = useMemo(() => {
    const normalizeName = (v) => (v || '').toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Build set of merchantIds/names already linked to a real Lead
    const linkedMerchantIds = new Set();
    const linkedMerchantNames = new Set();
    leads.forEach(l => {
      if (l.onboardingCaseId) {
        const oc = onboardingCases.find(c => c.id === l.onboardingCaseId);
        if (oc?.merchantId) linkedMerchantIds.add(oc.merchantId);
      }
      const n1 = normalizeName(l.fullName);
      const n2 = normalizeName(l.companyName);
      if (n1 && n1.length > 3) linkedMerchantNames.add(n1);
      if (n2 && n2.length > 3) linkedMerchantNames.add(n2);
    });

    // Build orphan proposals (no leadId) indexed by name
    const orphanProposalsByName = {};
    proposals.forEach(p => {
      if ((!p.leadId || p.leadId === '') && p.isCurrentVersion !== false) {
        const pName = normalizeName(p.clienteNome);
        if (pName && pName.length > 3) orphanProposalsByName[pName] = p;
      }
    });

    // Maps by merchantId
    const contractsByMerchantId = {};
    contracts.forEach(c => { if (c.merchantId) contractsByMerchantId[c.merchantId] = c; });
    const casesByMerchantId = {};
    onboardingCases.forEach(c => { if (c.merchantId && !c.isSubsellerCase) casesByMerchantId[c.merchantId] = c; });

    const result = [];
    merchants.forEach(m => {
      if (m.isSubseller) return;
      if (!m.fullName && !m.companyName) return;
      if (linkedMerchantIds.has(m.id)) return;
      
      const mName = normalizeName(m.fullName);
      const mCompany = normalizeName(m.companyName);
      
      // Check if any lead already matches by name (exact or partial)
      let nameMatched = false;
      for (const ln of linkedMerchantNames) {
        if (mName && ln && (mName.includes(ln) || ln.includes(mName))) { nameMatched = true; break; }
        if (mCompany && ln && (mCompany.includes(ln) || ln.includes(mCompany))) { nameMatched = true; break; }
      }
      if (nameMatched) return;

      const onbCase = casesByMerchantId[m.id];
      const contract = contractsByMerchantId[m.id];
      // Match orphan proposal by name (partial)
      let proposal = null;
      for (const [pName, p] of Object.entries(orphanProposalsByName)) {
        if (mName && (mName.includes(pName) || pName.includes(mName))) { proposal = p; break; }
        if (mCompany && (mCompany.includes(pName) || pName.includes(mCompany))) { proposal = p; break; }
      }

      if (!onbCase && !contract && !proposal) return;

      // Determine synthetic status
      let syntheticStatus = 'kyc_iniciado';
      if (onbCase) {
        if (onbCase.status === 'Aprovado') syntheticStatus = 'kyc_aprovado';
        else if (onbCase.status === 'Manual') syntheticStatus = 'kyc_revisao_manual';
      }
      if (proposal) {
        if (proposal.status === 'aceita') syntheticStatus = 'proposta_aceita';
        else if (['enviada', 'visualizada'].includes(proposal.status)) syntheticStatus = 'proposta_enviada';
      }
      if (contract) syntheticStatus = 'ativado';

      result.push({
        id: `virtual_${m.id}`,
        created_date: m.created_date,
        updated_date: m.updated_date,
        fullName: m.fullName || m.companyName || '',
        companyName: m.companyName || m.fullName || '',
        email: typeof m.email === 'string' && m.email.includes('@') ? m.email : '',
        phone: m.phone || '',
        cpfCnpj: '',
        status: syntheticStatus,
        tpvMensal: 0, ticketMedio: 0, transacoesMes: 0, mcc: '',
        onboardingCaseId: onbCase?.id || null,
        priscilaRiskLevel: null, leadQualifierLevel: null,
        lastInteractionDate: m.updated_date,
        _isVirtual: true, _merchantId: m.id,
        _contract: contract || null, _proposal: proposal || null, _onboardingCase: onbCase || null,
      });
    });
    return result;
  }, [merchants, leads, onboardingCases, contracts, proposals]);

  const moveMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }) => {
      let performedBy = 'admin';
      try { performedBy = (await base44.auth.me())?.email || 'admin'; } catch (_) {}
      await base44.entities.Lead.update(leadId, {
        status: newStatus,
        lastInteractionDate: new Date().toISOString()
      });
      await base44.entities.LeadActivity.create({
        leadId,
        activityType: 'status_alterado_manual',
        description: `Lead movido para: ${newStatus}`,
        performedBy,
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      toast.success(t('pipeline_page.lead_moved'));
    }
  });

  const handleCardAction = async (action, lead) => {
    if (lead._isVirtual) return; // Virtual leads can't be modified
    if (action === 'contact') {
      let performedBy = 'admin';
      try { performedBy = (await base44.auth.me())?.email || 'admin'; } catch (_) {}
      await base44.entities.Lead.update(lead.id, { status: 'em_contato_comercial', lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({ leadId: lead.id, activityType: 'contato_iniciado', description: 'Contato iniciado via pipeline', performedBy, activityDate: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      toast.success(t('pipeline_page.contact_started'));
    }
  };

  // Filter by period — combine real leads + virtual leads
  const filteredLeads = useMemo(() => {
    let realLeads = [...leads];
    let virtuals = [...virtualLeads];
    const filterFn = (l) => {
      if (search) {
        const s = search.toLowerCase();
        if (!(
          (l.fullName || '').toLowerCase().includes(s) ||
          (l.cpfCnpj || '').includes(s) ||
          (l.companyName || '').toLowerCase().includes(s)
        )) return false;
      }
      if (period !== 'all') {
        const days = { week: 7, month: 30, '3months': 90, '6months': 180, '12months': 365 }[period] || 30;
        if (!moment(l.created_date).isAfter(moment().subtract(days, 'days'))) return false;
      }
      return true;
    };
    return [...realLeads.filter(filterFn), ...virtuals.filter(filterFn)];
  }, [leads, virtualLeads, search, period]);

  // Enrich leads with contract/proposal data for display
  const enrichedLeads = useMemo(() => {
    return filteredLeads.map(l => {
      if (l._isVirtual) return l;
      return { ...l, _contract: leadContractMap[l.id] || null, _proposal: leadProposalMap[l.id] || null };
    });
  }, [filteredLeads, leadContractMap, leadProposalMap]);

  // Set of lead IDs that have accepted proposals (any version) — fonte de verdade para "fechado"
  const leadsWithAcceptedProposal = useMemo(() => {
    const set = new Set();
    proposals.forEach(p => {
      if (p.leadId && p.status === 'aceita') set.add(p.leadId);
    });
    return set;
  }, [proposals]);

  // Set of lead IDs that have an OPEN proposal (enviada/visualizada/contraproposta/expirada)
  // Expiradas voltam para "Proposta Enviada" para reenvio (não vão para Perdido).
  const leadsWithOpenProposal = useMemo(() => {
    const OPEN_STATUSES = new Set(['enviada', 'visualizada', 'contraproposta', 'expirada']);
    const set = new Set();
    proposals.forEach(p => {
      if (p.leadId && OPEN_STATUSES.has(p.status)) set.add(p.leadId);
    });
    return set;
  }, [proposals]);

  // "Negócio Fechado" = proposta aceita (cliente NÃO assina contrato — regra v2026-05-10).
  // Inclui: lead.status='proposta_aceita' OU qualquer proposta do lead com status='aceita'.
  // Não considera mais contratos (cliente não assina mais).
  const dealClosedIds = useMemo(() => {
    const set = new Set();
    enrichedLeads.forEach(l => {
      if (l.status === 'proposta_aceita') { set.add(l.id); return; }
      if (leadsWithAcceptedProposal.has(l.id)) { set.add(l.id); return; }
      if (l._proposal?.status === 'aceita') { set.add(l.id); return; }
    });
    return set;
  }, [enrichedLeads, leadsWithAcceptedProposal]);

  // Group leads by column
  const columns = useMemo(() => {
    return COLUNAS.map(col => ({
      ...col,
      leads: enrichedLeads.filter(l => {
        // "Negócio Fechado": proposta aceita (sem contrato — cliente não assina mais)
        if (col.specialRule === 'DEAL_CLOSED') return dealClosedIds.has(l.id);
        // Skip leads already in closed column from any other column
        if (dealClosedIds.has(l.id)) return false;
        // "Proposta Enviada" inclui qualquer lead com proposta aberta (enviada/visualizada/contraproposta/expirada)
        // mesmo que o Lead.status ainda esteja em 'em_contato_comercial' por falta de sync.
        if (col.specialRule === 'PROPOSAL_OPEN') {
          if (col.statuses.includes(l.status)) return true;
          if (leadsWithOpenProposal.has(l.id)) return true;
          if (l._proposal && ['enviada', 'visualizada', 'contraproposta', 'expirada'].includes(l._proposal.status)) return true;
          return false;
        }
        if (!col.statuses.includes(l.status)) return false;
        if (col.questionnaireType === 'FULL') {
          const lt = l.onboardingLinkCode ? linkTypeMap[l.onboardingLinkCode] : 'LEAD_QUESTIONNAIRE';
          return lt !== 'LEAD_SIMPLIFICADO';
        }
        return true;
      })
    }));
  }, [enrichedLeads, linkTypeMap, dealClosedIds, leadsWithOpenProposal]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const destColId = result.destination.droppableId;
    const leadId = result.draggableId;
    if (leadId.startsWith('virtual_')) return;
    const destCol = COLUNAS.find(c => c.id === destColId);
    if (!destCol || !destCol.statuses[0]) return;

    const newStatus = destCol.statuses[0];
    moveMutation.mutate({ leadId, newStatus });
  };

  // Pipeline metrics
  const totalTPV = filteredLeads.reduce((sum, l) => sum + (l.tpvMensal || 0), 0);
  const closedTPV = filteredLeads.filter(l => dealClosedIds.has(l.id)).reduce((sum, l) => sum + (l.tpvMensal || 0), 0);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <BarChart3 className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('pipeline_page.title')}</h1>
              <div className="flex gap-3 text-xs text-white/60 mt-1.5 flex-wrap">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{t('pipeline_page.leads_count', { count: filteredLeads.length })}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-1"><DollarSign className="w-3 h-3" /> TPV Pipeline: {formatMoeda(totalTPV)}</span>
                <span className="bg-[#2bc196]/20 text-[#5cf7cf] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium"><TrendingUp className="w-3 h-3" /> TPV Fechado: {formatMoeda(closedTPV)}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">Fechados: {dealClosedIds.size}</span>
              </div>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-9 border-white/20 text-white bg-white/10 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('pipeline_page.this_week')}</SelectItem>
              <SelectItem value="month">{t('pipeline_page.this_month')}</SelectItem>
              <SelectItem value="3months">{t('pipeline_page.three_months')}</SelectItem>
              <SelectItem value="6months">{t('pipeline_page.six_months')}</SelectItem>
              <SelectItem value="12months">{t('pipeline_page.twelve_months')}</SelectItem>
              <SelectItem value="all">{t('pipeline_page.lifetime')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics */}
      <PipelineMetrics leads={filteredLeads} proposals={proposals} dealClosedIds={dealClosedIds} />

      {/* Conversion chart + Aging alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PipelineConversionChart leads={filteredLeads} contracts={contracts} merchants={merchants} dealClosedIds={dealClosedIds} />
        <PipelineAgingAlerts leads={filteredLeads} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('pipeline_page.search_placeholder')} className="pl-10 h-9" />
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0">
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {columns.map(col => {
            const colTPVMensal = col.leads.reduce((s, l) => s + (l.tpvMensal || 0), 0);
            const colTPVAnual = colTPVMensal * 12;
            const colReceitaMensal = colTPVMensal * 0.025;
            const colReceitaAnual = colReceitaMensal * 12;
            return (
              <div key={col.id} className="flex-shrink-0 w-[260px]">
              {/* Column header */}
              <div className="mb-3 bg-white rounded-2xl p-3 border border-[#002443]/5 shadow-sm">
                <div className="h-1 rounded-full mb-2" style={{ backgroundColor: col.color }} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#002443]">{col.name}</span>
                  <Badge className="text-[10px] bg-[#002443]/5 text-[#002443] border-0">{col.leads.length}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] bg-[#f4f4f4] rounded-xl p-2 border border-[#002443]/5">
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">{t('pipeline_page.tpv_month')}</span>
                      <p className="font-bold text-[var(--pagsmile-blue)]">{formatMoeda(colTPVMensal)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">{t('pipeline_page.tpv_year')}</span>
                      <p className="font-bold text-[var(--pagsmile-blue)]">{formatMoeda(colTPVAnual)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">{t('pipeline_page.revenue_month')}</span>
                      <p className="font-bold text-[var(--pagsmile-green)]">{formatMoeda(colReceitaMensal)}</p>
                    </div>
                    <div>
                      <span className="text-[var(--pagsmile-blue)]/40">{t('pipeline_page.revenue_year')}</span>
                      <p className="font-bold text-[var(--pagsmile-green)]">{formatMoeda(colReceitaAnual)}</p>
                    </div>
                  </div>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[100px] rounded-xl p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[#2bc196]/5 border-2 border-dashed border-[#2bc196]/30' : 'bg-[#f4f4f4]/50'
                      }`}
                    >
                      {col.leads.map((lead, idx) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx} isDragDisabled={!!lead._isVirtual}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-[#002443]/5 p-3 transition-all ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-[#2bc196]/30 -rotate-1' : 'hover:shadow-md hover:-translate-y-0.5'
                              }`}
                            >
                              <LeadKanbanCard lead={lead} onAction={handleCardAction} contract={lead._contract} proposal={lead._proposal} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {col.leads.length === 0 && (
                        <p className="text-xs text-center text-[var(--pagsmile-blue)]/40 py-4">{t('pipeline_page.no_leads')}</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}