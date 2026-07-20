import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2, Check } from 'lucide-react';

const COMMON_REASONS = [
  'Documento ilegível ou com baixa qualidade',
  'Informações incompletas ou ausentes',
  'Documento incorreto ou incompatível',
  'Documento expirado ou fora da validade',
  'Dados divergentes dos informados no cadastro',
  'Documento adulterado ou suspeito de fraude',
];

export default function RejectReasonsDialog({ 
  open, 
  onOpenChange, 
  documentName, 
  onConfirm, 
  isPending = false 
}) {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const toggleReason = (reason) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleConfirm = () => {
    const fullReason = [
      ...selectedReasons,
      additionalNotes ? `Observação: ${additionalNotes}` : ''
    ].filter(Boolean).join('; ');
    
    onConfirm(fullReason);
    setSelectedReasons([]);
    setAdditionalNotes('');
  };

  const hasReason = selectedReasons.length > 0 || additionalNotes.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setSelectedReasons([]);
        setAdditionalNotes('');
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Rejeitar Documento
          </DialogTitle>
          <DialogDescription>
            Selecione os motivos da rejeição de "{documentName}".
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <div>
            <Label className="text-xs text-[#0A0A0A]/50 font-semibold mb-2 block">Motivos Comuns</Label>
            <div className="grid grid-cols-1 gap-2">
              {COMMON_REASONS.map((reason, i) => (
                <button
                  key={i}
                  onClick={() => toggleReason(reason)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-sm transition-all ${
                    selectedReasons.includes(reason) 
                      ? 'border-red-300 bg-red-50 text-red-700' 
                      : 'border-[#0A0A0A]/10 hover:border-[#0A0A0A]/20 text-[#0A0A0A]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selectedReasons.includes(reason) 
                      ? 'border-red-500 bg-red-500' 
                      : 'border-[#0A0A0A]/20'
                  }`}>
                    {selectedReasons.includes(reason) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#0A0A0A]/50 font-semibold mb-2 block">Detalhes Adicionais</Label>
            <Textarea 
              placeholder="Descreva detalhes adicionais (opcional)..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="rounded-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isPending || !hasReason}
            variant="destructive"
            className="rounded-lg"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Rejeitar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}