import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Eye, Trash2, Loader2, X, Globe, MessageSquareText, FileText } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import StandardProposalResponsesModal from './StandardProposalResponsesModal';

const STATUS_CONFIG = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  em_contato: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700' },
  aceito: { label: 'Aceito', color: 'bg-green-100 text-green-700' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600' },
};

export default function LandingPageLeadsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [responsesRecord, setResponsesRecord] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: lpLeads = [], isLoading } = useQuery({
    queryKey: ['landing-page-leads'],
    queryFn: () => base44.entities.LandingPageLead.list('-created_date', 500),
  });

  const filtered = useMemo(() => {
    let result = lpLeads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.razaoSocial || '').toLowerCase().includes(s) ||
        (l.cnpj || '').includes(s) ||
        (l.introducerName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [lpLeads, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LandingPageLead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-leads'] });
      toast.success('Excluído com sucesso');
      setDeleteTarget(null);
    }
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;

  if (lpLeads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Globe className="w-12 h-12 mx-auto text-[#002443]/20 mb-3" />
        <p className="text-[#002443]/50 font-medium">Nenhum lead via Landing Page ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">{lpLeads.length} leads via landing</Badge>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por empresa, CNPJ, introducer..." className="pl-10 h-10" />
        </div>
        {search && <Button variant="ghost" size="sm" onClick={() => setSearch('')}><X className="w-4 h-4 mr-1" /> Limpar</Button>}
      </div>

      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Parceiro (Introducer)</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>TPV Mensal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-[#002443]/40">Nenhum resultado</TableCell></TableRow>
              ) : paginated.map(record => {
                const sCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.novo;
                return (
                  <TableRow key={record.id} className="hover:bg-[#f4f4f4]">
                    <TableCell>
                      <p className="font-medium text-sm">{record.razaoSocial || record.email}</p>
                      <p className="text-[10px] text-[#002443]/50">{record.cnpj}</p>
                    </TableCell>
                    <TableCell>
                      {record.introducerName ? (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1">
                          <Globe className="w-3 h-3" />
                          {record.introducerName}
                        </Badge>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                      {record.slug && <p className="text-[10px] text-[#002443]/40 mt-0.5">/parceiro/{record.slug}</p>}
                    </TableCell>
                    <TableCell><Badge className="bg-[#002443]/5 text-[#002443] text-xs border-0">{record.segment || '-'}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge></TableCell>
                    <TableCell>
                      <p className="text-xs">{record.contactName || '-'}</p>
                      <p className="text-[10px] text-[#002443]/50">{record.email}</p>
                    </TableCell>
                    <TableCell><span className="text-sm font-mono">{record.tpvMensal ? `R$ ${record.tpvMensal.toLocaleString('pt-BR')}` : '-'}</span></TableCell>
                    <TableCell><span className="text-xs text-[#002443]/60">{record.created_date ? moment(record.created_date).format('DD/MM/YY HH:mm') : '-'}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setResponsesRecord(record)}>
                          <MessageSquareText className="w-3 h-3 mr-1" /> Respostas
                        </Button>
                        {record.leadId && (
                          <Link to={createPageUrl('LeadDetails') + `?id=${record.leadId}`}>
                            <Button variant="ghost" size="sm" className="h-7"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        )}
                        {record.leadId && (
                          <Link to={createPageUrl('CriarProposta') + `?lead=${record.leadId}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs"><FileText className="w-3 h-3 mr-1" /> Proposta</Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(record)} className="text-red-500 hover:text-red-700 h-7">
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
            <span className="text-xs text-[#002443]/60">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget && <><strong>{deleteTarget.cnpj}</strong> - {deleteTarget.razaoSocial}</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StandardProposalResponsesModal open={!!responsesRecord} onClose={() => setResponsesRecord(null)} record={responsesRecord} />
    </div>
  );
}