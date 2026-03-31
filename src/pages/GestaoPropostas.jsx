import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Search, Plus, Eye, Pencil, Send, Link2, Copy, Trash2,
  Loader2, X, AlertTriangle, FileText, List, Clock, CheckCircle, XCircle, History, FilePlus2, Building2, GitBranch, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import ProposalMetrics from '../components/proposals/ProposalMetrics';
import ProposalHistoryModal from '../components/proposals/ProposalHistoryModal';
import ProposalsByCompanyTab from '../components/proposals/ProposalsByCompanyTab';
import RentabilidadeDrawer from '../components/proposals/RentabilidadeDrawer';
import AssignSellerModal from '../components/proposals/AssignSellerModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GestaoPropostas() {
  const { t } = useTranslation();

  const STATUS_CONFIG = {
    rascunho: { label: t('proposals.status.draft'), color: 'bg-slate-100 text-slate-700', icon: '⚪' },
    enviada: { label: t('proposals.status.sent'), color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
    visualizada: { label: t('proposals.status.viewed'), color: 'bg-orange-100 text-orange-700', icon: '🟠' },
    contraproposta: { label: t('proposals.status.counter'), color: 'bg-blue-100 text-blue-700', icon: '🔵' },
    aceita: { label: t('proposals.status.accepted'), color: 'bg-green-100 text-green-700', icon: '🟢' },
    recusada: { label: t('proposals.status.rejected'), color: 'bg-red-100 text-red-700', icon: '🔴' },
    expirada: { label: t('proposals.status.expired'), color: 'bg-slate-100 text-slate-500', icon: '⚫' },
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [historyProposalId, setHistoryProposalId] = useState(null);
  const [rentabilidadeProposal, setRentabilidadeProposal] = useState(null);
  const [assignSellerProposal, setAssignSellerProposal] = useState(null);

  const [activeTab, setActiveTab] = useState('lista');

  const { data: allPropostas = [], isLoading } = useQuery({
    queryKey: ['propostas'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 500)
  });

  // Filtra apenas versões atuais para a lista principal
  const propostas = useMemo(() => allPropostas.filter(p => p.isCurrentVersion !== false), [allPropostas]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Proposal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success(t('gestao_propostas.deleted'));
      setDeleteId(null);
    }
  });

  const filtered = useMemo(() => {
    let result = propostas;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.codigo || '').toLowerCase().includes(s) ||
        (p.clienteNome || '').toLowerCase().includes(s) ||
        (p.clienteCnpj || '').includes(s)
      );
    }
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
    return result;
  }, [propostas, search, statusFilter]);

  const copyLink = (proposta) => {
    const url = window.location.origin + createPageUrl('PropostaPublica') + `?token=${proposta.tokenPublico}`;
    navigator.clipboard.writeText(url);
    toast.success(t('common.link_copied'));
  };

  const duplicar = async (proposta) => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const newProposta = {
      ...proposta,
      codigo: `PROP-${year}-${seq}`,
      status: 'rascunho',
      tokenPublico: Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
      sentDate: null,
      acceptedDate: null,
      rejectedDate: null,
      version: 1,
      previousVersionId: null,
      rootProposalId: null,
      isCurrentVersion: true,
    };
    delete newProposta.id;
    delete newProposta.created_date;
    delete newProposta.updated_date;
    delete newProposta.created_by;
    const created = await base44.entities.Proposal.create(newProposta);
    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    toast.success(t('gestao_propostas.duplicated'));
    navigate(createPageUrl('CriarProposta') + `?edit=${created.id}`);
  };

  const criarNovaVersao = async (proposta) => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const { id, created_date, updated_date, created_by, publicLinkCode, tokenPublico, sentDate, acceptedDate, rejectedDate, rejectedReason, counterProposalDetails, ...dataToCopy } = proposta;
    const newVersion = (proposta.version || 1) + 1;
    const rootId = proposta.rootProposalId || proposta.id;

    const newProposta = {
      ...dataToCopy,
      codigo: `PROP-${year}-${seq}`,
      status: 'rascunho',
      tokenPublico: Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
      version: newVersion,
      previousVersionId: proposta.id,
      rootProposalId: rootId,
      isCurrentVersion: true,
    };

    const created = await base44.entities.Proposal.create(newProposta);
    await base44.entities.Proposal.update(proposta.id, { isCurrentVersion: false });
    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    toast.success(t('gestao_propostas.version_created', { version: newVersion }));
    navigate(createPageUrl('CriarProposta') + `?edit=${created.id}`);
  };

  const isExpiring = (p) => {
    if (!p.validUntil) return false;
    const diff = moment(p.validUntil).diff(moment(), 'days');
    return diff <= 3 && diff >= 0;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <FileText className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('gestao_propostas.title')}</h1>
              <p className="text-white/60 text-sm mt-1">{t('gestao_propostas.found', { count: filtered.length })}</p>
            </div>
          </div>
          <Button onClick={() => navigate(createPageUrl('CriarProposta'))} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> {t('gestao_propostas.new')}
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <ProposalMetrics propostas={propostas} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#002443]/5">
          <TabsTrigger value="lista" className="gap-2 data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#002443]">
            <List className="w-4 h-4" /> {t('gestao_propostas.list_tab')}
          </TabsTrigger>
          <TabsTrigger value="empresa" className="gap-2 data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#002443]">
            <Building2 className="w-4 h-4" /> {t('gestao_propostas.by_company_tab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('gestao_propostas.search_placeholder')} className="pl-10 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('gestao_propostas.all_statuses')}</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('gestao_propostas.number')}</TableHead>
                     <TableHead>{t('gestao_propostas.company')}</TableHead>
                     <TableHead>Responsável</TableHead>
                     <TableHead>{t('gestao_propostas.model')}</TableHead>
                     <TableHead>{t('common.status')}</TableHead>
                     <TableHead>{t('gestao_propostas.timeline')}</TableHead>
                     <TableHead>{t('gestao_propostas.validity')}</TableHead>
                     <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
                        <p className="text-[var(--pagsmile-blue)]/60">{t('gestao_propostas.no_proposals')}</p>
                        <Button variant="link" onClick={() => navigate(createPageUrl('CriarProposta'))} className="mt-2 text-[var(--pagsmile-green)]">
                          {t('gestao_propostas.new')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(p => {
                    const sCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.rascunho;
                    const expiring = isExpiring(p);
                    const isFinalized = !['rascunho'].includes(p.status);
                    return (
                      <TableRow key={p.id} className="hover:bg-[#f4f4f4] transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm text-[var(--pagsmile-green)]">{p.codigo || '-'}</span>
                            {(p.version || 1) > 1 && (
                              <span className="text-[9px] bg-[#2bc196]/10 text-[#2bc196] px-1.5 py-0.5 rounded font-bold">v{p.version}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{p.clienteNome || '-'}</TableCell>
                         <TableCell>
                           {p.responsavelNome && p.responsavelNome !== 'sistema' ? (
                             <button onClick={() => setAssignSellerProposal(p)} className="flex items-center gap-1.5 group">
                               <div className="w-5 h-5 rounded-full bg-[#2bc196]/20 flex items-center justify-center text-[8px] font-bold text-[#2bc196]">
                                 {(p.responsavelNome)[0]?.toUpperCase()}
                               </div>
                               <span className="text-xs text-[#002443]/70 group-hover:text-[#2bc196] transition-colors truncate max-w-[80px]">{p.responsavelNome}</span>
                             </button>
                           ) : (
                             <button onClick={() => setAssignSellerProposal(p)} className="text-[10px] text-red-400 hover:text-[#2bc196] border border-dashed border-red-200 hover:border-[#2bc196] rounded-lg px-2 py-1 transition-all">
                               + Atribuir
                             </button>
                           )}
                         </TableCell>
                         <TableCell>
                          {p.businessSubCategory ? (
                            <Badge className={`text-[10px] border-0 ${
                              p.businessSubCategory === 'GATEWAY' ? 'bg-indigo-100 text-indigo-700' :
                              p.businessSubCategory === 'MARKETPLACE' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {p.businessSubCategory === 'MERCHAN' ? 'Merchant' : p.businessSubCategory === 'GATEWAY' ? 'Gateway' : 'Marketplace'}
                            </Badge>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-[var(--pagsmile-blue)]/60">{p.clienteCnpj || '-'}</TableCell>
                        <TableCell><Badge className={sCfg.color}>{sCfg.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-[10px]">
                            {p.sentDate && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Send className="w-2.5 h-2.5" />
                                {t('gestao_propostas.sent_on', { date: moment(p.sentDate).format('DD/MM') })}
                              </div>
                            )}
                            {p.acceptedDate && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-2.5 h-2.5" />
                                {t('gestao_propostas.accepted_on', { date: moment(p.acceptedDate).format('DD/MM') })}
                              </div>
                            )}
                            {p.rejectedDate && (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="w-2.5 h-2.5" />
                                {t('gestao_propostas.rejected_on', { date: moment(p.rejectedDate).format('DD/MM') })}
                              </div>
                            )}
                            {!p.sentDate && !p.acceptedDate && !p.rejectedDate && (
                              <span className="text-slate-400">{t('gestao_propostas.created_on', { date: moment(p.created_date).format('DD/MM') })}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {expiring && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                            <span className={`text-xs ${expiring ? 'text-amber-600 font-medium' : 'text-[var(--pagsmile-blue)]/60'}`}>
                              {p.validUntil ? moment(p.validUntil).format('DD/MM/YY') : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setRentabilidadeProposal(p)} title="Simular Rentabilidade" className="text-[#2bc196] hover:text-[#2bc196] hover:bg-[#2bc196]/10">
                              <DollarSign className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('PropostaDetalhes') + `?id=${p.id}`)} title="Ver detalhes">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {p.status === 'rascunho' && (
                              <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('CriarProposta') + `?edit=${p.id}`)} title="Editar rascunho">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {isFinalized && (
                              <Button variant="ghost" size="sm" onClick={() => criarNovaVersao(p)} title="Criar nova versão">
                                <GitBranch className="w-4 h-4 text-[#2bc196]" />
                              </Button>
                            )}
                            {p.tokenPublico && (
                              <a href={`${window.location.origin}/PropostaPublica?token=${p.tokenPublico}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" title="Ver proposta na mesa">
                                  <Link2 className="w-4 h-4" />
                                </Button>
                              </a>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => duplicar(p)} title="Duplicar proposta">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('CriarProposta') + `?templateFromId=${p.id}`)} title="Nova proposta com estas taxas">
                              <FilePlus2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setHistoryProposalId(p.id)} title="Histórico">
                              <History className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="text-red-500 hover:text-red-700">
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
          </div>
        </TabsContent>

        <TabsContent value="empresa" className="mt-4">
          <ProposalsByCompanyTab propostas={allPropostas} />
        </TabsContent>
      </Tabs>

      {/* History Modal */}
      <ProposalHistoryModal
        open={!!historyProposalId}
        onClose={() => setHistoryProposalId(null)}
        proposalId={historyProposalId}
      />

      {/* Assign Seller Modal */}
      <AssignSellerModal
        open={!!assignSellerProposal}
        onClose={() => setAssignSellerProposal(null)}
        proposal={assignSellerProposal || {}}
        onAssigned={() => queryClient.invalidateQueries({ queryKey: ['propostas'] })}
      />

      {/* Rentabilidade Drawer */}
      <RentabilidadeDrawer
        open={!!rentabilidadeProposal}
        onClose={() => setRentabilidadeProposal(null)}
        proposal={rentabilidadeProposal}
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gestao_propostas.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('gestao_propostas.delete_desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}