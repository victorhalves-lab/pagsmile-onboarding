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
  Search, Plus, Eye, Pencil, Send, Link2, Copy, Trash2,
  Loader2, X, AlertTriangle, FileText, List, Clock, CheckCircle, XCircle, History
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import ProposalMetrics from '../components/proposals/ProposalMetrics';
import ProposalHistoryModal from '../components/proposals/ProposalHistoryModal';

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: '⚪' },
  enviada: { label: 'Enviada', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  visualizada: { label: 'Visualizada', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  contraproposta: { label: 'Contraproposta', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700', icon: '🟢' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700', icon: '🔴' },
  expirada: { label: 'Expirada', color: 'bg-slate-100 text-slate-500', icon: '⚫' },
};

export default function GestaoPropostas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [historyProposalId, setHistoryProposalId] = useState(null);

  const { data: propostas = [], isLoading } = useQuery({
    queryKey: ['propostas'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 200)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Proposal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success('Proposta excluída');
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
    toast.success('Link copiado!');
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
    };
    delete newProposta.id;
    delete newProposta.created_date;
    delete newProposta.updated_date;
    delete newProposta.created_by;
    const created = await base44.entities.Proposal.create(newProposta);
    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    toast.success('Proposta duplicada!');
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
              <h1 className="text-2xl font-bold text-white">Gestão de Propostas</h1>
              <p className="text-white/60 text-sm mt-1">{filtered.length} propostas encontradas</p>
            </div>
          </div>
          <Button onClick={() => navigate(createPageUrl('CriarProposta'))} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 rounded-xl shadow-md">
            <Plus className="w-4 h-4" /> Nova Proposta
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <ProposalMetrics propostas={propostas} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número, empresa ou CNPJ..." className="pl-10 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
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
                <TableHead>Número</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
                    <p className="text-[var(--pagsmile-blue)]/60">Nenhuma proposta encontrada</p>
                    <Button variant="link" onClick={() => navigate(createPageUrl('CriarProposta'))} className="mt-2 text-[var(--pagsmile-green)]">
                      Nova Proposta
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const sCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.rascunho;
                const expiring = isExpiring(p);
                return (
                  <TableRow key={p.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell>
                      <span className="font-mono text-sm text-[var(--pagsmile-green)]">{p.codigo || '-'}</span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{p.clienteNome || '-'}</TableCell>
                    <TableCell className="text-sm text-[var(--pagsmile-blue)]/60">{p.clienteCnpj || '-'}</TableCell>
                    <TableCell><Badge className={sCfg.color}>{sCfg.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        {p.sentDate && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Send className="w-2.5 h-2.5" />
                            Enviada {moment(p.sentDate).format('DD/MM')}
                          </div>
                        )}
                        {p.acceptedDate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Aceita {moment(p.acceptedDate).format('DD/MM')}
                          </div>
                        )}
                        {p.rejectedDate && (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-2.5 h-2.5" />
                            Recusada {moment(p.rejectedDate).format('DD/MM')}
                          </div>
                        )}
                        {!p.sentDate && !p.acceptedDate && !p.rejectedDate && (
                          <span className="text-slate-400">Criada {moment(p.created_date).format('DD/MM')}</span>
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
                        <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('CriarProposta') + `?edit=${p.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {['rascunho', 'enviada', 'visualizada'].includes(p.status) && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('CriarProposta') + `?edit=${p.id}`)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {p.status !== 'rascunho' && (
                          <Button variant="ghost" size="sm" onClick={() => copyLink(p)}>
                            <Link2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => duplicar(p)}>
                          <Copy className="w-4 h-4" />
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

      {/* History Modal */}
      <ProposalHistoryModal
        open={!!historyProposalId}
        onClose={() => setHistoryProposalId(null)}
        proposalId={historyProposalId}
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
            <AlertDialogDescription>Essa ação é irreversível. A proposta será removida permanentemente.</AlertDialogDescription>
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