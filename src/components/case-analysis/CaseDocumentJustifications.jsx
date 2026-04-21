import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MessageSquareWarning, CheckCircle2, XCircle, Clock, Loader2, User
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Panel for compliance analysts to review document justifications
 * (documents the client declared as "not available" + wrote a reason).
 * The analyst can Accept (no score penalty) or Reject (triggers rescoring).
 */
export default function CaseDocumentJustifications({ caseId }) {
  const queryClient = useQueryClient();
  const [reviewModal, setReviewModal] = useState({ open: false, doc: null, action: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['case_justified_docs', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const all = await base44.entities.DocumentUpload.filter({ onboardingCaseId: caseId });
      return all.filter(d => d.notAvailable === true);
    },
    enabled: !!caseId,
  });

  const handleOpenReview = (doc, action) => {
    setReviewModal({ open: true, doc, action });
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    const { doc, action } = reviewModal;
    if (!doc) return;
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.DocumentUpload.update(doc.id, {
        notAvailableReviewStatus: action === 'accept' ? 'Aceito' : 'Rejeitado',
        notAvailableReviewedBy: user?.email || 'unknown',
        notAvailableReviewedAt: new Date().toISOString(),
        notAvailableReviewNotes: reviewNotes.trim(),
      });
      // Re-trigger scoring if rejected (loss of points)
      if (action === 'reject') {
        base44.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: caseId }).catch(() => {});
      }
      toast.success(`Justificativa ${action === 'accept' ? 'aceita' : 'rejeitada'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['case_justified_docs', caseId] });
      setReviewModal({ open: false, doc: null, action: null });
    } catch (err) {
      toast.error('Erro: ' + (err?.message || 'desconhecido'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Aceito':
        return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="w-3 h-3" /> Aceita</Badge>;
      case 'Rejeitado':
        return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" /> Rejeitada</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
      </div>
    );
  }

  if (docs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <MessageSquareWarning className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#002443]">Documentos não enviados — Justificativas do cliente</h3>
          <p className="text-xs text-[#002443]/60">{docs.length} documento(s) declarados como "não tenho"</p>
        </div>
      </div>

      <div className="space-y-3">
        {docs.map(doc => (
          <div key={doc.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#002443]">{doc.documentName}</p>
                <p className="text-[10px] text-[#002443]/50 font-mono">{doc.documentTypeId}</p>
              </div>
              {getStatusBadge(doc.notAvailableReviewStatus || 'Pendente')}
            </div>

            <div className="bg-white border border-amber-200 rounded p-3 mb-3">
              <p className="text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wide">Justificativa:</p>
              <p className="text-xs text-[#002443]/80 leading-relaxed italic">"{doc.notAvailableReason}"</p>
            </div>

            {doc.notAvailableReviewStatus && doc.notAvailableReviewStatus !== 'Pendente' ? (
              <div className="bg-slate-100 border border-slate-200 rounded p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3 h-3 text-slate-600" />
                  <p className="text-[10px] font-semibold text-[#002443]">Revisado por {doc.notAvailableReviewedBy}</p>
                  <p className="text-[10px] text-[#002443]/50">
                    · {doc.notAvailableReviewedAt ? new Date(doc.notAvailableReviewedAt).toLocaleString('pt-BR') : ''}
                  </p>
                </div>
                {doc.notAvailableReviewNotes && (
                  <p className="text-xs text-[#002443]/80">{doc.notAvailableReviewNotes}</p>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenReview(doc, 'accept')} className="flex-1 border-green-300 text-green-700 hover:bg-green-50">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Aceitar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleOpenReview(doc, 'reject')} className="flex-1 border-red-300 text-red-700 hover:bg-red-50">
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejeitar
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review modal */}
      <Dialog open={reviewModal.open} onOpenChange={(o) => !o && setReviewModal({ open: false, doc: null, action: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#002443]">
              {reviewModal.action === 'accept' ? '✅ Aceitar Justificativa' : '❌ Rejeitar Justificativa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#002443]/70">
              Documento: <strong>{reviewModal.doc?.documentName}</strong>
            </p>
            {reviewModal.action === 'reject' && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                ⚠️ <strong>Atenção:</strong> ao rejeitar, o caso será reprocessado e pode perder pontos no score de risco.
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-[#002443] mb-1.5 block">
                Observação (opcional):
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={reviewModal.action === 'accept' ? 'Ex: Balanço simplificado aceito como alternativa.' : 'Ex: Justificativa vaga; cliente deve enviar documento.'}
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setReviewModal({ open: false, doc: null, action: null })} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className={reviewModal.action === 'accept'
                ? 'flex-1 bg-green-600 hover:bg-green-700 text-white'
                : 'flex-1 bg-red-600 hover:bg-red-700 text-white'}
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}