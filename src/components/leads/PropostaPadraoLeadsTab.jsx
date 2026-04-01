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
import {
  Search, Eye, Trash2, Loader2, X, FileText, Phone, Rocket,
  ShoppingCart, Network, Building2, MessageSquareText
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import StandardProposalResponsesModal from './StandardProposalResponsesModal';

const SUB_CAT = {
  MERCHAN: { label: 'Merchan', icon: ShoppingCart },
  GATEWAY: { label: 'Gateway', icon: Network },
  MARKETPLACE: { label: 'Marketplace', icon: Building2 },
};

const STATUS_CONFIG = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  em_contato: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700', icon: '🟡' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700', icon: '🟣' },
  aceito: { label: 'Aceito', color: 'bg-green-100 text-green-700', icon: '🟢' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600', icon: '⚫' },
};

export default function PropostaPadraoLeadsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [responsesRecord, setResponsesRecord] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: spLeads = [], isLoading } = useQuery({
    queryKey: ['standard-proposal-leads'],
    queryFn: () => base44.entities.StandardProposalLead.list('-created_date', 500),
  });

  const filtered = useMemo(() => {
    let result = spLeads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.razaoSocial || '').toLowerCase().includes(s) ||
        (l.cnpj || '').includes(s) ||
        (l.contactName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') result = result.filter(l => l.status === statusFilter);
    return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [spLeads, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StandardProposalLead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-proposal-leads'] });
      toast.success('Registro excluído com sucesso');
      setDeleteTarget(null);
    }
  });

  React.useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;
  }

  if (spLeads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Rocket className="w-12 h-12 mx-auto text-[#002443]/20 mb-3" />
        <p className="text-[#002443]/50 font-medium">Nenhum fechamento via Proposta Padrão ainda</p>
        <p className="text-xs text-[#002443]/30 mt-1">Quando um cliente aceitar uma proposta padrão e preencher os dados, aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-[#2bc196]/20 px-3 py-1">
          {spLeads.length} fechamentos
        </Badge>
        <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
          {spLeads.filter(l => l.status === 'aceito').length} aceitos
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por empresa, CNPJ, e-mail..." className="pl-10 h-10" />
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
        {(search || statusFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
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
                <TableHead>Empresa</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>TPV Mensal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-[#002443]/40">Nenhum resultado encontrado</p>
                  </TableCell>
                </TableRow>
              ) : paginated.map(record => {
                const sCfg = STATUS_CONFIG[record.status] || { label: record.status || 'Novo', color: 'bg-blue-100 text-blue-700' };
                const sc = SUB_CAT[record.businessSubCategory];
                const ScIcon = sc?.icon || ShoppingCart;

                return (
                  <TableRow key={record.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell>
                      <p className="font-medium text-sm">{record.razaoSocial || record.email}</p>
                      <p className="text-[10px] text-[#002443]/50">{record.cnpj || ''}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#002443]/5 text-[#002443] text-xs border-0">
                        {record.segment || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sc && <div className="flex items-center gap-1"><ScIcon className="w-3 h-3" /><span className="text-xs">{sc.label}</span></div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{record.contactName || '-'}</p>
                      <p className="text-[10px] text-[#002443]/50">{record.email}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {record.tpvMensal ? `R$ ${record.tpvMensal.toLocaleString('pt-BR')}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#002443]/60">
                        {record.created_date ? moment(record.created_date).format('DD/MM/YY HH:mm') : '-'}
                      </span>
                    </TableCell>
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
              {deleteTarget && <><br /><strong>{deleteTarget.cnpj}</strong> - {deleteTarget.razaoSocial}</>}
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

      {/* Responses Modal — dedicado para Proposta Padrão */}
      <StandardProposalResponsesModal
        open={!!responsesRecord}
        onClose={() => setResponsesRecord(null)}
        record={responsesRecord}
      />
    </div>
  );
}