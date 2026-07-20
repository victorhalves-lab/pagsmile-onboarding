import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Search, Plus, Eye, Pencil, Link2, Copy, Trash2,
  Loader2, X, AlertTriangle, FileText, Clock, CheckCircle, XCircle, GitBranch, Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GestaoPropostasPix() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const STATUS_CONFIG = {
    rascunho: { label: t('proposals.status.draft'), color: 'bg-slate-100 text-slate-700', icon: '⚪' },
    enviada: { label: t('proposals.status.sent'), color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
    visualizada: { label: t('proposals.status.viewed'), color: 'bg-orange-100 text-orange-700', icon: '🟠' },
    contraproposta: { label: t('proposals.status.counter'), color: 'bg-blue-100 text-blue-700', icon: '🔵' },
    aceita: { label: t('proposals.status.accepted'), color: 'bg-green-100 text-green-700', icon: '🟢' },
    recusada: { label: t('proposals.status.rejected'), color: 'bg-red-100 text-red-700', icon: '🔴' },
    expirada: { label: t('proposals.status.expired'), color: 'bg-slate-100 text-slate-500', icon: '⚫' },
  };
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const { data: allPropostas = [], isLoading } = useQuery({
    queryKey: ['pix-propostas'],
    queryFn: () => base44.entities.PixProposal.list('-created_date', 500)
  });

  const propostas = useMemo(() => allPropostas.filter(p => p.isCurrentVersion !== false), [allPropostas]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PixProposal.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pix-propostas'] }); toast.success(t('gpx.deleted')); setDeleteId(null); }
  });

  const filtered = useMemo(() => {
    let result = propostas;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => (p.codigo || '').toLowerCase().includes(s) || (p.clienteNome || '').toLowerCase().includes(s) || (p.clienteCnpj || '').includes(s));
    }
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
    return result;
  }, [propostas, search, statusFilter]);

  const copyLink = (proposta) => {
    const url = proposta.publicSlug
      ? `${window.location.origin}/pix/${proposta.publicSlug}`
      : `${window.location.origin}/PropostaPixPublica?token=${proposta.tokenPublico}`;
    navigator.clipboard.writeText(url);
    toast.success(t('gpx.link_copied'));
  };

  const duplicar = async (proposta) => {
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const newProposta = { ...proposta, codigo: `PIX-${new Date().getFullYear()}-${seq}`, status: 'rascunho',
      tokenPublico: Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
      sentDate: null, acceptedDate: null, rejectedDate: null, version: 1, previousVersionId: null, rootProposalId: null, isCurrentVersion: true,
    };
    delete newProposta.id; delete newProposta.created_date; delete newProposta.updated_date; delete newProposta.created_by;
    const created = await base44.entities.PixProposal.create(newProposta);
    queryClient.invalidateQueries({ queryKey: ['pix-propostas'] });
    toast.success(t('gpx.duplicated'));
    navigate(`/CriarPropostaPix?edit=${created.id}`);
  };

  const criarNovaVersao = async (proposta) => {
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const { id, created_date, updated_date, created_by, tokenPublico, sentDate, acceptedDate, rejectedDate, rejectedReason, counterProposalDetails, ...dataToCopy } = proposta;
    const newVersion = (proposta.version || 1) + 1;
    const rootId = proposta.rootProposalId || proposta.id;
    const newProposta = { ...dataToCopy, codigo: `PIX-${new Date().getFullYear()}-${seq}`, status: 'rascunho',
      tokenPublico: Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
      version: newVersion, previousVersionId: proposta.id, rootProposalId: rootId, isCurrentVersion: true,
    };
    const created = await base44.entities.PixProposal.create(newProposta);
    await base44.entities.PixProposal.update(proposta.id, { isCurrentVersion: false });
    queryClient.invalidateQueries({ queryKey: ['pix-propostas'] });
    toast.success(t('gpx.version_created', { version: newVersion }));
    navigate(`/CriarPropostaPix?edit=${created.id}`);
  };

  const isExpiring = (p) => { if (!p.validUntil) return false; const diff = moment(p.validUntil).diff(moment(), 'days'); return diff <= 3 && diff >= 0; };

  // KPI counts
  const total = propostas.length;
  const enviadas = propostas.filter(p => ['enviada', 'visualizada'].includes(p.status)).length;
  const aceitas = propostas.filter(p => p.status === 'aceita').length;
  const recusadas = propostas.filter(p => p.status === 'recusada').length;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" /></div>;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10"><Banknote className="w-6 h-6 text-cyan-300" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('gpx.title')}</h1>
              <p className="text-white/60 text-sm mt-1">{t('gpx.found', { count: filtered.length })}</p>
            </div>
          </div>
          <Button onClick={() => navigate('/CriarPropostaPix')} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-2 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> {t('gpx.new')}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('gpx.total'), value: total, color: 'text-[#0A0A0A]' },
          { label: t('gpx.active'), value: enviadas, color: 'text-yellow-600' },
          { label: t('gpx.accepted'), value: aceitas, color: 'text-green-600' },
          { label: t('gpx.rejected'), value: recusadas, color: 'text-red-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#0A0A0A]/5 p-4 text-center">
            <p className="text-xs text-[#0A0A0A]/50 uppercase font-semibold">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('gpx.search_placeholder')} className="pl-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('gpx.all_statuses')}</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (<SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>))}
          </SelectContent>
        </Select>
        {(search || statusFilter !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}><X className="w-4 h-4" /></Button>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gpx.number')}</TableHead>
                <TableHead>{t('gpx.company')}</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>{t('gpx.pix_rate')}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{t('gpx.timeline')}</TableHead>
                <TableHead>{t('gpx.validity')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Banknote className="w-12 h-12 mx-auto text-[#0A0A0A]/30 mb-3" />
                    <p className="text-[#0A0A0A]/60">{t('gpx.no_proposals')}</p>
                    <Button variant="link" onClick={() => navigate('/CriarPropostaPix')} className="mt-2 text-[#1356E2]">{t('gpx.new')}</Button>
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const sCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.rascunho;
                const expiring = isExpiring(p);
                const isFinalized = p.status !== 'rascunho';
                const pixRate = p.rates?.pix;
                return (
                  <TableRow key={p.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm text-[#1356E2]">{p.codigo || '-'}</span>
                        {(p.version || 1) > 1 && <span className="text-[9px] bg-[#1356E2]/10 text-[#1356E2] px-1.5 py-0.5 rounded font-bold">v{p.version}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{p.clienteNome || '-'}</TableCell>
                    <TableCell className="text-sm text-[#0A0A0A]/60">{p.clienteCnpj || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-cyan-100 text-cyan-700 border-0">
                        {pixRate?.tipo === 'fixo' ? `R$ ${parseFloat(pixRate?.valor || 0).toFixed(2)}` : `${parseFloat(pixRate?.valor || 0).toFixed(2)}%`}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge className={sCfg.color}>{sCfg.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        {p.acceptedDate && <div className="flex items-center gap-1 text-green-600"><CheckCircle className="w-2.5 h-2.5" />{t('gpx.accepted_on', { date: moment(p.acceptedDate).format('DD/MM') })}</div>}
                        {p.rejectedDate && <div className="flex items-center gap-1 text-red-600"><XCircle className="w-2.5 h-2.5" />{t('gpx.rejected_on', { date: moment(p.rejectedDate).format('DD/MM') })}</div>}
                        {!p.acceptedDate && !p.rejectedDate && <span className="text-slate-400">{t('gpx.created_on', { date: moment(p.created_date).format('DD/MM') })}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {expiring && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        <span className={`text-xs ${expiring ? 'text-amber-600 font-medium' : 'text-[#0A0A0A]/60'}`}>{p.validUntil ? moment(p.validUntil).format('DD/MM/YY') : '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/PropostaPixDetalhes?id=${p.id}`)} title="Ver detalhes"><Eye className="w-4 h-4" /></Button>
                        {p.status === 'rascunho' && <Button variant="ghost" size="sm" onClick={() => navigate(`/CriarPropostaPix?edit=${p.id}`)} title="Editar"><Pencil className="w-4 h-4" /></Button>}
                        {isFinalized && <Button variant="ghost" size="sm" onClick={() => criarNovaVersao(p)} title="Nova versão"><GitBranch className="w-4 h-4 text-[#1356E2]" /></Button>}
                        {p.tokenPublico && <Button variant="ghost" size="sm" onClick={() => copyLink(p)} title="Copiar link"><Link2 className="w-4 h-4" /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => duplicar(p)} title="Duplicar"><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gpx.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('gpx.delete_desc')}</AlertDialogDescription>
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