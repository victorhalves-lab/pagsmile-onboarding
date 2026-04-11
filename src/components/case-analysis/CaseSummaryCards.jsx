import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, FileCheck, Scale } from 'lucide-react';

const SUBFAIXA_COLORS = {
  '1A': 'text-emerald-600', '1B': 'text-emerald-600',
  '2A': 'text-blue-600', '2B': 'text-blue-600',
  '3A': 'text-amber-600', '3B': 'text-orange-600',
  '4': 'text-red-600', '5': 'text-red-800',
};

export default function CaseSummaryCards({ complianceScore, onboardingCase, validations, documents, responses }) {
  // Use V4 score as the single source of truth
  const scoreV4 = onboardingCase?.riskScoreV4;
  const subfaixa = onboardingCase?.subfaixa;
  const subfaixaNome = onboardingCase?.subfaixaNome || subfaixa;
  const scoreColor = SUBFAIXA_COLORS[subfaixa] || 'text-[#002443]';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Score V4</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-3xl font-bold ${scoreColor}`}>{scoreV4 ?? '-'}</p>
              <span className="text-xs text-[#002443]/30">/849</span>
            </div>
            {subfaixa && (
              <p className={`text-xs font-semibold mt-0.5 ${scoreColor}`}>{subfaixa} — {subfaixaNome}</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-slate-100">
            <Scale className="w-6 h-6 text-[#002443]/60" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Validações</p>
            <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">
              {validations.filter(v => v.status === 'Sucesso').length}/{validations.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-100"><Shield className="w-6 h-6 text-blue-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Documentos</p>
            <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">
              {documents.filter(d => d.validationStatus === 'Validado').length}/{documents.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-100"><FileText className="w-6 h-6 text-purple-600" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Respostas</p>
            <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">{responses.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-100"><FileCheck className="w-6 h-6 text-teal-600" /></div>
        </div>
      </div>
    </div>
  );
}