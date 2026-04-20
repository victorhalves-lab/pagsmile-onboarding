import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Handshake, Trash2, CheckCircle2, XCircle, FileText, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import AssignCaseToPartnerModal from './AssignCaseToPartnerModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const REC_LABELS = {
  approve: { label: 'Aprovou', icon: CheckCircle2, className: 'bg-green-100 text-green-700 border-green-200' },
  reject: { label: 'Reprovou', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
  request_docs: { label: 'Solicitou Docs', icon: FileText, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  escalate: { label: 'Escalou', icon: AlertTriangle, className: 'bg-amber-100 text-amber-700 border-amber-200' }
};

const STATUS_LABELS = {
  pending: 'Pendente',
  viewed: 'Visualizado',
  in_review: 'Em análise',
  completed: 'Concluído',
  expired: 'Vencido',
  revoked: 'Revogado'
};

export default function CasePartnerAssignments({ onboardingCaseId }) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['case-partner-assignments', onboardingCaseId],
    queryFn: () => base44.entities.PartnerAssignment.filter({ onboardingCaseId }, '-assignedAt'),
    enabled: !!onboardingCaseId
  });

  const handleRevoke = async (assignment) => {
    const reason = prompt('Motivo da revogação:');
    if (!reason) return;
    try {
      const res = await base44.functions.invoke('adminRevokeAssignment', { assignmentId: assignment.id, reason });
      if (res.data?.success) {
        toast.success('Atribuição revogada.');
        queryClient.invalidateQueries({ queryKey: ['case-partner-assignments', onboardingCaseId] });
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Handshake className="w-4 h-4 text-[#2bc196]" />
            Parceiros de Compliance ({assignments.length})
          </CardTitle>
          <Button size="sm" onClick={() => setModalOpen(true)} className="bg-[#2bc196] hover:bg-[#2bc196]/90">
            <Plus className="w-3 h-3 mr-1" />
            Atribuir
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500">
              Este caso ainda não foi atribuído a nenhum parceiro.
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => {
                const rec = a.partnerRecommendation ? REC_LABELS[a.partnerRecommendation] : null;
                const RecIcon = rec?.icon;
                return (
                  <div key={a.id} className="flex items-start justify-between gap-3 p-3 border border-slate-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-[#002443]">{a.partnerName}</span>
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                          {STATUS_LABELS[a.status] || a.status}
                        </Badge>
                        {rec && (
                          <Badge className={rec.className}>
                            {RecIcon && <RecIcon className="w-3 h-3 mr-1" />}
                            {rec.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Atribuído por {a.assignedByName || a.assignedBy}</span>
                        <span>· {a.assignedAt ? format(new Date(a.assignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''}</span>
                        {a.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />SLA: {format(new Date(a.dueDate), "dd/MM HH:mm", { locale: ptBR })}</span>}
                      </div>
                      {a.partnerComments && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-700 whitespace-pre-wrap">
                          <strong>Parecer:</strong> {a.partnerComments}
                          {a.partnerReviewerName && (
                            <div className="text-slate-500 mt-1">— {a.partnerReviewerName}</div>
                          )}
                        </div>
                      )}
                    </div>
                    {['pending', 'viewed', 'in_review'].includes(a.status) && (
                      <Button size="sm" variant="ghost" onClick={() => handleRevoke(a)} className="text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignCaseToPartnerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onboardingCaseId={onboardingCaseId}
        onAssigned={() => queryClient.invalidateQueries({ queryKey: ['case-partner-assignments', onboardingCaseId] })}
      />
    </>
  );
}