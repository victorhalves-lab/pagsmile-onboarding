import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ComplianceDisclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs md:text-sm text-amber-900 font-semibold mb-1">
            Importante — Sujeito à Aprovação
          </p>
          <p className="text-[11px] md:text-xs text-amber-800/80 leading-relaxed">
            As taxas apresentadas são referenciais para o segmento indicado e estão sujeitas à aprovação final
            de Compliance e validação do enquadramento do modelo de negócio do cliente pela Pagsmile.
            O enquadramento do segmento depende da aderência do modelo de negócio do cliente ao segmento indicado.
          </p>
        </div>
      </div>
    </div>
  );
}