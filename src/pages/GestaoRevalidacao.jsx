import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  RefreshCw, History, Search, Users, Building2, User,
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Shield, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import RevalidationClientsTable from '../components/revalidation/RevalidationClientsTable';
import RevalidationActionBar from '../components/revalidation/RevalidationActionBar';
import RevalidationResultsModal from '../components/revalidation/RevalidationResultsModal';

export default function GestaoRevalidacao() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [subfaixaFilter, setSubfaixaFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultsModal, setResultsModal] = useState({ open: false, data: null });

  // Fetch all cases
  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['reval-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500),
  });

  // Fetch all merchants
  const { data: merchants = [] } = useQuery({
    queryKey: ['reval-merchants'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500),
  });

  // Fetch revalidation history
  const { data: validations = [] } = useQuery({
    queryKey: ['reval-history'],
    queryFn: () => base44.entities.ExternalValidationResult.filter(
      { provider: 'BigDataCorp', validationType: 'Revalidação BDC' },
      '-created_date', 100
    ),
  });

  // Build merchant map
  const merchantMap = useMemo(() => {
    const m = {};
    merchants.forEach(mer => { m[mer.id] = mer; });
    return m;
  }, [merchants]);

  // Build last revalidation map (caseId -> most recent validation)
  const lastRevalidationMap = useMemo(() => {
    const m = {};
    validations.forEach(v => {
      if (!m[v.onboardingCaseId] || new Date(v.created_date) > new Date(m[v.onboardingCaseId].created_date)) {
        m[v.onboardingCaseId] = v;
      }
    });
    return m;
  }, [validations]);

  // Build clients list: cases that have completed compliance (approved, manual, or have BDC data)
  const clients = useMemo(() => {
    const COMPLIANCE_STATUSES = ['Aprovado', 'Manual', 'Em Processamento', 'Docs Solicitados'];
    return cases
      .filter(c => {
        const mer = merchantMap[c.merchantId];
        if (!mer) return false;
        // Show cases that went through compliance
        return COMPLIANCE_STATUSES.includes(c.status) || c.bigDataCorpCompleted || c.riskScoreV4 != null;
      })
      .map(c => {
        const mer = merchantMap[c.merchantId];
        return {
          caseId: c.id,
          merchantId: c.merchantId,
          fullName: mer.fullName,
          companyName: mer.companyName,
          cpfCnpj: mer.cpfCnpj,
          type: mer.type,
          status: c.status,
          riskScoreV4: c.riskScoreV4,
          subfaixa: c.subfaixa,
          subfaixaNome: c.subfaixaNome,
        };
      });
  }, [cases, merchantMap]);

  // Apply filters
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (subfaixaFilter !== 'all' && c.subfaixa !== subfaixaFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = c.fullName?.toLowerCase().includes(q) ||
          c.companyName?.toLowerCase().includes(q) ||
          c.cpfCnpj?.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [clients, statusFilter, typeFilter, subfaixaFilter, searchTerm]);

  // Selection handlers
  const toggleSelect = (caseId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClients.map(c => c.caseId)));
    }
  };

  // Revalidation handler
  const handleRevalidate = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsProcessing(true);

    if (ids.length === 1) {
      // Single revalidation
      try {
        const res = await base44.functions.invoke('revalidateBdc', { caseId: ids[0] });
        setResultsModal({ open: true, data: res.data });
        if (res.data.result?.status === 'success') {
          toast.success(`Revalidação concluída: Score ${res.data.result.oldScore} → ${res.data.result.newScore}`);
        } else {
          toast.error('Erro: ' + (res.data.result?.error || 'Falha'));
        }
      } catch (err) {
        toast.error('Erro: ' + err.message);
      }
    } else {
      // Bulk - call one by one sequentially via single caseId calls
      const results = [];
      let succeeded = 0, failed = 0;
      const startTime = Date.now();

      for (const caseId of ids) {
        try {
          const res = await base44.functions.invoke('revalidateBdc', { caseId });
          const r = res.data.result || {};
          results.push(r);
          if (r.status === 'success') succeeded++;
          else failed++;
        } catch (err) {
          results.push({ status: 'error', error: err.message, caseId });
          failed++;
        }
      }

      const elapsed = Date.now() - startTime;
      const bulkData = {
        summary: { processed: ids.length, succeeded, failed, skipped: 0 },
        results,
        elapsed,
      };
      setResultsModal({ open: true, data: bulkData });
      toast.success(`Revalidação concluída: ${succeeded} sucesso, ${failed} falhas`);
    }

    setIsProcessing(false);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ['reval-cases'] });
    queryClient.invalidateQueries({ queryKey: ['reval-history'] });
  };

  // Stats
  const stats = useMemo(() => ({
    total: clients.length,
    approved: clients.filter(c => c.status === 'Aprovado').length,
    manual: clients.filter(c => c.status === 'Manual').length,
    neverRevalidated: clients.filter(c => !lastRevalidationMap[c.caseId]).length,
    revalidated: clients.filter(c => !!lastRevalidationMap[c.caseId]).length,
    alerts: validations.filter(v => (v.resultData?.scoreDelta ?? 0) > 20).length,
  }), [clients, lastRevalidationMap, validations]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reval-cases'] });
    queryClient.invalidateQueries({ queryKey: ['reval-merchants'] });
    queryClient.invalidateQueries({ queryKey: ['reval-history'] });
  };

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <History className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Revalidação de Compliance</h1>
              <p className="text-white/60 text-sm mt-1">Selecione clientes e revalide scores via BigDataCorp</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Clientes', value: stats.total, icon: Users, color: 'text-[#002443]' },
          { label: 'Aprovados', value: stats.approved, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Revisão Manual', value: stats.manual, icon: Clock, color: 'text-amber-600' },
          { label: 'Já Revalidados', value: stats.revalidated, icon: RefreshCw, color: 'text-blue-600' },
          { label: 'Nunca Revalidados', value: stats.neverRevalidated, icon: AlertTriangle, color: 'text-orange-600', alert: stats.neverRevalidated > 0 },
          { label: 'Alertas', value: stats.alerts, icon: TrendingUp, color: 'text-red-600', alert: stats.alerts > 0 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className={`rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-all ${s.alert ? 'border-orange-300 bg-orange-50/30' : ''}`}>
              <CardContent className="pt-4 flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${s.color} opacity-60`} />
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-[#002443]/50">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Bar (appears when something selected) */}
      <RevalidationActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onRevalidate={handleRevalidate}
        isProcessing={isProcessing}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#002443]/8 rounded-xl p-1">
          <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-[#2bc196] data-[state=active]:text-white gap-2">
            <Users className="w-4 h-4" /> Clientes ({filteredClients.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-[#2bc196] data-[state=active]:text-white gap-2">
            <History className="w-4 h-4" /> Histórico ({validations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-[#002443]/8 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-[#002443]/40" />
              <span className="text-xs font-bold text-[#002443]/60 uppercase tracking-wide">Filtros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
                <Input
                  placeholder="Buscar nome, CNPJ/CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Em Processamento">Em Processamento</SelectItem>
                  <SelectItem value="Docs Solicitados">Docs Solicitados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">PF e PJ</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subfaixaFilter} onValueChange={setSubfaixaFilter}>
                <SelectTrigger><SelectValue placeholder="Subfaixa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Subfaixas</SelectItem>
                  {['1A','1B','2A','2B','3A','3B','4','5'].map(sf => (
                    <SelectItem key={sf} value={sf}>{sf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <RevalidationClientsTable
            clients={filteredClients}
            isLoading={loadingCases}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            lastRevalidationMap={lastRevalidationMap}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RevalidationHistoryTab validations={validations} />
        </TabsContent>
      </Tabs>

      {/* Results Modal */}
      <RevalidationResultsModal
        open={resultsModal.open}
        onClose={() => setResultsModal({ open: false, data: null })}
        data={resultsModal.data}
      />
    </div>
  );
}

// ── History Tab (kept inline, small) ──
function RevalidationHistoryTab({ validations }) {
  const SUBFAIXA_COLORS = {
    '1A': 'bg-green-100 text-green-700', '1B': 'bg-green-50 text-green-600',
    '2A': 'bg-blue-100 text-blue-700', '2B': 'bg-blue-50 text-blue-600',
    '3A': 'bg-amber-100 text-amber-700', '3B': 'bg-orange-100 text-orange-700',
    '4': 'bg-red-100 text-red-700', '5': 'bg-red-200 text-red-800',
  };

  if (validations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-8 text-center">
        <History className="w-10 h-10 text-[#002443]/20 mx-auto mb-3" />
        <p className="text-sm text-[#002443]/50">Nenhuma revalidação realizada ainda</p>
        <p className="text-xs text-[#002443]/30 mt-1">Selecione clientes na aba "Clientes" e clique em "Revalidar Agora"</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 divide-y">
      {validations.map((v) => {
        const data = v.resultData || {};
        const delta = data.scoreDelta || 0;
        const isAlert = delta > 20;
        return (
          <div key={v.id} className={`p-4 flex items-center gap-4 ${isAlert ? 'bg-amber-50/50' : ''}`}>
            <div className={`p-2 rounded-lg ${delta > 0 ? 'bg-red-100' : delta < 0 ? 'bg-green-100' : 'bg-slate-100'}`}>
              {delta > 0 ? <TrendingUp className="w-4 h-4 text-red-600" /> :
               delta < 0 ? <Shield className="w-4 h-4 text-green-600" /> :
               <RefreshCw className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#002443] truncate">
                Case: {v.onboardingCaseId?.substring(0, 12)}...
              </p>
              <p className="text-xs text-[#002443]/50">
                {v.created_date ? new Date(v.created_date).toLocaleString('pt-BR') : ''}
                {' • '}{data.datasetsQueried || '?'} datasets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-[#002443]/50">Score</p>
                <p className="text-sm font-mono">
                  {data.oldScore ?? '?'} → <strong>{data.newScore ?? '?'}</strong>
                </p>
              </div>
              {data.subfaixaChanged ? (
                <div className="text-right">
                  <p className="text-xs text-[#002443]/50">Subfaixa</p>
                  <div className="flex items-center gap-1">
                    <Badge className={`${SUBFAIXA_COLORS[data.oldSubfaixa] || ''} text-[10px] border-0`}>{data.oldSubfaixa}</Badge>
                    <span className="text-xs">→</span>
                    <Badge className={`${SUBFAIXA_COLORS[data.newSubfaixa] || ''} text-[10px] border-0`}>{data.newSubfaixa}</Badge>
                  </div>
                </div>
              ) : (
                <Badge className={`${SUBFAIXA_COLORS[data.newSubfaixa] || 'bg-slate-100 text-slate-700'} text-xs border-0`}>{data.newSubfaixa || '-'}</Badge>
              )}
              <span className={`text-xs font-mono font-bold ${
                delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-slate-400'
              }`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}