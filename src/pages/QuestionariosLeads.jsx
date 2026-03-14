import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, ClipboardList, Download, Eye, Trash2, Loader2, X,
  ShoppingCart, Network, Building2, ArrowUpDown, RefreshCw, Zap,
  Phone, FileText, AlertTriangle, Shield, TrendingUp, MessageSquareText
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import QuestionarioSimplificadoCard from '../components/questionario-simplificado/QuestionarioSimplificadoCard';
import LeadSLAIndicator from '../components/leads/LeadSLAIndicator';
import LeadQualifierBadge from '../components/leads/LeadQualifierBadge';
import QuestionnaireResponsesModal from '../components/leads/QuestionnaireResponsesModal';

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

const getScoreColor = (score) => {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getActionButtons = (lead, navigate) => {
  const actions = [];
  if (['questionario_preenchido', 'analisado_priscila'].includes(lead.status)) {
    actions.push({ label: 'Iniciar Contato', icon: Phone, variant: 'default', action: 'contact' });
  }
  if (['questionario_preenchido', 'analisado_priscila', 'em_contato_comercial'].includes(lead.status) && lead.priscilaRiskLevel !== 'CRITICO') {
    actions.push({ label: 'Gerar Proposta', icon: FileText, variant: 'outline', action: 'proposal' });
  }
  if (lead.questionnaireData) {
    actions.push({ label: 'Ver Respostas', icon: MessageSquareText, variant: 'outline', action: 'responses' });
  }
  return actions;
};

const SUB_CAT = { MERCHAN: { label: 'Merchan', icon: ShoppingCart }, GATEWAY: { label: 'Gateway', icon: Network }, MARKETPLACE: { label: 'Marketplace', icon: Building2 } };

export default function QuestionariosLeads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodoFilter, setPeriodoFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('completo');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [responsesModalLead, setResponsesModalLead] = useState(null);
  const [introducerFilter, setIntroducerFilter] = useState('all');

  // Read introducer filter from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intro = params.get('introducer');
    if (intro) setIntroducerFilter(intro);
  }, []);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [search, statusFilter, periodoFilter, riskFilter, sortBy, introducerFilter]);
  const itemsPerPage = 10;

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads-questionarios'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const { data: questionariosSimplificados = [], isLoading: loadingSimplificados, refetch: refetchSimplificados } = useQuery({
    queryKey: ['questionarios-simplificados'],
    queryFn: () => base44.entities.QuestionarioSimplificado.list('-created_date', 500)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
      toast.success('Questionário excluído');
      setDeleteTarget(null);
    }
  });

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.cpfCnpj || '').includes(s) ||
        (l.contactName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.protocolo || '').toLowerCase().includes(s)
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
    // Sort
    if (sortBy === 'score_desc') result = [...result].sort((a, b) => (b.priscilaQualityScore || 0) - (a.priscilaQualityScore || 0));
    else if (sortBy === 'score_asc') result = [...result].sort((a, b) => (a.priscilaQualityScore || 0) - (b.priscilaQualityScore || 0));
    else if (sortBy === 'tpv') result = [...result].sort((a, b) => (b.tpvMensal || 0) - (a.tpvMensal || 0));
    else result = [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return result;
  }, [leads, search, statusFilter, periodoFilter, riskFilter, sortBy, introducerFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLeads = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Stats
  const thisMonth = leads.filter(l => moment(l.created_date).isSame(moment(), 'month')).length;
  const aguardando = leads.filter(l => ['questionario_preenchido', 'analisado_priscila'].includes(l.status)).length;

  const hasFilters = search || statusFilter !== 'all' || periodoFilter !== 'all' || riskFilter !== 'all' || introducerFilter !== 'all';

  // Get unique introducer codes from leads for filter dropdown
  const introducerOptions = useMemo(() => {
    const map = new Map();
    leads.forEach(l => {
      if (l.introducerReferralCode && l.introducerName) {
        map.set(l.introducerReferralCode, l.introducerName);
      }
    });
    return Array.from(map.entries()); // [[code, name], ...]
  }, [leads]);

  // Stats aprimorados
  const highScoreLeads = leads.filter(l => (l.priscilaQualityScore || 0) >= 70).length;
  const criticalLeads = leads.filter(l => l.priscilaRiskLevel === 'CRITICO' || l.priscilaRiskLevel === 'ALTO').length;

  const exportCSV = () => {
    const headers = ['Protocolo', 'CNPJ', 'Razão Social', 'Contato', 'Email', 'TPV', 'Score', 'Status', 'Origem', 'Data'];
    const rows = filtered.map(l => [
      l.protocolo, l.cpfCnpj, l.fullName, l.contactName, l.email,
      l.tpvMensal, l.priscilaQualityScore, l.status, l.origemLead,
      l.created_date ? moment(l.created_date).format('DD/MM/YYYY') : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questionarios_${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado com sucesso!');
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;
  }

  const handleVerDetalhes = (q) => {
    if (q.lead_id) {
      navigate(createPageUrl('LeadDetails') + `?id=${q.lead_id}`);
    } else {
      toast.info(`Protocolo: ${q.protocolo} | ${q.nome_empresa} | CNPJ: ${q.cnpj} | Contato: ${q.contato_nome} (${q.contato_email})`);
    }
  };

  const handleVincularLead = async (q) => {
    const lead = await base44.entities.Lead.create({
      email: q.contato_email,
      fullName: q.nome_empresa,
      cpfCnpj: q.cnpj,
      phone: q.contato_telefone,
      contactName: q.contato_nome,
      contactRole: q.contato_cargo,
      status: 'em_contato_comercial',
      businessSubCategory: 'MERCHAN',
      onboardingLinkCode: q.onboarding_link_code || '',
      lastInteractionDate: new Date().toISOString(),
    });
    await base44.entities.QuestionarioSimplificado.update(q.id, { status: 'vinculado', lead_id: lead.id });
    await base44.entities.LeadActivity.create({
      leadId: lead.id,
      activityType: 'contato_iniciado',
      description: `Lead criado a partir de questionário simplificado (${q.protocolo})`,
      performedBy: 'admin',
      activityDate: new Date().toISOString()
    });
    queryClient.invalidateQueries({ queryKey: ['questionarios-simplificados'] });
    queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
    toast.success('Lead criado e vinculado!');
  };

  const handleGerarProposta = (q) => {
    const leadId = q.lead_id;
    if (leadId) {
      navigate(createPageUrl('CriarProposta') + `?lead=${leadId}`);
    } else {
      toast.info('Vincule a um lead primeiro para gerar proposta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <ClipboardList className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Questionários Recebidos</h1>
              <div className="flex gap-3 text-xs text-white/60 mt-1.5">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{thisMonth} este mês</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{aguardando} aguardando</span>
                <span className="bg-[#2bc196]/20 text-[#5cf7cf] px-2 py-0.5 rounded-md font-medium">{highScoreLeads} alto score</span>
                {criticalLeads > 0 && <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md font-medium">{criticalLeads} risco alto/crítico</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="border-white/20 text-white hover:bg-white/10 rounded-lg"><Download className="w-4 h-4 mr-1" /> Exportar</Button>
            <Button variant="outline" size="sm" onClick={() => { refetch(); refetchSimplificados(); }} className="border-white/20 text-white hover:bg-white/10 rounded-lg"><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="completo" className="gap-1">
            <ClipboardList className="w-3 h-3" />
            Completo ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="simplificado" className="gap-1">
            <Zap className="w-3 h-3" />
            Simplificado ({questionariosSimplificados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simplificado" className="mt-4">
          {loadingSimplificados ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>
          ) : questionariosSimplificados.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Zap className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
              <p className="text-[var(--pagsmile-blue)]/60">Nenhum questionário simplificado recebido</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questionariosSimplificados.map(q => (
                <QuestionarioSimplificadoCard
                  key={q.id}
                  questionario={q}
                  onVerDetalhes={handleVerDetalhes}
                  onVincularLead={handleVincularLead}
                  onGerarProposta={handleGerarProposta}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completo" className="mt-4 space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por CNPJ, razão social, contato, email..." className="pl-10 h-10" />
        </div>
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
        {introducerOptions.length > 0 && (
          <Select value={introducerFilter} onValueChange={setIntroducerFilter}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Introducer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Introducers</SelectItem>
              {introducerOptions.map(([code, name]) => (
                <SelectItem key={code} value={code}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Lead IA</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>TPV Mensal</TableHead>
                <TableHead>Introducer</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12">
                    <ClipboardList className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
                    <p className="text-[var(--pagsmile-blue)]/60">
                      {hasFilters ? 'Nenhum resultado com esses filtros' : 'Nenhum questionário recebido'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : paginatedLeads.map(lead => {
                const sCfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'bg-slate-100' };
                const sc = SUB_CAT[lead.businessSubCategory];
                const ScIcon = sc?.icon || ShoppingCart;
                return (
                  <TableRow key={lead.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell><span className="font-mono text-xs text-[var(--pagsmile-green)]">{lead.protocolo || '-'}</span></TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{lead.fullName || lead.email}</p>
                      <p className="text-[10px] text-[var(--pagsmile-blue)]/50">{lead.cpfCnpj || ''}</p>
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
                    <TableCell>
                      <LeadQualifierBadge lead={lead} size="xs" />
                    </TableCell>
                    <TableCell>
                      {lead.priscilaRiskLevel ? (() => {
                        const rCfg = RISK_CONFIG[lead.priscilaRiskLevel];
                        if (!rCfg) return <span className="text-xs">{lead.priscilaRiskLevel}</span>;
                        const RIcon = rCfg.icon;
                        return (
                          <Badge className={`text-xs gap-1 ${rCfg.color}`}>
                            <RIcon className="w-3 h-3" />
                            {rCfg.label}
                          </Badge>
                        );
                      })() : <span className="text-xs text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {lead.tpvMensal ? `R$ ${lead.tpvMensal.toLocaleString('pt-BR')}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {lead.introducerName ? (
                        <Badge className="bg-purple-100 text-purple-700 text-[10px] border-0">{lead.introducerName}</Badge>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[var(--pagsmile-blue)]/60">
                          {lead.created_date ? moment(lead.created_date).format('DD/MM/YY HH:mm') : '-'}
                        </span>
                        <LeadSLAIndicator lead={lead} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getActionButtons(lead, navigate).map((btn, i) => {
                          const BIcon = btn.icon;
                          return (
                            <Button
                              key={i}
                              variant={btn.variant === 'default' ? 'default' : 'outline'}
                              size="sm"
                              className={btn.variant === 'default' ? 'bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white h-7 text-xs' : 'h-7 text-xs'}
                              onClick={async () => {
                                if (btn.action === 'contact') {
                                  await base44.entities.Lead.update(lead.id, { status: 'em_contato_comercial', lastInteractionDate: new Date().toISOString() });
                                  await base44.entities.LeadActivity.create({ leadId: lead.id, activityType: 'contato_iniciado', description: 'Contato iniciado', performedBy: 'admin', activityDate: new Date().toISOString() });
                                  queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
                                  toast.success('Status atualizado para "Em Contato"');
                                } else if (btn.action === 'proposal') {
                                  navigate(createPageUrl('CriarProposta') + `?lead=${lead.id}`);
                                } else if (btn.action === 'responses') {
                                  setResponsesModalLead(lead);
                                }
                              }}
                            >
                              <BIcon className="w-3 h-3 mr-1" />
                              {btn.label}
                            </Button>
                          );
                        })}
                        <Link to={createPageUrl('LeadDetails') + `?id=${lead.id}`}>
                          <Button variant="ghost" size="sm" className="h-7"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lead)} className="text-red-500 hover:text-red-700 h-7">
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

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Questionário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados serão perdidos.
              {deleteTarget && <><br /><strong>{deleteTarget.cpfCnpj}</strong> - {deleteTarget.protocolo}</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Questionnaire Responses Modal */}
      <QuestionnaireResponsesModal
        open={!!responsesModalLead}
        onClose={() => setResponsesModalLead(null)}
        lead={responsesModalLead}
      />
      </TabsContent>
      </Tabs>
    </div>
  );
}