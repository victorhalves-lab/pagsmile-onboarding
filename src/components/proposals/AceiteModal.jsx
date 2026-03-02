import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ACEITES = [
  'Li e concordo com as taxas apresentadas',
  'Declaro que as informações fornecidas são verdadeiras',
  'Concordo com os Termos de Uso',
  'Concordo com a Política de Privacidade',
];

export default function AceiteModal({ open, onClose, onConfirm, isPending }) {
  const [checked, setChecked] = useState({});

  const toggleCheck = (idx) => {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const allChecked = ACEITES.every((_, idx) => checked[idx]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2bc196]" />
            Confirmação de Aceite
          </DialogTitle>
          <DialogDescription>Para aceitar esta proposta, confirme os termos abaixo:</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {ACEITES.map((label, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Checkbox
                id={`aceite-${idx}`}
                checked={checked[idx] || false}
                onCheckedChange={() => toggleCheck(idx)}
              />
              <Label htmlFor={`aceite-${idx}`} className="text-sm cursor-pointer leading-relaxed">
                {label}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={!allChecked || isPending} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}