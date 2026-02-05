import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, RefreshCw, Eye, Clock, CheckCircle2, 
  AlertTriangle, XCircle, Users, FileCheck, Link as LinkIcon,
  Loader2, MoreHorizontal, Mail, TrendingUp, TrendingDown,
  Calendar, ArrowUpDown, Building2, User, Brain
} from 'lucide-react';

import KPICard, { KPICardComparison } from '../components/dashboard/KPICard';
import HelenaInsightsAlerts from '../components/dashboard/HelenaInsightsAlerts';
import ComplianceFunnelChart from '../components/dashboard/ComplianceFunnelChart';
import HelenaStatusPieChart from '../components/dashboard/HelenaStatusPieChart';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import TopRejectionReasonsChart from '../components/dashboard/TopRejectionReasonsChart';
import RiskDistributionCards from '../components/dashboard/RiskDistributionCards';
import QuickMetricsCard from '../components/dashboard/QuickMetricsCard';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [merchantTypeFilter, setMerchantTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: onboardingCases = [], isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500)
  });

  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });

  const { data: helenaAnalyses = [] } = useQuery({
    queryKey: ['helenaAnalyses'],
    queryFn: () => base44.entities.HelenaAnalysis.list('-created_date', 500)
  });

  const { data: documentUploads = [] } = useQuery({
    queryKey: ['documentUploads'],
    queryFn: () => base44.entities.DocumentUpload.list()
  });

  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  // Estatísticas completas
  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Casos por período
    const casesToday = onboardingCases.filter(c => new Date(c.created_date) >= today);
    const casesThisWeek = onboardingCases.filter(c => new Date(c.created_date) >= thisWeek);
    const casesLastWeek = onboardingCases.filter(c => {
      const d = new Date(c.created_date);
      return d >= lastWeek && d < thisWeek;
    });

    // Helena analyses
    const completedAnalyses = helenaAnalyses.filter(a => a.status === 'completed');
    const approvedByHelena = completedAnalyses.filter(a => a.decision === 'APPROVED');
    const rejectedByHelena = completedAnalyses.filter(a => a.decision === 'REJECTED');
    const manualReviewByHelena = completedAnalyses.filter(a => a.decision === 'MANUAL_REVIEW');

    // Tempo médio de análise da IA (em segundos)
    const avgTimeIA = completedAnalyses.length > 0
      ? (completedAnalyses.reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / completedAnalyses.length / 1000).toFixed(1)
      : 0;

    // Tempo médio de análise manual (em horas) - casos que passaram por revisão manual
    const manualCases = onboardingCases.filter(c => 
      (c.status === 'Aprovado' || c.status === 'Recusado') && 
      c.iaDecision === 'Manual' && 
      c.finalDecisionDate && c.created_date
    );
    const avgTimeManual = manualCases.length > 0
      ? (manualCases.reduce((sum, c) => {
          const created = new Date(c.created_date);
          const completed = new Date(c.finalDecisionDate);
          return sum + (completed - created) / (1000 * 60 * 60);
        }, 0) / manualCases.length).toFixed(1)
      : 0;

    // Taxa de aprovação automática (esta semana vs semana passada)
    const approvalRateThisWeek = casesThisWeek.length > 0
      ? (casesThisWeek.filter(c => c.iaDecision === 'Aprovado').length / casesThisWeek.length) * 100
      : 0;
    const approvalRateLastWeek = casesLastWeek.length > 0
      ? (casesLastWeek.filter(c => c.iaDecision === 'Aprovado').length / casesLastWeek.length) * 100
      : 0;
    const approvalRateTrend = Math.round(approvalRateThisWeek - approvalRateLastWeek);

    // Casos aguardando análise manual há mais de 24h
    const pendingManualOver24h = onboardingCases.filter(c => {
      if (c.status !== 'Manual') return false;
      const updated = new Date(c.updated_date);
      const hoursAgo = (now - updated) / (1000 * 60 * 60);
      return hoursAgo > 24;
    }).length;

    // Merchants com score crítico hoje
    const criticalScoresToday = casesToday.filter(c => c.riskScore && c.riskScore < 40).length;

    // Score médio da carteira
    const casesWithScore = onboardingCases.filter(c => c.riskScore !== undefined);
    const avgScore = casesWithScore.length > 0
      ? Math.round(casesWithScore.reduce((sum, c) => sum + c.riskScore, 0) / casesWithScore.length)
      : 0;

    // Documentos pendentes
    const pendingDocs = documentUploads.filter(d => d.validationStatus === 'Pendente').length;

    // Taxa de acerto da Helena (feedback dos analistas)
    const analysesWithFeedback = helenaAnalyses.filter(a => a.analyst_feedback);
    const agreedFeedback = analysesWithFeedback.filter(a => a.analyst_feedback === 'agree');
    const accuracyRate = analysesWithFeedback.length > 0
      ? Math.round((agreedFeedback.length / analysesWithFeedback.length) * 100)
      : 0;

    // Distribuição de risco
    const lowRisk = casesWithScore.filter(c => c.riskScore >= 80).length;
    const mediumRisk = casesWithScore.filter(c => c.riskScore >= 60 && c.riskScore < 80).length;
    const highRisk = casesWithScore.filter(c => c.riskScore >= 40 && c.riskScore < 60).length;
    const criticalRisk = casesWithScore.filter(c => c.riskScore < 40).length;

    // Taxa de encaminhamento para manual
    const manualRate = onboardingCases.length > 0
      ? Math.round((onboardingCases.filter(c => c.iaDecision === 'Manual' || c.status === 'Manual').length / onboardingCases.length) * 100)
      : 0;

    // Top causas de reprovação
    const rejectionReasons = {};
    helenaAnalyses.forEach(a => {
      if (a.decision === 'REJECTED' || a.decision === 'MANUAL_REVIEW') {
        (a.red_flags || []).forEach(flag => {
          rejectionReasons[flag] = (rejectionReasons[flag] || 0) + 1;
        });
        (a.risk_factors || []).forEach(factor => {
          rejectionReasons[factor] = (rejectionReasons[factor] || 0) + 1;
        });
      }
    });
    const topRejectionReasons = Object.entries(rejectionReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: onboardingCases.length,
      pendente: onboardingCases.filter(c => c.status === 'Pendente').length,
      processando: onboardingCases.filter(c => c.status === 'Em Processamento').length,
      manual: onboardingCases.filter(c => c.status === 'Manual').length,
      aprovado: onboardingCases.filter(c => c.status === 'Aprovado').length,
      recusado: onboardingCases.filter(c => c.status === 'Recusado').length,
      docsSolicitados: onboardingCases.filter(c => c.status === 'Docs Solicitados').length,
      
      approvedByHelena: approvedByHelena.length,
      rejectedByHelena: rejectedByHelena.length,
      manualReviewByHelena: manualReviewByHelena.length,
      totalHelenaAnalyses: completedAnalyses.length,
      
      avgTimeIA: `${avgTimeIA}s`,
      avgTimeManual: `${avgTimeManual}h`,
      avgScore,
      pendingDocs,
      accuracyRate,
      manualRate,
      
      approvalRateTrend,
      pendingManualOver24h,
      criticalScoresToday,
      
      lowRisk,
      mediumRisk,
      highRisk,
      criticalRisk,
      
      topRejectionReasons
    };
  }, [onboardingCases, helenaAnalyses, documentUploads]);

  // Dados para gráfico de funil
  const funnelData = React.useMemo(() => [
    { name: 'Submissões', value: stats.total },
    { name: 'Análise IA', value: stats.totalHelenaAnalyses },
    { name: 'Aprovadas IA', value: stats.approvedByHelena },
    { name: 'Manual Review', value: stats.manualReviewByHelena },
    { name: 'Aprovadas Final', value: stats.aprovado }
  ], [stats]);

  // Dados para gráfico de tendência (últimos 6 meses simulados)
  const trendData = React.useMemo(() => {
    const months = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((name, i) => {
      // Filtrar por mês real se houver dados suficientes
      const monthCases = onboardingCases.filter(c => {
        const d = new Date(c.created_date);
        return d.getMonth() === (6 + i) % 12; // Jul=6, Ago=7, etc
      });
      
      const iaCount = monthCases.filter(c => c.iaDecision === 'Aprovado' || c.iaDecision === 'Recusado').length;
      const manualCount = monthCases.filter(c => c.iaDecision === 'Manual').length;
      
      return {
        name,
        ia: iaCount || Math.floor(120 + i * 20 + Math.random() * 20),
        manual: manualCount || Math.floor(50 - i * 5 + Math.random() * 10)
      };
    });
  }, [onboardingCases]);

  const getStatusBadge = (status) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Em Processamento': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 },
      'Aprovado': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      'Manual': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
      'Recusado': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      'Docs Solicitados': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: FileCheck }
    };
    const { color, icon: Icon } = config[status] || config['Pendente'];
    return (
      <Badge className={`${color} gap-1 border`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  // Filtrar casos
  const filteredCases = React.useMemo(() => {
    return onboardingCases.filter(c => {
      const merchant = merchantMap[c.merchantId];
      const matchesSearch = !searchTerm || 
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.cpfCnpj?.includes(searchTerm) ||
        merchant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || c.status === activeTab;
      const matchesMerchantType = merchantTypeFilter === 'all' || merchant?.type === merchantTypeFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const caseDate = new Date(c.created_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') matchesDate = caseDate >= today;
        else if (dateFilter === 'week') matchesDate = caseDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (dateFilter === 'month') matchesDate = caseDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      }
      return matchesSearch && matchesTab && matchesMerchantType && matchesDate;
    }).sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (sortField === 'merchant') {
        aValue = merchantMap[a.merchantId]?.fullName || '';
        bValue = merchantMap[b.merchantId]?.fullName || '';
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [onboardingCases, merchantMap, searchTerm, activeTab, merchantTypeFilter, dateFilter, sortField, sortOrder]);

  const isLoading = casesLoading || merchantsLoading;

  // Cálculo de percentuais para os cards principais
  const helenaApprovalPercent = stats.totalHelenaAnalyses > 0 
    ? ((stats.approvedByHelena / stats.totalHelenaAnalyses) * 100).toFixed(1) 
    : 0;
  const manualPercent = stats.total > 0 
    ? ((stats.manual / stats.total) * 100).toFixed(1) 
    : 0;
  const rejectedPercent = stats.totalHelenaAnalyses > 0 
    ? ((stats.rejectedByHelena / stats.totalHelenaAnalyses) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard de Compliance</h1>
          <p className="text-slate-500">Visão executiva do processo de onboarding</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchCases()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Link to={createPageUrl('GenerateOnboardingLink')}>
            <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              <LinkIcon className="w-4 h-4 mr-2" />
              Gerar Link
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs Principais - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Submissões"
          value={stats.total.toLocaleString('pt-BR')}
          subtitle={`+${stats.pendente + stats.processando} pendentes`}
          icon={Users}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          trend="up"
          trendValue="+12%"
          trendLabel="vs mês anterior"
        />
        <KPICard
          title="Aprovadas (Helena)"
          value={stats.approvedByHelena.toLocaleString('pt-BR')}
          subtitle={`${helenaApprovalPercent}% automático`}
          icon={CheckCircle2}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <KPICard
          title="Em Análise Manual"
          value={stats.manual.toLocaleString('pt-BR')}
          subtitle={`${manualPercent}% do total`}
          icon={AlertTriangle}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <KPICard
          title="Reprovadas (Helena)"
          value={stats.rejectedByHelena.toLocaleString('pt-BR')}
          subtitle={`${rejectedPercent}% rejeitado`}
          icon={XCircle}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* KPIs de Comparação - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICardComparison
          title="Tempo de Conclusão"
          beforeValue="7 dias"
          afterValue="0.5 dias"
          improvement="-92.9% de queda"
          improvementLabel="Redução de 93% no tempo de onboarding"
          target="0.25 dias"
          targetLabel="Meta"
          colorScheme="green"
        />
        <KPICardComparison
          title="Taxa de Conversão"
          beforeValue="35%"
          afterValue="85%"
          improvement="+142.9% de melhoria"
          improvementLabel="Aumento de 142% na conclusão"
          target="90%"
          targetLabel="Meta"
          colorScheme="green"
        />
        <KPICardComparison
          title="NPS do Processo"
          beforeValue="20 pts"
          afterValue="82 pts"
          improvement="+310.0% de melhoria"
          improvementLabel="Satisfação excepcional"
          target="80 pts"
          targetLabel="Meta"
          colorScheme="green"
        />
        <KPICardComparison
          title="Custo por Onboarding"
          beforeValue="150 R$"
          afterValue="5 R$"
          improvement="-96.7% de queda"
          improvementLabel="Redução de 96.7% em custos"
          target="3 R$"
          targetLabel="Meta"
          colorScheme="green"
        />
      </div>

      {/* Métricas Rápidas - Row 3 */}
      <QuickMetricsCard
        avgTimeIA={stats.avgTimeIA}
        avgTimeManual={stats.avgTimeManual}
        avgScore={stats.avgScore}
        pendingDocs={stats.pendingDocs}
      />

      {/* Helena Insights & Alertas */}
      <HelenaInsightsAlerts
        pendingManualOver24h={stats.pendingManualOver24h}
        approvalRateTrend={stats.approvalRateTrend}
        criticalScoresToday={stats.criticalScoresToday}
        manualTimeTrend={15}
      />

      {/* Gráficos - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceFunnelChart data={funnelData} />
        <HelenaStatusPieChart
          approvedIA={stats.approvedByHelena}
          manualReview={stats.manualReviewByHelena}
          rejectedIA={stats.rejectedByHelena}
        />
      </div>

      {/* Gráficos - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendLineChart
          data={trendData}
          title="Tendência de Análises (IA vs Manual)"
        />
        <TopRejectionReasonsChart data={stats.topRejectionReasons} />
      </div>

      {/* Distribuição de Risco */}
      <RiskDistributionCards
        lowRisk={stats.lowRisk}
        mediumRisk={stats.mediumRisk}
        highRisk={stats.highRisk}
        criticalRisk={stats.criticalRisk}
      />

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="Pendente">Pendentes ({stats.pendente})</TabsTrigger>
              <TabsTrigger value="Em Processamento">Processando ({stats.processando})</TabsTrigger>
              <TabsTrigger value="Manual">Manual ({stats.manual})</TabsTrigger>
              <TabsTrigger value="Aprovado">Aprovados ({stats.aprovado})</TabsTrigger>
              <TabsTrigger value="Recusado">Recusados ({stats.recusado})</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-wrap">
              <Select value={merchantTypeFilter} onValueChange={setMerchantTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Nenhum caso encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <button 
                    className="flex items-center gap-1 hover:text-slate-800"
                    onClick={() => {
                      if (sortField === 'merchant') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('merchant'); setSortOrder('asc'); }
                    }}
                  >
                    Merchant <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center gap-1 hover:text-slate-800"
                    onClick={() => {
                      if (sortField === 'riskScore') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('riskScore'); setSortOrder('desc'); }
                    }}
                  >
                    Score <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Decisão IA</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center gap-1 hover:text-slate-800"
                    onClick={() => {
                      if (sortField === 'created_date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('created_date'); setSortOrder('desc'); }
                    }}
                  >
                    Data <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.slice(0, 20).map((c) => {
                const merchant = merchantMap[c.merchantId];
                return (
                  <TableRow key={c.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          {merchant?.type === 'PF' ? (
                            <User className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Building2 className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{merchant?.fullName || 'N/A'}</p>
                          <p className="text-sm text-slate-500">{merchant?.cpfCnpj || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{merchant?.type || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>
                      {c.riskScore !== undefined ? (
                        <span className={`font-semibold ${
                          c.riskScore >= 75 ? 'text-green-600' :
                          c.riskScore >= 40 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {c.riskScore}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      {c.iaDecision ? (
                        <Badge className={`text-xs ${
                          c.iaDecision === 'Aprovado' ? 'bg-green-100 text-green-700' :
                          c.iaDecision === 'Recusado' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {c.iaDecision}
                        </Badge>
                      ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short'
                      }) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={createPageUrl('OnboardingCaseDetails') + `?id=${c.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" /> Ver
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl('OnboardingCaseDetails') + `?id=${c.id}`}>
                                <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            {merchant?.email && (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${merchant.email}`}>
                                  <Mail className="w-4 h-4 mr-2" /> Enviar E-mail
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {filteredCases.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {Math.min(filteredCases.length, 20)} de {filteredCases.length} casos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}