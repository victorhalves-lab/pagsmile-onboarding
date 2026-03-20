import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function CaseReviewDialogs({
  merchantName, reviewComments, setReviewComments,
  showApproveDialog, setShowApproveDialog, onApprove,
  showRejectDialog, setShowRejectDialog, onReject,
  showRequestInfoDialog, setShowRequestInfoDialog, onRequestInfo,
  isPending,
}) {
  return (
    <>
      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Confirmar Aprovação</DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar o caso de onboarding de <strong>{merchantName}</strong>. Esta ação será registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Comentários (opcional)</Label>
            <Textarea placeholder="Adicione um comentário sobre a aprovação..." value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancelar</Button>
            <Button onClick={onApprove} disabled={isPending} className="bg-green-600 hover:bg-green-700">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Recusa */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /> Confirmar Recusa</DialogTitle>
            <DialogDescription>
              Você está prestes a recusar o caso de onboarding de <strong>{merchantName}</strong>. Esta ação será registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Motivo da recusa <span className="text-red-500">*</span></Label>
            <Textarea placeholder="Informe o motivo da recusa..." value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button onClick={onReject} disabled={isPending || !reviewComments} variant="destructive">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Solicitar Informações */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-600" /> Solicitar Informações Adicionais</DialogTitle>
            <DialogDescription>
              O caso será marcado como "Manual" e o merchant será notificado para enviar informações adicionais.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Quais informações são necessárias? <span className="text-red-500">*</span></Label>
            <Textarea placeholder="Descreva as informações ou documentos necessários..." value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoDialog(false)}>Cancelar</Button>
            <Button onClick={onRequestInfo} disabled={isPending || !reviewComments} className="bg-orange-600 hover:bg-orange-700">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}