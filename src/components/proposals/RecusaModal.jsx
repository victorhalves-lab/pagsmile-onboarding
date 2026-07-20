import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const MOTIVOS = [
  'Taxas muito altas',
  'Melhor oferta de concorrente',
  'Prazo não atende',
  'Não preciso mais',
  'Outro',
];

export default function RecusaModal({ open, onClose, onSubmit, isPending }) {
  const [motivo, setMotivo] = useState('');
  const [detalhe, setDetalhe] = useState('');

  const handleSubmit = () => {
    onSubmit({ motivo, detalhe });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recusar Proposta</DialogTitle>
          <DialogDescription>Por favor, nos ajude a entender o motivo (opcional):</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 gap-2">
            {MOTIVOS.map(m => (
              <button
                key={m}
                onClick={() => setMotivo(m)}
                className={`text-left py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                  motivo === m
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 text-[#0A0A0A]/70 hover:border-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {motivo === 'Outro' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Detalhe</Label>
              <Textarea
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending} variant="destructive">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar Recusa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}