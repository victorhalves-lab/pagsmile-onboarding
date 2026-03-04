import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, RefreshCw, Eye, Clock, CheckCircle2, 
  AlertTriangle, XCircle, FileCheck,
  Loader2, MoreHorizontal, Mail, Download,
  ArrowUpDown, Building2, User, Filter,
  ChevronLeft, ChevronRight, Brain, FileText,
  Inbox, ChevronDown, Shield
} from 'lucide-react';

export default function QuestionariosRecebidos() {
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

  const { data: onboardingCases = [], isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500)
  });

  // Fetch Compliance Scores
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

  // Fetch Questionnaire Templates para exibir o modelo
  const { data: questionnaireTemplates = [] } = useQuery({
    queryKey: ['questionnaireTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.list()
  });

  // Fetch OnboardingLinks para pegar o complianceType
  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['onboardingLinks'],
    queryFn: () => base44.entities.OnboardingLink.list()
  });

  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  const scoresMap = React.useMemo(() => {
    const map = {};
    complianceScores.forEach(s => { map[s.onboarding_case_id] = s; });
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

  // Função para determinar o modelo do caso
  const getCaseModel = (c) => {
    // Primeiro tenta pelo link
    if (c.onboardingLinkCode && linksMap[c.onboardingLinkCode]) {
      const link = linksMap[c.onboardingLinkCode];
      if (link.complianceType === 'LITE') return 'lite';
      if (link.complianceType === 'PIX') return 'pix';
      if (link.complianceType === 'FULL') return 'full';
    }
    // Depois tenta pelo template
    if (c.questionnaireTemplateId && templatesMap[c.questionnaireTemplateId]) {
      return templatesMap[c.questionnaireTemplateId].model || 'full';
    }
    return 'full'; // default
  };

  const getModelBadge = (model) => {
    const config = {
      'lite': { color: 'bg-teal-100 text-teal-700', label: 'Lite' },
      'pix': { color: 'bg-blue-100 text-blue-700', label: 'Pix' },
      'full': { color: 'bg-purple-100 text-purple-700', label: 'Full' },
      'ecommerce': { color: 'bg-amber-100 text-amber-700', label: 'E-commerce' },
      'gateway': { color: 'bg-indigo-100 text-indigo-700', label: 'Gateway' }
    };
    const { color, label } = config[model] || config['full'];
    return (
      <Badge className={`${color} text-xs font-medium border-0`}>
        {label}
      </Badge>
    );
  };

  // Estatísticas rápidas
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

  // Lista de analistas únicos
  const analysts = React.useMemo(() => {
    const uniqueAnalysts = [...new Set(onboardingCases.map(c => c.assignedAnalystName).filter(Boolean))];
    return uniqueAnalysts;
  }, [onboardingCases]);

  // Calcular tempo em fila
  const getTimeInQueue = (createdDate) => {
    if (!createdDate) return '-';
    const now = new Date();
    const created = new Date(createdDate);
    const diffMs = now - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h`;
    return '< 1h';
  };

  const getStatusBadge = (status) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Em Processamento': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 },
      'Aprovado': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      'Manual': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
      'Recusado': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config['Pendente'];
    return (
      <Badge className={`${color} gap-1 border`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getScoreBadge = (score) => {
    if (score === undefined || score === null) {
      return <span className="text-[var(--pagsmile-blue)]/50">-</span>;
    }
    
    let colorClass = 'text-red-600 bg-red-50';
    let label = 'Crítico';
    
    if (score >= 80) {
      colorClass = 'text-green-600 bg-green-50';
      label = 'Baixo Risco';
    } else if (score >= 50) {
      colorClass = 'text-orange-600 bg-orange-50';
      label = 'Médio Risco';
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className={`font-bold text-lg ${colorClass.split(' ')[0]}`}>{score}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
      </div>
    );
  };

  const getIADecisionBadge = (decision) => {
    if (!decision) return <span className="text-[var(--pagsmile-blue)]/50">-</span>;
    
    const config = {
      'Aprovado': { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      'Manual': { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      'Recusado': { color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    const { color, icon: Icon } = config[decision] || { color: 'bg-slate-100 text-slate-700', icon: Brain };
    
    return (
      <Badge className={`${color} gap-1 border-0`}>
        <Icon className="w-3 h-3" />
        {decision}
      </Badge>
    );
  };

  // Filtrar casos
  const filteredCases = React.useMemo(() => {
    return onboardingCases.filter(c => {
      const merchant = merchantMap[c.merchantId];
      
      // Busca
      const matchesSearch = !searchTerm || 
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.cpfCnpj?.includes(searchTerm) ||
        merchant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      // Tipo de merchant
      const matchesMerchantType = merchantTypeFilter === 'all' || merchant?.type === merchantTypeFilter;
      
      // Analista
      const matchesAnalyst = analystFilter === 'all' || c.assignedAnalystName === analystFilter;
      
      // Prioridade
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      
      // Modelo
      const caseModel = getCaseModel(c);
      const matchesModel = modelFilter === 'all' || caseModel === modelFilter;
      
      // Score
      let matchesScore = true;
      if (scoreFilter !== 'all' && c.riskScore !== undefined) {
        if (scoreFilter === 'high') matchesScore = c.riskScore >= 80;
        else if (scoreFilter === 'medium') matchesScore = c.riskScore >= 50 && c.riskScore < 80;
        else if (scoreFilter === 'low') matchesScore = c.riskScore < 50;
      } else if (scoreFilter !== 'all' && c.riskScore === undefined) {
        matchesScore = false;
      }
      
      // Data
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const caseDate = new Date(c.created_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateFilter === 'today') {
          matchesDate = caseDate >= today;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = caseDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          matchesDate = caseDate >= monthStart;
        }
      }
      
      return matchesSearch && matchesStatus && matchesMerchantType && matchesScore && matchesDate && matchesAnalyst && matchesPriority && matchesModel;
    }).sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'merchant') {
        aValue = merchantMap[a.merchantId]?.fullName || '';
        bValue = merchantMap[b.merchantId]?.fullName || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  }, [onboardingCases, merchantMap, linksMap, templatesMap, searchTerm, statusFilter, merchantTypeFilter, scoreFilter, dateFilter, analystFilter, priorityFilter, modelFilter, sortField, sortOrder]);

  // Paginação
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Merchant', 'CNPJ/CPF', 'Tipo', 'Status', 'Score Helena', 'Decisão IA', 'Data Submissão'].join(','),
      ...filteredCases.map(c => {
        const merchant = merchantMap[c.merchantId];
        return [
          c.id,
          `"${merchant?.fullName || 'N/A'}"`,
          merchant?.cpfCnpj || '',
          merchant?.type || '',
          c.status,
          c.riskScore || '',
          c.iaDecision || '',
          c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `questionarios_compliance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const isLoadingAll = casesLoading || merchantsLoading;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <Shield className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Questionários Recebidos</h1>
              <p className="text-white/60 text-sm mt-1">Todas as submissões de compliance dos merchants</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => refetchCases()} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'all', label: 'Total', value: stats.total, color: 'text-[#002443]', border: 'border-[#2bc196]', ring: 'ring-[#2bc196]/20' },
          { key: 'Pendente', label: 'Pendentes', value: stats.pendente, color: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-500/20' },
          { key: 'Em Processamento', label: 'Processando', value: stats.processando, color: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500/20' },
          { key: 'Manual', label: 'Revisão Manual', value: stats.manual, color: 'text-orange-600', border: 'border-orange-500', ring: 'ring-orange-500/20' },
          { key: 'Aprovado', label: 'Aprovados', value: stats.aprovado, color: 'text-green-600', border: 'border-green-500', ring: 'ring-green-500/20' },
          { key: 'Recusado', label: 'Recusados', value: stats.recusado, color: 'text-red-600', border: 'border-red-500', ring: 'ring-red-500/20' },
        ].map(s => (
          <button 
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
              statusFilter === s.key ? `${s.border} ring-2 ${s.ring}` : 'border-[#002443]/5'
            }`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#282828]/50">{s.label}</p>
            {s.key === 'Manual' && stats.slaAtRisk > 0 && (
              <p className="text-[10px] text-red-500 font-medium mt-1">{stats.slaAtRisk} com SLA em risco</p>
            )}
          </button>
        ))}
      </div>

      {/* Batch Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-[#002443] rounded-xl p-3 flex items-center justify-between shadow-lg">
          <span className="text-sm text-white font-medium">{selectedRows.length} selecionado(s)</span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-lg text-xs"
              onClick={() => setSelectedRows([])}
            >
              Limpar seleção
            </Button>
          </div>
        </div>
      )}

      {/* Filtros - Sticky */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Modelos</SelectItem>
                <SelectItem value="lite">Lite</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>

            <Select value={merchantTypeFilter} onValueChange={setMerchantTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Score Helena" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Scores</SelectItem>
                <SelectItem value="high">≥ 80 (Baixo Risco)</SelectItem>
                <SelectItem value="medium">50-79 (Médio Risco)</SelectItem>
                <SelectItem value="low">&lt; 50 (Alto Risco)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>

            {analysts.length > 0 && (
              <Select value={analystFilter} onValueChange={setAnalystFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Analista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Analistas</SelectItem>
                  {analysts.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== 'all' || merchantTypeFilter !== 'all' || scoreFilter !== 'all' || dateFilter !== 'all' || analystFilter !== 'all' || priorityFilter !== 'all' || modelFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setMerchantTypeFilter('all');
                  setScoreFilter('all');
                  setDateFilter('all');
                  setAnalystFilter('all');
                  setPriorityFilter('all');
                  setModelFilter('all');
                }}
                className="text-[var(--pagsmile-blue)]/70"
              >
                Limpar filtros
              </Button>
            )}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, e-mail ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : paginatedCases.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
            <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum questionário encontrado</p>
            <p className="text-sm text-[var(--pagsmile-blue)]/50 mt-1">Ajuste os filtros ou aguarde novas submissões</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f4]">
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedRows.length === paginatedCases.length && paginatedCases.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRows(paginatedCases.map(c => c.id));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-[280px]">
                  <button 
                    className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold"
                    onClick={() => {
                      if (sortField === 'merchant') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('merchant');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    Merchant
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Fase 1 (SQ)</TableHead>
                <TableHead className="text-center">Fase 2 (SVE)</TableHead>
                <TableHead className="text-center">
                  <button 
                    className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold mx-auto"
                    onClick={() => {
                      if (sortField === 'riskScore') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('riskScore');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    Final (SGC)
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Tempo na Fila</TableHead>
                <TableHead>Analista</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold"
                    onClick={() => {
                      if (sortField === 'created_date') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('created_date');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Submissão
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCases.map((c) => {
                const merchant = merchantMap[c.merchantId];
                return (
                  <React.Fragment key={c.id}>
                  <TableRow className={`hover:bg-[#f4f4f4] transition-colors cursor-pointer ${selectedRows.includes(c.id) ? 'bg-[#2bc196]/5' : ''}`}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedRows.includes(c.id)}
                        onCheckedChange={(checked) => {
                          setSelectedRows(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id));
                        }}
                      />
                    </TableCell>
                    <TableCell onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {merchant?.type === 'PF' ? (
                            <User className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Building2 className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--pagsmile-blue)]">
                            {merchant?.fullName || 'N/A'}
                          </p>
                          <p className="text-sm text-[var(--pagsmile-blue)]/70">
                            {merchant?.cpfCnpj || '-'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getModelBadge(getCaseModel(c))}
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    
                    {/* Scores Columns */}
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-[var(--pagsmile-blue)]/80">
                        {scoresMap[c.id]?.score_questionario || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-[var(--pagsmile-blue)]/80">
                        {scoresMap[c.id]?.score_validacao_externa || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {getScoreBadge(scoresMap[c.id]?.score_geral_composto || c.riskScore)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const time = getTimeInQueue(c.created_date);
                        const hasDays = time.includes('d');
                        const days = hasDays ? parseInt(time) : 0;
                        let bgColor = 'bg-green-100 text-green-700';
                        if (days >= 5) bgColor = 'bg-red-100 text-red-700';
                        else if (days >= 3) bgColor = 'bg-orange-100 text-orange-700';
                        else if (days >= 1) bgColor = 'bg-yellow-100 text-yellow-700';
                        return (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${bgColor}`}>
                            {time}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[var(--pagsmile-blue)]/80">
                        {c.assignedAnalystName || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-[var(--pagsmile-blue)] text-sm">
                          {c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : '-'}
                        </p>
                        <p className="text-xs text-[var(--pagsmile-blue)]/50">
                          {c.created_date ? new Date(c.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === c.id ? null : c.id); }}
                          className="text-[#002443]/50"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedRow === c.id ? 'rotate-180' : ''}`} />
                        </Button>
                        <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-[var(--pagsmile-green)] hover:text-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10">
                            <Eye className="w-4 h-4 mr-1" />
                            Analisar
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
                              <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}>
                                <FileText className="w-4 h-4 mr-2" />
                                Ver Respostas
                              </Link>
                            </DropdownMenuItem>
                            {merchant?.email && (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${merchant.email}`}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Enviar E-mail
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded Row Detail */}
                  {expandedRow === c.id && (
                    <TableRow className="bg-[#f4f4f4]/50">
                      <TableCell colSpan={11} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-xl p-4 border border-[#002443]/5">
                            <h4 className="text-xs font-bold text-[#002443] mb-2 uppercase tracking-wider">Resumo IA</h4>
                            <p className="text-xs text-[#282828]/60">
                              {scoresMap[c.id]?.sumario_executivo || scoresMap[c.id]?.parecer_final || c.iaExplanation || 'Análise não disponível.'}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-[#002443]/5">
                            <h4 className="text-xs font-bold text-[#002443] mb-2 uppercase tracking-wider">Red Flags</h4>
                            {(scoresMap[c.id]?.red_flags || c.redFlags || []).length > 0 ? (
                              <ul className="space-y-1">
                                {(scoresMap[c.id]?.red_flags || c.redFlags || []).slice(0, 3).map((flag, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-[#282828]/40">Nenhum red flag identificado.</p>
                            )}
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-[#002443]/5">
                            <h4 className="text-xs font-bold text-[#002443] mb-2 uppercase tracking-wider">Scores Detalhados</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#282828]/50">Questionário (SQ)</span>
                                <span className="font-bold">{scoresMap[c.id]?.score_questionario || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#282828]/50">Validação Ext. (SVE)</span>
                                <span className="font-bold">{scoresMap[c.id]?.score_validacao_externa || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#282828]/50">Geral Composto (SGC)</span>
                                <span className="font-bold text-[#2bc196]">{scoresMap[c.id]?.score_geral_composto || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#282828]/50">Recomendação</span>
                                <span className="font-semibold">{scoresMap[c.id]?.recomendacao_final || c.iaDecision || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {/* Paginação */}
        {filteredCases.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-[var(--pagsmile-blue)]/70">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCases.length)} de {filteredCases.length} questionários
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--pagsmile-blue)]/80">
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}