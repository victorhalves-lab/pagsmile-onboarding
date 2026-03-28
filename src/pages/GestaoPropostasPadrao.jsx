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
import { Search, Plus, Eye, Pencil, Trash2, Loader2, X, FileText, Tag, Copy, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import SegmentQuickLinks from '@/components/proposals/SegmentQuickLinks';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const SEGMENTS = ['Educação', 'Infoprodutos', 'E-commerce', 'SaaS', 'Gateway', 'Merchan', 'Marketplace'];

export default function GestaoPropostasPadrao() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const STATUS_CONFIG = {
    rascunho: { label: t('proposals.status.draft'), color: 'bg-slate-100 text-slate-700' },
    ativa: { label: t('proposals.status.accepted'), color: 'bg-green-100 text-green-700' },
    inativa: { label: t('proposals.status.rejected'), color: 'bg-red-100 text-red-700' },
  };
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['std-proposals'],
    queryFn: () => base44.entities.StandardProposal.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StandardProposal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['std-proposals'] });
      toast.success(t('gsp.deleted'));
      setDeleteId(null);
    },
  });

  const filtered = useMemo(() => {
    let result = proposals;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => (p.templateName || '').toLowerCase().includes(s) || (p.codigo || '').toLowerCase().includes(s) || (p.segment || '').toLowerCase().includes(s));
    }
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
    if (segmentFilter !== 'all') result = result.filter(p => p.segment === segmentFilter);
    return result;
  }, [proposals, search, statusFilter, segmentFilter]);

  const copyLink = (p) => {
    const url = `${window.location.origin}/PropostaPadraoPublica?token=${p.tokenPublico}`;
    navigator.clipboard.writeText(url);
    toast.success(t('gsp.link_copied'));
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10"><Tag className="w-6 h-6 text-[#5cf7cf]" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('gsp.title')}</h1>
              <p className="text-white/60 text-sm mt-1">{t('gsp.found', { count: filtered.length })}</p>
            </div>
          </div>
          <Button onClick={() => navigate('/CriarPropostaPadrao')} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> {t('gsp.new')}
          </Button>
        </div>
      </div>

      {/* Links Rápidos por Segmento */}
      <SegmentQuickLinks proposals={proposals} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('gsp.search_placeholder')} className="pl-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('gsp.all_statuses')}</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder={t('gsp.segment')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('gsp.all_segments')}</SelectItem>
            {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== 'all' || segmentFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setSegmentFilter('all'); }}><X className="w-4 h-4" /></Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gsp.code')}</TableHead>
                <TableHead>{t('gsp.name')}</TableHead>
                <TableHead>{t('gsp.segment')}</TableHead>
                <TableHead>{t('gsp.model')}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{t('gsp.created')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-[#002443]/30 mb-3" />
                    <p className="text-[#002443]/60">{t('gsp.no_proposals')}</p>
                    <Button variant="link" onClick={() => navigate('/CriarPropostaPadrao')} className="mt-2 text-[#2bc196]">{t('gsp.create_first')}</Button>
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const sCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.rascunho;
                return (
                  <TableRow key={p.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell><span className="font-mono text-sm text-[#2bc196]">{p.codigo || '-'}</span></TableCell>
                    <TableCell className="font-medium text-sm">{p.templateName}</TableCell>
                    <TableCell><Badge className="bg-[#2bc196]/10 text-[#002443] border-0">{p.segment}</Badge></TableCell>
                    <TableCell>
                      {p.businessSubCategory ? (
                        <Badge className={`text-[10px] border-0 ${p.businessSubCategory === 'GATEWAY' ? 'bg-indigo-100 text-indigo-700' : p.businessSubCategory === 'MARKETPLACE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {p.businessSubCategory === 'MERCHAN' ? 'Merchant' : p.businessSubCategory === 'GATEWAY' ? 'Gateway' : 'Marketplace'}
                        </Badge>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </TableCell>
                    <TableCell><Badge className={sCfg.color}>{sCfg.label}</Badge></TableCell>
                    <TableCell className="text-xs text-[#002443]/60">{moment(p.created_date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/PropostaPadraoDetalhes?id=${p.id}`)} title="Ver detalhes"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/CriarPropostaPadrao?edit=${p.id}`)} title="Editar"><Pencil className="w-4 h-4" /></Button>
                        {p.tokenPublico && p.status === 'ativa' && (
                          <Button variant="ghost" size="sm" onClick={() => copyLink(p)} title="Copiar link público"><Link2 className="w-4 h-4 text-[#2bc196]" /></Button>
                        )}
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
            <AlertDialogTitle>{t('gsp.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('gsp.delete_desc')}</AlertDialogDescription>
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