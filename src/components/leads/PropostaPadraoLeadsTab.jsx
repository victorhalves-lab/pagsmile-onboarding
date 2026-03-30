import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import LeadSLAIndicator from './LeadSLAIndicator';
import PropostaPadraoResponsesModal from './PropostaPadraoResponsesModal';

const FECHAMENTO_TEMPLATE_ID = '69caaf2cd9ea49029f4de352';

const SUB_CAT = {
  MERCHAN: { label: 'Merchan', icon: ShoppingCart },
  GATEWAY: { label: 'Gateway', icon: Network },
  MARKETPLACE: { label: 'Marketplace', icon: Building2 },
};

const STATUS_CONFIG = {
  proposta_aceita: { label: 'Proposta Aceita', color: 'bg-green-100 text-green-700', icon: '🟢' },
  questionario_preenchido: { label: 'Novo', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  em_contato_comercial: { label: 'Em Contato', color: 'bg-amber-100 text-amber-700', icon: '🟡' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-700', icon: '🟣' },
  kyc_iniciado: { label: 'KYC Iniciado', color: 'bg-purple-100 text-purple-700', icon: '🟣' },
  ativado: { label: 'Ativado', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  perdido: { label: 'Perdido', color: 'bg-slate-100 text-slate-600', icon: '⚫' },
};

export default function PropostaPadraoLeadsTab({ leads = [], onDelete, onViewResponses }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [responsesModalLead, setResponsesModalLead] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Filter only leads from Proposta Padrão fechamento
  const propostaPadraoLeads = useMemo(() => {
    return leads.filter(l => l.leadQuestionnaireTemplateId === FECHAMENTO_TEMPLATE_ID);
  }, [leads]);

  const filtered = useMemo(() => {
    let result = propostaPadraoLeads;
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
    return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [propostaPadraoLeads, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
      toast.success('Lead excluído com sucesso');
      setDeleteTarget(null);
    }
  });

  React.useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (propostaPadraoLeads.length === 0) {
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
          {propostaPadraoLeads.length} fechamentos
        </Badge>
        <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
          {propostaPadraoLeads.filter(l => l.status === 'proposta_aceita').length} aceitos
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
                <TableHead>Introducer</TableHead>
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
              ) : paginated.map(lead => {
                const sCfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: 'bg-slate-100' };
                const sc = SUB_CAT[lead.businessSubCategory];
                const ScIcon = sc?.icon || ShoppingCart;
                const segmentFromData = lead.questionnaireData?.segment || '';

                return (
                  <TableRow key={lead.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell>
                      <p className="font-medium text-sm">{lead.fullName || lead.email}</p>
                      <p className="text-[10px] text-[#002443]/50">{lead.cpfCnpj || ''}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#002443]/5 text-[#002443] text-xs border-0">
                        {segmentFromData}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sc && <div className="flex items-center gap-1"><ScIcon className="w-3 h-3" /><span className="text-xs">{sc.label}</span></div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{lead.contactName || '-'}</p>
                      <p className="text-[10px] text-[#002443]/50">{lead.email}</p>
                    </TableCell>
                    <TableCell>
                      {lead.introducerName ? (
                        <Badge className="bg-purple-100 text-purple-700 text-[10px] border-0">{lead.introducerName}</Badge>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#002443]/60">
                          {lead.created_date ? moment(lead.created_date).format('DD/MM/YY HH:mm') : '-'}
                        </span>
                        <LeadSLAIndicator lead={lead} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {lead.questionnaireData && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setResponsesModalLead(lead)}>
                            <MessageSquareText className="w-3 h-3 mr-1" /> Respostas
                          </Button>
                        )}
                        <Link to={createPageUrl('LeadDetails') + `?id=${lead.id}`}>
                          <Button variant="ghost" size="sm" className="h-7"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Link to={createPageUrl('CriarProposta') + `?lead=${lead.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs"><FileText className="w-3 h-3 mr-1" /> Proposta</Button>
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
            <span className="text-xs text-[#002443]/60">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
              {deleteTarget && <><br /><strong>{deleteTarget.cpfCnpj}</strong> - {deleteTarget.fullName}</>}
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

      {/* Responses Modal — dedicated for Proposta Padrão */}
      <PropostaPadraoResponsesModal
        open={!!responsesModalLead}
        onClose={() => setResponsesModalLead(null)}
        lead={responsesModalLead}
      />
    </div>
  );
}