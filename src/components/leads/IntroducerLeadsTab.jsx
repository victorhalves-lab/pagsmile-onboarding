import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Eye, Trash2, Loader2, X,
  ShoppingCart, Network, Building2, Phone, FileText,
  MessageSquareText, UserPlus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import LeadQualifierBadge from './LeadQualifierBadge';
import ReassignComplianceModal from './ReassignComplianceModal';

const SUB_CAT = { MERCHAN: { label: 'Merchan', icon: ShoppingCart }, GATEWAY: { label: 'Gateway', icon: Network }, MARKETPLACE: { label: 'Marketplace', icon: Building2 } };

const STATUS_CONFIG = {
  novo: { label: 'Novo', color: 'bg-blue-100 text-blue-700' },
  em_contato: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700' },
  aceito: { label: 'Aceito', color: 'bg-green-100 text-green-700' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600' },
};

export default function IntroducerLeadsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [introducerFilter, setIntroducerFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: introducerLeads = [], isLoading } = useQuery({
    queryKey: ['introducer-leads'],
    queryFn: () => base44.entities.IntroducerLead.list('-created_date', 500),
  });

  const introducerOptions = useMemo(() => {
    const map = new Map();
    introducerLeads.forEach(l => {
      if (l.introducerReferralCode && l.introducerName) {
        map.set(l.introducerReferralCode, l.introducerName);
      }
    });
    return Array.from(map.entries());
  }, [introducerLeads]);

  const filtered = useMemo(() => {
    let result = introducerLeads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        (l.fullName || '').toLowerCase().includes(s) ||
        (l.cpfCnpj || '').includes(s) ||
        (l.contactName || '').toLowerCase().includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.introducerName || '').toLowerCase().includes(s)
      );
    }
    if (introducerFilter !== 'all') result = result.filter(l => l.introducerReferralCode === introducerFilter);
    return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [introducerLeads, search, introducerFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IntroducerLead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['introducer-leads'] });
      toast.success('Excluído com sucesso');
      setDeleteTarget(null);
    }
  });

  React.useEffect(() => { setPage(1); }, [search, introducerFilter]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;

  if (introducerLeads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <UserPlus className="w-12 h-12 mx-auto text-[#002443]/20 mb-3" />
        <p className="text-[#002443]/50 font-medium">Nenhum lead via Introducer ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <Badge className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1">{introducerLeads.length} leads de introducers</Badge>
        <Badge className="bg-purple-50 text-purple-600 border-purple-200 px-3 py-1">{introducerOptions.length} introducers</Badge>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
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
        {(search || introducerFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setIntroducerFilter('all'); }}>
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
      </div>

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
                <TableHead>Lead IA</TableHead>
                <TableHead>TPV Mensal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <UserPlus className="w-12 h-12 mx-auto text-[#002443]/20 mb-3" />
                    <p className="text-[#002443]/40">Nenhum resultado</p>
                  </TableCell>
                </TableRow>
              ) : paginated.map(record => {
                const sc = SUB_CAT[record.businessSubCategory];
                const ScIcon = sc?.icon || ShoppingCart;
                const sCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.novo;
                return (
                  <TableRow key={record.id} className="hover:bg-[#f4f4f4]">
                    <TableCell><span className="font-mono text-xs text-[#2bc196]">{record.protocolo || '-'}</span></TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{record.fullName || record.email}</p>
                      <p className="text-[10px] text-[#002443]/50">{record.cpfCnpj}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700 text-xs border-0 gap-1">
                        <UserPlus className="w-3 h-3" />
                        {record.introducerName}
                      </Badge>
                      <p className="text-[10px] text-[#002443]/40 mt-0.5">{record.introducerReferralCode}</p>
                    </TableCell>
                    <TableCell>
                      {sc && <div className="flex items-center gap-1"><ScIcon className="w-3 h-3" /><span className="text-xs">{sc.label}</span></div>}
                    </TableCell>
                    <TableCell><Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge></TableCell>
                    <TableCell><LeadQualifierBadge lead={record} size="xs" /></TableCell>
                    <TableCell><span className="text-sm font-mono">{record.tpvMensal ? `R$ ${record.tpvMensal.toLocaleString('pt-BR')}` : '-'}</span></TableCell>
                    <TableCell><span className="text-xs text-[#002443]/60">{record.created_date ? moment(record.created_date).format('DD/MM/YY HH:mm') : '-'}</span></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs text-teal-700 border-teal-300 hover:bg-teal-50" onClick={() => setReassignTarget(record)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Compliance
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
            <AlertDialogDescription>{deleteTarget && <><strong>{deleteTarget.cpfCnpj}</strong> - {deleteTarget.fullName}</>}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget.id)} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ReassignComplianceModal
        open={!!reassignTarget}
        onClose={() => setReassignTarget(null)}
        lead={reassignTarget}
        entityName="IntroducerLead"
        invalidateKeys={[['introducer-leads']]}
      />
    </div>
  );
}