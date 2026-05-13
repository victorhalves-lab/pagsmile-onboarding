import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Building2, Users, Shield, AlertTriangle, Download, BarChart3, List, GitMerge } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import CadastroDashboard from '@/components/cadastro/CadastroDashboard';
import ExportReportModal from '@/components/cadastro/ExportReportModal';
import CadastroRichRow from '@/components/cadastro/CadastroRichRow';
import MergeDuplicatesModal from '@/components/cadastro/MergeDuplicatesModal';

const ORIGIN_LABELS = {
  'questionario_leads_pagsmile_v5': 'Questionário V5',
  'landing_page': 'Landing Page',
  'proposta_padrao': 'Proposta Padrão',
  'introducer': 'Introducer',
};

export default function Cadastro() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [duplicateOnly, setDuplicateOnly] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [exportOpen, setExportOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const { data: merchants = [], isLoading: loadingMerchants, refetch: refetchMerchants } = useQuery({
    queryKey: ['cadastro-merchants'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cadastro-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 1000),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['cadastro-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 1000),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['cadastro-proposals'],
    queryFn: () => base44.entities.Proposal.filter({ isCurrentVersion: true }, '-created_date', 1000),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['cadastro-contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 1000),
  });

  // Separa sellers e subsellers
  const sellers = useMemo(() => merchants.filter(m => !m.isSubseller), [merchants]);
  const subsellers = useMemo(() => merchants.filter(m => m.isSubseller), [merchants]);

  // Conta subsellers por seller
  const subsellerCountMap = useMemo(() => {
    const map = {};
    subsellers.forEach(s => {
      if (s.parentMerchantId) map[s.parentMerchantId] = (map[s.parentMerchantId] || 0) + 1;
    });
    return map;
  }, [subsellers]);

  // Mapeia merchant → último case
  const caseMap = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      if (!map[c.merchantId] || new Date(c.created_date) > new Date(map[c.merchantId].created_date)) {
        map[c.merchantId] = c;
      }
    });
    return map;
  }, [cases]);

  // Mapeia merchant → lead (via case ou via CNPJ)
  const leadMap = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      if (l.onboardingCaseId) {
        const c = cases.find(c => c.id === l.onboardingCaseId);
        if (c) map[c.merchantId] = l;
      }
      if (l.cpfCnpj) {
        const m = merchants.find(m => m.cpfCnpj === l.cpfCnpj);
        if (m && !map[m.id]) map[m.id] = l;
      }
    });
    return map;
  }, [leads, cases, merchants]);

  // Mapeia merchant → proposta atual (via lead)
  const proposalMap = useMemo(() => {
    const map = {};
    sellers.forEach(m => {
      const lead = leadMap[m.id];
      if (!lead) return;
      const p = proposals.find(p => p.leadId === lead.id);
      if (p) map[m.id] = p;
    });
    return map;
  }, [sellers, leadMap, proposals]);

  // Mapeia merchant → contrato (via CNPJ ou merchantId)
  const contractMap = useMemo(() => {
    const map = {};
    contracts.forEach(c => {
      const targetMerchant = sellers.find(m =>
        m.id === c.merchantId || m.cpfCnpj === c.clientCnpj
      );
      if (targetMerchant && !map[targetMerchant.id]) map[targetMerchant.id] = c;
    });
    return map;
  }, [sellers, contracts]);

  // Detecta duplicatas por CNPJ
  const duplicateCountMap = useMemo(() => {
    const counts = {};
    sellers.forEach(m => {
      const doc = String(m.cpfCnpj || '').replace(/\D/g, '');
      if (doc.length >= 11) counts[doc] = (counts[doc] || 0) + 1;
    });
    const map = {};
    sellers.forEach(m => {
      const doc = String(m.cpfCnpj || '').replace(/\D/g, '');
      map[m.id] = counts[doc] || 1;
    });
    return map;
  }, [sellers]);

  const totalDuplicates = useMemo(() => {
    const seen = new Set();
    let count = 0;
    sellers.forEach(m => {
      const doc = String(m.cpfCnpj || '').replace(/\D/g, '');
      if (doc.length >= 11 && duplicateCountMap[m.id] > 1 && !seen.has(doc)) {
        seen.add(doc);
        count += duplicateCountMap[m.id] - 1;
      }
    });
    return count;
  }, [sellers, duplicateCountMap]);

  // Filtros
  const filtered = useMemo(() => {
    return sellers.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.companyName || '').toLowerCase().includes(q) ||
        (m.cpfCnpj || '').includes(q) ||
        (m.email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || m.onboardingStatus === statusFilter;
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchDup = !duplicateOnly || duplicateCountMap[m.id] > 1;
      return matchSearch && matchStatus && matchType && matchDup;
    });
  }, [sellers, search, statusFilter, typeFilter, duplicateOnly, duplicateCountMap]);

  if (loadingMerchants) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Cadastro de Clientes</h1>
          <p className="text-sm text-[var(--pagsmile-blue)]/60 mt-1">Visão unificada de todos os sellers e subsellers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {totalDuplicates > 0 && (
            <Button
              onClick={() => setMergeOpen(true)}
              variant="outline"
              className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <GitMerge className="w-4 h-4" />
              Mesclar Duplicatas ({totalDuplicates})
            </Button>
          )}
          <Button onClick={() => setExportOpen(true)} variant="outline" className="gap-2 border-[var(--pagsmile-green)]/30 text-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/5">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Alerta de duplicatas no topo */}
      {totalDuplicates > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-900 text-sm">
              {totalDuplicates} cadastro{totalDuplicates > 1 ? 's' : ''} duplicado{totalDuplicates > 1 ? 's' : ''} detectado{totalDuplicates > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-700/80 mt-0.5">
              Clientes com o mesmo CNPJ aparecem mais de uma vez na base. Use "Mesclar Duplicatas" para consolidar.
            </p>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="bg-white border border-[var(--pagsmile-blue)]/8">
          <TabsTrigger value="list" className="gap-1.5 text-xs"><List className="w-3.5 h-3.5" />Lista</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs"><BarChart3 className="w-3.5 h-3.5" />Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <CadastroDashboard merchants={merchants} cases={cases} leads={leads} />
        </TabsContent>

        <TabsContent value="list">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <StatCard icon={Building2} label="Sellers" value={sellers.length} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={Users} label="Subsellers" value={subsellers.length} color="text-purple-600" bg="bg-purple-50" />
            <StatCard icon={Shield} label="Aprovados" value={sellers.filter(s => s.onboardingStatus === 'Aprovado').length} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={AlertTriangle} label="Pendentes" value={sellers.filter(s => ['Pendente', 'Em Análise', 'Manual'].includes(s.onboardingStatus)).length} color="text-amber-600" bg="bg-amber-50" />
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
              <Input
                placeholder="Buscar por nome, CNPJ, e-mail..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Manual">Revisão Manual</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">PF e PJ</SelectItem>
                <SelectItem value="PJ">PJ</SelectItem>
                <SelectItem value="PF">PF</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={duplicateOnly ? 'default' : 'outline'}
              onClick={() => setDuplicateOnly(!duplicateOnly)}
              className={duplicateOnly ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-200 text-red-600 hover:bg-red-50'}
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Só duplicados
            </Button>
          </div>

          {/* Lista enriquecida */}
          <div className="space-y-2 mt-4">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-[var(--pagsmile-blue)]/50">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum seller encontrado</p>
              </div>
            )}
            {filtered.map(m => {
              const lead = leadMap[m.id];
              const origemRaw = lead?.origemLead || lead?.questionnaireData?.origem;
              const originLabel = origemRaw ? (ORIGIN_LABELS[origemRaw] || origemRaw) : null;
              return (
                <CadastroRichRow
                  key={m.id}
                  merchant={m}
                  oCase={caseMap[m.id]}
                  lead={lead}
                  proposal={proposalMap[m.id]}
                  contract={contractMap[m.id]}
                  subsellerCount={subsellerCountMap[m.id] || 0}
                  duplicateCount={duplicateCountMap[m.id] || 1}
                  originLabel={originLabel}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <ExportReportModal open={exportOpen} onOpenChange={setExportOpen} />
      <MergeDuplicatesModal
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        onMerged={() => refetchMerchants()}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{value}</p>
        <p className="text-xs text-[var(--pagsmile-blue)]/50">{label}</p>
      </div>
    </div>
  );
}