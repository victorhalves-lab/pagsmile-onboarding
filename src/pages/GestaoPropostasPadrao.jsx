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

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  ativa: { label: 'Ativa', color: 'bg-green-100 text-green-700' },
  inativa: { label: 'Inativa', color: 'bg-red-100 text-red-700' },
};

const SEGMENTS = ['Educação', 'Infoprodutos', 'E-commerce', 'SaaS', 'Gateway', 'Merchan', 'Marketplace'];

export default function GestaoPropostasPadrao() {
  const navigate = useNavigate();
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
      toast.success('Proposta padrão excluída');
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
    toast.success('Link copiado!');
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
              <h1 className="text-2xl font-bold text-white">Propostas Padrão</h1>
              <p className="text-white/60 text-sm mt-1">{filtered.length} modelos encontrados</p>
            </div>
          </div>
          <Button onClick={() => navigate('/CriarPropostaPadrao')} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> Nova Proposta Padrão
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, código ou segmento..." className="pl-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
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
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-[#002443]/30 mb-3" />
                    <p className="text-[#002443]/60">Nenhuma proposta padrão encontrada</p>
                    <Button variant="link" onClick={() => navigate('/CriarPropostaPadrao')} className="mt-2 text-[#2bc196]">Criar Primeira</Button>
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
            <AlertDialogTitle>Excluir Proposta Padrão</AlertDialogTitle>
            <AlertDialogDescription>Essa ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}