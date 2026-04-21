import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Modal for the client to declare they don't have a specific document
 * and provide a written justification. The compliance analyst will later
 * review the justification and accept or reject it — rejection may cost
 * points on the risk score.
 */
export default function DocumentNotAvailableModal({ open, onOpenChange, doc, onConfirm }) {
  const [reason, setReason] = useState('');
  const MIN_REASON = 30;

  const handleConfirm = () => {
    if (reason.trim().length < MIN_REASON) return;
    onConfirm(reason.trim());
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  if (!doc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-[#002443]">Não possuo este documento</DialogTitle>
          </div>
          <DialogDescription className="text-[#002443]/70">
            <strong className="text-[#002443]">{doc.label || doc.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informative banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <p className="font-semibold mb-1">Como funciona a análise:</p>
              <ul className="space-y-1 list-disc pl-4">
                <li>Sua justificativa será analisada por nossa equipe de compliance</li>
                <li><strong>Aceita:</strong> seu cadastro segue sem penalização</li>
                <li><strong>Rejeitada:</strong> pode impactar seu score de risco ou ser exigido novamente</li>
              </ul>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="text-sm font-semibold text-[#002443] mb-2 block">
              Por que você não possui este documento? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Empresa foi constituída há menos de 1 ano, ainda não tenho balanço patrimonial auditado. Posso enviar o DRE simplificado do período..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className={`text-xs ${reason.trim().length >= MIN_REASON ? 'text-green-600' : 'text-slate-500'}`}>
                {reason.trim().length >= MIN_REASON ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Mínimo atingido
                  </span>
                ) : (
                  <>Mínimo {MIN_REASON} caracteres ({reason.trim().length}/{MIN_REASON})</>
                )}
              </p>
              <p className="text-xs text-slate-400">{reason.length}/1000</p>
            </div>
          </div>

          {/* Example tip */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-[#002443] mb-1">💡 Dicas para uma boa justificativa:</p>
            <ul className="text-xs text-[#002443]/70 space-y-0.5 list-disc pl-4">
              <li>Explique o motivo real (ex: empresa nova, sem operação anterior)</li>
              <li>Indique documentos alternativos que você pode enviar</li>
              <li>Seja transparente — justificativas vagas são rejeitadas</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            <XCircle className="w-4 h-4 mr-2" /> Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={reason.trim().length < MIN_REASON}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar Justificativa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}