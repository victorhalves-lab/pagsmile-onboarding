import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, Users, TrendingUp, ShieldCheck, AlertTriangle, 
  Eye, Loader2, RefreshCw, ExternalLink, Filter,
  ShoppingCart, Network, Building2, ArrowUpDown
} from 'lucide-react';
import moment from 'moment';

const STATUS_CONFIG = {
  questionario_preenchido: { label: 'Questionário Preenchido', color: 'bg-blue-100 text-blue-700' },
  analisado_priscila: { label: 'Analisado PRISCILA', color: 'bg-purple-100 text-purple-700' },
  em_contato_comercial: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700' },
  proposta_aceita: { label: 'Proposta Aceita', color: 'bg-green-100 text-green-700' },
  proposta_recusada: { label: 'Proposta Recusada', color: 'bg-red-100 text-red-700' },
  kyc_iniciado: { label: 'KYC Iniciado', color: 'bg-teal-100 text-teal-700' },
  kyc_aprovado: { label: 'KYC Aprovado', color: 'bg-green-100 text-green-800' },
  kyc_revisao_manual: { label: 'KYC Revisão', color: 'bg-orange-100 text-orange-700' },
  ativado: { label: 'Ativado', color: 'bg-emerald-100 text-emerald-800' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600' },
};

const RISK_CONFIG = {
  BAIXO: { label: 'Baixo', color: 'bg-green-100 text-green-700' },
  MEDIO: { label: 'Médio', color: 'bg-yellow-100 text-yellow-700' },
  ALTO: { label: 'Alto', color: 'bg-orange-100 text-orange-700' },
  CRITICO: { label: 'Crítico', color: 'bg-red-100 text-red-700' },
  EM_ANALISE: { label: 'Em Análise', color: 'bg-slate-100 text-slate-600' },
};

const SUB_CAT_CONFIG = {
  MERCHAN: { label: 'Merchan', icon: ShoppingCart, color: 'text-blue-600' },
  GATEWAY: { label: 'Gateway', icon: Network, color: 'text-purple-600' },
  MARKETPLACE: { label: 'Marketplace', icon: Building2, color: 'text-orange-600' },
};

export default function LeadManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [subCatFilter, setSubCatFilter] = useState('all');
  const [sortField, setSortField] = useState('created_date');
  const [sortDir, setSortDir] = useState(-1);

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200)
  });

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => 
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.cpfCnpj || '').includes(s) ||
        (l.protocolo || '').toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (riskFilter !== 'all') result = result.filter(l => l.priscilaRiskLevel === riskFilter);
    if (subCatFilter !== 'all') result = result.filter(l => l.businessSubCategory === subCatFilter);

    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (sortField === 'priscilaQualityScore') return (sortDir === 1 ? 1 : -1) * ((a.priscilaQualityScore || 0) - (b.priscilaQualityScore || 0));
      return sortDir * String(aVal).localeCompare(String(bVal));
    });

    return result;
  }, [leads, search, statusFilter, riskFilter, subCatFilter, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    novos: leads.filter(l => l.status === 'questionario_preenchido' || l.status === 'analisado_priscila').length,
    emNegociacao: leads.filter(l => ['em_contato_comercial', 'proposta_enviada'].includes(l.status)).length,
    convertidos: leads.filter(l => ['proposta_aceita', 'kyc_iniciado', 'kyc_aprovado', 'ativado'].includes(l.status)).length,
    perdidos: leads.filter(l => l.status === 'perdido' || l.status === 'proposta_recusada').length,
  }), [leads]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(prev => prev * -1);
    else { setSortField(field); setSortDir(-1); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Gestão de Leads</h1>
          <p className="text-[var(--pagsmile-blue)]/70">Gerencie leads comerciais e acompanhe o funil de vendas</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{stats.total}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/70">Total de Leads</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold text-blue-600">{stats.novos}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/70">Novos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold text-amber-600">{stats.emNegociacao}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/70">Em Negociação</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold text-green-600">{stats.convertidos}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/70">Convertidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-2xl font-bold text-slate-500">{stats.perdidos}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/70">Perdidos</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input
            placeholder="Buscar por nome, email, CNPJ, protocolo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="Risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Riscos</SelectItem>
            {Object.entries(RISK_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subCatFilter} onValueChange={setSubCatFilter}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="MERCHAN">Merchan</SelectItem>
            <SelectItem value="GATEWAY">Gateway</SelectItem>
            <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('fullName')}>
                  <div className="flex items-center gap-1">Empresa <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('priscilaQualityScore')}>
                  <div className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead>Risco</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_date')}>
                  <div className="flex items-center gap-1">Data <ArrowUpDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
                    <p className="text-[var(--pagsmile-blue)]/60">Nenhum lead encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map(lead => {
                  const statusCfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'bg-slate-100 text-slate-600' };
                  const riskCfg = RISK_CONFIG[lead.priscilaRiskLevel] || { label: '-', color: 'bg-slate-50 text-slate-400' };
                  const subCatCfg = SUB_CAT_CONFIG[lead.businessSubCategory];
                  const SubCatIcon = subCatCfg?.icon || ShoppingCart;

                  return (
                    <TableRow key={lead.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-[var(--pagsmile-blue)] text-sm">{lead.fullName || lead.email}</p>
                          <p className="text-xs text-[var(--pagsmile-blue)]/60">{lead.cpfCnpj || lead.email}</p>
                          {lead.protocolo && (
                            <p className="text-xs font-mono text-[var(--pagsmile-blue)]/40 mt-0.5">{lead.protocolo}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {subCatCfg && (
                          <div className="flex items-center gap-1.5">
                            <SubCatIcon className={`w-4 h-4 ${subCatCfg.color}`} />
                            <span className="text-xs font-medium">{subCatCfg.label}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {lead.priscilaQualityScore !== undefined && lead.priscilaQualityScore !== null ? (
                          <span className={`text-sm font-bold ${
                            lead.priscilaQualityScore >= 70 ? 'text-green-600' :
                            lead.priscilaQualityScore >= 40 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {lead.priscilaQualityScore}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${riskCfg.color}`}>{riskCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[var(--pagsmile-blue)]/60">
                          {lead.created_date ? moment(lead.created_date).format('DD/MM/YY HH:mm') : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={createPageUrl('LeadDetails') + `?id=${lead.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}