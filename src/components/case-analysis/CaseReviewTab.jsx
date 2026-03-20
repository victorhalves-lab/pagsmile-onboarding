import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function CaseReviewTab({
  onboardingCase, reviewComments, setReviewComments,
  onShowApprove, onShowReject, onShowRequestInfo,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">Revisão Manual</h3>
      
      {onboardingCase.manualReviewComments && (
        <Alert className="bg-slate-50 border-slate-200">
          <AlertDescription>
            <p className="font-semibold text-[var(--pagsmile-blue)] mb-1">Comentário anterior:</p>
            <p className="text-[var(--pagsmile-blue)]/80 font-medium">{onboardingCase.manualReviewComments}</p>
            {onboardingCase.manualReviewerId && (
              <p className="text-xs text-[var(--pagsmile-blue)]/60 font-medium mt-2">
                Por {onboardingCase.manualReviewerId} em {onboardingCase.manualReviewDate ? 
                  new Date(onboardingCase.manualReviewDate).toLocaleDateString('pt-BR') : '-'}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {onboardingCase.status !== 'Aprovado' && onboardingCase.status !== 'Recusado' && (
        <>
          <div className="space-y-2">
            <Label>Comentários da Revisão</Label>
            <Textarea 
              placeholder="Adicione comentários sobre este caso..."
              rows={4}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onShowApprove} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprovar
            </Button>
            <Button variant="outline" onClick={onShowRequestInfo} className="flex-1">
              <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar Informações
            </Button>
            <Button variant="destructive" onClick={onShowReject} className="flex-1">
              <XCircle className="w-4 h-4 mr-2" /> Recusar
            </Button>
          </div>
        </>
      )}

      {(onboardingCase.status === 'Aprovado' || onboardingCase.status === 'Recusado') && (
        <Alert className={onboardingCase.status === 'Aprovado' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {onboardingCase.status === 'Aprovado' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={onboardingCase.status === 'Aprovado' ? 'text-green-800' : 'text-red-800'}>
            Este caso foi {onboardingCase.status === 'Aprovado' ? 'aprovado' : 'recusado'} 
            {onboardingCase.finalDecisionDate ? ` em ${new Date(onboardingCase.finalDecisionDate).toLocaleDateString('pt-BR')}` : ''}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}