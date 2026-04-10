import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Página de simulação removida — a verificação real é feita pelo SDK da CAF
 * integrado no DynamicDocumentUploadPage > CafVerificationStep.
 */
export default function LivenessSimulation() {
  useEffect(() => {
    // If opened as popup, notify parent and close
    if (window.opener) {
      window.opener.postMessage({ type: 'LIVENESS_COMPLETED', sessionId: 'redirected' }, '*');
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[#002443] mb-2">Verificação Integrada</h2>
        <p className="text-sm text-[#002443]/60">
          A verificação de identidade agora é feita diretamente no fluxo de envio de documentos, 
          usando o SDK real da CAF (DocumentDetector + FaceLiveness).
        </p>
      </div>
    </div>
  );
}