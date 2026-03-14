import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Search, ClipboardList, Eye, Trash2, X,
  ShoppingCart, Network, Building2, Phone, FileText, 
  AlertTriangle, Shield, MessageSquareText, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import LeadSLAIndicator from './LeadSLAIndicator';
import LeadQualifierBadge from './LeadQualifierBadge';

const STATUS_CONFIG = {
  questionario_preenchido: { label: 'Novo', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  analisado_priscila: { label: 'Analisado', color: 'bg-purple-100 text-purple-700', icon: '🟣' },
  em_contato_comercial: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700', icon: '🟡' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700', icon: '🟣' },
  proposta_aceita: { label: 'Proposta Aceita', color: 'bg-green-100 text-green-700', icon: '🟢' },
  proposta_recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: '🔴' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600', icon: '⚫' },
};

const RISK_CONFIG = {
  BAIXO: { label: 'Baixo', color: 'bg-green-100 text-green-700', icon: Shield },
  MEDIO: { label: 'Médio', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  ALTO: { label: 'Alto', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  CRITICO: { label: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  EM_ANALISE: { label: 'Em Análise', color: 'bg-slate-100 text-slate-600', icon: Shield },
};

const SUB_CAT = { MERCHAN: { label: 'Merchan', icon: ShoppingCart }, GATEWAY: { label: 'Gateway', icon: Network }, MARKETPLACE: { label: 'Marketplace', icon: Building2 } };

const getScoreColor = (score) => {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

export default function IntroducerLeadsTab({ leads, onDelete, onViewResponses }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodoFilter, setPeriodoFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [introducerFilter, setIntroducerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Only leads from introducers
  const introducerLeads = useMemo(() => leads.filter(l => l.introducerReferralCode), [leads]);

  // Introducer options for filter
  const introducerOptions = useMemo(() => {
    const map = new Map();
    introducerLeads.forEach(l => {
      if (l.introducerReferralCode && l.introducerName) {
        map.set(l.introducerReferralCode, l.introducerName);
      }
    });
    return Array.from(map.entries());
  }, [introducerLeads]);

  React.useEffect(() => { setPage(1); }, [search, statusFilter, periodoFilter, riskFilter, sortBy, introducerFilter]);

  const filtered = useMemo(() => {
    let result = introducerLeads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.cpfCnpj || '').includes(s) ||
        (l.contactName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.protocolo || '').toLowerCase().includes(s) ||
        (l.introducerName || '').toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    if (periodoFilter !== 'all') {
      const now = moment();
      const map = { hoje: 0, '7dias': 7, '30dias': 30, '90dias': 90 };
      const days = map[periodoFilter];
      if (days === 0) result = result.filter(l => moment(l.created_date).isSame(now, 'day'));
      else result = result.filter(l => moment(l.created_date).isAfter(now.clone().subtract(days, 'days')));
    }
    if (riskFilter !== 'all') result = result.filter(l => l.priscilaRiskLevel === riskFilter);
    if (introducerFilter !== 'all') result = result.filter(l => l.introducerReferralCode === introducerFilter);
    if (sortBy === 'score_desc') result = [...result].sort((a, b) => (b.priscilaQualityScore || 0) - (a.priscilaQualityScore || 0));
    else if (sortBy === 'score_asc') result = [...result].sort((a, b) => (a.priscilaQualityScore || 0) - (b.priscilaQualityScore || 0));
    else if (sortBy === 'tpv') result = [...result].sort((a, b) => (b.tpvMensal || 0) - (a.tpvMensal || 0));
    else result = [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return result;
  }, [introducerLeads, search, statusFilter, periodoFilter, riskFilter, sortBy, introducerFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const hasFilters = search || statusFilter !== 'all' || periodoFilter !== 'all' || riskFilter !== 'all' || introducerFilter !== 'all';

  const handleAction = async (lead, action) => {
    if (action === 'contact') {
      await base44.entities.Lead.update(lead.id, { status: 'em_contato_comercial', lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({ leadId: lead.id, activityType: 'contato_iniciado', description: 'Contato iniciado', performedBy: 'admin', activityDate: new Date().toISOString() });
      queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
      toast.success('Status atualizado para "Em Contato"');
    } else if (action === 'proposal') {
      navigate(createPageUrl('CriarProposta') + `?lead=${lead.id}`);
    } else if (action === 'responses') {
      onViewResponses(lead);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por CNPJ, empresa, introducer..." className="pl-10 h-10" />
        </div>
        <Select value={introducerFilter} onValueChange={setIntroducerFilter}>
          <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Introducer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Introducers</SelectItem>
            {introducerOptions.map(([code, name]) => (
              <SelectItem key={code} value={code}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
          <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="7dias">Últimos 7 dias</SelectItem>
            <SelectItem value="30dias">Últimos 30 dias</SelectItem>
            <SelectItem value="90dias">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[150px] h-10"><SelectValue placeholder="Risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os riscos</SelectItem>
            {Object.entries(RISK_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[170px] h-10"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Mais recentes</SelectItem>
            <SelectItem value="score_desc">Maior score</SelectItem>
            <SelectItem value="score_asc">Menor score</SelectItem>
            <SelectItem value="tpv">Maior TPV</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setPeriodoFilter('all'); setRiskFilter('all'); setIntroducerFilter('all'); }}>
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Introducer</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Lead IA</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>TPV Mensal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <UserPlus className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
                    <p className="text-[var(--pagsmile-blue)]/60">
                      {hasFilters ? 'Nenhum resultado com esses filtros' : 'Nenhum questionário de Introducer recebido'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : paginated.map(lead => {
                const sCfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'bg-slate-100' };
                const sc = SUB_CAT[lead.businessSubCategory];
                const ScIcon = sc?.icon || ShoppingCart;
                const canContact = ['questionario_preenchido', 'analisado_priscila'].includes(lead.status);
                const canProposal = ['questionario_preenchido', 'analisado_priscila', 'em_contato_comercial'].includes(lead.status) && lead.priscilaRiskLevel !== 'CRITICO';
                return (
                  <TableRow key={lead.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell><span className="font-mono text-xs text-[var(--pagsmile-green)]">{lead.protocolo || '-'}</span></TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{lead.fullName || lead.email}</p>
                      <p className="text-[10px] text-[var(--pagsmile-blue)]/50">{lead.cpfCnpj || ''}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700 text-[10px] border-0">{lead.introducerName}</Badge>
                    </TableCell>
                    <TableCell>
                      {sc && <div className="flex items-center gap-1"><ScIcon className="w-3 h-3" /><span className="text-xs">{sc.label}</span></div>}
                    </TableCell>
                    <TableCell><Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge></TableCell>
                    <TableCell>
                      {lead.priscilaQualityScore != null ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-bold border ${getScoreColor(lead.priscilaQualityScore)}`}>
                          {lead.priscilaQualityScore}
                        </span>
                      ) : <span className="text-xs text-slate-400">Pendente</span>}
                    </TableCell>
                    <TableCell><LeadQualifierBadge lead={lead} size="xs" /></TableCell>
                    <TableCell>
                      {lead.priscilaRiskLevel ? (() => {
                        const rCfg = RISK_CONFIG[lead.priscilaRiskLevel];
                        if (!rCfg) return <span className="text-xs">{lead.priscilaRiskLevel}</span>;
                        const RIcon = rCfg.icon;
                        return <Badge className={`text-xs gap-1 ${rCfg.color}`}><RIcon className="w-3 h-3" />{rCfg.label}</Badge>;
                      })() : <span className="text-xs text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">{lead.tpvMensal ? `R$ ${lead.tpvMensal.toLocaleString('pt-BR')}` : '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[var(--pagsmile-blue)]/60">{lead.created_date ? moment(lead.created_date).format('DD/MM/YY HH:mm') : '-'}</span>
                        <LeadSLAIndicator lead={lead} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canContact && (
                          <Button variant="default" size="sm" className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white h-7 text-xs" onClick={() => handleAction(lead, 'contact')}>
                            <Phone className="w-3 h-3 mr-1" /> Iniciar Contato
                          </Button>
                        )}
                        {canProposal && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(lead, 'proposal')}>
                            <FileText className="w-3 h-3 mr-1" /> Gerar Proposta
                          </Button>
                        )}
                        {lead.questionnaireData && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleAction(lead, 'responses')}>
                            <MessageSquareText className="w-3 h-3 mr-1" /> Ver Respostas
                          </Button>
                        )}
                        <Link to={createPageUrl('LeadDetails') + `?id=${lead.id}`}>
                          <Button variant="ghost" size="sm" className="h-7"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(lead)} className="text-red-500 hover:text-red-700 h-7">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#002443]/5">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="text-xs text-[var(--pagsmile-blue)]/60">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        )}
      </div>
    </div>
  );
}