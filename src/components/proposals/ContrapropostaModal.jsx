import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

function ContrapropostaRow({ label, original, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-center">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="text-center">
        <span className="text-xs text-[#0A0A0A]/50">de: </span>
        <span className="text-xs font-semibold">{original || '-'}%</span>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nova taxa"
        className="h-8 text-xs"
      />
    </div>
  );
}

export default function ContrapropostaModal({ open, onClose, proposta, onSubmit, isPending }) {
  const [taxas, setTaxas] = useState({
    credito_1x: '',
    credito_2_6x: '',
    credito_7_12x: '',
    rav: '',
  });
  const [justificativa, setJustificativa] = useState('');

  const getTaxa = (key) => {
    const rates = proposta?.rates || {};
    if (key === 'credito_1x') return rates.credito_1x?.mastercard || rates.cartao?.mastercard?.avista || '';
    if (key === 'credito_2_6x') return rates.credito_2_6x?.mastercard || rates.cartao?.mastercard?.de2a6x || '';
    if (key === 'credito_7_12x') return rates.credito_7_12x?.mastercard || rates.cartao?.mastercard?.de7a12x || '';
    if (key === 'rav') return rates.rav?.taxa || '';
    return '';
  };

  const canSubmit = justificativa.length >= 20;

  const handleSubmit = () => {
    onSubmit({ taxas_solicitadas: taxas, justificativa });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Contraproposta</DialogTitle>
          <DialogDescription>Informe as taxas que você gostaria de negociar:</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <ContrapropostaRow label="Crédito 1x" original={getTaxa('credito_1x')} value={taxas.credito_1x} onChange={(v) => setTaxas(prev => ({ ...prev, credito_1x: v }))} />
          <ContrapropostaRow label="Crédito 2-6x" original={getTaxa('credito_2_6x')} value={taxas.credito_2_6x} onChange={(v) => setTaxas(prev => ({ ...prev, credito_2_6x: v }))} />
          <ContrapropostaRow label="Crédito 7-12x" original={getTaxa('credito_7_12x')} value={taxas.credito_7_12x} onChange={(v) => setTaxas(prev => ({ ...prev, credito_7_12x: v }))} />
          <ContrapropostaRow label="RAV" original={getTaxa('rav')} value={taxas.rav} onChange={(v) => setTaxas(prev => ({ ...prev, rav: v }))} />

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-medium">Justificativa *</Label>
            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              placeholder="Explique o motivo da contraproposta (mínimo 20 caracteres)"
              rows={3}
            />
            <p className="text-[10px] text-[#0A0A0A]/40">{justificativa.length}/20 caracteres mínimos</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}