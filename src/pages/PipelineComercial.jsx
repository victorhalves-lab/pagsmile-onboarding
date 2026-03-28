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

  const COLUNAS = [
    { id: 'leads_completo', name: t('pipeline_page.col_leads_complete'), color: '#6B7280', statuses: ['questionario_preenchido', 'analisado_priscila'], questionnaireType: 'FULL' },
    { id: 'em_contato_simplificado', name: t('pipeline_page.col_in_contact'), color: '#F59E0B', statuses: ['em_contato_comercial'], questionnaireType: 'ANY' },
    { id: 'proposta_enviada', name: t('pipeline_page.col_proposal_sent'), color: '#3B82F6', statuses: ['proposta_enviada'] },
    { id: 'proposta_aceita', name: t('pipeline_page.col_proposal_accepted'), color: '#8B5CF6', statuses: ['proposta_aceita'] },
    { id: 'compliance_kyc', name: t('pipeline_page.col_compliance'), color: '#10B981', statuses: ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'] },
    { id: 'contrato_gerado', name: t('pipeline_page.col_contract'), color: '#059669', statuses: ['ativado'], specialRule: 'HAS_CONTRACT' },
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

  // Build enrichment maps: leadId -> has contract, leadId -> has proposal
  // Contracts may not have leadId — match by CNPJ, client name, or merchant as fallback
  const leadContractMap = useMemo(() => {
    const map = {};
    const normalizeCnpj = (v) => (v || '').replace(/[.\-\/\s]/g, '');
    const normalizeName = (v) => (v || '').toLowerCase().trim();

    // Build merchant CNPJ lookup
    const merchantCnpjMap = {};
    merchants.forEach(m => {
      const cnpj = normalizeCnpj(m.cpfCnpj);
      if (cnpj) merchantCnpjMap[m.id] = cnpj;
    });

    // First pass: direct leadId linkage
    contracts.forEach(c => {
      if (c.leadId) map[c.leadId] = c;
    });

    // Second pass: match by CNPJ, clientName, or merchant CNPJ
    const unleadedContracts = contracts.filter(c => !c.leadId);
    if (unleadedContracts.length > 0) {
      const cnpjToContract = {};
      const nameToContract = {};
      unleadedContracts.forEach(c => {
        // By CNPJ
        const cnpj = normalizeCnpj(c.clientCnpj);
        if (cnpj && cnpj.length >= 11) cnpjToContract[cnpj] = c;
        // By merchant CNPJ
        if (c.merchantId && merchantCnpjMap[c.merchantId]) {
          cnpjToContract[merchantCnpjMap[c.merchantId]] = c;
        }
        // By client name (fallback)
        const name = normalizeName(c.clientName);
        if (name && name.length > 3) nameToContract[name] = c;
      });

      leads.forEach(l => {
        if (map[l.id]) return;
        // Match by CNPJ
        const cnpj = normalizeCnpj(l.cpfCnpj);
        if (cnpj && cnpjToContract[cnpj]) {
          map[l.id] = cnpjToContract[cnpj];
          return;
        }
        // Match by fullName (razão social)
        const name = normalizeName(l.fullName);
        if (name && nameToContract[name]) {
          map[l.id] = nameToContract[name];
          return;
        }
        // Match by companyName
        const company = normalizeName(l.companyName);
        if (company && nameToContract[company]) {
          map[l.id] = nameToContract[company];
        }
      });
    }
    return map;
  }, [contracts, leads, merchants]);

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

  const moveMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }) => {
      await base44.entities.Lead.update(leadId, {
        status: newStatus,
        lastInteractionDate: new Date().toISOString()
      });
      await base44.entities.LeadActivity.create({
        leadId,
        activityType: 'status_alterado_manual',
        description: `Lead movido para: ${newStatus}`,
        performedBy: 'admin',
        activityDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      toast.success(t('pipeline_page.lead_moved'));
    }
  });

  const handleCardAction = async (action, lead) => {
    if (action === 'contact') {
      await base44.entities.Lead.update(lead.id, { status: 'em_contato_comercial', lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({ leadId: lead.id, activityType: 'contato_iniciado', description: 'Contato iniciado via pipeline', performedBy: 'admin', activityDate: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      toast.success(t('pipeline_page.contact_started'));
    }
  };

  // Filter by period
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.cpfCnpj || '').includes(s) ||
        (l.companyName || '').toLowerCase().includes(s)
      );
    }

    if (period !== 'all') {
      const now = moment();
      const map = { week: 7, month: 30, '3months': 90, '6months': 180, '12months': 365 };
      const days = map[period] || 30;
      result = result.filter(l => moment(l.created_date).isAfter(now.clone().subtract(days, 'days')));
    }

    return result;
  }, [leads, search, period]);

  // Enrich leads with contract/proposal data for display
  const enrichedLeads = useMemo(() => {
    return filteredLeads.map(l => ({
      ...l,
      _contract: leadContractMap[l.id] || null,
      _proposal: leadProposalMap[l.id] || null,
    }));
  }, [filteredLeads, leadContractMap, leadProposalMap]);

  // Set of lead IDs that have contracts (for special column logic)
  const leadsWithContract = useMemo(() => new Set(Object.keys(leadContractMap)), [leadContractMap]);

  // Group leads by column (considering questionnaire type and contract presence)
  const columns = useMemo(() => {
    // Pre-compute which leads belong in "Contrato Gerado" (priority column)
    const contractLeadIds = new Set();
    enrichedLeads.forEach(l => {
      if (leadsWithContract.has(l.id) || l.status === 'ativado') {
        contractLeadIds.add(l.id);
      }
    });

    return COLUNAS.map(col => ({
      ...col,
      leads: enrichedLeads.filter(l => {
        // "Contrato Gerado" special rule: lead has a contract OR status is 'ativado'
        if (col.specialRule === 'HAS_CONTRACT') {
          return contractLeadIds.has(l.id);
        }

        // All other columns: skip leads that belong in contract column
        if (contractLeadIds.has(l.id)) return false;

        if (!col.statuses.includes(l.status)) return false;

        // For "Leads (Quest. Completo)" — only from LEAD_QUESTIONNAIRE (or no link = direct)
        if (col.questionnaireType === 'FULL') {
          const lt = l.onboardingLinkCode ? linkTypeMap[l.onboardingLinkCode] : 'LEAD_QUESTIONNAIRE';
          return lt !== 'LEAD_SIMPLIFICADO';
        }

        return true;
      })
    }));
  }, [enrichedLeads, linkTypeMap, leadsWithContract]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const destColId = result.destination.droppableId;
    const leadId = result.draggableId;
    const destCol = COLUNAS.find(c => c.id === destColId);
    if (!destCol) return;

    const newStatus = destCol.statuses[0];
    moveMutation.mutate({ leadId, newStatus });
  };

  // Pipeline metrics
  const totalTPV = filteredLeads.reduce((sum, l) => sum + (l.tpvMensal || 0), 0);

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
              <div className="flex gap-3 text-xs text-white/60 mt-1.5">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{t('pipeline_page.leads_count', { count: filteredLeads.length })}</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md flex items-center gap-1"><DollarSign className="w-3 h-3" /> TPV: {formatMoeda(totalTPV)}</span>
                <span className="bg-[#2bc196]/20 text-[#5cf7cf] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium"><TrendingUp className="w-3 h-3" /> {t('pipeline_page.revenue')}: {formatMoeda(totalTPV * 0.025)}</span>
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
      <PipelineMetrics leads={filteredLeads} contracts={contracts} proposals={proposals} />

      {/* Conversion chart + Aging alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PipelineConversionChart leads={filteredLeads} contracts={contracts} merchants={merchants} />
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
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
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