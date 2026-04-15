import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RiskPositivesAndConcerns({ complianceScore }) {
  const positives = complianceScore?.pontos_positivos || [];
  const concerns = complianceScore?.pontos_atencao || [];

  if (positives.length === 0 && concerns.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {positives.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-emerald-800">Pontos Positivos ({positives.length})</h4>
          </div>
          <ul className="space-y-2">
            {positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-emerald-700 leading-relaxed">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {concerns.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-amber-800">Pontos de Atenção ({concerns.length})</h4>
          </div>
          <ul className="space-y-2">
            {concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-700 leading-relaxed">
                <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}