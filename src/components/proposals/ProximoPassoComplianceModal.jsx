import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Shield, Copy, ExternalLink, Check, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal exibido após o aceite da proposta para deixar CLARO ao cliente
 * que o próximo passo é executar o questionário de Compliance.
 *
 * - NÃO redireciona automaticamente — o cliente decide quando ir.
 * - Mostra o link de forma destacada e permite copiar para executar mais tarde.
 * - Só fecha quando o cliente clica em "Ir agora" ou em "Fechar".
 */
export default function ProximoPassoComplianceModal({ open, complianceUrl, onGoNow, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(complianceUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1356E2]/15 mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-[#1356E2]" />
          </div>
          <DialogTitle className="text-center text-xl text-[#0A0A0A]">
            Proposta aceita com sucesso! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Próximo Passo */}
          <div className="rounded-xl border-2 border-[#1356E2]/30 bg-[#1356E2]/5 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1356E2] text-white font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-[#0A0A0A] text-base mb-1">
                  Próximo passo: Compliance
                </h3>
                <p className="text-sm text-[#0A0A0A]/75 leading-relaxed">
                  Para que sua conta seja aprovada, você precisa preencher o nosso
                  processo de Compliance. É rápido e essencial para liberar sua operação.
                </p>
              </div>
            </div>

            {/* Link destacado */}
            <div className="bg-white rounded-lg border border-[#1356E2]/20 p-3 mb-3">
              <div className="flex items-center gap-2 text-xs text-[#0A0A0A]/60 uppercase font-semibold mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                Link do Compliance
              </div>
              <p className="text-xs text-[#0A0A0A] break-all font-mono leading-relaxed">
                {complianceUrl}
              </p>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 border-[#0A0A0A]/20 text-[#0A0A0A] hover:bg-[#0A0A0A]/5 h-11 rounded-xl font-semibold"
              >
                {copied ? (
                  <><Check className="w-4 h-4 mr-2 text-[#1356E2]" /> Link copiado!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> Copiar link para fazer depois</>
                )}
              </Button>
              <Button
                onClick={onGoNow}
                className="flex-1 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white h-11 rounded-xl font-bold"
              >
                Continuar
                <Shield className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Aviso para depois */}
          <div className="flex items-start gap-2.5 text-xs text-[#0A0A0A]/65 bg-amber-50/60 border border-amber-200/60 rounded-lg p-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Copie o link</strong> para retomar o Compliance mais tarde, ou
              clique em <strong>Continuar</strong> para iniciar agora.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}