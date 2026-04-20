import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Shield, FileCheck, FileEdit, Users } from 'lucide-react';
import ComplianceStatsCards from '@/components/compliance/ComplianceStatsCards';
import ComplianceCaseFilters from '@/components/compliance/ComplianceCaseFilters';
import ComplianceCasesCardsGrid from '@/components/compliance/ComplianceCasesCardsGrid';
import BulkActionsBar from '@/components/compliance/BulkActionsBar';
import DraftsTab from '@/components/compliance/DraftsTab';
import SubsellerCasesTab from '@/components/compliance/SubsellerCasesTab';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function QuestionariosRecebidos() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [merchantTypeFilter, setMerchantTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [analystFilter, setAnalystFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [sortField, setSortField] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 15;

  // ── Data Fetching ──
  const { data: onboardingCases = [], isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: async () => {
      const all = await base44.entities.OnboardingCase.list('-created_date', 500);
      // Excluir casos de subseller — esses aparecem apenas na aba Subsellers
      return all.filter(c => !c.isSubsellerCase);
    }
  });

  const { data: complianceScores = [] } = useQuery({
    queryKey: ['complianceScores'],
    queryFn: () => base44.entities.ComplianceScore.list()
  });

  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: questionnaireTemplates = [] } = useQuery({
    queryKey: ['questionnaireTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.list()
  });

  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['onboardingLinks'],
    queryFn: () => base44.entities.OnboardingLink.list()
  });

  const { data: introducers = [] } = useQuery({
    queryKey: ['introducers'],
    queryFn: () => base44.entities.Introducer.list()
  });

  // ── Data Maps ──
  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  const scoresMap = React.useMemo(() => {
    const map = {};
    // Keep only the most recently updated score per case
    complianceScores.forEach(s => {
      const existing = map[s.onboarding_case_id];
      if (!existing || new Date(s.updated_date) > new Date(existing.updated_date)) {
        map[s.onboarding_case_id] = s;
      }
    });
    return map;
  }, [complianceScores]);

  const templatesMap = React.useMemo(() => {
    const map = {};
    questionnaireTemplates.forEach(t => { map[t.id] = t; });
    return map;
  }, [questionnaireTemplates]);

  const linksMap = React.useMemo(() => {
    const map = {};
    onboardingLinks.forEach(l => { map[l.uniqueCode] = l; });
    return map;
  }, [onboardingLinks]);

  const introducerMap = React.useMemo(() => {
    const map = {};
    introducers.forEach(i => { map[i.id] = i; });
    return map;
  }, [introducers]);

  const casesMap = React.useMemo(() => {
    const map = {};
    onboardingCases.forEach(c => { map[c.id] = c; });
    return map;
  }, [onboardingCases]);

  // ── Helpers ──
  const getCaseModel = (c) => {
    // Prioridade 1: modelo do template V4 (fonte de verdade)
    if (c.questionnaireTemplateId && templatesMap[c.questionnaireTemplateId]) {
      return templatesMap[c.questionnaireTemplateId].model || 'desconhecido';
    }
    // Prioridade 2: link de onboarding (legado)
    if (c.onboardingLinkCode && linksMap[c.onboardingLinkCode]) {
      const link = linksMap[c.onboardingLinkCode];
      if (link.complianceType === 'LITE') return 'lite';
      if (link.complianceType === 'PIX') return 'pix';
    }
    return 'desconhecido';
  };

  // ── Stats ──
  const stats = React.useMemo(() => {
    const now = new Date();
    return {
      total: onboardingCases.length,
      pendente: onboardingCases.filter(c => c.status === 'Pendente').length,
      processando: onboardingCases.filter(c => c.status === 'Em Processamento').length,
      manual: onboardingCases.filter(c => c.status === 'Manual').length,
      aprovado: onboardingCases.filter(c => c.status === 'Aprovado').length,
      recusado: onboardingCases.filter(c => c.status === 'Recusado').length,
      docsSolicitados: onboardingCases.filter(c => c.status === 'Docs Solicitados').length,
      slaAtRisk: onboardingCases.filter(c => c.slaDeadline && new Date(c.slaDeadline) < now && c.status !== 'Aprovado' && c.status !== 'Recusado').length,
    };
  }, [onboardingCases]);

  const analysts = React.useMemo(() => {
    return [...new Set(onboardingCases.map(c => c.assignedAnalystName).filter(Boolean))];
  }, [onboardingCases]);

  // ── Filtering & Sorting ──
  const filteredCases = React.useMemo(() => {
    return onboardingCases.filter(c => {
      const merchant = merchantMap[c.merchantId];
      const matchesSearch = !searchTerm || 
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.cpfCnpj?.includes(searchTerm) ||
        merchant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesMerchantType = merchantTypeFilter === 'all' || merchant?.type === merchantTypeFilter;
      const matchesAnalyst = analystFilter === 'all' || c.assignedAnalystName === analystFilter;
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      const caseModel = getCaseModel(c);
      const matchesModel = modelFilter === 'all' || caseModel === modelFilter;
      let matchesScore = true;
      if (scoreFilter !== 'all') {
        const v4 = c.riskScoreV4;
        if (v4 != null) {
          // V4: 0=best, 849=worst. high risk = high score
          if (scoreFilter === 'high') matchesScore = v4 >= 400;
          else if (scoreFilter === 'medium') matchesScore = v4 >= 150 && v4 < 400;
          else if (scoreFilter === 'low') matchesScore = v4 < 150;
        } else {
          matchesScore = false;
        }
      }
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const caseDate = new Date(c.created_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') matchesDate = caseDate >= today;
        else if (dateFilter === 'week') matchesDate = caseDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (dateFilter === 'month') matchesDate = caseDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      }
      return matchesSearch && matchesStatus && matchesMerchantType && matchesScore && matchesDate && matchesAnalyst && matchesPriority && matchesModel;
    }).sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (sortField === 'merchant') {
        aValue = merchantMap[a.merchantId]?.fullName || '';
        bValue = merchantMap[b.merchantId]?.fullName || '';
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [onboardingCases, merchantMap, linksMap, templatesMap, searchTerm, statusFilter, merchantTypeFilter, scoreFilter, dateFilter, analystFilter, priorityFilter, modelFilter, sortField, sortOrder]);

  // ── Pagination ──
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Export ──
  const handleExport = () => {
    const csvContent = [
      ['ID', 'Merchant', 'CNPJ/CPF', 'Tipo', 'Status', 'Score Helena', 'Decisão IA', 'Data Submissão'].join(','),
      ...filteredCases.map(c => {
        const merchant = merchantMap[c.merchantId];
        return [
          c.id, `"${merchant?.fullName || 'N/A'}"`, merchant?.cpfCnpj || '', merchant?.type || '',
          c.status, c.riskScore || '', c.iaDecision || '',
          c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : ''
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `questionarios_compliance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setStatusFilter('all'); setMerchantTypeFilter('all'); setScoreFilter('all');
    setDateFilter('all'); setAnalystFilter('all'); setPriorityFilter('all'); setModelFilter('all');
  };

  const isLoadingAll = casesLoading || merchantsLoading;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10"><Shield className="w-6 h-6 text-[#5cf7cf]" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('qr.title')}</h1>
              <p className="text-white/60 text-sm mt-1">{t('qr.subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'received' && (
              <>
                <Button variant="outline" onClick={handleExport} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
                  <Download className="w-4 h-4 mr-2" /> {t('qr.export')}
                </Button>
                <Button variant="outline" onClick={() => refetchCases()} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
                  <RefreshCw className="w-4 h-4 mr-2" /> {t('qr.refresh')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#002443]/10 p-1 rounded-xl">
          <TabsTrigger value="received" className="rounded-lg data-[state=active]:bg-[#002443] data-[state=active]:text-white gap-2 px-4">
            <FileCheck className="w-4 h-4" /> {t('qr.received')}
            <Badge className="bg-[#2bc196]/20 text-[#002443] text-xs ml-1 border-0">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="rounded-lg data-[state=active]:bg-[#002443] data-[state=active]:text-white gap-2 px-4">
            <FileEdit className="w-4 h-4" /> {t('qr.drafts')}
          </TabsTrigger>
          <TabsTrigger value="subsellers" className="rounded-lg data-[state=active]:bg-[#002443] data-[state=active]:text-white gap-2 px-4">
            <Users className="w-4 h-4" /> Subsellers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-6 mt-4">
          <ComplianceStatsCards stats={stats} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />

          <BulkActionsBar
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            casesMap={casesMap}
            merchantMap={merchantMap}
            onRefresh={refetchCases}
          />

          <ComplianceCaseFilters
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            modelFilter={modelFilter} onModelFilterChange={setModelFilter}
            merchantTypeFilter={merchantTypeFilter} onMerchantTypeFilterChange={setMerchantTypeFilter}
            scoreFilter={scoreFilter} onScoreFilterChange={setScoreFilter}
            dateFilter={dateFilter} onDateFilterChange={setDateFilter}
            analystFilter={analystFilter} onAnalystFilterChange={setAnalystFilter}
            priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter}
            statusFilter={statusFilter} analysts={analysts} onClearFilters={clearFilters}
          />

          <ComplianceCasesCardsGrid
            paginatedCases={paginatedCases} filteredCasesCount={filteredCases.length}
            merchantMap={merchantMap} scoresMap={scoresMap} getCaseModel={getCaseModel}
            selectedRows={selectedRows} setSelectedRows={setSelectedRows}
            expandedRow={expandedRow} setExpandedRow={setExpandedRow}
            currentPage={currentPage} setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage} totalPages={totalPages}
            templatesMap={templatesMap} isLoading={isLoadingAll}
            linksMap={linksMap} introducerMap={introducerMap}
          />
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <DraftsTab />
        </TabsContent>

        <TabsContent value="subsellers" className="mt-4">
          <SubsellerCasesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}