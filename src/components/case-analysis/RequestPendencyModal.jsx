import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, HelpCircle, Sparkles, Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import PendencyItemEditor from '@/components/pendencias/PendencyItemEditor';

const uid = () => `it_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const newDocItem = (isOther = false) => ({
  itemId: uid(),
  kind: 'document',
  label: '',
  description: '',
  isRequired: true,
  status: 'pending',
  acceptedFileTypes: ['pdf'],
  requiredQuantity: 1,
  isOther,
  uploadedDocIds: [],
});

const newQuestionItem = () => ({
  itemId: uid(),
  kind: 'question',
  label: '',
  description: '',
  isRequired: true,
  status: 'pending',
  answerType: 'text',
  answerValue: '',
});

function validateItems(items) {
  const errors = [];
  if (items.length === 0) {
    errors.push('Adicione pelo menos um item à solicitação.');
    return errors;
  }
  items.forEach((it, i) => {
    const prefix = `Item ${i + 1}`;
    if (!it.label?.trim()) errors.push(`${prefix}: nome/pergunta é obrigatório.`);
    if (it.kind === 'document') {
      if (!Array.isArray(it.acceptedFileTypes) || it.acceptedFileTypes.length === 0) {
        errors.push(`${prefix}: selecione pelo menos um tipo de arquivo (PDF ou Imagem).`);
      }
      if (!it.requiredQuantity || it.requiredQuantity < 1) {
        errors.push(`${prefix}: quantidade mínima deve ser pelo menos 1.`);
      }
    }
    if (it.kind === 'question' && !it.answerType) {
      errors.push(`${prefix}: selecione o tipo de resposta.`);
    }
  });
  return errors;
}

export default function RequestPendencyModal({
  open,
  onClose,
  onboardingCase,
  merchant,
  onSuccess,
}) {
  const [generalMessage, setGeneralMessage] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setGeneralMessage('');
    setDeadlineDays(7);
    setItems([]);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const addDoc = () => setItems(prev => [...prev, newDocItem(false)]);
  const addOther = () => setItems(prev => [...prev, newDocItem(true)]);
  const addQuestion = () => setItems(prev => [...prev, newQuestionItem()]);

  const updateItem = (idx, updated) => setItems(prev => prev.map((it, i) => (i === idx ? updated : it)));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const errors = validateItems(items);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    if (!deadlineDays || deadlineDays < 1 || deadlineDays > 60) {
      toast.error('Prazo deve estar entre 1 e 60 dias.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await base44.functions.invoke('createPendencyRequest', {
        onboardingCaseId: onboardingCase.id,
        generalMessage: generalMessage.trim(),
        deadlineDays: parseInt(deadlineDays),
        items,
      });
      if (!res.data?.ok) throw new Error(res.data?.error || 'Falha ao criar solicitação.');
      toast.success(
        res.data?.emailSent
          ? '✅ Solicitação enviada! Cliente recebeu o e-mail com o link.'
          : '✅ Solicitação criada! (E-mail não pôde ser enviado — copie o link manualmente.)'
      );
      reset();
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error('[RequestPendencyModal] error:', err);
      toast.error(err.message || 'Erro ao enviar solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const docCount = items.filter(i => i.kind === 'document').length;
  const questionCount = items.filter(i => i.kind === 'question').length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[var(--pinbank-blue)] flex items-center gap-2">
            📋 Solicitar Pendências ao Cliente
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Crie uma lista de documentos e perguntas. O cliente receberá um link público por e-mail.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Caso + merchant info */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm">
            <div className="text-slate-500 text-xs">Caso:</div>
            <div className="font-semibold text-[var(--pinbank-blue)]">
              {merchant?.fullName || 'Merchant'} • {merchant?.email || 'sem e-mail'}
            </div>
          </div>

          {/* Mensagem geral */}
          <div>
            <Label className="text-sm font-semibold text-[var(--pinbank-blue)]">
              Mensagem ao cliente (opcional)
            </Label>
            <Textarea
              value={generalMessage}
              onChange={(e) => setGeneralMessage(e.target.value)}
              placeholder="Ex.: Para finalizar sua análise, precisamos de alguns documentos adicionais..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Prazo */}
          <div>
            <Label className="text-sm font-semibold text-[var(--pinbank-blue)]">Prazo (dias) *</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(parseInt(e.target.value) || 7)}
              className="mt-1 max-w-[120px]"
            />
            <p className="text-xs text-slate-500 mt-1">Período em que o cliente pode preencher (1 a 60 dias).</p>
          </div>

          {/* Lista de itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-[var(--pinbank-blue)]">
                Itens da solicitação
              </Label>
              <div className="text-xs text-slate-500">
                {docCount} documento(s) • {questionCount} pergunta(s)
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <Button variant="outline" size="sm" onClick={addDoc} className="gap-1.5">
                <FileText className="w-4 h-4" /> + Documento
              </Button>
              <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
                <HelpCircle className="w-4 h-4" /> + Pergunta
              </Button>
              <Button variant="outline" size="sm" onClick={addOther} className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                <Sparkles className="w-4 h-4" /> + OUTROS (livre)
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum item adicionado ainda.</p>
                <p className="text-xs text-slate-400">Use os botões acima para criar pendências.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <PendencyItemEditor
                    key={item.itemId}
                    item={item}
                    index={idx}
                    onChange={(updated) => updateItem(idx, updated)}
                    onRemove={() => removeItem(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0}
            className="bg-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue-dark)] text-white gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? 'Enviando...' : 'Enviar ao Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}