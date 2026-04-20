import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const OPTIONS = [
  { value: 'approve', label: 'Aprovar — aceito operar com este cliente', icon: CheckCircle2, color: 'text-green-600', borderColor: 'border-green-300' },
  { value: 'reject', label: 'Reprovar — NÃO aceito operar com este cliente', icon: XCircle, color: 'text-red-600', borderColor: 'border-red-300' },
  { value: 'request_docs', label: 'Solicitar documentos adicionais antes de decidir', icon: FileText, color: 'text-blue-600', borderColor: 'border-blue-300' },
  { value: 'escalate', label: 'Escalar para comitê interno do parceiro', icon: AlertTriangle, color: 'text-amber-600', borderColor: 'border-amber-300' }
];

export default function PartnerRecommendationForm({ open, onClose, assignment, onSuccess }) {
  const [recommendation, setRecommendation] = useState(assignment?.partnerRecommendation || '');
  const [comments, setComments] = useState(assignment?.partnerComments || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!recommendation) {
      toast.error('Selecione uma decisão.');
      return;
    }
    if (!comments || comments.trim().length < 20) {
      toast.error('A justificativa deve ter pelo menos 20 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('partnerSubmitRecommendation', {
        assignmentId: assignment.id,
        recommendation,
        comments
      });
      if (res.data?.success) {
        toast.success('Parecer enviado com sucesso.');
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data?.error || 'Falha ao enviar parecer.');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar Parecer — {assignment?.merchantName}</DialogTitle>
          <DialogDescription>
            Sua decisão determina se você aceita operar com este cliente. A Pagsmile considerará seu parecer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-semibold mb-3 block">Decisão *</Label>
            <RadioGroup value={recommendation} onValueChange={setRecommendation} className="space-y-2">
              {OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = recommendation === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selected ? opt.borderColor + ' bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <RadioGroupItem value={opt.value} id={opt.value} className="mt-0.5" />
                    <Icon className={`w-5 h-5 mt-0.5 ${opt.color}`} />
                    <span className="text-sm text-[#002443] flex-1">{opt.label}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="comments" className="text-sm font-semibold mb-1 block">
              Justificativa * <span className="text-slate-500 font-normal">(mín. 20 caracteres)</span>
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={5}
              placeholder="Descreva os motivos da sua decisão..."
              className="resize-none"
            />
            <div className="text-xs text-slate-500 mt-1">{comments.length} caracteres</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-[#2bc196] hover:bg-[#2bc196]/90">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar Parecer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}