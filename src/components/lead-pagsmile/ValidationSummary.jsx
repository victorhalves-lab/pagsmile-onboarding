import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Visible list of validation errors at the top of the current step.
 * Shown after the user clicks "Próximo" and there are pending required fields.
 * Auto-dismisses when all errors are cleared.
 */
export default function ValidationSummary({ messages, totalFields, filledFields }) {
  if (!messages || messages.length === 0) {
    if (totalFields > 0 && filledFields === totalFields) {
      return (
        <div className="mb-4 rounded-xl border border-[#1356E2]/30 bg-[#1356E2]/5 p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1356E2] shrink-0" />
          <p className="text-xs font-medium text-[#0A0A0A]">
            Tudo certo nesta etapa. Você pode avançar.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border-2 border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-red-900">
            {messages.length === 1 ? 'Falta 1 item para continuar:' : `Faltam ${messages.length} itens para continuar:`}
          </p>
          <ul className="mt-2 space-y-1">
            {messages.map((msg, idx) => (
              <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}