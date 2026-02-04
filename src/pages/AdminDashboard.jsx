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
  Calendar, Filter, ArrowUpDown, Building2, User, CreditCard,
  BarChart3, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [merchantTypeFilter, setMerchantTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: onboardingCases = [], isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 200)
  });

  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });

  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  // Estatísticas
  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const casesToday = onboardingCases.filter(c => new Date(c.created_date) >= today);
    const casesThisWeek = onboardingCases.filter(c => new Date(c.created_date) >= thisWeek);
    const casesThisMonth = onboardingCases.filter(c => new Date(c.created_date) >= thisMonth);

    return {
      total: onboardingCases.length,
      pendente: onboardingCases.filter(c => c.status === 'Pendente').length,
      processando: onboardingCases.filter(c => c.status === 'Em Processamento').length,
      manual: onboardingCases.filter(c => c.status === 'Manual').length,
      aprovado: onboardingCases.filter(c => c.status === 'Aprovado').length,
      recusado: onboardingCases.filter(c => c.status === 'Recusado').length,
      today: casesToday.length,
      thisWeek: casesThisWeek.length,
      thisMonth: casesThisMonth.length,
      approvalRate: onboardingCases.length > 0 
        ? Math.round((onboardingCases.filter(c => c.status === 'Aprovado').length / onboardingCases.length) * 100) 
        : 0,
      avgScore: onboardingCases.filter(c => c.riskScore).length > 0
        ? Math.round(onboardingCases.filter(c => c.riskScore).reduce((sum, c) => sum + c.riskScore, 0) / onboardingCases.filter(c => c.riskScore).length)
        : 0
    };
  }, [onboardingCases]);

  // Dados para gráficos
  const chartData = React.useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      
      const dayCases = onboardingCases.filter(c => {
        const caseDate = new Date(c.created_date).toISOString().split('T')[0];
        return caseDate === dateStr;
      });

      last7Days.push({
        name: dayName,
        total: dayCases.length,
        aprovados: dayCases.filter(c => c.status === 'Aprovado').length,
        pendentes: dayCases.filter(c => c.status === 'Pendente' || c.status === 'Manual').length
      });
    }
    return last7Days;
  }, [onboardingCases]);

  const pieData = [
    { name: 'Aprovados', value: stats.aprovado, color: '#22c55e' },
    { name: 'Pendentes', value: stats.pendente, color: '#eab308' },
    { name: 'Manual', value: stats.manual, color: '#f97316' },
    { name: 'Recusados', value: stats.recusado, color: '#ef4444' },
    { name: 'Processando', value: stats.processando, color: '#3b82f6' }
  ].filter(d => d.value > 0);

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

  // Filtrar casos
  const filteredCases = React.useMemo(() => {
    return onboardingCases.filter(c => {
      const merchant = merchantMap[c.merchantId];
      
      // Busca
      const matchesSearch = !searchTerm || 
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.cpfCnpj?.includes(searchTerm) ||
        merchant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status
      const matchesTab = activeTab === 'all' || c.status === activeTab;
      
      // Tipo de merchant
      const matchesMerchantType = merchantTypeFilter === 'all' || merchant?.type === merchantTypeFilter;
      
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
      
      return matchesSearch && matchesTab && matchesMerchantType && matchesDate;
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
  }, [onboardingCases, merchantMap, searchTerm, activeTab, merchantTypeFilter, dateFilter, sortField, sortOrder]);

  const isLoading = casesLoading || merchantsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard de Onboarding</h1>
          <p className="text-slate-500">Gerencie e monitore os casos de compliance</p>
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

      {/* Stats Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pendente}</p>
              <p className="text-xs text-slate-500">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.processando}</p>
              <p className="text-xs text-slate-500">Processando</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.manual}</p>
              <p className="text-xs text-slate-500">Revisão Manual</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.aprovado}</p>
              <p className="text-xs text-slate-500">Aprovados</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.recusado}</p>
              <p className="text-xs text-slate-500">Recusados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Row 2 + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Métricas Rápidas */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Métricas Rápidas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Hoje</span>
              </div>
              <span className="font-bold text-slate-800">{stats.today} casos</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Esta semana</span>
              </div>
              <span className="font-bold text-slate-800">{stats.thisWeek} casos</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">Este mês</span>
              </div>
              <span className="font-bold text-slate-800">{stats.thisMonth} casos</span>
            </div>
            <div className="border-t border-slate-100 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600">Taxa de Aprovação</span>
                </div>
                <span className="font-bold text-green-600">{stats.approvalRate}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-slate-600">Score Médio</span>
              </div>
              <span className="font-bold text-blue-600">{stats.avgScore}</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Área */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#2bc196" fill="#2bc196" fillOpacity={0.2} />
              <Area type="monotone" dataKey="aprovados" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-4">
          {/* Tabs de Status */}
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
          
          {/* Filtros Adicionais */}
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
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center gap-1 hover:text-slate-800"
                    onClick={() => {
                      if (sortField === 'riskScore') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('riskScore');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Score
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead>Serviços</TableHead>
                <TableHead>
                  <button 
                    className="flex items-center gap-1 hover:text-slate-800"
                    onClick={() => {
                      if (sortField === 'created_date') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('created_date');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Data
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((c) => {
                const merchant = merchantMap[c.merchantId];
                return (
                  <TableRow key={c.id} className="hover:bg-slate-50">
                    <TableCell>
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
                          <p className="font-medium text-slate-800">
                            {merchant?.fullName || 'N/A'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {merchant?.cpfCnpj || '-'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {merchant?.type || 'N/A'}
                      </Badge>
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
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {merchant?.paymentServices?.map(service => (
                          <Badge key={service} variant="outline" className="text-xs font-normal">
                            {service}
                          </Badge>
                        )) || '-'}
                      </div>
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
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
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
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
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
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {/* Paginação simples */}
        {filteredCases.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {filteredCases.length} de {onboardingCases.length} casos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}