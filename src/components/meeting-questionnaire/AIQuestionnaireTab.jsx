import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Eye, Trash2, Loader2, FileText, Plus, Bot, Pencil, ShoppingCart, Network, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import MeetingQuestionnaireDetailModal from './MeetingQuestionnaireDetailModal';

const BIZ_TYPE = {
  MERCHAN: { label: 'Merchant', icon: ShoppingCart },
  GATEWAY: { label: 'Gateway', icon: Network },
  MARKETPLACE: { label: 'Marketplace', icon: Building2 },
};

export default function AIQuestionnaireTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: questionnaires = [], isLoading } = useQuery({
    queryKey: ['ai-questionnaires'],
    queryFn: async () => {
      const all = await base44.entities.InternalCommercialQuestionnaire.list('-created_date', 500);
      return all.filter(q => q.origemIA === true);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InternalCommercialQuestionnaire.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-questionnaires'] });
      queryClient.invalidateQueries({ queryKey: ['internal-questionnaires'] });
      toast.success('Questionário IA excluído');
      setDeleteTarget(null);
    }
  });

  const filtered = useMemo(() => {
    if (!search) return questionnaires;
    const s = search.toLowerCase();
    return questionnaires.filter(q =>
      (q.clientFullName || '').toLowerCase().includes(s) ||
      (q.clientCpfCnpj || '').includes(s) ||
      (q.clientEmail || '').toLowerCase().includes(s) ||
      (q.protocolo || '').toLowerCase().includes(s)
    );
  }, [questionnaires, search]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pinbank-blue)]" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pinbank-blue)]/40" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome, CNPJ, email, protocolo..." className="pl-10 h-10" />
        </div>
        <Link to={createPageUrl('ProcessMeetingNotes')}>
          <Button className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white">
            <Bot className="w-4 h-4 mr-1" /> Processar Notas com IA
          </Button>
        </Link>
      </div>

      {/* Table */}
      {questionnaires.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bot className="w-12 h-12 mx-auto text-[var(--pinbank-blue)]/30 mb-3" />
          <p className="text-[var(--pinbank-blue)]/60 mb-2">Nenhum questionário IA gerado ainda</p>
          <p className="text-xs text-[var(--pinbank-blue)]/40 mb-4">Cole anotações ou transcrições de reunião e a IA preencherá automaticamente</p>
          <Link to={createPageUrl('ProcessMeetingNotes')}>
            <Button className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white">
              <Bot className="w-4 h-4 mr-1" /> Processar Notas com IA
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TPV Mensal</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-[var(--pinbank-blue)]/50">
                      Nenhum resultado encontrado
                    </TableCell>
                  </TableRow>
                ) : paginated.map(q => {
                  const biz = BIZ_TYPE[q.businessType];
                  const BizIcon = biz?.icon || ShoppingCart;
                  const isAiStatus = q.status === 'ai_preenchido';
                  return (
                    <TableRow key={q.id} className="hover:bg-[#f4f4f4] transition-colors">
                      <TableCell><span className="font-mono text-xs text-[var(--pinbank-blue)]">{q.protocolo || '-'}</span></TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{q.clientFullName}</p>
                        <p className="text-[10px] text-[var(--pinbank-blue)]/50">{q.clientCpfCnpj || q.clientEmail}</p>
                      </TableCell>
                      <TableCell>
                        {biz && <div className="flex items-center gap-1"><BizIcon className="w-3 h-3" /><span className="text-xs">{biz.label}</span></div>}
                      </TableCell>
                      <TableCell>
                        <Badge className={isAiStatus ? 'bg-violet-100 text-violet-700 text-xs' : 'bg-green-100 text-green-700 text-xs'}>
                          {isAiStatus ? '🤖 IA Preenchido' : q.status === 'preenchido' ? 'Revisado' : q.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {q.monthlyTpv ? `R$ ${Number(q.monthlyTpv).toLocaleString('pt-BR')}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-[var(--pinbank-blue)]/60">
                          {q.created_date ? moment(q.created_date).format('DD/MM/YY HH:mm') : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white h-7 text-xs"
                            onClick={() => navigate(createPageUrl('QuestionarioReuniao') + `?id=${q.id}`)}
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Revisar
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDetailTarget(q)}>
                            <Eye className="w-3 h-3 mr-1" /> Ver
                          </Button>
                          {q.leadId && (
                            <Link to={createPageUrl('LeadDetails') + `?id=${q.leadId}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(q)} className="text-red-500 hover:text-red-700 h-7">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#0A0A0A]/5">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-xs text-[var(--pinbank-blue)]/60">Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <MeetingQuestionnaireDetailModal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        questionnaire={detailTarget}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Questionário IA</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O questionário gerado pela IA para <strong>{deleteTarget?.clientFullName}</strong> será excluído.
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
    </div>
  );
}